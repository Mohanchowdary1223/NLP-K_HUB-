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
from bson.objectid import ObjectId
from gridfs import GridFS
from extractive_summarization import extract_content_from_pdf, summarize_text
import tempfile

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
db = client['NLP_SIGN']  # Database name
translations_collection = db['translations']  # Collection for storing translations
original_texts_collection = db['original_texts']  # Collection for original untranslated text
multimedia_collection = db['multimedia']  # Collection for storing multimedia files metadata

# Initialize GridFS
fs = GridFS(db)

# Add this after MongoDB connection setup
trash_collection = db['trash']  # New collection for trash items

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
    email = current_user.email if current_user.is_authenticated else "anonymous"

    translations_collection.insert_one({
        'email': current_user.email,
        'original_text': original_text,
        'source_lang': source_lang,
        'translated_text': translated_text,
        'target_lang': target_lang,
        'category': category,
        'region': region,
        'timestamp': time.time()
    })

    # Log the insertion
    print(f"Inserted translation for email: {email}")


# Serve files from user-specific folder
@app.route('/uploads/<user>/<filename>', methods=['GET'])
@login_required
def serve_file(user, filename):
    if user != current_user.email:
        return jsonify({"error": "Unauthorized"}), 403
    user_folder = os.path.join(app.config['UPLOAD_FOLDER'], user)
    return send_from_directory(user_folder, filename)


@app.route('/uploads/multimedia', methods=['GET'])
@login_required
def get_multimedia():
    multimedia_files = list(multimedia_collection.find({'email': current_user.email}, {'_id': 0}))
    return jsonify(multimedia_files)



@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
# Translation route
@app.route('/translate', methods=['POST'])
@login_required
def translate_text():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        text = data.get('text')
        source_lang = data.get('sourceLang')
        target_lang = data.get('targetLang')

        if not text or not target_lang or not source_lang:
            return jsonify({'error': 'Text, source language, and target language are required'}), 400

        # Initialize translator
        translator = Translator()
        
        try:
            # Perform translation
            translation = translator.translate(text, src=source_lang, dest=target_lang)
            
            if not translation or not translation.text:
                return jsonify({'error': 'Translation failed'}), 500

            # Get the category and region
            category = categorize_text(text)
            region = language_to_region.get(target_lang, "Unknown Region")

            # Save to MongoDB
            save_translation_to_mongodb(
                text, 
                source_lang, 
                translation.text, 
                target_lang, 
                category, 
                region
            )

            return jsonify({
                'translated_text': translation.text,
                'source_lang': source_lang,
                'target_lang': target_lang,
                'category': category,
                'region': region
            })

        except Exception as translation_error:
            print(f"Translation error: {translation_error}")
            return jsonify({'error': 'Translation service error'}), 500

    except Exception as e:
        print(f"Server error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/upload-image', methods=['POST'])
@login_required
def upload_image():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file uploaded"}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Read file content once
        file_content = file.read()
        
        # Store in GridFS
        file_id = fs.put(
            file_content,
            filename=secure_filename(file.filename),
            content_type=file.content_type
        )

        # Create a temporary file for processing
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(file_content)
            temp_path = temp_file.name

        # Get selected model
        model = request.form.get('model', 'simple')  # Default to simple if not specified

        # Process image based on model
        if model == "gemini":
            result = process_gemini_image(temp_path)
        elif model == "simple":
            result = process_image(temp_path)
        else:
            result = extract_table_data(temp_path)

        # Clean up temporary file
        os.unlink(temp_path)

        # Store metadata in MongoDB
        multimedia_collection.insert_one({
            'email': current_user.email,
            'file_id': str(file_id),
            'filename': secure_filename(file.filename),
            'type': 'image',
            'content_type': file.content_type,
            'extracted_text': result.get("extracted_text", ""),
            'classified_data': result.get("classified_data", {}),
            'saved_data': result.get("saved_data", {}),
            'timestamp': time.time()
        })

        return jsonify({
            "status": "success",
            "file_id": str(file_id),
            "extracted_text": result.get("extracted_text", ""),
            "classified_data": result.get("classified_data", {}),
            "saved_data": result.get("saved_data", {})
        })

    except Exception as e:
        print("Error during image processing:", str(e))
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500



# Route for uploading and processing audio
@app.route('/upload-audio', methods=['POST'])
@login_required
def upload_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file uploaded"}), 400

        file = request.files['audio']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Create a user-specific folder
        user_folder = os.path.join(app.config['UPLOAD_FOLDER'], current_user.email)
        if not os.path.exists(user_folder):
            os.makedirs(user_folder)

        # Save audio file in the user folder
        filename = secure_filename(file.filename)
        filepath = os.path.join(user_folder, filename)
        file.save(filepath)

        # Process the audio
        extracted_text = audio_to_text(filepath)
        classified_data = classify_text(extracted_text)

        # Store audio metadata in MongoDB
        multimedia_collection.insert_one({
            'email': current_user.email,
            'filepath': filepath,
            'type': 'audio',
            'extracted_text': extracted_text,
            'classified_data': classified_data,
            'timestamp': time.time()
        })

        return jsonify({
            "extracted_text": extracted_text,
            "classified_data": classified_data
        })

    except Exception as e:
        print(f"Unexpected error in upload_audio: {str(e)}")
        return jsonify({"error": "An unexpected error occurred"}), 500
5

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

        # Process the video
        result = main(video_path)
        
        # Ensure result contains extracted_text
        if isinstance(result, str):
            extracted_text = result
            classification = {}
        else:
            extracted_text = result.get("extracted_text", "")
            classification = result.get("classification", {})

        if not extracted_text:
            return jsonify({"error": "No text could be extracted from the video"}), 400

        # Store video metadata in MongoDB
        multimedia_collection.insert_one({
            'email': current_user.email,
            'filepath': video_path,
            'type': 'video',
            'extracted_text': extracted_text,
            'classification': classification,
            'timestamp': time.time()
        })

        return jsonify({
            "extracted_text": extracted_text,
            "classification": classification
        })

    except Exception as e:
        print("Error in /convert-video:", str(e))
        return jsonify({"error": str(e)}), 500

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
    user = users_collection.find_one({"email": current_user.email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Count user's data in different collections
    image_count = userdata_collection.count_documents({'email': current_user.email, 'type': 'image'})
    audio_count = userdata_collection.count_documents({'email': current_user.email, 'type': 'audio'})
    video_count = userdata_collection.count_documents({'email': current_user.email, 'type': 'video'})
    translation_count = translations_collection.count_documents({'email': current_user.email})  # Correct collection

    return jsonify({
        "email": user.get("email"),
        "name": user.get("name"),
        "first_name": user.get("first_name"),
        "last_name": user.get("last_name"),
        "phone": user.get("phone"),
        "city": user.get("city"),
        "state": user.get("state"),
        "profile_image": user.get("profile_image"),
        "image_count": image_count,
        "audio_count": audio_count,
        "video_count": video_count,
        "translation_count": translation_count  # Correct count
    }), 200

    
@app.route('/profile-stats', methods=['GET'])
@login_required
def get_profile_stats():
    try:
        # Get counts directly from MongoDB
        image_count = multimedia_collection.count_documents({'email': current_user.email, 'type': 'image'})
        video_count = multimedia_collection.count_documents({'email': current_user.email, 'type': 'video'})
        audio_count = multimedia_collection.count_documents({'email': current_user.email, 'type': 'audio'})
        translation_count = translations_collection.count_documents({'email': current_user.email})

        return jsonify({
            "image_count": image_count,
            "video_count": video_count,
            "audio_count": audio_count,
            "translation_count": translation_count
        })
    except Exception as e:
        print(f"Error fetching profile stats: {e}")
        return jsonify({"error": str(e)}), 500

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
    # Include _id field and convert it to string
    translations = list(translations_collection.find(
        {'email': current_user.email},
        {"_id": 1, "original_text": 1, "translated_text": 1, "timestamp": 1}
    ))
    
    # Convert ObjectId to string for each translation
    for translation in translations:
        translation['_id'] = str(translation['_id'])
    
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
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 200

    try:
        data = request.json
        name = data.get('name')
        contact_email = data.get('contact_email')  # Get the contact email
        message = data.get('message')

        if not name or not message:
            return jsonify({"error": "Name and message are required"}), 400

        # Get the currently logged-in user's email from the session
        current_user_email = current_user.email if current_user.is_authenticated else None
        
        if not current_user_email:
            return jsonify({"error": "User not authenticated"}), 401

        # Save message data with both emails
        message_data = {
            "name": name,
            "user_email": current_user_email,  # Store the logged-in user's email
            "contact_email": contact_email,    # Store the contact email
            "message": message,
            "timestamp": time.time(),
            "status": "unread"  # Add a status field for message tracking
        }
        
        # Store in interested_customer collection
        db['interested customer'].insert_one(message_data)

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




@app.route('/admin-users', methods=['GET'])
def admin_users_data():
    try:
        # Fetch all users from the database
        users = list(users_collection.find({}, {
            'password': 0  # Exclude password from the response
        }))
        user_list = []
        
        for user in users:
            email = user.get('email', '')
            if not email:
                continue  # Skip users without email
                
            # Get media files from MongoDB with content_type
            images = list(multimedia_collection.find(
                {'email': email, 'type': 'image'},
                {'_id': 0, 'file_id': 1, 'filename': 1, 'extracted_text': 1, 'timestamp': 1, 'content_type': 1}
            ))
            videos = list(multimedia_collection.find(
                {'email': email, 'type': 'video'},
                {'_id': 0, 'file_id': 1, 'filename': 1, 'extracted_text': 1, 'timestamp': 1, 'content_type': 1}
            ))
            audios = list(multimedia_collection.find(
                {'email': email, 'type': 'audio'},
                {'_id': 0, 'file_id': 1, 'filename': 1, 'extracted_text': 1, 'timestamp': 1, 'content_type': 1}
            ))

            # Get translations
            translations = list(translations_collection.find(
                {'email': email},
                {'_id': 0, 'original_text': 1, 'translated_text': 1, 'timestamp': 1}
            ))

            documentation = list(multimedia_collection.find(
                {'email': email, 'type': 'documentation'},
                {'_id': 0, 'file_id': 1, 'filename': 1, 'extracted_text': 1, 'summary': 1, 'timestamp': 1, 'content_type': 1}
            ))
            
            # Add debug logging
            print(f"Documentation for user {email}:", documentation)
            for doc in documentation:
                print(f"Document details - filename: {doc.get('filename')}")
                print(f"Summary: {doc.get('summary')}")
                print(f"Extracted text: {doc.get('extracted_text')}")

            # Convert ObjectId to string
            for media in images + videos + audios:
                if isinstance(media.get('file_id'), ObjectId):
                    media['file_id'] = str(media['file_id'])

            # Explicitly log the query parameters for messages
            print(f"Searching for messages with email: {email}")
            
            # Get user messages from interested_customer collection
            messages = list(db['interested customer'].find(
                {'user_email': email},  # Make sure this matches how you store the email in contact form
                {
                    '_id': 0,
                    'name': 1,
                    'user_email': 1,
                    'contact_email': 1,  # Include contact_email
                    'message': 1,
                    'timestamp': 1,
                    'status': 1  # Include status field
                }
            ))
            
            # Debug log for messages
            print(f"Found {len(messages)} messages for user {email}")
            print("Messages:", messages)

            user_data = {
                '_id': str(user.get('_id')),
                'name': user.get('name', 'Unknown'),
                'email': email,
                'profile_image': user.get('profile_image'),
                'images': images,
                'videos': videos,
                'audios': audios,
                'translations': translations,
                'documentation': documentation,
                'messages': messages,
                'image_count': len(images),
                'video_count': len(videos),
                'audio_count': len(audios),
                'translation_count': len(translations),
                'documentation_count': len(documentation),
                'message_count': len(messages)
            }
            
            # Log the full user_data object
            print(f"User data being sent for {email}:", user_data)
            
            user_list.append(user_data)

        # Debug log entire response
        print("Full response:", user_list)
        return jsonify(user_list), 200

    except Exception as e:
        print(f"Error fetching user data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/media/files', methods=['GET'])
@login_required
def get_media_files():
    try:
        # Get all media files for the current user
        images = list(multimedia_collection.find(
            {'email': current_user.email, 'type': 'image'},
            {'_id': 0, 'file_id': 1, 'filename': 1, 'extracted_text': 1}
        ))
        videos = list(multimedia_collection.find(
            {'email': current_user.email, 'type': 'video'},
            {'_id': 0, 'file_id': 1, 'filename': 1, 'extracted_text': 1}
        ))
        audios = list(multimedia_collection.find(
            {'email': current_user.email, 'type': 'audio'},
            {'_id': 0, 'file_id': 1, 'filename': 1, 'extracted_text': 1}
        ))

        # Convert ObjectId to string for each document
        for doc in images + videos + audios:
            if isinstance(doc.get('file_id'), ObjectId):
                doc['file_id'] = str(doc['file_id'])

        return jsonify({
            'images': images,
            'videos': videos,
            'audios': audios
        })
    except Exception as e:
        print(f"Error fetching media files: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/media/file/<file_id>', methods=['GET'])
@login_required
def get_media_file(file_id):
    try:
        # Get file from GridFS
        if isinstance(file_id, str):
            file_id = ObjectId(file_id)
        
        file = fs.get(file_id)
        if not file:
            return jsonify({'error': 'File not found'}), 404

        # Verify user has access to this file (check both multimedia and trash collections)
        media_info = multimedia_collection.find_one({
            'file_id': str(file_id),
            'email': current_user.email
        }) or trash_collection.find_one({
            'file_id': str(file_id),
            'email': current_user.email
        })
        
        if not media_info:
            return jsonify({'error': 'Unauthorized'}), 403

        # Create response with file data
        response = make_response(file.read())
        response.mimetype = file.content_type
        return response

    except Exception as e:
        print(f"Error retrieving file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/user/media', methods=['GET'])
@login_required
def get_user_media():
    try:
        # Get all media files including documentation
        media = list(multimedia_collection.find(
            {'email': current_user.email},
            {
                '_id': 0, 
                'file_id': 1, 
                'type': 1, 
                'filename': 1, 
                'extracted_text': 1,
                'summary': 1,
                'source': 1,
                'content_type': 1,
                'timestamp': 1
            }
        ))

        # Convert ObjectId to string for file_ids
        for item in media:
            if isinstance(item.get('file_id'), ObjectId):
                item['file_id'] = str(item['file_id'])

        # Separate documentation items from regular media
        documentation = [m for m in media if m.get('type') == 'documentation']
        videos = [m for m in media if m['type'] == 'video' and m.get('source') != 'documentation']
        images = [m for m in media if m['type'] == 'image']
        audios = [m for m in media if m['type'] == 'audio']

        return jsonify({
            'images': images,
            'videos': videos,
            'audios': audios,
            'documentation': documentation  # Add separate documentation array
        })
    except Exception as e:
        print(f"Error fetching user media: {e}")
        return jsonify({'error': str(e)}), 500

# Add this new route
@app.route('/media/counts', methods=['GET'])
@login_required
def get_media_counts():
    try:
        # Get counts from multimedia_collection
        image_count = multimedia_collection.count_documents({
            'email': current_user.email, 
            'type': 'image'
        })
        video_count = multimedia_collection.count_documents({
            'email': current_user.email, 
            'type': 'video'
        })
        audio_count = multimedia_collection.count_documents({
            'email': current_user.email, 
            'type': 'audio'
        })
        translation_count = translations_collection.count_documents({
            'email': current_user.email
        })
        documentation_count = multimedia_collection.count_documents({
            'email': current_user.email,
            'type': 'documentation',
            'source': 'documentation'
        })

        return jsonify({
            'image_count': image_count,
            'video_count': video_count,
            'audio_count': audio_count,
            'translation_count': translation_count,
            'documentation_count': documentation_count  # Add this line
        })
    except Exception as e:
        print(f"Error getting media counts: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/process-document', methods=['POST'])
@login_required
def process_document():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        source = request.form.get('source', 'documentation')  # Get source information

        # Store file in GridFS
        file_id = fs.put(
            file.read(),
            filename=secure_filename(file.filename),
            content_type=file.content_type
        )

        # Process the file and get text/summary
        try:
            # Create temporary file for processing
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
                file.seek(0)  # Reset file pointer
                file.save(tmp.name)
                temp_path = tmp.name

                if file.content_type == 'application/pdf':
                    extracted_text = extract_content_from_pdf(temp_path)
                    summary = summarize_text(extracted_text)
                else:  # video file
                    result = main(temp_path)
                    extracted_text = result.get("extracted_text", "")
                    if isinstance(result, str):
                        extracted_text = result
                    summary = summarize_text(extracted_text)

            # Clean up temp file
            os.unlink(temp_path)

        except Exception as e:
            print(f"Processing error: {str(e)}")
            return jsonify({'error': f'Error processing file: {str(e)}'}), 500

        # Store metadata in MongoDB
        doc_data = {
            'email': current_user.email,
            'file_id': str(file_id),
            'filename': secure_filename(file.filename),
            'type': 'documentation',  # New type for documentation files
            'content_type': file.content_type,
            'original_text': extracted_text,
            'summary': summary,
            'source': source,
            'timestamp': time.time()
        }
        multimedia_collection.insert_one(doc_data)

        return jsonify({
            "status": "success",
            "file_id": str(file_id),
            "extracted_text": summary
        })

    except Exception as e:
        print(f"Server error: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/get-summary/<doc_id>', methods=['GET'])
@login_required
def get_summary(doc_id):
    try:
        doc = multimedia_collection.find_one({
            '_id': ObjectId(doc_id),
            'email': current_user.email
        })
        
        if not doc:
            return jsonify({'error': 'Document not found'}), 404

        return jsonify({
            'summary': doc.get('summary', ''),
            'original_text': doc.get('original_text', '')
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/translations/move-to-trash', methods=['POST'])
@login_required
def move_translations_to_trash():
    try:
        data = request.json
        translation_ids = data.get('translation_ids', [])
        
        if not translation_ids:
            return jsonify({'error': 'No translations selected'}), 400

        # Find translations before deleting
        translations = list(translations_collection.find({
            'email': current_user.email,
            '_id': {'$in': [ObjectId(id) for id in translation_ids]}
        }))

        if not translations:
            return jsonify({'error': 'No translations found'}), 404

        # Convert ObjectId to string for each translation
        for translation in translations:
            translation['_id'] = str(translation['_id'])

        # Add to trash collection
        trash_documents = [{
            **translation,
            'deleted_at': time.time(),
            'original_collection': 'translations'
        } for translation in translations]
        
        trash_collection.insert_many(trash_documents)

        # Remove from translations collection
        result = translations_collection.delete_many({
            'email': current_user.email,
            '_id': {'$in': [ObjectId(id) for id in translation_ids]}
        })

        return jsonify({
            'message': f'Successfully moved {result.deleted_count} translations to trash',
            'count': result.deleted_count
        }), 200

    except Exception as e:
        print(f"Error moving translations to trash: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/move-to-trash', methods=['POST'])
@login_required
def move_to_trash():
    try:
        data = request.json
        items = data.get('items', {})
        
        total_moved = 0
        results = {}

        print("Received items to delete:", items)  # Debug log

        # Handle translations
        if items.get('translations'):
            # Fixed the syntax error in the ObjectId list comprehension
            translations = list(translations_collection.find({
                'email': current_user.email,
                '_id': {'$in': [ObjectId(id) for id in items['translations']]}  # Fixed closing bracket position
            }))
            
            if translations:
                for translation in translations:
                    translation['_id'] = str(translation['_id'])
                    translation['original_collection'] = 'translations'
                    translation['deleted_at'] = time.time()
                
                trash_collection.insert_many(translations)
                result = translations_collection.delete_many({
                    'email': current_user.email,
                    '_id': {'$in': [ObjectId(id) for id in items['translations']]}
                }
                )
                total_moved += result.deleted_count
                results['translations'] = result.deleted_count

        # Handle multimedia (images, videos, audios, documentation)
        for media_type in ['images', 'videos', 'audios', 'documentation']:
            if items.get(media_type):
                documents = list(multimedia_collection.find({
                    'email': current_user.email,
                    'file_id': {'$in': items[media_type]}
                }))
                
                if documents:
                    trash_items = []
                    for doc in documents:
                        doc['_id'] = str(doc['_id'])
                        doc['original_collection'] = media_type
                        doc['deleted_at'] = time.time()
                        trash_items.append(doc)
                    
                    if trash_items:
                        trash_collection.insert_many(trash_items)
                        result = multimedia_collection.delete_many({
                            'email': current_user.email,
                            'file_id': {'$in': items[media_type]}
                        })
                        total_moved += result.deleted_count
                        results[media_type] = result.deleted_count

        print("Results of deletion:", results)  # Debug log

        if total_moved > 0:
            return jsonify({
                'message': f'Successfully moved {total_moved} items to trash',
                'details': results
            }), 200
        
        return jsonify({'message': 'No items found to move'}), 404

    except Exception as e:
        print(f"Error moving items to trash: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/trash-data', methods=['GET'])
@login_required
def get_trash_data():
    try:
        # Fetch all trash items for current user
        trash_items = list(trash_collection.find({
            'email': current_user.email
        }))

        # Organize items by type
        organized_data = {
            'images': [],
            'videos': [],
            'audios': [],
            'translations': [],
            'documentation': []
        }

        for item in trash_items:
            # Convert ObjectId to string for JSON serialization
            item['_id'] = str(item['_id'])
            if isinstance(item.get('file_id'), ObjectId):
                item['file_id'] = str(item['file_id'])

            # Categorize based on type or original_collection
            if item.get('original_collection') == 'translations':
                organized_data['translations'].append(item)
            elif item.get('type') == 'image':
                organized_data['images'].append(item)
            elif item.get('type') == 'video':
                organized_data['videos'].append(item)
            elif item.get('type') == 'audio':
                organized_data['audios'].append(item)
            elif item.get('type') == 'documentation':
                organized_data['documentation'].append(item)

        return jsonify(organized_data)

    except Exception as e:
        print(f"Error fetching trash data: {e}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(500)
def internal_error(error):
    print(f"Internal error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(404) 
def not_found_error(error):
    return jsonify({'error': 'Resource not found'}), 404

def initialize_nltk_quietly():
    import nltk
    try:
        # Suppress NLTK download messages
        import warnings
        warnings.filterwarnings('ignore')
        
        nltk.data.find('tokenizers/punkt')
        nltk.data.find('corpora/stopwords')
    except LookupError:
        # Download required NLTK data silently
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)

if __name__ == '__main__':
    try:
        # Initialize NLTK quietly
        initialize_nltk_quietly()
        
        # Ensure required collections exist
        if not users_collection or not userdata_collection:
            raise RuntimeError("MongoDB collections not properly initialized")
        
        app.run(debug=True)
        
    except Exception as e:
        print(f"Failed to start application: {str(e)}")
