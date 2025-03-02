import os
from pydub import AudioSegment
import speech_recognition as sr
from pymongo import MongoClient

# Define the keyword lists for each category
keywords = {
    'Canteen': ['food', 'lunch', 'snack', 'meal', 'canteen', 'dinner', 'breakfast', 'cuisine', 'dish', 
                 'restaurant', 'menu', 'eating', 'order', 'takeaway', 'serve', 'delicious', 'taste', 
                 'cook', 'chef', 'recipe', 'appetizer', 'main course', 'dessert', 'refreshments', 
                 'buffet', 'drinks', 'beverages', 'snacks', 'treat', 'special', 'gourmet'],
    
    'Class': ['class', 'lecture', 'study', 'exam', 'syllabus', 'course', 'subject', 'teacher', 
              'pupil', 'homework', 'assignment', 'grades', 'curriculum', 'session', 'seminar', 
              'tutorial', 'training', 'education', 'learning', 'knowledge', 'classroom', 'students', 
              'test', 'quiz', 'project', 'presentation', 'feedback', 'evaluation', 'participation', 
              'attendance', 'peer', 'workshop'],

    'Fear': ['anxiety', 'nervous', 'fear', 'stress', 'panic', 'worry', 'apprehension', 'fright', 
             'dread', 'terror', 'unease', 'phobia', 'tension', 'distress', 'foreboding', 
             'alarm', 'disquiet', 'agitation', 'fret', 'concern', 'trepidation', 'shock', 
             'timidity', 'horror', 'fears', 'trouble', 'despair', 'anguish', 'trouble', 'turbulence'],

    'Food': ['food', 'dish', 'cuisine', 'dinner', 'breakfast', 'lunch', 'snack', 'meal', 
              'recipe', 'ingredient', 'cooking', 'baking', 'grill', 'stew', 'soup', 'salad', 
              'appetizer', 'dessert', 'beverage', 'sauce', 'taste', 'flavor', 'dish', 
              'cater', 'feast', 'vegetarian', 'vegan', 'spicy', 'sweet', 'sour', 'bitter', 
              'savory'],

    'Funny': ['joke', 'funny', 'humor', 'laugh', 'comedy', 'giggle', 'hilarity', 'witty', 
              'amusement', 'entertainment', 'satire', 'puns', 'sketch', 'parody', 'gag', 
              'banter', 'prank', 'chuckle', 'jest', 'silly', 'laughter', 'smile', 
              'wit', 'punchline', 'stand-up', 'humorist', 'mock', 'light-hearted', 'comic', 
              'mirth'],

    'Hackathons': ['hackathon', 'coding', 'programming', 'development', 'innovation', 'project', 
                   'collaboration', 'competition', 'teamwork', 'solution', 'challenge', 
                   'creativity', 'design', 'technology', 'software', 'app', 'prototype', 
                   'ideas', 'brainstorm', 'coding', 'sprint', 'workshop', 'presentations', 
                   'networking', 'mentorship', 'debugging', 'iteration', 'community', 
                   'resources', 'support'],

    'Hostel': ['hostel', 'room', 'dormitory', 'bed', 'sleep', 'accommodation', 
               'student housing', 'community', 'shared', 'living', 'facilities', 
               'kitchen', 'study room', 'laundry', 'common area', 'security', 
               'privacy', 'rules', 'guests', 'check-in', 'check-out', 
               'maintenance', 'caretaker', 'roommate', 'environment', 
               'housing', 'flatmates', 'dorm', 'stay', 'locality'],

    'Lessons': ['lesson', 'learning', 'teaching', 'knowledge', 'education', 
                'lecture', 'course', 'topic', 'material', 'study', 'skill', 
                'practice', 'method', 'curriculum', 'experience', 'strategy', 
                'session', 'development', 'coaching', 'training', 'tutoring', 
                'study group', 'assignment', 'resources', 'expertise', 
                'instructor', 'guide', 'knowledge-sharing'],

    'Motivation': ['motivation', 'goal', 'inspiration', 'dream', 'drive', 
                   'ambition', 'determination', 'passion', 'success', 'aspiration', 
                   'hope', 'encouragement', 'support', 'positivity', 'enthusiasm', 
                   'challenge', 'achievement', 'persistence', 'resilience', 
                   'focus', 'commitment', 'self-improvement', 'energy', 'mindset', 
                   'creativity', 'vision', 'growth', 'opportunity', 'resolve', 
                   'action', 'dedication'],

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
                     'program', 'engagement', 'challenge', 'involvement', 
                     'experience', 'skills', 'projects', 'discussion', 
                     'outreach', 'support', 'fun'],

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

    'Empowerment': ['empowerment', 'strength', 'support', 'enable', 'capacity', 
                    'confidence', 'growth', 'development', 'advancement', 'skill', 
                    'training', 'resources', 'knowledge', 'agency', 'leadership', 
                    'advocacy', 'self-efficacy'],

    'Employment': ['employment', 'job', 'work', 'career', 'profession', 'occupation', 
                   'hiring', 'resume', 'interview', 'salary', 'benefits', 'position', 
                   'full-time', 'part-time', 'unemployment', 'workforce', 'skills', 
                   'training', 'experience', 'opportunity']
}

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client['NLP_SIGN']  # Your database name

def convert_mp3_to_wav(mp3_path, wav_output_path):
    """Convert MP3 file to WAV format."""
    audio = AudioSegment.from_mp3(mp3_path)
    audio.export(wav_output_path, format="wav")
    print(f"Converted {mp3_path} to {wav_output_path}")

def audio_to_text(audio_path):
    """Convert audio file to text using Google Speech Recognition."""
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_path) as source:
        audio_data = recognizer.record(source)
        try:
            text = recognizer.recognize_google(audio_data)
            return text
        except sr.UnknownValueError:
            print("Speech Recognition could not understand audio.")
            return None
        except sr.RequestError as e:
            print(f"Could not request results from Speech Recognition service: {e}")
            return None

def classify_text(extracted_text):
    """Classify extracted text into predefined categories."""
    classified_data = {}
    for category, words in keywords.items():
        if any(word in extracted_text.lower() for word in words):
            classified_data[category] = extracted_text
    return classified_data

def save_to_mongo(category, text, email):
    """Save classified data to MongoDB."""
    data = {
        'email': email,
        'text': text
    }
    db[category].insert_one(data)  # Save under the respective category
    print(f"Saved to MongoDB under category '{category}': {data}")

if __name__ == "__main__":
    # Example usage
    mp3_file_path = r"D:\NLP\backend\audio_to_text.py3"  # Path to your MP3 file
    wav_file_path = r"D:\NLP\backend\uploads\audio.wav"   # Path where the WAV file will be saved

    # Convert MP3 to WAV if necessary
    if mp3_file_path.endswith(".mp3"):
        convert_mp3_to_wav(mp3_file_path, wav_file_path)

    # Extract text from the audio
    extracted_text = audio_to_text(wav_file_path)
    if extracted_text:
        print(f"Extracted Text: {extracted_text}")

        # Classify the extracted text
        classified_data = classify_text(extracted_text)
        print(f"Classified Data: {classified_data}")

        # Save to MongoDB for each classified category
        for category in classified_data.keys():
            save_to_mongo(category, classified_data[category], "user@example.com")  # Replace with actual user email
