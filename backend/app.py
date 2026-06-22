import os
import bcrypt
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from config import Config
from models.db import init_db
from models.admin import create_admin, find_admin_by_email

# Initialize extensions
mail = Mail()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend Vite dev server (usually http://localhost:5173 or * in dev)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize extensions
    init_db(app)
    mail.init_app(app)
    jwt.init_app(app)

    # Register blueprints
    from routes.auth import auth_bp
    from routes.student import student_bp
    from routes.company import company_bp
    from routes.internship import internship_bp
    from routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(student_bp, url_prefix="/api/student")
    app.register_blueprint(company_bp, url_prefix="/api/company")
    app.register_blueprint(internship_bp, url_prefix="/api/internships")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    # Static file serving for uploads (resumes, profile photos)
    @app.route("/uploads/<path:filename>")
    def uploaded_files(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # Global error handling
    @app.errorhandler(413)
    def file_too_large(e):
        return jsonify({
            "success": False,
            "message": "File is too large. Max allowed size is 5MB for resumes and 2MB for images."
        }), 413

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            "success": False,
            "message": "Endpoint not found."
        }), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({
            "success": False,
            "message": f"An unexpected server error occurred: {str(e)}"
        }), 500

    # Seed Default Admin Account
    with app.app_context():
        try:
            admin_email = app.config["ADMIN_EMAIL"]
            admin_pass = app.config["ADMIN_PASSWORD"]
            
            existing_admin = find_admin_by_email(admin_email)
            if not existing_admin:
                hashed_pass = bcrypt.hashpw(admin_pass.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                create_admin(
                    name="System Administrator",
                    email=admin_email,
                    password_hash=hashed_pass
                )
                print(f"[SUCCESS] Default admin account seeded: {admin_email}")
            else:
                print("[INFO] Default admin account already exists.")
        except Exception as e:
            print(f"[ERROR] Admin seeding failed: {str(e)}")

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)
