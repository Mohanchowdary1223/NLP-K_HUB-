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

# Load object detection model
model = AutoModelForObjectDetection.from_pretrained("microsoft/table-transformer-detection", revision="no_timm")
model.config.id2label

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)

# Define your MongoDB connection and keywords (as in the original code)
client = MongoClient("mongodb://localhost:27017/")
db = client['NLP_SIGN']


   # Define the keyword lists for each category
keywords = {
    'Canteen': ['food', 'lunch', 'snack', 'meal', 'canteen', 'dinner', 'breakfast', 'cuisine', 'dish', 'restaurant',
                 'menu', 'eating', 'order', 'takeaway', 'serve', 'delicious', 'taste', 'cook',
                 'chef', 'recipe', 'appetizer', 'main course', 'dessert', 'refreshments', 'buffet', 
                 'drinks', 'beverages', 'snacks', 'treat', 'special', 'gourmet'],

    'Class': ['class', 'lecture', 'study', 'exam', 'syllabus', 'course', 'subject', 'teacher', 'pupil',
              'homework', 'assignment', 'grades', 'curriculum', 'session', 'seminar', 'tutorial', 
              'training', 'education', 'learning', 'knowledge', 'classroom', 'students', 'test', 
              'quiz', 'project', 'presentation', 'feedback', 'evaluation', 'participation', 'attendance',
              'peer', 'workshop', 'skills', 'knowledge-sharing', 'session notes', 'resources', 'discussions'],

    'Fear': ['anxiety', 'nervous', 'fear', 'stress', 'panic', 'worry', 'apprehension', 'fright', 
             'dread', 'terror', 'unease', 'phobia', 'tension', 'distress', 'foreboding', 
             'alarm', 'disquiet', 'agitation', 'fret', 'concern', 'trepidation', 'shock', 
             'timidity', 'horror', 'fears', 'trouble', 'despair', 'anguish', 'nervousness', 
             'fretfulness', 'restlessness', 'uneasiness', 'worrying thoughts', 'self-doubt'],

    'Food': ['food', 'dish', 'cuisine', 'dinner', 'breakfast', 'lunch', 'snack', 'meal', 'recipe',
              'ingredient', 'cooking', 'baking', 'grill', 'stew', 'soup', 'salad', 'appetizer', 
              'dessert', 'beverage', 'sauce', 'taste', 'flavor', 'dish', 'cater', 'feast', 
              'vegetarian', 'vegan', 'spicy', 'sweet', 'sour', 'bitter', 'savory', 'sustenance', 
              'gastronomy', 'meal prep', 'catering', 'diet', 'nutrition', 'delicacy'],

    'Funny': ['joke', 'funny', 'humor', 'laugh', 'comedy', 'giggle', 'hilarity', 'witty', 
              'amusement', 'entertainment', 'satire', 'puns', 'sketch', 'parody', 'gag', 
              'banter', 'prank', 'chuckle', 'jest', 'silly', 'laughter', 'smile', 
              'wit', 'punchline', 'stand-up', 'humorist', 'mock', 'light-hearted', 'comic', 
              'mirth', 'jester', 'whimsy', 'absurdity', 'ridicule', 'sardonic', 'comedic relief'],

    'Hackathons': ['hackathon', 'coding', 'programming', 'development', 'innovation', 'project', 
                   'collaboration', 'competition', 'teamwork', 'solution', 'challenge', 'creativity', 
                   'design', 'technology', 'software', 'app', 'prototype', 'ideas', 'brainstorm', 
                   'coding', 'sprint', 'workshop', 'presentations', 'networking', 'mentorship', 
                   'debugging', 'iteration', 'community', 'resources', 'support', 'collaborate', 
                   'brainchild', 'digital', 'development', 'platform'],

    'Hostel': ['hostel', 'room', 'dormitory', 'bed', 'sleep', 'accommodation', 'student housing', 
               'community', 'shared', 'living', 'facilities', 'kitchen', 'study room', 'laundry', 
               'common area', 'security', 'privacy', 'rules', 'guests', 'check-in', 'check-out', 
               'maintenance', 'caretaker', 'roommate', 'environment', 'housing', 'flatmates', 
               'dorm', 'stay', 'locality', 'residency', 'boarding', 'shared space', 'housing policy'],

    'Lessons': ['lesson', 'learning', 'teaching', 'knowledge', 'education', 'lecture', 
                'course', 'topic', 'material', 'study', 'skill', 'practice', 'method', 
                'curriculum', 'experience', 'strategy', 'session', 'development', 
                'coaching', 'training', 'tutoring', 'study group', 'assignment', 
                'resources', 'expertise', 'instructor', 'guide', 'knowledge-sharing', 
                'concept', 'review', 'session plan', 'objectives', 'engagement'],

    'Motivation': ['motivation', 'goal', 'inspiration', 'dream', 'drive', 'ambition', 
                   'determination', 'passion', 'success', 'aspiration', 'hope', 
                   'encouragement', 'support', 'positivity', 'enthusiasm', 'challenge', 
                   'achievement', 'persistence', 'resilience', 'focus', 'commitment', 
                   'self-improvement', 'energy', 'mindset', 'creativity', 'vision', 
                   'growth', 'opportunity', 'resolve', 'action', 'dedication', 'self-belief', 
                   'tenacity'],

    'Student': ['student', 'pupil', 'learner', 'classmate', 'school', 'scholar', 
                'enrollment', 'study', 'education', 'participant', 'research', 
                'academic', 'coursework', 'degree', 'graduate', 'undergraduate', 
                'homework', 'study group', 'team', 'peer', 'classroom', 
                'project', 'feedback', 'performance', 'report', 'assessment', 
                'attendance', 'presentation', 'evaluation', 'mentor', 'adviser', 
                'curriculum', 'academic journey', 'student life', 'extracurricular'],

    'Student Club': ['club', 'activity', 'event', 'group', 'community', 'membership', 
                     'participation', 'project', 'collaboration', 'teamwork', 
                     'meeting', 'social', 'networking', 'initiative', 'leadership', 
                     'interest', 'volunteer', 'development', 'forum', 'workshop', 
                     'program', 'engagement', 'challenge', 'involvement', 'experience', 
                     'skills', 'projects', 'discussion', 'outreach', 'support', 'fun', 
                     'gathering', 'events', 'fellowship', 'camaraderie', 'contribution'],

    'Teacher': ['teacher', 'professor', 'mentor', 'instructor', 'guide', 'educator', 
                'lecturer', 'trainer', 'facilitator', 'tutor', 'coach', 'staff', 
                'class', 'curriculum', 'education', 'knowledge', 'feedback', 
                'support', 'assessment', 'evaluation', 'experience', 'expert', 
                'role model', 'influence', 'advice', 'learning', 'development', 
                'research', 'community', 'engagement', 'inspiration', 'instruction'],

    'Transport': ['bus', 'car', 'bike', 'train', 'transport', 'travel', 'journey', 
                  'commute', 'vehicle', 'route', 'ticket', 'station', 'departure', 
                  'arrival', 'schedule', 'fare', 'destination', 'logistics', 
                  'public transport', 'taxi', 'shuttle', 'ride', 'transportation', 
                  'carpool', 'aviation', 'ship', 'freight', 'cargo', 'delivery', 
                  'infrastructure', 'accessibility', 'metro', 'trolley', 'journey plan'],

    'Empowerment': ['empowerment', 'strength', 'support', 'enable', 'capacity', 'confidence', 
                    'growth', 'development', 'advancement', 'skill', 'training', 'resources', 
                    'knowledge', 'agency', 'leadership', 'advocacy', 'self-efficacy', 
                    'motivation', 'influence', 'self-advocacy', 'assertiveness', 'potential'],

    'Employment': ['employment', 'job', 'work', 'career', 'profession', 'occupation', 
                   'hiring', 'resume', 'interview', 'salary', 'benefits', 'position', 
                   'full-time', 'part-time', 'temporary', 'contract', 'workplace', 
                   'experience', 'training', 'skills', 'internship', 'vacancy', 
                   'application', 'career development', 'promotion', 'networking', 
                   'recruitment', 'job search', 'employee', 'employer', 'staff', 
                   'responsibility', 'role', 'work-life balance']
}


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
    # Load object detection model
    model = AutoModelForObjectDetection.from_pretrained("microsoft/table-transformer-detection", revision="no_timm")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)

    # Load and process image
    image = Image.open(file_path).convert("RGB")

    class MaxResize(object):
        def __init__(self, max_size=800):
            self.max_size = max_size

        def __call__(self, image):
            width, height = image.size
            scale = self.max_size / max(width, height)
            return image.resize((int(round(scale * width)), int(round(scale * height))))

    detection_transform = transforms.Compose([
        MaxResize(800),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    pixel_values = detection_transform(image).unsqueeze(0).to(device)

    # Perform object detection
    with torch.no_grad():
        outputs = model(pixel_values)

    # Helper functions for bounding box processing
    def box_cxcywh_to_xyxy(x):
        x_c, y_c, w, h = x.unbind(-1)
        return torch.stack([(x_c - 0.5 * w), (y_c - 0.5 * h), (x_c + 0.5 * w), (y_c + 0.5 * h)], dim=1)

    def rescale_bboxes(out_bbox, size):
        img_w, img_h = size
        b = box_cxcywh_to_xyxy(out_bbox)
        return b * torch.tensor([img_w, img_h, img_w, img_h], dtype=torch.float32)

    # Update id2label to include "no object"
    id2label = model.config.id2label
    id2label[len(id2label)] = "no object"

    # Convert outputs to detected objects
    def outputs_to_objects(outputs, img_size, id2label):
        m = outputs.logits.softmax(-1).max(-1)
        pred_labels = list(m.indices.detach().cpu().numpy())[0]
        pred_scores = list(m.values.detach().cpu().numpy())[0]
        pred_bboxes = outputs['pred_boxes'].detach().cpu()[0]
        pred_bboxes = [elem.tolist() for elem in rescale_bboxes(pred_bboxes, img_size)]

        return [
            {'label': id2label[int(label)], 'score': float(score), 'bbox': bbox}
            for label, score, bbox in zip(pred_labels, pred_scores, pred_bboxes)
            if id2label[int(label)] != 'no object'
        ]

    objects = outputs_to_objects(outputs, image.size, id2label)

    # Crop detected tables
    def objects_to_crops(img, objects, class_thresholds, padding=10):
        table_crops = []
        for obj in objects:
            if obj['score'] < class_thresholds.get(obj['label'], 0):
                continue

            bbox = [obj['bbox'][0]-padding, obj['bbox'][1]-padding, obj['bbox'][2]+padding, obj['bbox'][3]+padding]
            cropped_img = img.crop(bbox)

            if obj['label'] == 'table rotated':
                cropped_img = cropped_img.rotate(270, expand=True)

            table_crops.append({'image': cropped_img})

        return table_crops

    detection_class_thresholds = {"table": 0.5, "table rotated": 0.5, "no object": 10}
    tables_crops = objects_to_crops(image, objects, detection_class_thresholds, padding=0)

    if not tables_crops:
        return []

    cropped_table = tables_crops[0]['image'].convert("RGB")

    # Load structure recognition model
    structure_model = TableTransformerForObjectDetection.from_pretrained("microsoft/table-structure-recognition-v1.1-all")
    structure_model.to(device)

    structure_transform = transforms.Compose([
        MaxResize(1000),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    pixel_values = structure_transform(cropped_table).unsqueeze(0).to(device)

    # Perform structure recognition
    with torch.no_grad():
        outputs = structure_model(pixel_values)

    structure_id2label = structure_model.config.id2label
    structure_id2label[len(structure_id2label)] = "no object"

    cells = outputs_to_objects(outputs, cropped_table.size, structure_id2label)

    def get_cell_coordinates_by_row(table_data):
        rows = sorted([entry for entry in table_data if entry['label'] == 'table row'], key=lambda x: x['bbox'][1])
        columns = sorted([entry for entry in table_data if entry['label'] == 'table column'], key=lambda x: x['bbox'][0])

        def find_cell_coordinates(row, column):
            return [column['bbox'][0], row['bbox'][1], column['bbox'][2], row['bbox'][3]]

        cell_coordinates = []
        for row in rows:
            row_cells = [{'cell': find_cell_coordinates(row, col)} for col in columns]
            cell_coordinates.append({'cells': row_cells})

        return cell_coordinates

    cell_coordinates = get_cell_coordinates_by_row(cells)

    # OCR on detected cells
    reader = easyocr.Reader(['en'])

    def apply_ocr(cell_coordinates):
        data, max_num_columns = {}, 0

        for idx, row in enumerate(tqdm(cell_coordinates)):
            row_text = []
            for cell in row["cells"]:
                cell_image = np.array(cropped_table.crop(cell["cell"]))
                result = reader.readtext(cell_image)
                text = " ".join([x[1] for x in result]) if result else ""
                row_text.append(text)

            max_num_columns = max(max_num_columns, len(row_text))
            data[idx] = row_text

        for row, row_data in data.items():
            if len(row_data) < max_num_columns:
                row_data.extend(["" for _ in range(max_num_columns - len(row_data))])

        return data

    table_data=apply_ocr(cell_coordinates)
    # Convert integer keys to strings
    table_data_str = {str(k): v for k, v in table_data.items()}

    return {"extracted_text": table_data}
