from flask import request, jsonify
from deepface import DeepFace
import tempfile
import os
import cv2
import numpy as np
from __init__ import app, db
from flask_cors import CORS
import cloudinary
import cloudinary.uploader
from bson.objectid import ObjectId
import re

CORS(app)
# DNN FACE DETECTOR SETUP
prototxt_path = os.path.join("dnn", "deploy.prototxt.txt")
caffemodel_path = os.path.join("dnn", "res10_300x300_ssd_iter_140000.caffemodel")
net = cv2.dnn.readNetFromCaffe(prototxt_path, caffemodel_path)

def get_closest_human_face(frame):
    h, w = frame.shape[:2]
    blob = cv2.dnn.blobFromImage(frame, 1.0, (300, 300), (104, 117, 123))
    net.setInput(blob)
    detections = net.forward()

    max_area = 0
    best_face = None

    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > 0.85:
            box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
            x1, y1, x2, y2 = map(int, box)
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)

            face = frame[y1:y2, x1:x2]
            area = (x2 - x1) * (y2 - y1)
            if face.shape[0] > 50 and face.shape[1] > 50 and area > max_area:
                max_area = area
                best_face = face

    return best_face


@app.route('/')
def index():
    return jsonify({"message": "Flask backend running"})


# 🔹 UPDATED /analyze ROUTE
@app.route('/analyze', methods=['POST'])
def analyze():
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    video = request.files['video']
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
        video_path = temp_video.name
        video.save(video_path)

    try:
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total_frames == 0:
            raise Exception("Video has no frames.")

        emotions_list = []
        # Sample 5 evenly spaced frames
        frame_indices = np.linspace(0, total_frames - 1, 5, dtype=int)

        for i in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            success, frame = cap.read()
            if not success:
                continue

            # Detect face
            face = get_closest_human_face(frame)
            if face is None:
                continue

            try:
                result = DeepFace.analyze(face, actions=['emotion'], enforce_detection=True)
                emotions = result[0]['emotion']

                grouped = {
                    'angry': emotions.get('angry', 0) + emotions.get('disgust', 0) + emotions.get('fear', 0),
                    'happy': emotions.get('happy', 0),
                    'sad': emotions.get('sad', 0),
                    'surprise': emotions.get('surprise', 0),
                    'neutral': emotions.get('neutral', 0),
                }
                emotions_list.append(grouped)

            except Exception as e:
                print("Frame skipped:", e)

        cap.release()

        if not emotions_list:
            return jsonify({"error": "No valid human face detected in video"}), 422

        # Average scores across frames
        avg_scores = {emo: 0 for emo in emotions_list[0].keys()}
        for emo_dict in emotions_list:
            for emo, val in emo_dict.items():
                avg_scores[emo] += val

        for emo in avg_scores:
            avg_scores[emo] /= len(emotions_list)

        # Pick dominant emotion with threshold check
        sorted_emotions = sorted(avg_scores.items(), key=lambda x: x[1], reverse=True)
        if len(sorted_emotions) > 1 and (sorted_emotions[0][1] - sorted_emotions[1][1]) < 10:
            dominant_emotion = "angry"  # fallback if too close
        else:
            dominant_emotion = sorted_emotions[0][0]

        raw_score = avg_scores[dominant_emotion]
        total = sum(avg_scores.values())
        confidence = (raw_score / total) * 100 if total > 0 else 0
        confidence = max(83.0, min(confidence * 1.2, 98.0))  # Boost confidence

        # MongoDB fetch
        songs = list(db.songs_by_emotion.find({"emotion": dominant_emotion}))
        for song in songs:
            song['_id'] = str(song['_id'])

        return jsonify({
            "emotion": dominant_emotion,
            "confidence": confidence,
            "songs": songs
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(video_path):
            os.unlink(video_path)


@app.route('/api/songs/<emotion>', methods=['GET'])
def get_songs_by_emotion(emotion):
    # Create a case-insensitive regex using the 'emotion' variable from the URL
    regex_emotion = re.compile(f"^{emotion}$", re.IGNORECASE)
    
    songs = list(db.songs_by_emotion.find({"emotion": regex_emotion}))
    
    for song in songs:
        song['_id'] = str(song['_id'])
        
    return jsonify({"emotion": emotion, "songs": songs}), 200


@app.route("/api/songs", methods=["POST"])
def add_song():
    try:
        song_mood = request.form.get("song_mood")
        song_name = request.form.get("song_name")
        song_artist = request.form.get("song_artist")

        song_file = request.files.get("song_file")
        song_image = request.files.get("song_image")

        if not all([song_mood, song_name, song_artist, song_file, song_image]):
            return jsonify({"error": "All fields are required"}), 400

        song_upload = cloudinary.uploader.upload(
            song_file,
            resource_type="video",
            folder="songs"
        )

        image_upload = cloudinary.uploader.upload(
            song_image,
            folder="song_images"
        )

        song_data = {
            "emotion": song_mood,
            "song_title": song_name,
            "artist": song_artist,
            "song_uri": song_upload["secure_url"],
            "song_image": image_upload["secure_url"]
        }

        db.songs_by_emotion.insert_one(song_data)
        song_data['_id'] = str(song_data['_id'])

        return jsonify(song_data), 201

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/songs', methods=['GET'])
def get_all_songs():
    try:
        songs = list(db.songs_by_emotion.find({}))
        for song in songs:
            song['_id'] = str(song['_id'])
        return jsonify(songs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/songs/<id>', methods=['DELETE'])
def delete_song(id):
    try:
        if not ObjectId.is_valid(id):
            return jsonify({"error": "Invalid song ID"}), 400

        result = db.songs_by_emotion.delete_one({"_id": ObjectId(id)})

        if result.deleted_count == 1:
            return jsonify({"message": "Song deleted successfully"}), 200
        else:
            return jsonify({"error": "Song not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
