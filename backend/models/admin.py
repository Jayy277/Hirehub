from bson import ObjectId
from models.db import get_db

def get_admin_collection():
    return get_db().admins

def create_admin(name, email, password_hash):
    admin = {
        "name": name.strip(),
        "email": email.lower().strip(),
        "password_hash": password_hash
    }
    result = get_admin_collection().insert_one(admin)
    admin["_id"] = str(result.inserted_id)
    return admin

def find_admin_by_email(email):
    return get_admin_collection().find_one({"email": email.lower().strip()})

def find_admin_by_id(admin_id):
    try:
        return get_admin_collection().find_one({"_id": ObjectId(admin_id)})
    except Exception:
        return None
