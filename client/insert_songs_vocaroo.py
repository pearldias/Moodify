from pymongo import MongoClient

# MongoDB Atlas URI
MONGO_URI = "mongodb+srv://soniyavitkar2712:soniya_27@cluster0.slai2ew.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# 🎵 New song data with Vocaroo links and cover images
songs = [
    # Happy
    {
        "emotion": "happy",
        "song_title": "You Are The One",
        "artist": "Sean Ferree",
        "song_uri": "https://voca.ro/1jYnxj74r70E",
        "song_image": "https://i.postimg.cc/x1zbnPcs/download.jpg"
    },
    {
        "emotion": "happy",
        "song_title": "Let It In",
        "artist": "Josh Woodward",
        "song_uri": "https://voca.ro/1bI9CwvYGoD0",
        "song_image": "https://i.postimg.cc/7L1GTY10/download-1.jpg"
    },
    {
        "emotion": "happy",
        "song_title": "Cherubs",
        "artist": "Josh Woodward",
        "song_uri": "https://voca.ro/1hZdIsCRhIv8",
        "song_image": "https://i.postimg.cc/Y9bvbnsS/download-2.jpg"
    },
    {
        "emotion": "happy",
        "song_title": "Swimming in Turpentine",
        "artist": "Josh Woodward",
        "song_uri": "https://voca.ro/188xhqjKeuK2",
        "song_image": "https://i.postimg.cc/RhhN87kL/images-1.jpg"
    },

    # Sad
    {
        "emotion": "sad",
        "song_title": "A Thousand Skins (Part 2)",
        "artist": "Josh Woodward",
        "song_uri": "https://voca.ro/1nSlJPhfDbfa",
        "song_image": "https://i.postimg.cc/xdQqYVrC/saddd.jpg"
    },
    {
        "emotion": "sad",
        "song_title": "Already There",
        "artist": "Josh Woodward",
        "song_uri": "https://voca.ro/1gIBtcid8Rum",
        "song_image": "https://i.postimg.cc/Jn4nD3zC/download-3.jpg"
    },
    {
        "emotion": "sad",
        "song_title": "Anchor",
        "artist": "Josh Woodward",
        "song_uri": "https://voca.ro/1jQSrYo3055w",
        "song_image": "https://i.postimg.cc/W3W4MDdF/breakup-sad-background-songs-hd-260nw-2105938568.webp"
    },
    {
        "emotion": "sad",
        "song_title": "Pompeii",
        "artist": "Josh Woodward",
        "song_uri": "https://voca.ro/18vXmRIDcRGA",
        "song_image": "https://i.postimg.cc/T1BY4ZqT/images-2.jpg"
    },
    {
        "emotion": "sad",
        "song_title": "The Handyman's Lament",
        "artist": "Josh Woodward",
        "song_uri": "https://voca.ro/1gJIW0TFjQGS",
        "song_image": "https://i.postimg.cc/sgYDTHBR/images-3.jpg"
    },
    {
        "emotion": "sad",
        "song_title": "Turnaround",
        "artist": "Sean Ferree",
        "song_uri": "https://voca.ro/1o57Ai5q4LAN",
        "song_image": "https://i.postimg.cc/V5ymRXm6/images-4.jpg"
    },

    # Angry
    {
        "emotion": "angry",
        "song_title": "Believe Me",
        "artist": "Sean Ferree",
        "song_uri": "https://voca.ro/1e8hHHKLHuw9",
        "song_image": "https://i.postimg.cc/CM81ZKF1/angryyy.jpg"
    },
    {
        "emotion": "angry",
        "song_title": "Equilibrium",
        "artist": "Sean Ferree",
        "song_uri": "https://voca.ro/1hZPe5ujyIYM",
        "song_image": "https://i.postimg.cc/m2Gr7GDS/images-5.jpg"
    },
    {
        "emotion": "angry",
        "song_title": "Not Today",
        "artist": "Sean Ferree",
        "song_uri": "https://voca.ro/1nXEQ66sTsa0",
        "song_image": "https://i.postimg.cc/RVQZRbJx/images-6.jpg"
    },
    {
        "emotion": "angry",
        "song_title": "The Bond",
        "artist": "Sean Ferree",
        "song_uri": "https://voca.ro/1lZzJ8SK1oCb",
        "song_image": "https://i.postimg.cc/13m5YcDn/images-7.jpg"
    }
]

# Insert into MongoDB
try:
    client = MongoClient(MONGO_URI)
    db = client["moodify_db"]
    collection = db["songs_by_emotion"]

    # Optional: Clear old records
    collection.delete_many({})
    
    # Insert new ones
    result = collection.insert_many(songs)
    print(f"✅ Successfully inserted {len(result.inserted_ids)} songs into MongoDB!")
except Exception as e:
    print("❌ Error:", e)
