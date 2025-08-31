import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
import torch
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import random
import certifi
from textblob import TextBlob

# --- Set up logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Database Connection ---
MONGO_URI = "mongodb+srv://soniyavitkar2712:soniya_27@cluster0.slai2ew.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = None
db = None
songs_collection = None

try:
    logger.info("Attempting to connect to MongoDB Atlas...")
    # Use certifi to provide the SSL certificate
    ca = certifi.where()
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, tlsCAFile=ca)
    # The ismaster command is cheap and does not require auth.
    client.admin.command('ismaster')
    db = client["moodify_db"]
    songs_collection = db["songs_by_emotion"]
    logger.info(f"Successfully connected to MongoDB. Using database: '{db.name}' and collection: '{songs_collection.name}'")
except ConnectionFailure as e:
    logger.error(f"MongoDB connection failed. Please check your MONGO_URI and network access. Error: {e}")
    # Exit if we can't connect to the DB
    exit()
except Exception as e:
    logger.error(f"An unexpected error occurred during DB initialization: {e}")
    exit()


app = Flask(__name__)
CORS(app)

# --- Model & Configuration ---
emotion_classifier = None
device = "cuda" if torch.cuda.is_available() else "cpu"

EMOTION_MAP = {
    'joy': 'happy',
    'sadness': 'sad',
    'anger': 'angry',
    'surprise': 'surprised',
    'neutral': 'neutral',
}

def initialize_model():
    """Initializes the pre-trained emotion classification model."""
    global emotion_classifier
    try:
        model_name = "j-hartmann/emotion-english-distilroberta-base"
        logger.info(f"Loading model: {model_name} on device: {device}")
        
        emotion_classifier = pipeline(
            "text-classification",
            model=model_name,
            tokenizer=model_name,
            device=0 if device == "cuda" else -1,
            top_k=None,
            max_length=512,
            truncation=True
        )
        logger.info("Model loaded successfully!")
        return True
    except Exception as e:
        logger.error(f"Fatal error loading model: {e}")
        emotion_classifier = None
        return False

def combine_responses(responses):
    """Combine multiple text inputs into one."""
    if not responses:
        return ""
    valid_responses = [resp.strip() for resp in responses if resp and resp.strip()]
    combined_text = " . ".join(valid_responses)
    words = combined_text.split()
    if len(words) > 400:
        combined_text = " ".join(words[:400])
    return combined_text

def correct_spelling(text):
    """Corrects spelling mistakes in the input text using TextBlob."""
    if not text:
        return ""
    try:
        # Create a TextBlob object and call the correct() method
        corrected_blob = TextBlob(text).correct()
        return str(corrected_blob)
    except Exception as e:
        logger.error(f"Error during spelling correction: {e}")
        # Fallback to original text if correction fails
        return text

def fetch_songs_by_emotion(emotion, limit=20):
    """Fetch songs from MongoDB based on emotion with enhanced logging."""
    try:
        query_filter = {"emotion": emotion}
        logger.info(f"Executing MongoDB find with filter: {query_filter}")
        
        songs = list(songs_collection.find(query_filter, {"_id": 0}).limit(limit))
        
        if not songs:
            logger.warning(f"Query returned 0 songs for filter: {query_filter}")
            case_insensitive_filter = {"emotion": {"$regex": f"^{emotion}$", "$options": "i"}}
            case_insensitive_count = songs_collection.count_documents(case_insensitive_filter)
            if case_insensitive_count > 0:
                logger.warning(f"Hint: Found {case_insensitive_count} songs with case-insensitive match. Check for capitalization issues (e.g., 'Happy' vs 'happy').")
            return []

        logger.info(f"Query successfully found {len(songs)} songs for emotion: '{emotion}'")
        random.shuffle(songs)
        return songs
    except Exception as e:
        logger.error(f"Error during MongoDB query for emotion '{emotion}': {e}")
        return []

def process_emotion_predictions(text):
    """Analyzes text, filters for relevant emotions, maps them, and returns sorted results."""
    raw_predictions = emotion_classifier(text)
    
    mapped_predictions = []
    for pred in raw_predictions[0]:
        raw_emotion = pred['label'].lower()
        if raw_emotion in EMOTION_MAP:
            mapped_predictions.append({
                'emotion': EMOTION_MAP[raw_emotion],
                'confidence': round(pred['score'], 4)
            })
            
    # --- MODIFICATION START ---
    # If no emotions from the EMOTION_MAP are found, fallback to 'neutral'.
    if not mapped_predictions:
        logger.warning(f"No mapped emotions found in predictions. Falling back to 'neutral'.")
        return [{'emotion': 'neutral', 'confidence': 1.0}]
    # --- END MODIFICATION ---

    mapped_predictions.sort(key=lambda x: x['confidence'], reverse=True)
    return mapped_predictions


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for server, model, and database status."""
    try:
        client.admin.command('ping')
        db_status = "connected"
        db_info = f"Using database '{db.name}' with {songs_collection.count_documents({})} songs."
    except Exception as e:
        db_status = "disconnected"
        db_info = str(e)
    
    return jsonify({
        'status': 'healthy',
        'model_status': "loaded" if emotion_classifier else "not loaded",
        'device': device,
        'database_status': db_status,
        'database_info': db_info
    })

@app.route('/predict', methods=['POST'])
def predict_emotion():
    """Predict emotion, return all relevant emotion scores, and provide songs."""
    if not emotion_classifier:
        return jsonify({'error': 'Model is not available. Please try again later.'}), 503

    try:
        data = request.get_json()
        if not data or 'responses' not in data:
            return jsonify({'error': 'Invalid input. Provide "responses" field in JSON.'}), 400

        original_text = combine_responses(data.get('responses', []))
        if not original_text.strip():
            return jsonify({'error': 'Input text is empty after processing.'}), 400

        logger.info(f"Original text received: '{original_text}'")
        corrected_text = correct_spelling(original_text)
        logger.info(f"Text after spell correction: '{corrected_text}'")

        final_emotions = process_emotion_predictions(corrected_text)
        
        # This check is now effectively redundant due to the fallback, but safe to keep.
        if not final_emotions:
            return jsonify({'error': 'Could not determine a relevant emotion from the provided text.'}), 400

        primary_emotion_obj = final_emotions[0]
        primary_emotion = primary_emotion_obj['emotion']
        
        songs = fetch_songs_by_emotion(primary_emotion)

        return jsonify({
            'primary_emotion': primary_emotion,
            'confidence': primary_emotion_obj['confidence'],
            'all_emotions': final_emotions,
            'original_text_preview': original_text[:150] + ('...' if len(original_text) > 150 else ''),
            'corrected_text_preview': corrected_text[:150] + ('...' if len(corrected_text) > 150 else ''),
            'songs': songs,
            'songs_count': len(songs)
        })

    except Exception as e:
        logger.error(f"Error in prediction endpoint: {e}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/text_emotion/predict', methods=['POST'])
def predict_emotion_text():
    if not emotion_classifier:
        return jsonify({'error': 'Model is not available. Please try again later.'}), 503
    try:
        data = request.get_json()
        if not data or 'responses' not in data:
            return jsonify({'error': 'Invalid input. Provide "responses" field in JSON.'}), 400
        
        original_text = combine_responses(data.get('responses', []))
        if not original_text.strip():
            return jsonify({'error': 'Input text is empty after processing.'}), 400

        logger.info(f"Original text received: '{original_text}'")
        corrected_text = correct_spelling(original_text)
        logger.info(f"Text after spell correction: '{corrected_text}'")

        final_emotions = process_emotion_predictions(corrected_text)

        # This check is now effectively redundant due to the fallback, but safe to keep.
        if not final_emotions:
            return jsonify({'error': 'Could not determine a relevant emotion from the provided text.'}), 400
        primary_emotion_obj = final_emotions[0]

        return jsonify({
            'primary_emotion': primary_emotion_obj['emotion'],
            'confidence': primary_emotion_obj['confidence'],
            'all_emotions': final_emotions,
            'original_text_preview': original_text[:150] + ('...' if len(original_text) > 150 else ''),
            'corrected_text_preview': corrected_text[:150] + ('...' if len(corrected_text) > 150 else '')
        })
    except Exception as e:
        logger.error(f"Error in text_emotion prediction: {e}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/songs/<emotion>', methods=['GET'])
def get_songs_by_emotion(emotion):
    limit = request.args.get('limit', 20, type=int)
    songs = fetch_songs_by_emotion(emotion.lower(), limit)
    return jsonify({'emotion': emotion, 'songs': songs, 'count': len(songs)})

@app.route('/songs/all', methods=['GET'])
def get_all_emotions():
    try:
        emotions = sorted(songs_collection.distinct("emotion"))
        emotion_counts = {emo: songs_collection.count_documents({"emotion": emo}) for emo in emotions}
        return jsonify({'emotions': emotions, 'emotion_counts': emotion_counts})
    except Exception as e:
        logger.error(f"Error fetching all emotions: {e}")
        return jsonify({'error': f'Failed to fetch emotions: {str(e)}'}), 500

if __name__ == '__main__':
    logger.info("Starting Emotion Detection API...")
    if emotion_classifier or initialize_model():
        app.run(debug=True, host='0.0.0.0', port=5001)
    else:
        logger.error("Could not start the server because the model failed to initialize.")

# import logging
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from transformers import pipeline
# import torch
# from pymongo import MongoClient
# from pymongo.errors import ConnectionFailure
# import random
# import certifi
# from textblob import TextBlob # --- NEW ---

# # --- Set up logging ---
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# logger = logging.getLogger(__name__)

# # --- Database Connection ---
# MONGO_URI = "mongodb+srv://soniyavitkar2712:soniya_27@cluster0.slai2ew.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
# client = None
# db = None
# songs_collection = None

# try:
#     logger.info("Attempting to connect to MongoDB Atlas...")
#     # Use certifi to provide the SSL certificate
#     ca = certifi.where()
#     client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, tlsCAFile=ca)
#     # The ismaster command is cheap and does not require auth.
#     client.admin.command('ismaster')
#     db = client["moodify_db"]
#     songs_collection = db["songs_by_emotion"]
#     logger.info(f"Successfully connected to MongoDB. Using database: '{db.name}' and collection: '{songs_collection.name}'")
# except ConnectionFailure as e:
#     logger.error(f"MongoDB connection failed. Please check your MONGO_URI and network access. Error: {e}")
#     # Exit if we can't connect to the DB
#     exit()
# except Exception as e:
#     logger.error(f"An unexpected error occurred during DB initialization: {e}")
#     exit()


# app = Flask(__name__)
# CORS(app)

# # --- Model & Configuration ---
# emotion_classifier = None
# device = "cuda" if torch.cuda.is_available() else "cpu"

# EMOTION_MAP = {
#     'joy': 'happy',
#     'sadness': 'sad',
#     'anger': 'angry',
#     'surprise': 'surprised',
#     'neutral': 'neutral',
# }

# def initialize_model():
#     """Initializes the pre-trained emotion classification model."""
#     global emotion_classifier
#     try:
#         model_name = "j-hartmann/emotion-english-distilroberta-base"
#         logger.info(f"Loading model: {model_name} on device: {device}")
        
#         emotion_classifier = pipeline(
#             "text-classification",
#             model=model_name,
#             tokenizer=model_name,
#             device=0 if device == "cuda" else -1,
#             top_k=None,
#             max_length=512,
#             truncation=True
#         )
#         logger.info("Model loaded successfully!")
#         return True
#     except Exception as e:
#         logger.error(f"Fatal error loading model: {e}")
#         emotion_classifier = None
#         return False

# def combine_responses(responses):
#     """Combine multiple text inputs into one."""
#     if not responses:
#         return ""
#     valid_responses = [resp.strip() for resp in responses if resp and resp.strip()]
#     combined_text = " . ".join(valid_responses)
#     words = combined_text.split()
#     if len(words) > 400:
#         combined_text = " ".join(words[:400])
#     return combined_text

# # --- NEW: Function to correct spelling ---
# def correct_spelling(text):
#     """Corrects spelling mistakes in the input text using TextBlob."""
#     if not text:
#         return ""
#     try:
#         # Create a TextBlob object and call the correct() method
#         corrected_blob = TextBlob(text).correct()
#         return str(corrected_blob)
#     except Exception as e:
#         logger.error(f"Error during spelling correction: {e}")
#         # Fallback to original text if correction fails
#         return text

# def fetch_songs_by_emotion(emotion, limit=20):
#     """Fetch songs from MongoDB based on emotion with enhanced logging."""
#     try:
#         query_filter = {"emotion": emotion}
#         logger.info(f"Executing MongoDB find with filter: {query_filter}")
        
#         songs = list(songs_collection.find(query_filter, {"_id": 0}).limit(limit))
        
#         if not songs:
#             logger.warning(f"Query returned 0 songs for filter: {query_filter}")
#             case_insensitive_filter = {"emotion": {"$regex": f"^{emotion}$", "$options": "i"}}
#             case_insensitive_count = songs_collection.count_documents(case_insensitive_filter)
#             if case_insensitive_count > 0:
#                 logger.warning(f"Hint: Found {case_insensitive_count} songs with case-insensitive match. Check for capitalization issues (e.g., 'Happy' vs 'happy').")
#             return []

#         logger.info(f"Query successfully found {len(songs)} songs for emotion: '{emotion}'")
#         random.shuffle(songs)
#         return songs
#     except Exception as e:
#         logger.error(f"Error during MongoDB query for emotion '{emotion}': {e}")
#         return []

# def process_emotion_predictions(text):
#     """Analyzes text, filters for relevant emotions, maps them, and returns sorted results."""
#     raw_predictions = emotion_classifier(text)
    
#     mapped_predictions = []
#     for pred in raw_predictions[0]:
#         raw_emotion = pred['label'].lower()
#         if raw_emotion in EMOTION_MAP:
#             mapped_predictions.append({
#                 'emotion': EMOTION_MAP[raw_emotion],
#                 'confidence': round(pred['score'], 4)
#             })
            
#     if not mapped_predictions:
#         return None

#     mapped_predictions.sort(key=lambda x: x['confidence'], reverse=True)
#     return mapped_predictions


# @app.route('/health', methods=['GET'])
# def health_check():
#     """Health check endpoint for server, model, and database status."""
#     try:
#         client.admin.command('ping')
#         db_status = "connected"
#         db_info = f"Using database '{db.name}' with {songs_collection.count_documents({})} songs."
#     except Exception as e:
#         db_status = "disconnected"
#         db_info = str(e)
    
#     return jsonify({
#         'status': 'healthy',
#         'model_status': "loaded" if emotion_classifier else "not loaded",
#         'device': device,
#         'database_status': db_status,
#         'database_info': db_info
#     })

# @app.route('/predict', methods=['POST'])
# def predict_emotion():
#     """Predict emotion, return all relevant emotion scores, and provide songs."""
#     if not emotion_classifier:
#         return jsonify({'error': 'Model is not available. Please try again later.'}), 503

#     try:
#         data = request.get_json()
#         if not data or 'responses' not in data:
#             return jsonify({'error': 'Invalid input. Provide "responses" field in JSON.'}), 400

#         original_text = combine_responses(data.get('responses', []))
#         if not original_text.strip():
#             return jsonify({'error': 'Input text is empty after processing.'}), 400

#         # --- MODIFIED: Add spelling correction step ---
#         logger.info(f"Original text received: '{original_text}'")
#         corrected_text = correct_spelling(original_text)
#         logger.info(f"Text after spell correction: '{corrected_text}'")

#         final_emotions = process_emotion_predictions(corrected_text)
#         # --- END MODIFICATION ---
        
#         if not final_emotions:
#             return jsonify({'error': 'Could not determine a relevant emotion from the provided text.'}), 400

#         primary_emotion_obj = final_emotions[0]
#         primary_emotion = primary_emotion_obj['emotion']
        
#         songs = fetch_songs_by_emotion(primary_emotion)

#         # --- MODIFIED: Add corrected text to the response for clarity ---
#         return jsonify({
#             'primary_emotion': primary_emotion,
#             'confidence': primary_emotion_obj['confidence'],
#             'all_emotions': final_emotions,
#             'original_text_preview': original_text[:150] + ('...' if len(original_text) > 150 else ''),
#             'corrected_text_preview': corrected_text[:150] + ('...' if len(corrected_text) > 150 else ''),
#             'songs': songs,
#             'songs_count': len(songs)
#         })

#     except Exception as e:
#         logger.error(f"Error in prediction endpoint: {e}")
#         return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

# @app.route('/text_emotion/predict', methods=['POST'])
# def predict_emotion_text():
#     if not emotion_classifier:
#         return jsonify({'error': 'Model is not available. Please try again later.'}), 503
#     try:
#         data = request.get_json()
#         if not data or 'responses' not in data:
#             return jsonify({'error': 'Invalid input. Provide "responses" field in JSON.'}), 400
        
#         original_text = combine_responses(data.get('responses', []))
#         if not original_text.strip():
#             return jsonify({'error': 'Input text is empty after processing.'}), 400

#         # --- MODIFIED: Add spelling correction step ---
#         logger.info(f"Original text received: '{original_text}'")
#         corrected_text = correct_spelling(original_text)
#         logger.info(f"Text after spell correction: '{corrected_text}'")

#         final_emotions = process_emotion_predictions(corrected_text)
#         # --- END MODIFICATION ---

#         if not final_emotions:
#             return jsonify({'error': 'Could not determine a relevant emotion from the provided text.'}), 400
#         primary_emotion_obj = final_emotions[0]

#         # --- MODIFIED: Add corrected text to the response for clarity ---
#         return jsonify({
#             'primary_emotion': primary_emotion_obj['emotion'],
#             'confidence': primary_emotion_obj['confidence'],
#             'all_emotions': final_emotions,
#             'original_text_preview': original_text[:150] + ('...' if len(original_text) > 150 else ''),
#             'corrected_text_preview': corrected_text[:150] + ('...' if len(corrected_text) > 150 else '')
#         })
#     except Exception as e:
#         logger.error(f"Error in text_emotion prediction: {e}")
#         return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

# @app.route('/songs/<emotion>', methods=['GET'])
# def get_songs_by_emotion(emotion):
#     limit = request.args.get('limit', 20, type=int)
#     songs = fetch_songs_by_emotion(emotion.lower(), limit)
#     return jsonify({'emotion': emotion, 'songs': songs, 'count': len(songs)})

# @app.route('/songs/all', methods=['GET'])
# def get_all_emotions():
#     try:
#         emotions = sorted(songs_collection.distinct("emotion"))
#         emotion_counts = {emo: songs_collection.count_documents({"emotion": emo}) for emo in emotions}
#         return jsonify({'emotions': emotions, 'emotion_counts': emotion_counts})
#     except Exception as e:
#         logger.error(f"Error fetching all emotions: {e}")
#         return jsonify({'error': f'Failed to fetch emotions: {str(e)}'}), 500

# if __name__ == '__main__':
#     logger.info("Starting Emotion Detection API...")
#     if emotion_classifier or initialize_model():
#         app.run(debug=True, host='0.0.0.0', port=5001)
#     else:
#         logger.error("Could not start the server because the model failed to initialize.")