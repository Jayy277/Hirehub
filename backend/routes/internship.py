from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from utils.decorators import role_required
from models.internship import (
    create_internship,
    find_internship_by_id,
    search_and_filter_internships
)
from models.company import find_company_by_id
from models.student import find_student_by_id
from models.application import create_application
from utils.email_helper import send_application_submitted_email

internship_bp = Blueprint("internship", __name__)

@internship_bp.route("", methods=["GET"])
def get_internships():
    keyword = request.args.get("keyword")
    skills_raw = request.args.get("skills")
    
    skills = []
    if skills_raw:
        # Split by comma and filter out empty strings
        skills = [s.strip() for s in skills_raw.split(",") if s.strip()]

    try:
        internships = search_and_filter_internships(keyword, skills)
        
        # Populate company name for each internship
        for item in internships:
            company = find_company_by_id(item["company_id"])
            item["company_name"] = company["name"] if company else "Unknown Company"
            
        return jsonify({
            "success": True,
            "data": internships
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to search internships: {str(e)}"
        }), 500


@internship_bp.route("/<internship_id>", methods=["GET"])
def get_internship_details(internship_id):
    try:
        internship = find_internship_by_id(internship_id)
        if not internship:
            return jsonify({
                "success": False,
                "message": "Internship not found."
            }), 404
            
        company = find_company_by_id(internship["company_id"])
        internship["company_name"] = company["name"] if company else "Unknown Company"
        internship["company_description"] = company.get("description", "") if company else ""

        return jsonify({
            "success": True,
            "data": internship
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to retrieve details: {str(e)}"
        }), 500


@internship_bp.route("", methods=["POST"])
@jwt_required()
@role_required("company")
def post_internship():
    company_id = get_jwt_identity()
    data = request.get_json() or {}
    
    title = data.get("title")
    description = data.get("description")
    skills_required = data.get("skills_required")  # expected list of strings
    stipend = data.get("stipend")
    duration = data.get("duration")
    deadline = data.get("deadline")

    if not title or not description or not stipend or not duration or not deadline:
        return jsonify({
            "success": False,
            "message": "Title, description, stipend, duration, and deadline are required."
        }), 400

    if not isinstance(skills_required, list):
        return jsonify({
            "success": False,
            "message": "skills_required must be a list of strings."
        }), 400

    try:
        internship = create_internship(
            company_id=company_id,
            title=title,
            description=description,
            skills_required=skills_required,
            stipend=stipend,
            duration=duration,
            deadline=deadline
        )
        return jsonify({
            "success": True,
            "message": "Internship posted successfully.",
            "data": internship
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to post internship: {str(e)}"
        }), 500


@internship_bp.route("/<internship_id>/apply", methods=["POST"])
@jwt_required()
@role_required("student")
def apply_for_internship(internship_id):
    student_id = get_jwt_identity()
    
    try:
        # Check if internship exists
        internship = find_internship_by_id(internship_id)
        if not internship:
            return jsonify({
                "success": False,
                "message": "Internship post not found."
            }), 404

        if internship.get("status") == "closed":
            return jsonify({
                "success": False,
                "message": "This internship posting is closed."
            }), 400

        # Verify student profile is complete (needs resume at least)
        student = find_student_by_id(student_id)
        if not student:
            return jsonify({
                "success": False,
                "message": "Student account not found."
            }), 404
            
        if not student.get("resume_path"):
            return jsonify({
                "success": False,
                "message": "Please upload your resume in your profile before applying."
            }), 400

        # Create application
        application = create_application(student_id, internship_id)
        if not application:
            return jsonify({
                "success": False,
                "message": "You have already applied for this internship."
            }), 409

        # Trigger email notification
        company = find_company_by_id(internship["company_id"])
        company_name = company["name"] if company else "Unknown Company"
        
        send_application_submitted_email(
            student_email=student["email"],
            student_name=student["name"],
            internship_title=internship["title"],
            company_name=company_name
        )

        return jsonify({
            "success": True,
            "message": "Application submitted successfully.",
            "data": application
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to apply: {str(e)}"
        }), 500
