from datetime import datetime
from bson import ObjectId
from models.db import get_db

def get_application_collection():
    return get_db().applications

def create_application(student_id, internship_id):
    # Check if student already applied to this internship
    existing = get_application_collection().find_one({
        "student_id": ObjectId(student_id) if isinstance(student_id, str) else student_id,
        "internship_id": ObjectId(internship_id) if isinstance(internship_id, str) else internship_id
    })
    if existing:
        return None  # Already applied
        
    application = {
        "student_id": ObjectId(student_id) if isinstance(student_id, str) else student_id,
        "internship_id": ObjectId(internship_id) if isinstance(internship_id, str) else internship_id,
        "status": "Pending",  # "Pending", "Accepted", "Rejected"
        "applied_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = get_application_collection().insert_one(application)
    application["_id"] = str(result.inserted_id)
    application["student_id"] = str(application["student_id"])
    application["internship_id"] = str(application["internship_id"])
    return application

def find_application_by_id(app_id):
    try:
        app = get_application_collection().find_one({"_id": ObjectId(app_id)})
        if app:
            app["_id"] = str(app["_id"])
            app["student_id"] = str(app["student_id"])
            app["internship_id"] = str(app["internship_id"])
        return app
    except Exception:
        return None

def update_application_status(app_id, status):
    try:
        get_application_collection().update_one(
            {"_id": ObjectId(app_id)},
            {
                "$set": {
                    "status": status,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return True
    except Exception:
        return False

def get_applications_by_student(student_id):
    try:
        apps = list(get_application_collection().find({
            "student_id": ObjectId(student_id) if isinstance(student_id, str) else student_id
        }))
        for app in apps:
            app["_id"] = str(app["_id"])
            app["student_id"] = str(app["student_id"])
            app["internship_id"] = str(app["internship_id"])
        return apps
    except Exception:
        return []

def get_applications_by_internship(internship_id):
    try:
        apps = list(get_application_collection().find({
            "internship_id": ObjectId(internship_id) if isinstance(internship_id, str) else internship_id
        }))
        for app in apps:
            app["_id"] = str(app["_id"])
            app["student_id"] = str(app["student_id"])
            app["internship_id"] = str(app["internship_id"])
        return apps
    except Exception:
        return []

def delete_applications_by_student(student_id):
    try:
        get_application_collection().delete_many({
            "student_id": ObjectId(student_id) if isinstance(student_id, str) else student_id
        })
        return True
    except Exception:
        return False

def delete_applications_by_internship(internship_id):
    try:
        get_application_collection().delete_many({
            "internship_id": ObjectId(internship_id) if isinstance(internship_id, str) else internship_id
        })
        return True
    except Exception:
        return False


def get_all_applications():
    apps = list(get_application_collection().find())
    for app in apps:
        app["_id"] = str(app["_id"])
        app["student_id"] = str(app["student_id"])
        app["internship_id"] = str(app["internship_id"])
    return apps

