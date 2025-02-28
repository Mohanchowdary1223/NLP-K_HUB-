import pdfplumber
import pytesseract
from pdf2image import convert_from_path
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from heapq import nlargest
import spacy

# Download necessary NLTK data
nltk.download('punkt')
nltk.download('stopwords')
nlp = spacy.load("en_core_web_sm")

# Function to extract text using pdfplumber
def extract_text_with_pdfplumber(pdf_path):
    all_text = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                all_text.append(text)
            else:
                image = page.to_image()
                ocr_text = pytesseract.image_to_string(image.original)
                all_text.append(ocr_text)
    return "\n".join(all_text)

# Function to extract text using OCR if pdfplumber fails
def extract_text_with_ocr(pdf_path):
    images = convert_from_path(pdf_path)
    all_text = [pytesseract.image_to_string(image) for image in images]
    return "\n".join(all_text)

# General extraction function
def extract_content_from_pdf(pdf_path):
    try:
        # First try extracting text using pdfplumber
        extracted_text = extract_text_with_pdfplumber(pdf_path)
        if not extracted_text.strip():  # If no text is found, use OCR
            extracted_text = extract_text_with_ocr(pdf_path)
        return extracted_text
    except Exception as e:
        return ""

# Function to extract key points from text (improved for key sentence extraction)
def extract_keypoints(text, top_n=10):
    doc = nlp(text)
    sentences = [sent.text.strip() for sent in doc.sents if len(sent.text.split()) > 8]  # Avoid very short sentences
    
    stop_words = set(stopwords.words('english'))
    sentence_scores = {}
    
    for sent in sentences:
        words = word_tokenize(sent.lower())
        important_words = [word for word in words if word not in stop_words and word.isalpha()]
        sentence_scores[sent] = len(important_words)
    
    keypoints = nlargest(top_n, sentence_scores, key=sentence_scores.get)
    return keypoints

# Function to summarize text (more refined approach to capture exam-oriented content)
def summarize_text(text, summary_length=7):
    stop_words = set(stopwords.words('english'))
    words = word_tokenize(text)
    word_frequencies = {}

    for word in words:
        if word.lower() not in stop_words and word.isalpha():
            word_frequencies[word.lower()] = word_frequencies.get(word.lower(), 0) + 1
            
    max_frequency = max(word_frequencies.values(), default=1)
    for word in word_frequencies:
        word_frequencies[word] /= max_frequency

    sentence_scores = {}
    sentences = sent_tokenize(text)
    for sentence in sentences:
        for word in word_tokenize(sentence.lower()):
            if word in word_frequencies:
                if 10 < len(sentence.split(' ')) < 50:  # Avoid very short or very long sentences
                    sentence_scores[sentence] = sentence_scores.get(sentence, 0) + word_frequencies[word]

    summary_sentences = nlargest(summary_length, sentence_scores, key=sentence_scores.get)
    summary = ' '.join(summary_sentences)
    keypoints = extract_keypoints(summary, top_n=summary_length)  # Extract key points from summary
    
    return summary, keypoints

# Function to process and organize PDF output
def process_exam_pdf(pdf_path):
    # Extract full content from PDF
    text = extract_content_from_pdf(pdf_path)
    if text:
        # Summarize the full text and extract key points
        summary, keypoints = summarize_text(text)
        
        # Organize the key points line by line
        keypoints_line_by_line = "\n".join([f"{i+1}. {point}" for i, point in enumerate(keypoints)])
        
        # Returning the summary and key points in a structured format
        output = {
            "summary": summary,
            "keypoints": keypoints_line_by_line
        }
        
        return output
    else:
        return {"error": "No text extracted from the PDF."}
