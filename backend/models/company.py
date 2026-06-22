from datetime import datetime
from bson import ObjectId
from models.db import get_db

def get_company_collection():
    return get_db().companies

def create_company(name, email, password_hash, description=""):
    company = {
        "name": name.strip(),
        "email": email.lower().strip(),
        "password_hash": password_hash,
        "description": description.strip(),
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    result = get_company_collection().insert_one(company)
    company["_id"] = str(result.inserted_id)
    return company

def find_company_by_email(email):
    return get_company_collection().find_one({"email": email.lower().strip()})

def find_company_by_id(company_id):
    try:
        return get_company_collection().find_one({"_id": ObjectId(company_id)})
    except Exception:
        return None

def update_company_profile(company_id, name, description):
    get_company_collection().update_one(
        {"_id": ObjectId(company_id)},
        {"$set": {"name": name.strip(), "description": description.strip()}}
    )

def set_company_active_status(company_id, is_active):
    try:
        get_company_collection().update_one(
            {"_id": ObjectId(company_id)},
            {"$set": {"is_active": is_active}}
        )
        return True
    except Exception:
        return False

def delete_company(company_id):
    try:
        get_company_collection().delete_one({"_id": ObjectId(company_id)})
        return True
    except Exception:
        return False

def get_all_companies():
    companies = list(get_company_collection().find())
    for c in companies:
        c["_id"] = str(c["_id"])
    return companies
