from googletrans import Translator
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client['ocr_database']  # Your database name
translations_collection = db['translations']  # Collection for storing translations
original_texts_collection = db['original_texts']  # Collection for original untranslated text

# Simulating multiple category databases with dictionaries
category_database = {
    'Fee': {}, 'Admissions': {}, 'Courses': {}, 'Exams': {}, 'Hostel': {},
    'Day Scholar': {}, 'General': {}, 'Canteen': {}, 'Class': {}, 'Fear': {},
    'Food': {}, 'Funny': {}, 'Hackathons': {}, 'Lessons': {}, 'Motivation': {},
    'Student': {}, 'Student Club': {}, 'Teacher': {}, 'Transport': {}, 'Empowerment': {}, 'Employment': {}
}

# Define keywords for each category
keywords = {
    'Canteen': ['food', 'lunch', 'snack', 'meal', 'canteen', 'dinner', 'breakfast', 'cuisine', 'dish', 'restaurant',
                'menu', 'eating', 'order', 'takeaway', 'serve', 'delicious', 'taste', 'cook',
                'chef', 'recipe', 'appetizer', 'main course', 'dessert', 'refreshments', 'buffet', 
                'drinks', 'beverages', 'snacks', 'treat', 'special', 'gourmet'],
    
    'Class': ['class', 'lecture', 'study', 'exam', 'syllabus', 'course', 'subject', 'teacher', 'pupil',
              'homework', 'assignment', 'grades', 'curriculum', 'session', 'seminar', 'tutorial', 
              'training', 'education', 'learning', 'knowledge', 'classroom', 'students', 'test', 
              'quiz', 'project', 'presentation', 'feedback', 'evaluation', 'participation', 'attendance',
              'peer', 'workshop'],

    'Fear': ['anxiety', 'nervous', 'fear', 'stress', 'panic', 'worry', 'apprehension', 'fright', 
             'dread', 'terror', 'unease', 'phobia', 'tension', 'distress', 'foreboding', 
             'alarm', 'disquiet', 'agitation', 'fret', 'concern', 'trepidation', 'shock', 
             'timidity', 'horror', 'fears', 'trouble', 'despair', 'anguish', 'turbulence'],

    'Food': ['food', 'dish', 'cuisine', 'dinner', 'breakfast', 'lunch', 'snack', 'meal', 'recipe',
             'ingredient', 'cooking', 'baking', 'grill', 'stew', 'soup', 'salad', 'appetizer', 
             'dessert', 'beverage', 'sauce', 'taste', 'flavor', 'dish', 'cater', 'feast', 
             'vegetarian', 'vegan', 'spicy', 'sweet', 'sour', 'bitter', 'savory'],

    'Funny': ['joke', 'funny', 'humor', 'laugh', 'comedy', 'giggle', 'hilarity', 'witty', 
              'amusement', 'entertainment', 'satire', 'puns', 'sketch', 'parody', 'gag', 
              'banter', 'prank', 'chuckle', 'jest', 'silly', 'laughter', 'smile', 
              'wit', 'punchline', 'stand-up', 'humorist', 'mock', 'light-hearted', 'comic', 'mirth'],

    'Hackathons': ['hackathon', 'coding', 'programming', 'development', 'innovation', 'project', 
                   'collaboration', 'competition', 'teamwork', 'solution', 'challenge', 'creativity', 
                   'design', 'technology', 'software', 'app', 'prototype', 'ideas', 'brainstorm', 
                   'coding', 'sprint', 'workshop', 'presentations', 'networking', 'mentorship', 
                   'debugging', 'iteration', 'community', 'resources', 'support'],

    'Hostel': ['hostel', 'room', 'dormitory', 'bed', 'sleep', 'accommodation', 'student housing', 
               'community', 'shared', 'living', 'facilities', 'kitchen', 'study room', 'laundry', 
               'common area', 'security', 'privacy', 'rules', 'guests', 'check-in', 'check-out', 
               'maintenance', 'caretaker', 'roommate', 'environment', 'housing', 'flatmates', 
               'dorm', 'stay', 'locality'],

    'Lessons': ['lesson', 'learning', 'teaching', 'knowledge', 'education', 'lecture', 
                'course', 'topic', 'material', 'study', 'skill', 'practice', 'method', 
                'curriculum', 'experience', 'strategy', 'session', 'development', 
                'coaching', 'training', 'tutoring', 'study group', 'assignment', 
                'resources', 'expertise', 'instructor', 'guide', 'knowledge-sharing'],

    'Motivation': ['motivation', 'goal', 'inspiration', 'dream', 'drive', 'ambition', 
                   'determination', 'passion', 'success', 'aspiration', 'hope', 
                   'encouragement', 'support', 'positivity', 'enthusiasm', 'challenge', 
                   'achievement', 'persistence', 'resilience', 'focus', 'commitment', 
                   'self-improvement', 'energy', 'mindset', 'creativity', 'vision', 
                   'growth', 'opportunity', 'resolve', 'action', 'dedication'],

    'Student': ['student', 'pupil', 'learner', 'classmate', 'school', 'scholar', 
                'enrollment', 'study', 'education', 'participant', 'research', 
                'academic', 'coursework', 'degree', 'graduate', 'undergraduate', 
                'homework', 'study group', 'team', 'peer', 'classroom', 
                'project', 'feedback', 'performance', 'report', 'assessment', 
                'attendance', 'presentation', 'evaluation', 'mentor', 'adviser'],

    'Student Club': ['club', 'activity', 'event', 'group', 'community', 'membership', 
                     'participation', 'project', 'collaboration', 'teamwork', 
                     'meeting', 'social', 'networking', 'initiative', 'leadership', 
                     'interest', 'volunteer', 'development', 'forum', 'workshop', 
                     'program', 'engagement', 'challenge', 'involvement', 'experience', 
                     'skills', 'projects', 'discussion', 'outreach', 'support', 'fun'],

    'Teacher': ['teacher', 'professor', 'mentor', 'instructor', 'guide', 'educator', 
                'lecturer', 'trainer', 'facilitator', 'tutor', 'coach', 'staff', 
                'class', 'curriculum', 'education', 'knowledge', 'feedback', 
                'support', 'assessment', 'evaluation', 'experience', 'expert', 
                'role model', 'influence', 'advice', 'learning', 'development', 
                'research', 'community', 'engagement', 'inspiration'],

    'Transport': ['bus', 'car', 'bike', 'train', 'transport', 'travel', 'journey', 
                  'commute', 'vehicle', 'route', 'ticket', 'station', 'departure', 
                  'arrival', 'schedule', 'fare', 'destination', 'logistics', 
                  'public transport', 'taxi', 'shuttle', 'ride', 'transportation', 
                  'carpool', 'aviation', 'ship', 'freight', 'cargo', 'delivery', 
                  'infrastructure', 'accessibility'],

    'Empowerment': ['empowerment', 'strength', 'support', 'enable', 'capacity', 'confidence', 
                    'growth', 'development', 'advancement', 'skill', 'training', 'resources', 
                    'knowledge', 'agency', 'leadership', 'advocacy', 'self-efficacy'],

    'Employment': ['employment', 'job', 'work', 'career', 'profession', 'occupation', 
                   'hiring', 'resume', 'interview', 'salary', 'benefits', 'position', 
                   'full-time', 'part-time', 'unemployment', 'workforce', 'skills', 
                   'training', 'experience', 'opportunity']
}

# Define regions and their respective language codes
language_to_region = {
    'ta': 'South Indian', 'te': 'South Indian', 'kn': 'South Indian', 'ml': 'South Indian',
    'hi': 'North Indian', 'bn': 'North Indian', 'pa': 'North Indian', 'mr': 'North Indian',
    'en': 'European', 'fr': 'European', 'es': 'European', 'de': 'European',
    'it': 'European', 'pt': 'European', 'nl': 'European', 'sv': 'European',
    'ru': 'European', 'uk': 'European', 'el': 'European', 'tr': 'Middle Eastern',
    'ar': 'Middle Eastern', 'he': 'Middle Eastern', 'fa': 'Middle Eastern',
    'zh': 'East Asian', 'ja': 'East Asian', 'ko': 'East Asian', 'vi': 'Southeast Asian',
    'th': 'Southeast Asian', 'id': 'Southeast Asian', 'ms': 'Southeast Asian',
    'sw': 'African', 'am': 'African', 'yo': 'African', 'ig': 'African', 'zu': 'African',
    'af': 'African', 'ha': 'African', 'so': 'African', 'xh': 'African'
}


def detect_and_translate(text, target_lang):
    translator = Translator()

    # Detect the source language
    try:
        detected_lang = translator.detect(text).lang
        print(f"Detected language: {detected_lang}")
    except Exception as e:
        print(f"Error detecting language: {e}")
        return None

    # Save the original text to MongoDB (before translation)
    save_original_text_to_mongodb(text, detected_lang)

    # Translate text into the selected target language
    try:
        translation = translator.translate(text, src=detected_lang, dest=target_lang).text
    except Exception as e:
        print(f"Error during translation: {e}")
        return None

    print(f"Translated to {target_lang}: {translation}")

    # Save the translation in the appropriate regional database
    region = language_to_region.get(target_lang, "Unknown Region")
    category = categorize_text(text)
    category_database[category][target_lang] = translation

    # Save translation to MongoDB
    save_translation_to_mongodb(text, detected_lang, translation, target_lang, category, region)

    print(f"Translation saved in '{category}' category under language '{target_lang}'")
    return translation

def categorize_text(text):
    lower_text = text.lower()
    for category, keyword_list in keywords.items():
        if any(keyword in lower_text for keyword in keyword_list):
            return category
    return 'General'

def save_original_text_to_mongodb(original_text, source_lang):
    original_text_record = {
        'original_text': original_text,
        'source_lang': source_lang
    }
    original_texts_collection.insert_one(original_text_record)
    print(f"Saved original text to MongoDB: {original_text_record}")

def save_translation_to_mongodb(original_text, source_lang, translated_text, target_lang, category, region):
    translation_record = {
        'original_text': original_text,
        'source_lang': source_lang,
        'translated_text': translated_text,
        'target_lang': target_lang,
        'category': category,
        'region': region
    }
    translations_collection.insert_one(translation_record)
    print(f"Saved translation to MongoDB: {translation_record}")

def main():
    input_text = input("Enter the text to translate: ")
    target_language = input("Enter the target language code (e.g., 'ta' for Tamil, 'en' for English, etc.): ")

    # Perform translation, categorization, and save to MongoDB
    translated_text = detect_and_translate(input_text, target_language)

    # Simulating database printout
    print("\n--- Category Database Content ---")
    for category, translations in category_database.items():
        print(f"\n{category} Category Translations:")
        for lang, translation in translations.items():
            print(f"{lang}: {translation}")

if __name__ == "__main__":
    main()