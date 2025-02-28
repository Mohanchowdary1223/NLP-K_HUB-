from flask import Blueprint, request, jsonify, session, make_response
from flask_login import login_user, logout_user, current_user  # ✅ Import current_user
from models import User, bcrypt, users_collection

auth_bp = Blueprint('auth', __name__)

# ✅ Function to handle CORS for OPTIONS requests
def handle_cors():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response

# ✅ SIGNUP ROUTE
@auth_bp.route('/api/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        return handle_cors()

    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if users_collection.find_one({"email": email}):
        return jsonify({"success": False, "message": "Email already exists!"}), 409
    
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    users_collection.insert_one({"email": email, "password": hashed_password, "name": name})
    return jsonify({"success": True, "message": "Successfully registered!"}), 201

# ✅ SIGNIN ROUTE
@auth_bp.route('/api/signin', methods=['POST', 'GET', 'OPTIONS'])
def signin():
    if request.method == 'OPTIONS':
        return handle_cors()

    # ✅ Fix: Ensure `current_user` is defined before checking `is_authenticated`
    if request.method == 'GET':
        if current_user.is_authenticated:
            return jsonify({"message": "Already logged in!", "user": current_user.email}), 200
        else:
            return jsonify({"message": "Please sign in via POST"}), 401  # 🔹 Returns 401 if user not logged in

    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({"email": email})
    if user and bcrypt.check_password_hash(user['password'], password):
        user_obj = User(email=email)
        login_user(user_obj)
        session['email'] = email
        return jsonify({"success": True, "message": "Successfully logged in!", "user": email}), 200

    return jsonify({"success": False, "message": "Invalid email or password!"}), 401

# ✅ LOGOUT ROUTE
@auth_bp.route('/api/logout', methods=['POST', 'OPTIONS'])
def logout():
    if request.method == 'OPTIONS':
        return handle_cors()
    
    logout_user()
    session.pop('email', None)
    return jsonify({"success": True, "message": "Logged out successfully!"}), 200

# ✅ CHECK IF USER IS LOGGED IN
@auth_bp.route('/api/user', methods=['GET'])
def get_current_user():
    if current_user.is_authenticated:
        return jsonify({"authenticated": True, "email": current_user.email}), 200
    return jsonify({"authenticated": False}), 401
