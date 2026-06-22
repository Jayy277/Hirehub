import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from models.student import create_student, find_student_by_email, find_student_by_id
from models.company import create_company, find_company_by_email, find_company_by_id
from models.admin import find_admin_by_email, find_admin_by_id

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")  # "student" or "company"

    if not name or not email or not password or not role:
        return jsonify({
            "success": False,
            "message": "Name, email, password, and role are required."
        }), 400

    if role not in ["student", "company"]:
        return jsonify({
            "success": False,
            "message": "Invalid role. Must be 'student' or 'company'."
        }), 400

    email = email.lower().strip()

    # Check if user already exists in students, companies, or admins
    if find_student_by_email(email) or find_company_by_email(email) or find_admin_by_email(email):
        return jsonify({
            "success": False,
            "message": "An account with this email already exists."
        }), 409

    # Hash the password
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    try:
        if role == "student":
            create_student(name, email, password_hash)
        else:
            create_company(name, email, password_hash)
            
        return jsonify({
            "success": True,
            "message": f"{role.capitalize()} registered successfully. Please log in."
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Registration failed: {str(e)}"
        }), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required."
        }), 400

    email = email.lower().strip()

    # Check students
    user = find_student_by_email(email)
    role = "student"

    # Check companies
    if not user:
        user = find_company_by_email(email)
        role = "company"

    # Check admins
    if not user:
        user = find_admin_by_email(email)
        role = "admin"

    if not user:
        return jsonify({
            "success": False,
            "message": "Invalid email or password."
        }), 401

    # Verify password
    saved_hash = user.get("password_hash")
    if not bcrypt.checkpw(password.encode("utf-8"), saved_hash.encode("utf-8")):
        return jsonify({
            "success": False,
            "message": "Invalid email or password."
        }), 401

    # Check if user is active (admins don't have is_active, check if it's False for student/company)
    if role != "admin" and not user.get("is_active", True):
        return jsonify({
            "success": False,
            "message": "Your account has been deactivated. Please contact support."
        }), 403

    # Generate JWT
    user_id = str(user["_id"])
    additional_claims = {"role": role}
    token = create_access_token(identity=user_id, additional_claims=additional_claims)

    return jsonify({
        "success": True,
        "token": token,
        "role": role,
        "user": {
            "id": user_id,
            "name": user.get("name"),
            "email": user.get("email")
        },
        "message": "Login successful"
    }), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    user_info = None
    if role == "student":
        user_info = find_student_by_id(user_id)
    elif role == "company":
        user_info = find_company_by_id(user_id)
    elif role == "admin":
        user_info = find_admin_by_id(user_id)

    if not user_info:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    # Remove password hash for security
    user_info.pop("password_hash", None)
    if "_id" in user_info:
        user_info["_id"] = str(user_info["_id"])

    return jsonify({
        "success": True,
        "role": role,
        "data": user_info
    }), 200
