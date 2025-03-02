from flask_bcrypt import Bcrypt
from flask_login import UserMixin
from pymongo import MongoClient, errors

bcrypt = Bcrypt()

class User(UserMixin):
    def __init__(self, email):
        self.email = email

    def get_id(self):
        return self.email

    @property
    def is_active(self):
        return True

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

# MongoDB setup with error handling
try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client["NLP_SIGN"]

    # Access collections
    users_collection = db["users"]
    userdata_collection = db["USERDATA"]

    print("Connected to MongoDB.")
except errors.ConnectionFailure:
    print("Failed to connect to MongoDB. Please ensure MongoDB is running.")
    users_collection = None
    userdata_collection = None
