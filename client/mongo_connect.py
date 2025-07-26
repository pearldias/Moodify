from pymongo import MongoClient

# Correct connection string
MONGO_URI = "mongodb+srv://soniyavitkar2712:soniya_27@cluster0.slai2ew.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

print("🔍 Connecting using URI:", MONGO_URI)

try:
    client = MongoClient(MONGO_URI)
    db = client["moodify_db"]
    collection = db["songs_by_emotion"]

    print("✅ Successfully connected to MongoDB Atlas!")
    print("📁 Collections:", db.list_collection_names())

except Exception as e:
    print("❌ Error connecting to MongoDB:", e)
