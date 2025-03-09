from flask import Blueprint, request, jsonify, session, make_response
from flask_login import login_user, logout_user
from models import User, bcrypt, users_collection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response
    
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
   
    if users_collection.find_one({"email": email}):
        return jsonify({"success": False, "message": "Email already exists!"}), 409
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    users_collection.insert_one({"email": email, "password": hashed_password , "name": name})
    return jsonify({"success": True, "message": "Successfully registered!"}), 201

@auth_bp.route('/api/signin', methods=['POST','GET','OPTIONS'])
def signin():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Methods","GET, POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response
    
    '''data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = users_collection.find_one({"email": email})
    if user and bcrypt.check_password_hash(user['password'], password):
        user_obj = User(email=email)
        login_user(user_obj)
        session['email'] = email
        return jsonify({"success": True, "message": "Successfully logged in!"}), 200
    return jsonify({"success": False, "message": "Invalid email or password!"}), 401'''

     # Handle GET requests (e.g., Flask-Login redirect)
    if request.method == 'GET':
        # You can return a JSON message or render a template
        # If user is already logged in, you could optionally redirect or show a different message
        if current_user.is_authenticated:
            return jsonify({"message": "Already logged in!"}), 200
        else:
            return jsonify({"message": "Please sign in via POST"}), 200
    
    # Handle POST requests (actual sign-in logic)
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({"email": email})
    if user and bcrypt.check_password_hash(user['password'], password):
        user_obj = User(email=email)
        login_user(user_obj)
        session['email'] = email
        return jsonify({"success": True, "message": "Successfully logged in!"}), 200
    
    return jsonify({"success": False, "message": "Invalid email or password!"}), 401

@auth_bp.route('/api/logout', methods=['POST', 'OPTIONS'])
def logout():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response
    
    logout_user()
    session.pop('email', None)
    return jsonify({"success": True, "message": "Logged out successfully!"}), 200

@auth_bp.route('/api/verify-email', methods=['POST', 'OPTIONS'])
def verify_email():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response

    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"exists": False, "message": "Email is required"}), 400

    # Check if email exists in database
    user = users_collection.find_one({"email": email})
    
    return jsonify({
        "exists": bool(user),
        "message": "Email verified successfully" if user else "Email not found"
    })
