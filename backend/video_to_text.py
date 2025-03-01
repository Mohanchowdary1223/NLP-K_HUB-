import os
from moviepy.editor import VideoFileClip
import speech_recognition as sr
from pymongo import MongoClient
import tempfile

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
                   'full-time', 'part-time', 'unemployment', 'workforce', 'skills', 
                   'training', 'experience', 'opportunity', 'job market', 'career development', 
                   'internship', 'recruitment', 'work environment', 'employment agency', 
                   'job search', 'CV', 'work experience', 'positions available', 'application', 'offer'],
    
    'Fee': ['fee', 'fees', 'tuition', 'cost', 'payment', 'charge', 'price', 'expenses', 'financial', 
             'bill', 'amount', 'rate', 'tuition fees', 'school fees', 'chargeable', 'registration fee'],

    'Admissions': ['admission', 'enroll', 'enrollment', 'apply', 'application', 'intake', 
                   'registration', 'submission', 'acceptance', 'criteria', 'process', 
                   'review', 'interview', 'requirements', 'selection', 'offer'],

    'Courses': ['course', 'subject', 'curriculum', 'class', 'program', 'module', 'topic', 
                'study', 'content', 'classroom', 'instruction', 'learning path', 
                'academic program', 'schedule', 'course outline', 'prerequisites'],

    'Exams': ['exam', 'test', 'assessment', 'quiz', 'evaluation', 'finals', 'midterm', 
              'standardized test', 'score', 'results', 'marking', 'grading', 'testing', 
              'exam paper', 'oral exam', 'written exam', 'subject test'],

    'Day Scholar': ['day scholar', 'commute', 'day student', 'transport', 'bus', 
                    'day pass', 'travel', 'school commute', 'daily', 'non-resident', 
                    'commuting student', 'school transport', 'local student', 'daytime', 
                    'off-campus', 'return', 'daily journey']
}
# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/") 
# mongodb+srv://project:<database>@cluster0.qff9s.mongodb.net/
db = client['NLP_SIGN']  # Your database name

def extract_audio(video_path, audio_output_path):
    """Extracts audio from the video and saves it as a separate file."""
    try:
        with VideoFileClip(video_path) as video:
            video.audio.write_audiofile(audio_output_path)
        print("Audio extracted successfully.")
    except Exception as e:
        print(f"Error extracting audio: {e}")

def audio_to_text(audio_path):
    """Converts audio file to text using speech recognition."""
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_path) as source:
        audio_data = recognizer.record(source)
        try:
            text = recognizer.recognize_google(audio_data)
            print("Text extracted from audio successfully.")
            return text
        except sr.UnknownValueError:
            print("Speech Recognition could not understand audio.")
            return ""
        except sr.RequestError:
            print("Could not request results from Speech Recognition service.")
            return ""
    return ""

def classify_text(extracted_text):
    """Classifies extracted text into categories based on keywords."""
    classified_data = {key: [] for key in keywords}  # Initialize classified data
    words = extracted_text.lower().split()  # Split text into words

    # Create a set for faster keyword lookup
    keyword_sets = {key: set(value) for key, value in keywords.items()}

    # Classify based on keywords
    for word in words:
        for category, kw_set in keyword_sets.items():
            if word in kw_set:
                classified_data[category].append(word)

    # Filter out categories with no matches
    classified_data = {category: words for category, words in classified_data.items() if words}
    print("Classification completed:", classified_data)
    return classified_data

def save_to_mongo(classified_data, extracted_text, category, video_path):
    """Saves classified data to MongoDB under the appropriate category collection."""
    collection = db[category]
    document = {
        "video": video_path,
        "extracted_text": extracted_text,
        "classification": classified_data
    }
    try:
        collection.insert_one(document)
        print(f"Data saved to MongoDB under category '{category}' successfully.")
    except Exception as e:
        print(f"Error saving to MongoDB in category {category}: {str(e)}")

def main(video_path):
    """Main function to process the video and classify extracted text."""
    # Create a temporary file for extracted audio
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
        audio_path = temp_audio.name

    # Extract audio from the video
    extract_audio(video_path, audio_path)

    # Convert audio to text
    extracted_text = audio_to_text(audio_path)

    # Initialize result dictionary
    result = {
        "extracted_text": extracted_text,
        "classification": {}
    }

    if extracted_text:
        print("Extracted Text:", extracted_text)  # Print the extracted text for verification
        # Classify the extracted text
        classified_data = classify_text(extracted_text)
        
        # Update result with classification data
        result["classification"] = classified_data

        # Save the classified data to MongoDB under the respective categories
        for category, words in classified_data.items():
            save_to_mongo(classified_data, extracted_text, category, video_path)
    else:
        print("No text extracted from the audio.")

    # Clean up the temporary audio file
    os.remove(audio_path)
    print("Temporary audio file removed.")

    # Return result for frontend usage
    return result


if __name__ == "__main__":
    video_path = r"D:\NLP\backend\uploads\video.mp4"  # Update with your actual video file path

    # Check if the video file exists
    if os.path.exists(video_path):
        try:
            main(video_path)
        except Exception as e:
            print(f"Error processing video {video_path}: {str(e)}")
    else:
        print(f"Video file not found: {video_path}")
