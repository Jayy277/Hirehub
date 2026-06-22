import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.decorators import role_required
from models.student import find_student_by_id, update_student_profile
from models.application import get_applications_by_student
from models.internship import find_internship_by_id
from models.company import find_company_by_id

student_bp = Blueprint("student", __name__)

def allowed_file(filename, allowed_extensions):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions

@student_bp.route("/profile", methods=["PUT"])
@jwt_required()
@role_required("student")
def update_profile():
    student_id = get_jwt_identity()
    data = request.get_json() or {}
    
    education = data.get("education", "")
    skills = data.get("skills", [])

    if not isinstance(skills, list):
        return jsonify({
            "success": False,
            "message": "Skills must be a list of strings."
        }), 400

    try:
        update_student_profile(student_id, education, skills)
        return jsonify({
            "success": True,
            "message": "Profile updated successfully."
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to update profile: {str(e)}"
        }), 500


@student_bp.route("/upload-resume", methods=["POST"])
@jwt_required()
@role_required("student")
def upload_resume():
    student_id = get_jwt_identity()
    
    if "resume" not in request.files:
        return jsonify({
            "success": False,
            "message": "No resume file provided."
        }), 400

    file = request.files["resume"]
    
    if file.filename == "":
        return jsonify({
            "success": False,
            "message": "Empty file name."
        }), 400

    # Validate file extension
    if not allowed_file(file.filename, current_app.config["ALLOWED_RESUME_EXTENSIONS"]):
        return jsonify({
            "success": False,
            "message": f"Invalid file type. Only PDF is allowed."
        }), 400

    # Validate PDF contents to ensure it looks like a resume
    try:
        import pypdf
        reader = pypdf.PdfReader(file.stream)
        text = ""
        # Inspect up to first 2 pages for text
        for i in range(min(2, len(reader.pages))):
            page_text = reader.pages[i].extract_text()
            if page_text:
                text += page_text.lower()
        
        # Check for typical resume keywords
        resume_keywords = [
            "education", "skills", "experience", "projects", "employment", 
            "work history", "volunteer", "certificates", "languages", 
            "curriculum vitae", "resume", "contact", "achievements", "objective",
            "qualifications", "summary"
        ]
        
        # Require at least 2 matching words
        match_count = sum(1 for kw in resume_keywords if kw in text)
        if match_count < 2:
            return jsonify({
                "success": False,
                "message": "The uploaded PDF does not appear to be a valid resume. Please ensure it contains typical sections like Education, Experience, or Skills."
            }), 400
            
        # Reset file stream pointer to the beginning so it saves correctly
        file.stream.seek(0)
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to verify PDF document: {str(e)}. Please ensure it is a valid, unencrypted PDF."
        }), 400

    # Ensure uploads folder exists
    resumes_dir = current_app.config["RESUMES_FOLDER"]
    if not os.path.exists(resumes_dir):
        os.makedirs(resumes_dir, exist_ok=True)

    # Make file name unique
    orig_filename = secure_filename(file.filename)
    unique_filename = f"{student_id}_{uuid.uuid4().hex[:8]}_{orig_filename}"
    file_path = os.path.join(resumes_dir, unique_filename)
    
    try:
        file.save(file_path)
        
        # Save relative path to MongoDB (useful for URL construction)
        relative_path = f"uploads/resumes/{unique_filename}"
        update_student_profile(student_id, "", [], {"resume_path": relative_path})
        
        return jsonify({
            "success": True,
            "message": "Resume uploaded successfully.",
            "data": {"resume_path": relative_path}
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to save resume: {str(e)}"
        }), 500


@student_bp.route("/upload-photo", methods=["POST"])
@jwt_required()
@role_required("student")
def upload_photo():
    student_id = get_jwt_identity()
    
    if "photo" not in request.files:
        return jsonify({
            "success": False,
            "message": "No photo file provided."
        }), 400

    file = request.files["photo"]
    
    if file.filename == "":
        return jsonify({
            "success": False,
            "message": "Empty file name."
        }), 400

    # Validate file extension
    if not allowed_file(file.filename, current_app.config["ALLOWED_IMAGE_EXTENSIONS"]):
        return jsonify({
            "success": False,
            "message": "Invalid file type. Only images (png, jpg, jpeg, gif) are allowed."
        }), 400

    # Ensure uploads folder exists
    photos_dir = current_app.config["PHOTOS_FOLDER"]
    if not os.path.exists(photos_dir):
        os.makedirs(photos_dir, exist_ok=True)

    # Make file name unique
    orig_filename = secure_filename(file.filename)
    unique_filename = f"{student_id}_{uuid.uuid4().hex[:8]}_{orig_filename}"
    file_path = os.path.join(photos_dir, unique_filename)
    
    try:
        file.save(file_path)
        
        # Save relative path to MongoDB
        relative_path = f"uploads/photos/{unique_filename}"
        update_student_profile(student_id, "", [], {"photo_path": relative_path})
        
        return jsonify({
            "success": True,
            "message": "Profile photo uploaded successfully.",
            "data": {"photo_path": relative_path}
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to save photo: {str(e)}"
        }), 500


@student_bp.route("/photo", methods=["DELETE"])
@jwt_required()
@role_required("student")
def delete_photo():
    student_id = get_jwt_identity()
    try:
        student = find_student_by_id(student_id)
        if not student:
            return jsonify({
                "success": False,
                "message": "Student account not found."
            }), 404
            
        photo_path = student.get("photo_path")
        if photo_path:
            # Delete actual file if it exists
            abs_path = os.path.join(current_app.config["BASE_DIR"], photo_path)
            if os.path.exists(abs_path):
                try:
                    os.remove(abs_path)
                except Exception as ex:
                    print(f"Error removing photo file from disk: {ex}")
                    
        # Update database path
        update_student_profile(student_id, "", [], {"photo_path": ""})
        return jsonify({
            "success": True,
            "message": "Profile photo deleted successfully."
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to delete profile photo: {str(e)}"
        }), 500


@student_bp.route("/applications", methods=["GET"])
@jwt_required()
@role_required("student")
def list_applications():
    student_id = get_jwt_identity()
    
    try:
        apps = get_applications_by_student(student_id)
        
        # Populate internship and company details
        detailed_apps = []
        for app in apps:
            internship = find_internship_by_id(app["internship_id"])
            if not internship:
                continue
                
            company = find_company_by_id(internship["company_id"])
            company_name = company["name"] if company else "Unknown Company"
            
            detailed_apps.append({
                "id": app["_id"],
                "internship_id": app["internship_id"],
                "status": app["status"],
                "applied_at": app["applied_at"],
                "updated_at": app["updated_at"],
                "internship": {
                    "title": internship["title"],
                    "description": internship["description"],
                    "stipend": internship["stipend"],
                    "duration": internship["duration"],
                    "deadline": internship["deadline"],
                    "company_name": company_name
                }
            })
            
        return jsonify({
            "success": True,
            "data": detailed_apps
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to retrieve applications: {str(e)}"
        }), 500
