from datetime import datetime
from bson import ObjectId
from models.db import get_db

def get_internship_collection():
    return get_db().internships

def create_internship(company_id, title, description, skills_required, stipend, duration, deadline):
    internship = {
        "company_id": ObjectId(company_id) if isinstance(company_id, str) else company_id,
        "title": title.strip(),
        "description": description.strip(),
        "skills_required": [skill.strip().lower() for skill in skills_required if skill.strip()] if isinstance(skills_required, list) else [],
        "stipend": stipend,
        "duration": duration.strip(),
        "deadline": deadline,  # Expected as a string YYYY-MM-DD or similar
        "status": "active",  # "active" or "closed"
        "created_at": datetime.utcnow()
    }
    result = get_internship_collection().insert_one(internship)
    internship["_id"] = str(result.inserted_id)
    internship["company_id"] = str(internship["company_id"])
    return internship

def find_internship_by_id(internship_id):
    try:
        internship = get_internship_collection().find_one({"_id": ObjectId(internship_id)})
        if internship:
            internship["_id"] = str(internship["_id"])
            internship["company_id"] = str(internship["company_id"])
        return internship
    except Exception:
        return None

def update_internship(internship_id, update_fields):
    try:
        if "company_id" in update_fields:
            update_fields["company_id"] = ObjectId(update_fields["company_id"]) if isinstance(update_fields["company_id"], str) else update_fields["company_id"]
        if "skills_required" in update_fields:
            update_fields["skills_required"] = [s.strip().lower() for s in update_fields["skills_required"] if s.strip()]
        
        get_internship_collection().update_one(
            {"_id": ObjectId(internship_id)},
            {"$set": update_fields}
        )
        return True
    except Exception:
        return False

def delete_internship(internship_id):
    try:
        get_internship_collection().delete_one({"_id": ObjectId(internship_id)})
        return True
    except Exception:
        return False

def get_all_internships_raw():
    internships = list(get_internship_collection().find())
    for item in internships:
        item["_id"] = str(item["_id"])
        item["company_id"] = str(item["company_id"])
    return internships

def search_and_filter_internships(keyword=None, skills=None):
    query = {}
    
    # Keyword search across title and description
    if keyword:
        query["$or"] = [
            {"title": {"$regex": keyword, "$options": "i"}},
            {"description": {"$regex": keyword, "$options": "i"}}
        ]
        
    # Filter by skills (multi-select / tag matches)
    if skills and isinstance(skills, list) and len(skills) > 0:
        cleaned_skills = [s.strip().lower() for s in skills if s.strip()]
        if cleaned_skills:
            # Matches internships that require any of the specified filter skills
            query["skills_required"] = {"$in": cleaned_skills}
            
    # Return active postings
    internships = list(get_internship_collection().find(query).sort("created_at", -1))
    
    for item in internships:
        item["_id"] = str(item["_id"])
        item["company_id"] = str(item["company_id"])
    return internships
