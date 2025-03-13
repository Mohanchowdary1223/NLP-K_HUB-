# image_to_text.py
import easyocr
from PIL import Image
from pymongo import MongoClient
from datetime import datetime
import google.generativeai as genai
from transformers import AutoModelForObjectDetection, TableTransformerForObjectDetection
from torchvision import transforms
import torch
import numpy as np
from IPython.display import display
from PIL import Image
from tqdm.auto import tqdm
from transformers import AutoModelForObjectDetection, TableTransformerForObjectDetection
from PIL import Image
from torchvision import transforms
import torch
import numpy as np
import easyocr
from tqdm.auto import tqdm
from keywords import keywords

# Load object detection model
model = AutoModelForObjectDetection.from_pretrained("microsoft/table-transformer-detection", revision="no_timm")
model.config.id2label

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

# Define your MongoDB connection and keywords (as in the original code)
client = MongoClient("mongodb://localhost:27017/")
db = client['NLP_SIGN']


   # Define the keyword lists for each category


# Text Classification Function
def classify_text(extracted_text):
    classified_data = {key: [] for key in keywords}
    words = extracted_text.lower().split()

    for word in words:
        for category, keyword_list in keywords.items():
            if word in keyword_list:
                classified_data[category].append(word)
    
    return classified_data

'''# OCR and Classification Function
def process_image(image_path):
    reader = easyocr.Reader(['en'])
    result = reader.readtext(image_path)
    extracted_text = " ".join([text[1] for text in result])

    if not extracted_text.strip():
        return {"error": "No text was extracted from the image."}

    classified_data = classify_text(extracted_text)

    # Save to MongoDB
    saved_data = {}
    for category, words in classified_data.items():
        if words:
            collection = db[category]
            doc = {
                "extracted_text": extracted_text,
                "keywords": words,
                "timestamp": datetime.now(),
                "image_path": image_path
            }
            result = collection.insert_one(doc)
            saved_data[category] = str(result.inserted_id)
    
    return {"extracted_text": extracted_text, "classified_data": classified_data, "saved_data": saved_data}
'''

# OCR and Classification Function
def process_image(image_path):
    try:
        reader = easyocr.Reader(['en'])
        result = reader.readtext(image_path)
        extracted_text = " ".join([text[1] for text in result])

        if not extracted_text.strip():
            return {"error": "No text was extracted from the image."}

        classified_data = classify_text(extracted_text)
        
        return {
            "extracted_text": extracted_text, 
            "classified_data": classified_data
        }
    except Exception as e:
        print(f"Error in process_image: {str(e)}")
        return {"error": str(e)}

def process_gemini_image(image_path):
    try:
        extracted_text = extract_text_from_image([image_path])

        if not extracted_text.strip():
            return {"error": "No text was extracted from the image."}

        classified_data = classify_text(extracted_text)
        
        return {
            "extracted_text": extracted_text,
            "classified_data": classified_data
        }
    except Exception as e:
        print(f"Error in process_gemini_image: {str(e)}")
        return {"error": str(e)}

# Configure Gemini API key
genai.configure(api_key="AIzaSyA8AcTys00u4NWs2OEpshLq13xuP6SYqUA")

def upload_to_gemini(path, mime_type=None):
    """Uploads the given file to Gemini."""
    file = genai.upload_file(path, mime_type=mime_type)
    print(f"Uploaded file '{file.display_name}' as: {file.uri}")
    return file

def extract_text_from_image(image_paths):
    """Extracts text from one or more images using Gemini."""
    files = [upload_to_gemini(path, mime_type="image/jpeg") for path in image_paths]

    # Create the model
    generation_config = {
        "temperature": 0.1,  # Lower temperature for more accurate extraction
        "max_output_tokens": 2048,  # Adjust as needed
        "response_mime_type": "text/plain",
    }
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",  # Or "gemini-pro-vision"
        generation_config=generation_config,
    )

    # Start a chat session and provide the image
    chat_session = model.start_chat(
        history=[
            {
                "role": "user",
                "parts": ["Extract the text from the following image(s) accurately:"],
            },
            {
                "role": "user",
                "parts": files,  # Pass the uploaded file(s)
            },
        ]
    )

    # Get the response containing the extracted text
    response = chat_session.send_message("Please provide the extracted text.")
    extracted_text = response.text

    return extracted_text

# Gemini OCR and Classification Function
def process_gemini_image(image_path):
    extracted_text = extract_text_from_image([image_path])

    if not extracted_text.strip():
        return {"error": "No text was extracted from the image."}

    classified_data = classify_text(extracted_text)

    # Save to MongoDB
    saved_data = {}
    for category, words in classified_data.items():
        if words:
            collection = db[category]
            doc = {
                "extracted_text": extracted_text,
                "keywords": words,
                "timestamp": datetime.now(),
                "image_path": image_path
            }
            result = collection.insert_one(doc)
            saved_data[category] = str(result.inserted_id)
    
    return {"extracted_text": extracted_text, "classified_data": classified_data, "saved_data": saved_data}

def extract_table_data(file_path):
    image = None
    try:
        reader = easyocr.Reader(['en'])
        
        # Load and process image with proper cleanup handling
        with Image.open(file_path) as img:
            image = img.copy().convert("RGB")
        
        # Transform image
        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        img_tensor = transform(image).unsqueeze(0).to(device)
        
        # Process with model
        with torch.no_grad():
            outputs = model(img_tensor)

        # Extract cells
        height, width = image.size[1], image.size[0]
        pred_boxes = outputs['pred_boxes'][0].cpu().numpy()
        scores = outputs.logits.softmax(-1).max(-1).values[0].cpu().numpy()
        
        table_cells = []
        for box, score in zip(pred_boxes, scores):
            if score > 0.5:
                x1 = max(0, int(box[0] * width))
                y1 = max(0, int(box[1] * height))
                x2 = min(width, int(box[2] * width))
                y2 = min(height, int(box[3] * height))
                if x2 > x1 and y2 > y1:
                    table_cells.append([x1, y1, x2, y2])

        if not table_cells:
            return {
                "extracted_text": "",
                "table_data": {},
                "error": "No table cells detected"
            }

        # Process cells
        table_data = {}
        formatted_text = []
        
        # Sort cells by y-coordinate
        table_cells.sort(key=lambda x: x[1])
        
        # Group into rows
        current_row = []
        current_y = table_cells[0][1]
        row_index = 0
        
        for cell in table_cells:
            if abs(cell[1] - current_y) > height * 0.02:  # New row
                if current_row:
                    current_row.sort(key=lambda x: x[0])  # Sort by x-coordinate
                    row_text = []
                    for cell_coords in current_row:
                        cell_image = image.crop(cell_coords)
                        result = reader.readtext(np.array(cell_image))
                        text = " ".join([r[1] for r in result]) if result else ""
                        row_text.append(text.strip())
                    table_data[str(row_index)] = row_text
                    formatted_text.append("\t".join(row_text))
                    row_index += 1
                current_row = [cell]
                current_y = cell[1]
            else:
                current_row.append(cell)
        
        # Process last row
        if current_row:
            current_row.sort(key=lambda x: x[0])
            row_text = []
            for cell_coords in current_row:
                cell_image = image.crop(cell_coords)
                result = reader.readtext(np.array(cell_image))
                text = " ".join([r[1] for r in result]) if result else ""
                row_text.append(text.strip())
            table_data[str(row_index)] = row_text
            formatted_text.append("\t".join(row_text))

        return {
            "extracted_text": "\n".join(formatted_text),
            "table_data": table_data,
            "error": None
        }

    except Exception as e:
        print(f"Error in extract_table_data: {str(e)}")
        return {
            "extracted_text": "",
            "table_data": {},
            "error": f"Failed to process table: {str(e)}"
        }
    finally:
        # Clean up
        if image:
            image.close()
