from datetime import datetime
from bson import ObjectId
from models.db import get_db

def get_student_collection():
    return get_db().students

def create_student(name, email, password_hash):
    student = {
        "name": name.strip(),
        "email": email.lower().strip(),
        "password_hash": password_hash,
        "education": "",
        "skills": [],
        "resume_path": "",
        "photo_path": "",
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    result = get_student_collection().insert_one(student)
    student["_id"] = str(result.inserted_id)
    return student

def find_student_by_email(email):
    return get_student_collection().find_one({"email": email.lower().strip()})

def find_student_by_id(student_id):
    try:
        return get_student_collection().find_one({"_id": ObjectId(student_id)})
    except Exception:
        return None

def update_student_profile(student_id, education, skills, additional_fields=None):
    update_data = {
        "education": education,
        "skills": [skill.strip() for skill in skills if skill.strip()] if isinstance(skills, list) else skills
    }
    if additional_fields:
        update_data.update(additional_fields)
    
    get_student_collection().update_one(
        {"_id": ObjectId(student_id)},
        {"$set": update_data}
    )

def set_student_active_status(student_id, is_active):
    try:
        get_student_collection().update_one(
            {"_id": ObjectId(student_id)},
            {"$set": {"is_active": is_active}}
        )
        return True
    except Exception:
        return False

def delete_student(student_id):
    try:
        get_student_collection().delete_one({"_id": ObjectId(student_id)})
        return True
    except Exception:
        return False

def get_all_students():
    students = list(get_student_collection().find())
    for s in students:
        s["_id"] = str(s["_id"])
    return students
