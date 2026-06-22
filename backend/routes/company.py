from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.decorators import role_required
from models.internship import get_internship_collection, find_internship_by_id
from models.application import get_applications_by_internship, find_application_by_id, update_application_status
from models.student import find_student_by_id
from models.company import find_company_by_id
from utils.email_helper import send_application_status_email
from bson import ObjectId

company_bp = Blueprint("company", __name__)

@company_bp.route("/internships", methods=["GET"])
@jwt_required()
@role_required("company")
def get_company_internships():
    company_id = get_jwt_identity()
    
    try:
        internships = list(get_internship_collection().find({"company_id": ObjectId(company_id)}))
        for item in internships:
            item["_id"] = str(item["_id"])
            item["company_id"] = str(item["company_id"])
        
        return jsonify({
            "success": True,
            "data": internships
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to retrieve company internships: {str(e)}"
        }), 500


@company_bp.route("/applications/<internship_id>", methods=["GET"])
@jwt_required()
@role_required("company")
def get_applicants(internship_id):
    company_id = get_jwt_identity()
    
    try:
        # Verify the internship belongs to this company
        internship = find_internship_by_id(internship_id)
        if not internship:
            return jsonify({
                "success": False,
                "message": "Internship post not found."
            }), 404
            
        if internship["company_id"] != company_id:
            return jsonify({
                "success": False,
                "message": "Unauthorized. You do not own this internship posting."
            }), 403
            
        apps = get_applications_by_internship(internship_id)
        
        # Populate applicant details
        detailed_apps = []
        for app in apps:
            student = find_student_by_id(app["student_id"])
            if not student:
                continue
                
            detailed_apps.append({
                "id": app["_id"],
                "status": app["status"],
                "applied_at": app["applied_at"],
                "updated_at": app["updated_at"],
                "student": {
                    "id": str(student["_id"]),
                    "name": student.get("name"),
                    "email": student.get("email"),
                    "education": student.get("education"),
                    "skills": student.get("skills", []),
                    "resume_path": student.get("resume_path"),
                    "photo_path": student.get("photo_path")
                }
            })
            
        return jsonify({
            "success": True,
            "data": detailed_apps
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to retrieve applicants: {str(e)}"
        }), 500


@company_bp.route("/applications/<application_id>", methods=["PUT"])
@jwt_required()
@role_required("company")
def update_applicant_status(application_id):
    company_id = get_jwt_identity()
    data = request.get_json() or {}
    status = data.get("status")  # "Accepted" or "Rejected"

    if status not in ["Accepted", "Rejected"]:
        return jsonify({
            "success": False,
            "message": "Invalid status. Must be 'Accepted' or 'Rejected'."
        }), 400

    try:
        # Find application
        application = find_application_by_id(application_id)
        if not application:
            return jsonify({
                "success": False,
                "message": "Application not found."
            }), 404

        # Verify company owns the internship related to the application
        internship = find_internship_by_id(application["internship_id"])
        if not internship or internship["company_id"] != company_id:
            return jsonify({
                "success": False,
                "message": "Unauthorized to update this application."
            }), 403

        # Update application status
        update_application_status(application_id, status)
        
        # Fetch student and company information to send email
        student = find_student_by_id(application["student_id"])
        company = find_company_by_id(company_id)
        
        if student and company:
            send_application_status_email(
                student_email=student["email"],
                student_name=student["name"],
                internship_title=internship["title"],
                company_name=company["name"],
                status=status
            )

        return jsonify({
            "success": True,
            "message": f"Application status updated to {status}."
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to update application status: {str(e)}"
        }), 500
