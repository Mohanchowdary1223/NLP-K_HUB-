from flask import Blueprint, request, jsonify, session, make_response
from flask_login import login_user, logout_user
from models import User, bcrypt, users_collection
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask_cors import cross_origin
import time  # Add this import

auth_bp = Blueprint('auth', __name__)

def generate_otp():
    return str(random.randint(100000, 999999))  # Generate 6-digit OTP

def send_email_otp(email, otp):
    sender_email = "mohansunkara963@gmail.com"  
    # Generate an App Password from Google Account:
    # 1. Go to Google Account Settings
    # 2. Security
    # 3. 2-Step Verification
    # 4. App Passwords (at the bottom)
    # 5. Generate a new app password for 'Mail'
    sender_password = "ixsmidtdvlmadduj"  # Replace with your app password

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = email
    msg['Subject'] = "Password Reset OTP - Data Dialect"

    body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #2C3E50;">Password Reset OTP</h2>
        <p>Your OTP for password reset is: <strong style="font-size: 24px; color: #3498DB;">{otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
        <p style="color: #7F8C8D;">If you didn't request this password reset, please ignore this email.</p>
        <hr>
        <p style="font-size: 12px; color: #95A5A6;">This is an automated email. Please do not reply.</p>
      </body>
    </html>
    """
    msg.attach(MIMEText(body, 'html'))

    try:
        print(f"Attempting to send OTP to {email}")  # Debug log
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"OTP sent successfully to {email}")  # Debug log
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")  # Debug log
        return False

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
        # Handle preflight request
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response, 200  # Important: Return 200 status for OPTIONS

    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"exists": False, "message": "Email is required"}), 400

    # Check if email exists in database
    user = users_collection.find_one({"email": email})
    
    # Add CORS headers to the actual response
    response = jsonify({
        "exists": bool(user),
        "message": "Email verified successfully" if user else "Email not found"
    })
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response

@auth_bp.route('/api/send-otp', methods=['POST', 'OPTIONS'])
def send_otp():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Max-Age'] = '120'
        return response, 200

    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({"success": False, "message": "Email is required"}), 400

        # Generate and store OTP
        otp = generate_otp()
        
        # Actually send the email with OTP
        if send_email_otp(email, otp):
            # Only store in session if email was sent successfully
            session['reset_otp'] = otp
            session['reset_email'] = email
            session['otp_timestamp'] = time.time()

            response = jsonify({
                "success": True,
                "message": "OTP sent successfully to your email"
            })
        else:
            response = jsonify({
                "success": False,
                "message": "Failed to send OTP email. Please try again."
            })
            return response, 500
        
        # Set CORS headers
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    except Exception as e:
        print(f"Error in send_otp: {str(e)}")
        error_response = jsonify({
            "success": False,
            "message": f"Error sending OTP: {str(e)}"
        })
        error_response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        error_response.headers['Access-Control-Allow-Credentials'] = 'true'
        return error_response, 500

@auth_bp.route('/api/verify-otp', methods=['POST', 'OPTIONS'])
def verify_otp():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response, 200

    try:
        data = request.get_json()
        email = data.get('email')
        otp = data.get('otp')

        if not all([email, otp]):
            return jsonify({
                "success": False,
                "message": "Email and OTP are required"
            }), 400

        # Verify OTP
        stored_otp = session.get('reset_otp')
        stored_email = session.get('reset_email')
        stored_timestamp = session.get('otp_timestamp')

        if not all([stored_otp, stored_email, stored_timestamp]):
            return jsonify({
                "success": False,
                "message": "OTP session expired"
            }), 400

        if time.time() - stored_timestamp > 600:
            return jsonify({
                "success": False,
                "message": "OTP has expired"
            }), 400

        if email != stored_email or otp != stored_otp:
            return jsonify({
                "success": False,
                "message": "Invalid OTP"
            }), 400

        # Don't clear session data yet, we need it for password change
        response = jsonify({
            "success": True,
            "message": "OTP verified successfully"
        })
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    except Exception as e:
        print(f"Error in verify_otp: {str(e)}")
        error_response = jsonify({
            "success": False,
            "message": f"Error verifying OTP: {str(e)}"
        })
        error_response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        error_response.headers['Access-Control-Allow-Credentials'] = 'true'
        return error_response, 500

@auth_bp.route('/api/change-password', methods=['POST', 'OPTIONS'])
def change_password():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response, 200

    try:
        data = request.get_json()
        email = data.get('email')
        new_password = data.get('newPassword')

        if not all([email, new_password]):
            return jsonify({
                "success": False,
                "message": "Email and new password are required"
            }), 400

        # Verify the session data exists
        if not session.get('reset_otp') or email != session.get('reset_email'):
            return jsonify({
                "success": False,
                "message": "Please verify OTP first"
            }), 400

        # Update password
        hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        result = users_collection.update_one(
            {"email": email},
            {"$set": {"password": hashed_password}}
        )

        if result.modified_count > 0:
            # Clear session data after successful password change
            session.pop('reset_otp', None)
            session.pop('reset_email', None)
            session.pop('otp_timestamp', None)

            response = jsonify({
                "success": True,
                "message": "Password updated successfully"
            })
        else:
            response = jsonify({
                "success": False,
                "message": "Failed to update password"
            })

        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    except Exception as e:
        print(f"Error in change_password: {str(e)}")
        error_response = jsonify({
            "success": False,
            "message": f"Error changing password: {str(e)}"
        })
        error_response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
        error_response.headers['Access-Control-Allow-Credentials'] = 'true'
        return error_response, 500
