from flask import Flask, render_template, redirect, url_for, request, session, flash, jsonify, make_response, send_from_directory
from flask_cors import CORS
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.utils import secure_filename
import os
from models import User, bcrypt, users_collection, userdata_collection
from auth import auth_bp
from audio_to_text import convert_mp3_to_wav, audio_to_text, classify_text
from image_to_text import process_image, process_gemini_image , extract_table_data
from video_to_text import main  
from googletrans import Translator
from lang import keywords,language_to_region
from pymongo import MongoClient
from flask import send_from_directory
from flask import jsonify
from Liveasr import record_audio, transcribe_audio, translate_text
import uuid
import time


app = Flask(__name__)
app.secret_key = 'your_secret_key'

# Enable CORS
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

# Register auth blueprint
app.register_blueprint(auth_bp, url_prefix="/auth")

# Initialize Bcrypt for password hashing
bcrypt.init_app(app)

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.signin'

translator = Translator()

# Define upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

category_database = {category: {} for category in keywords.keys()}

@login_manager.user_loader
def load_user(email):
    user = users_collection.find_one({"email": email})
    if user:
        return User(email=user['email'])
    return None

@app.route('/')
def home():
    return redirect(url_for('auth.signup'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user_email=current_user.email)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    session.pop('email', None)
    flash("You've been logged out.", "success")
    return redirect(url_for('auth.login'))

@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload_file():
    return render_template('upload.html')

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client['ocr_database']  # Database name
translations_collection = db['translations']  # Collection for storing translations
original_texts_collection = db['original_texts']  # Collection for original untranslated text

# Text categorization function
def categorize_text(text):
    lower_text = text.lower()
    for category, keyword_list in keywords.items():
        if any(keyword in lower_text for keyword in keyword_list):
            return category
    return 'General'
 
# Save original text to MongoDB
def save_original_text_to_mongodb(original_text, source_lang):
    original_texts_collection.insert_one({
        'original_text': original_text,
        'source_lang': source_lang
    })

# Save translation to MongoDB
def save_translation_to_mongodb(original_text, source_lang, translated_text, target_lang, category, region):
        # Use "anonymous" if the user is not authenticated
    email = current_user.email if current_user.is_authenticated else "anonymous"

    translations_collection.insert_one({
        'email': email,
        'original_text': original_text,
        'source_lang': source_lang,
        'translated_text': translated_text,
        'target_lang': target_lang,
        'category': category,
        'region': region
    })


# Serve files from user-specific folder
@app.route('/uploads/<user>/<filename>', methods=['GET'])
@login_required
def serve_file(user, filename):
    if user != current_user.email:
        return jsonify({"error": "Unauthorized"}), 403
    user_folder = os.path.join(app.config['UPLOAD_FOLDER'], user)
    return send_from_directory(user_folder, filename)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
# Translation route
# Translation route
@app.route('/translate', methods=['POST'])

def translate_text():
    data = request.json
    text = data.get('text')
    source_lang = data.get('sourceLang')
    target_lang = data.get('targetLang')

    if not text or not target_lang or not source_lang:
        return jsonify({'error': 'Text, source language, and target language are required'}), 400

    try:
        # Detect source language if not provided
        detected_lang = source_lang if source_lang else translator.detect(text).lang
        save_original_text_to_mongodb(text, detected_lang)

        # Perform translation
        translation = translator.translate(text, src=detected_lang, dest=target_lang).text
        category = categorize_text(text)
        region = language_to_region.get(target_lang, "Unknown Region")

        # Save translation to MongoDB
        save_translation_to_mongodb(text, detected_lang, translation, target_lang, category, region)

        return jsonify({
            'original_text': text,
            'detected_lang': detected_lang,
            'translated_text': translation,
            'target_lang': target_lang,
            'category': category,
            'region': region
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

 # Updated import to include the new Gemini function

# Route for uploading and processing images
@app.route('/upload-image', methods=['POST'])
@login_required
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image file uploaded"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    # Create a user-specific folder
    user_folder = os.path.join(app.config['UPLOAD_FOLDER'], current_user.email)
    if not os.path.exists(user_folder):
        os.makedirs(user_folder)

    # Save image file in the user folder
    filename = secure_filename(file.filename)
    filepath = os.path.join(user_folder, filename)
    file.save(filepath)

    # Get selected model
    model = request.form.get('model')

    try:
        if model == "gemini":
            # Process the image using Gemini OCR
            result = process_gemini_image(filepath)
        elif model == "simple":
            # Process the image using Simple OCR
            result = process_image(filepath)
        else:
            result = extract_table_data(filepath)
            print(result)

        # Convert integer keys to strings if needed
        extracted_text = result.get("extracted_text", {})
        if isinstance(extracted_text, dict):
            extracted_text = {str(k): v for k, v in extracted_text.items()}
            result["extracted_text"] = extracted_text

        # Now insert into MongoDB
        db_result = userdata_collection.insert_one({
            'email': current_user.email,
            'extracted_text': result.get("extracted_text"),
            'classified_data': result.get("classified_data"),
            'saved_data': result.get("saved_data"),
            'type': 'image'
        })

        # Return processed data
        response = jsonify({
            "extracted_text": result.get("extracted_text"),
            "classified_data": result.get("classified_data"),
            "saved_data": result.get("saved_data"),
            "id": str(db_result.inserted_id)
        })
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response

    except Exception as e:
        print("Error during image processing:", e)
        return jsonify({"error": "An error occurred during image processing"}), 500




# Route for uploading and processing audio
@app.route('/upload-audio', methods=['POST'])
@login_required
def upload_audio():
    try:
        if 'audio' not in request.files:
            print("No audio file in request")
            return jsonify({"error": "No audio file uploaded"}), 400

        file = request.files['audio']
        if file.filename == '':
            print("Empty filename")
            return jsonify({"error": "No file selected"}), 400

        # Create a user-specific folder
        user_folder = os.path.join(app.config['UPLOAD_FOLDER'], current_user.email)
        if not os.path.exists(user_folder):
            os.makedirs(user_folder)

        # Generate unique filename to avoid conflicts
        filename = secure_filename(file.filename)
        unique_filename = f"{int(time.time())}_{filename}"
        filepath = os.path.join(user_folder, unique_filename)
        print(f"Saving file to: {filepath}")
        file.save(filepath)

        # Convert to WAV if needed
        wav_path = filepath
        if filepath.lower().endswith('.mp3'):
            wav_path = os.path.join(user_folder, f"{int(time.time())}_converted.wav")
            print(f"Converting MP3 to WAV: {wav_path}")
            try:
                convert_mp3_to_wav(filepath, wav_path)
                os.remove(filepath)  # Remove the original MP3 after conversion
            except Exception as e:
                print(f"Error converting MP3 to WAV: {str(e)}")
                return jsonify({"error": "Error converting audio format"}), 500

        # Process the audio
        print("Processing audio file...")
        extracted_text = audio_to_text(wav_path)
        
        if not extracted_text:
            print("No text extracted from audio")
            return jsonify({"error": "Could not extract text from audio"}), 500

        # Classify the extracted text
        classified_data = classify_text(extracted_text)

        # Save to MongoDB
        try:
            result = userdata_collection.insert_one({
                'email': current_user.email,
                'extracted_text': extracted_text,
                'classified_data': classified_data,
                'type': 'audio',
                'timestamp': time.time(),
                'filename': unique_filename
            })
            print(f"Saved to MongoDB with ID: {result.inserted_id}")
        except Exception as e:
            print(f"MongoDB error: {str(e)}")
            return jsonify({"error": "Database error"}), 500

        # Clean up temporary files
        try:
            if wav_path != filepath:
                os.remove(wav_path)
        except Exception as e:
            print(f"Error cleaning up files: {str(e)}")

        return jsonify({
            "extracted_text": extracted_text,
            "classified_data": classified_data
        })

    except Exception as e:
        print(f"Unexpected error in upload_audio: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path=None):
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response


@app.route("/convert-video", methods=["POST"])
@login_required
def convert_video():
    try:
        if 'media' not in request.files:
            return jsonify({"error": "No video file uploaded"}), 400

        file = request.files['media']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        # Create a user-specific folder
        user_folder = os.path.join(app.config['UPLOAD_FOLDER'], current_user.email)
        if not os.path.exists(user_folder):
            os.makedirs(user_folder)

        # Save the video file
        filename = secure_filename(file.filename)
        video_path = os.path.join(user_folder, filename)
        file.save(video_path)

        # Run the main function and retrieve results
        result = main(video_path)

        # Return the result as JSON
        return jsonify({
            "extracted_text": result.get("extracted_text", "No text extracted"),
            "classification": result.get("classification", {}),
            "message": "Conversion successful"
        }), 200

    except Exception as e:
        print("Error in /convert-video:", e)
        return jsonify({"error": "An internal error occurred during conversion"}), 500



@app.route('/profile/upload-image', methods=['POST'])
@login_required
def upload_profile_image():
    if 'profileImage' not in request.files:
        return jsonify({"error": "No image file uploaded"}), 400

    file = request.files['profileImage']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    user_folder = os.path.join(app.config['UPLOAD_FOLDER'], current_user.email)
    if not os.path.exists(user_folder):
        os.makedirs(user_folder)

    filename = secure_filename(file.filename)
    filepath = os.path.join(user_folder, filename)
    file.save(filepath)
    # Update user's profile image path in MongoDB (store only the filename)
    users_collection.update_one(
        {"email": current_user.email},
        {"$set": {"profile_image": filename}}
    )
    return jsonify({"message": "Profile image uploaded successfully", "profile_image": filename}), 200

# Update the profile details (name, phone, city, state)
@app.route('/profile/update', methods=['POST'])
@login_required
def update_profile():
    data = request.json
    
    # Log the received data for debugging
    print("Received profile update data:", data)
    
    # Create update dictionary with all fields
    update_fields = {
        "name": data.get("name"),
        "phone": data.get("phone"),
        "city": data.get("city"),
        "state": data.get("state"),
    }
    
    # Remove None values from update_fields
    update_fields = {k: v for k, v in update_fields.items() if v is not None}
    
    try:
        # Update the user's profile in MongoDB
        result = users_collection.update_one(
            {"email": current_user.email},
            {"$set": update_fields}
        )
        
        if result.modified_count > 0:
            return jsonify({"message": "Profile updated successfully"}), 200
        else:
            return jsonify({"message": "No changes made to profile"}), 200
            
    except Exception as e:
        print("Error updating profile:", str(e))
        return jsonify({"error": "Failed to update profile"}), 500

@app.route('/profile', methods=['GET'])
@login_required
def get_profile():
    # Fetch user data from MongoDB
    user = users_collection.find_one({"email": current_user.email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Count user's data in different collections
    image_count = userdata_collection.count_documents({'email': current_user.email, 'type': 'image'})
    audio_count = userdata_collection.count_documents({'email': current_user.email, 'type': 'audio'})
    video_count = userdata_collection.count_documents({'email': current_user.email, 'type': 'video'})
    translation_count = translations_collection.count_documents({'email': current_user.email})

    # Return profile data with counts and profile image
    return jsonify({
        "email": user.get("email"),
        "name": user.get("name"),
        "first_name": user.get("first_name"),
        "last_name": user.get("last_name"),
        "phone": user.get("phone"),
        "city": user.get("city"),
        "state": user.get("state"),
        "profile_image": user.get("profile_image"),  # Only the filename is stored in MongoDB
        "image_count": image_count,
        "audio_count": audio_count,
        "video_count": video_count,
        "translation_count": translation_count
    }), 200


@app.route('/profile-stats', methods=['GET'])
@login_required
def get_profile_stats():
    

    try:
        user_folder = os.path.join(app.config['UPLOAD_FOLDER'], current_user.email)
        # Define file types for images, audio, and videos
        image_extensions = {".jpg", ".jpeg", ".png", ".gif"}
        audio_extensions = {".mp3", ".wav"}
        video_extensions = {".mp4", ".avi", ".mov"}

       
        
        # Initialize counts
        image_count = 0
        audio_count = 0
        video_count = 0

        if os.path.exists(user_folder):
            for filename in os.listdir(user_folder):
                file_extension = os.path.splitext(filename)[1].lower()
                if file_extension in image_extensions:
                    image_count += 1
                elif file_extension in audio_extensions:
                    audio_count += 1
                elif file_extension in video_extensions:
                    video_count += 1

        # Get the translation count from MongoDB
        translation_count = translations_collection.count_documents({'email': current_user.email})

        # Return the counts
        response = jsonify({
            "image_count": image_count,
            "audio_count": audio_count,
            "video_count": video_count,
            "translation_count": translation_count
        })
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response

    except Exception as e:
        print(f"Error fetching profile stats: {e}")
        return jsonify({"error": "Failed to fetch profile statistics"}), 500


@app.route('/uploads/images', methods=['GET'])
@login_required
def get_images():
    user_folder = os.path.join(app.config['UPLOAD_FOLDER'], current_user.email)
    if not os.path.exists(user_folder):
        return jsonify([])

    image_files = [
         f"http://localhost:5000/uploads/{current_user.email}/{f}"
        for f in os.listdir(user_folder)
        if f.lower().endswith(('png', 'jpg', 'jpeg', 'gif'))
    ]
    return jsonify(image_files)


@app.route('/uploads/videos', methods=['GET'])
@login_required
def get_videos():
    user_folder = os.path.join(app.config['UPLOAD_FOLDER'], current_user.email)
    if not os.path.exists(user_folder):
        return jsonify([])
    video_files = [
        f"http://localhost:5000/uploads/{current_user.email}/{f}"
        for f in os.listdir(user_folder)
        if f.lower().endswith(('mp4', 'avi', 'mov', 'mkv'))
    ]
    return jsonify(video_files)


@app.route('/uploads/audios', methods=['GET'])
@login_required
def get_audios():
    user_folder = os.path.join(app.config['UPLOAD_FOLDER'], current_user.email)
    if not os.path.exists(user_folder):
        return jsonify([])
    audio_files = [
        f"http://localhost:5000/uploads/{current_user.email}/{f}"
        for f in os.listdir(user_folder)
        if f.lower().endswith(('mp3', 'wav', 'aac'))
    ]
    return jsonify(audio_files)

# Route to fetch translations from MongoDB
@app.route('/uploads/translations', methods=['GET'])
@login_required
def get_translations():
    translations = list(translations_collection.find({}, {"_id": 0, "original_text": 1, "translated_text": 1}))
    return jsonify(translations)

#@app.route('/uploads/<filename>', methods=['GET'])
#def serve_file(filename):
 #   return send_from_directory(UPLOAD_FOLDER, filename)


def generate_unique_filename(filename):
    timestamp = int(time.time())
    extension = os.path.splitext(filename)[1]
    return f"{uuid.uuid4().hex}_{timestamp}{extension}"

@app.route('/submit-contact', methods=['POST', 'OPTIONS'])
def submit_contact():
    # Handle preflight request
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 200

    try:
        # Connect to the NLP_SIGN database and get or create the 'interested customer' collection
        db = client['NLP_SIGN']
        interested_customer_collection = db['interested customer']

        # Get JSON data from the frontend
        data = request.json
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')

        # Validate input fields
        if not name or not email or not message:
            return jsonify({"error": "All fields are required"}), 400

        # Save the data into the collection
        interested_customer_collection.insert_one({
            "name": name,
            "email": email,
            "message": message,
            "timestamp": time.time()
        })

        # Success response
        response = jsonify({"message": "Contact information submitted successfully"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 200

    except Exception as e:
        print(f"Error in /submit-contact: {e}")
        response = jsonify({"error": "Failed to submit contact information"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 500

@app.route('/record-audio', methods=['POST'])

def record_audio_endpoint():
    try:
        user_folder = os.path.join(app.config['UPLOAD_FOLDER'])
        if not os.path.exists(user_folder):
            os.makedirs(user_folder)

        filename = os.path.join(user_folder, "live_recorded_audio.wav")
        record_audio(filename, duration=10)

        # Transcribe and translate audio
        transcribed_text = transcribe_audio(filename)
        target_language = request.json.get('target_language', 'en')  # Default to English
        #translated_text = translate_text(transcribed_text, target_language)
        translated_text=""
        return jsonify({
            "extracted_text": transcribed_text,
            "translated_text": translated_text
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    if users_collection is not None and userdata_collection is not None:
        app.run(debug=True)
    else:
        print("MongoDB collections are not properly initialized. Exiting.")
