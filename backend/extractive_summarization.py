import pdfplumber
import pytesseract
from pdf2image import convert_from_path
import nltk
import os
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from heapq import nlargest
from collections import Counter
import re
import spacy

# Initialize NLTK and download required resources
def initialize_nltk():
    try:
        # Create nltk_data directory if it doesn't exist
        nltk_data_dir = os.path.expanduser('~/nltk_data')
        if not os.path.exists(nltk_data_dir):
            os.makedirs(nltk_data_dir)

        # Download required NLTK resources
        nltk.download('punkt')  # Changed from punkt_tab to punkt
        nltk.download('stopwords')
        return True
    except Exception as e:
        print(f"Error initializing NLTK: {str(e)}")
        return False

# Initialize NLTK when module is loaded
initialize_nltk()

nlp = spacy.load("en_core_web_sm")

def extract_text_with_pdfplumber(pdf_path):
    try:
        all_text = []
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    all_text.append(text)
                else:
                    # Handle image-based page
                    with page.to_image() as image:
                        ocr_text = pytesseract.image_to_string(image.original)
                        all_text.append(ocr_text)
        return "\n".join(all_text)
    except Exception as e:
        print(f"Error in extract_text_with_pdfplumber: {str(e)}")
        return ""

def extract_text_with_ocr(pdf_path):
    images = convert_from_path(pdf_path)
    all_text = [pytesseract.image_to_string(image) for image in images]
    return "\n".join(all_text)

def extract_content_from_pdf(pdf_path):
    try:
        # First try with pdfplumber
        extracted_text = extract_text_with_pdfplumber(pdf_path)
        
        # If no text was extracted, try OCR
        if not extracted_text.strip():
            try:
                images = convert_from_path(pdf_path)
                extracted_text = "\n".join(
                    pytesseract.image_to_string(image) 
                    for image in images
                )
            except Exception as ocr_error:
                print(f"OCR error: {str(ocr_error)}")
                return ""
                
        return extracted_text
    except Exception as e:
        print(f"Error extracting content from PDF: {str(e)}")
        return ""

def extract_keypoints(summary):
    doc = nlp(summary)

    # Extract meaningful sentences instead of single words
    keypoints = []
    for sent in doc.sents:
        if len(sent.text.split()) > 3:  # Avoid very short sentences
            keypoints.append(sent.text.strip())

    return keypoints[:5]

def summarize_text(text):
    """
    Simple extractive summarization that takes the first 5 sentences
    """
    try:
        if not text or not isinstance(text, str):
            return "No text available to summarize."

        # Clean the text
        text = text.strip()
        if not text:
            return "Empty text provided."

        # Split into sentences
        sentences = text.split('.')
        sentences = [s.strip() for s in sentences if s.strip()]

        # Return original text if it's already short
        if len(sentences) <= 5:
            return text

        # Take first 5 sentences as summary
        summary_sentences = sentences[:5]
        summary = '. '.join(summary_sentences) + '.'
        
        return summary

    except Exception as e:
        print(f"Summarization error: {str(e)}")
        return text  # Return original text if summarization fails
