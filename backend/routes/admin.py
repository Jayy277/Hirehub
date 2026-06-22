from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from utils.decorators import role_required
from models.student import get_student_collection, set_student_active_status, delete_student, get_all_students
from models.company import get_company_collection, set_company_active_status, delete_company, get_all_companies
from models.internship import get_internship_collection, update_internship, delete_internship, get_all_internships_raw
from models.application import get_application_collection, delete_applications_by_student, delete_applications_by_internship
from bson import ObjectId

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@role_required("admin")
def get_dashboard_stats():
    try:
        # Simple counts using collections
        total_students = get_student_collection().count_documents({})
        total_companies = get_company_collection().count_documents({})
        total_internships = get_internship_collection().count_documents({})
        total_applications = get_application_collection().count_documents({})

        # Count applications by status
        pending_apps = get_application_collection().count_documents({"status": "Pending"})
        accepted_apps = get_application_collection().count_documents({"status": "Accepted"})
        rejected_apps = get_application_collection().count_documents({"status": "Rejected"})

        stats = {
            "total_students": total_students,
            "total_companies": total_companies,
            "total_internships": total_internships,
            "total_applications": total_applications,
            "applications_status": {
                "Pending": pending_apps,
                "Accepted": accepted_apps,
                "Rejected": rejected_apps
            }
        }

        return jsonify({
            "success": True,
            "data": stats
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to retrieve stats: {str(e)}"
        }), 500


@admin_bp.route("/students", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_students():
    try:
        students = get_all_students()
        return jsonify({
            "success": True,
            "data": students
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to fetch students: {str(e)}"
        }), 500


@admin_bp.route("/students/<student_id>/status", methods=["PUT"])
@jwt_required()
@role_required("admin")
def toggle_student_status(student_id):
    data = request.get_json() or {}
    is_active = data.get("is_active")

    if is_active is None or not isinstance(is_active, bool):
        return jsonify({
            "success": False,
            "message": "is_active (boolean) field is required."
        }), 400

    if set_student_active_status(student_id, is_active):
        status_str = "activated" if is_active else "deactivated"
        return jsonify({
            "success": True,
            "message": f"Student account has been {status_str}."
        }), 200
    else:
        return jsonify({
            "success": False,
            "message": "Failed to update student status."
        }), 500


@admin_bp.route("/students/<student_id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def remove_student(student_id):
    try:
        # Cascading delete: delete all application entries for this student
        delete_applications_by_student(student_id)
        
        # Delete student document
        if delete_student(student_id):
            return jsonify({
                "success": True,
                "message": "Student account and their applications have been deleted."
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Failed to delete student account."
            }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"An error occurred: {str(e)}"
        }), 500


@admin_bp.route("/companies", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_companies():
    try:
        companies = get_all_companies()
        return jsonify({
            "success": True,
            "data": companies
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to fetch companies: {str(e)}"
        }), 500


@admin_bp.route("/companies/<company_id>/status", methods=["PUT"])
@jwt_required()
@role_required("admin")
def toggle_company_status(company_id):
    data = request.get_json() or {}
    is_active = data.get("is_active")

    if is_active is None or not isinstance(is_active, bool):
        return jsonify({
            "success": False,
            "message": "is_active (boolean) field is required."
        }), 400

    if set_company_active_status(company_id, is_active):
        status_str = "activated" if is_active else "deactivated"
        return jsonify({
            "success": True,
            "message": f"Company account has been {status_str}."
        }), 200
    else:
        return jsonify({
            "success": False,
            "message": "Failed to update company status."
        }), 500


@admin_bp.route("/companies/<company_id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def remove_company(company_id):
    try:
        # Cascading delete: 
        # 1. Find all internships posted by this company
        internships = list(get_internship_collection().find({"company_id": ObjectId(company_id)}))
        
        for internship in internships:
            internship_id = str(internship["_id"])
            # 2. Delete all applications for each internship
            delete_applications_by_internship(internship_id)
            # 3. Delete the internship posting
            delete_internship(internship_id)

        # 4. Delete company document
        if delete_company(company_id):
            return jsonify({
                "success": True,
                "message": "Company, postings, and applicant history deleted successfully."
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Failed to delete company account."
            }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"An error occurred: {str(e)}"
        }), 500


@admin_bp.route("/internships", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_all_internships():
    try:
        internships = get_all_internships_raw()
        for item in internships:
            company = get_company_collection().find_one({"_id": ObjectId(item["company_id"])})
            item["company_name"] = company["name"] if company else "Unknown Company"
        return jsonify({
            "success": True,
            "data": internships
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to fetch internships: {str(e)}"
        }), 500


@admin_bp.route("/internships/<internship_id>", methods=["PUT"])
@jwt_required()
@role_required("admin")
def modify_internship(internship_id):
    data = request.get_json() or {}
    
    # Extract supported edit fields
    update_fields = {}
    if "title" in data:
        update_fields["title"] = data["title"]
    if "description" in data:
        update_fields["description"] = data["description"]
    if "status" in data and data["status"] in ["active", "closed"]:
        update_fields["status"] = data["status"]
    if "stipend" in data:
        update_fields["stipend"] = data["stipend"]
    if "duration" in data:
        update_fields["duration"] = data["duration"]
    if "deadline" in data:
        update_fields["deadline"] = data["deadline"]

    if not update_fields:
        return jsonify({
            "success": False,
            "message": "No valid update fields supplied."
        }), 400

    if update_internship(internship_id, update_fields):
        return jsonify({
            "success": True,
            "message": "Internship post modified successfully."
        }), 200
    else:
        return jsonify({
            "success": False,
            "message": "Failed to modify internship posting."
        }), 500


@admin_bp.route("/internships/<internship_id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def remove_internship(internship_id):
    try:
        # Cascade delete applications for this posting
        delete_applications_by_internship(internship_id)
        
        if delete_internship(internship_id):
            return jsonify({
                "success": True,
                "message": "Internship posting and associated applications removed."
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Failed to remove internship posting."
            }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"An error occurred: {str(e)}"
        }), 500
