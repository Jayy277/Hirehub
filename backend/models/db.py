from pymongo import MongoClient
from config import Config

client = None
db = None

def init_db(app=None):
    global client, db
    client = MongoClient(Config.MONGO_URI)
    db = client[Config.MONGO_DB_NAME]
    return db

def get_db():
    global db
    if db is None:
        client = MongoClient(Config.MONGO_URI)
        db = client[Config.MONGO_DB_NAME]
    return db
