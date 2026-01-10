# app/__init__.py
from flask_cors import CORS
import os
from flask import Flask
from flask_pymongo import PyMongo
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

# Load env variables
load_dotenv()

app = Flask(__name__)

# --- FIX: Use the URI from your .env file (Atlas), NOT localhost ---
app.config["MONGO_URI"] = os.getenv("MONGO_URI") 
# ------------------------------------------------------------------

# Enable CORS
CORS(
    app,
    origins=[
        "http://localhost:5173",
        "https://humble-goldfish-4j9wgq46wr6j3j6xj-5173.app.github.dev"
    ],
    supports_credentials=True
)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

# MongoDB connection
mongodb_client = PyMongo(app)
db = mongodb_client.db

# Cloudinary config
cloudinary.config(
    secure=True
)

# Attach routes
import routes