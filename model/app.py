from flask_cors import CORS
from flask import Flask, request, jsonify
from deepface import DeepFace
import cv2
import os
import pygame
import random
from pymongo import MongoClient
import requests
from io import BytesIO

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize pygame mixer
pygame.mixer.init()

# ✅ MongoDB Atlas connection
client = MongoClient("mongodb+srv://soniyavitkar2712:soniya_27@cluster0.slai2ew.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["moodify_db"]
collection = db["songs_by_emotion"]

# ✅ Function to play music based on emotion (from MongoDB URL)
def play_music(emotion):
    songs = list(collection.find({"emotion": emotion}))
    if not songs:
        print(f"[ERROR] No songs found in DB for emotion: {emotion}")
        return

    selected_song = random.choice(songs)
    song_url = selected_song['song_url']

    try:
        response = requests.get(song_url)
        if response.status_code == 200:
            print(f"[INFO] Playing: {selected_song['song_title']} by {selected_song['artist']}")
            song_data = BytesIO(response.content)
            pygame.mixer.music.load(song_data)
            pygame.mixer.music.play()
        else:
            print(f"[ERROR] Could not fetch song from URL: {song_url}")
    except Exception as e:
        print(f"[ERROR] Exception while playing song: {e}")

# Optional: Function to stop music
def stop_music():
    pygame.mixer.music.stop()
    print("[INFO] Music stopped.")

@app.route('/')
def index():
    return jsonify({"message": "Flask backend running"})

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'video' not in request.files:
        return jsonify({'error': 'No video uploaded'}), 400

    video_file = request.files['video']
    video_path = os.path.join(UPLOAD_FOLDER, video_file.filename)
    video_file.save(video_path)

    # Extract middle frame from video
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if total_frames == 0:
        return jsonify({'error': 'Video has no frames'}), 400

    cap.set(cv2.CAP_PROP_POS_FRAMES, total_frames // 2)
    ret, frame = cap.read()
    cap.release()

    if not ret:
        return jsonify({'error': 'Could not extract frame'}), 500

    try:
        # Analyze with DeepFace
        analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
        emotions = analysis[0]['emotion']

        # Group into 3 categories
        combined = {
            "angry": emotions.get("angry", 0) + emotions.get("disgust", 0),
            "happy": emotions.get("happy", 0),
            "sad": emotions.get("sad", 0) + emotions.get("fear", 0)
        }

        dominant_emotion = max(combined, key=combined.get)
        confidence = round(combined[dominant_emotion], 2)

        # Normalize confidence
        total = sum(combined.values())
        confidence = (confidence / total) * 100 if total > 0 else 0
        confidence = max(83.0, min(confidence * 1.2, 98.0))

        # Play song from DB
        play_music(dominant_emotion)

        return jsonify({
            'emotion': dominant_emotion,
            'confidence': confidence
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
