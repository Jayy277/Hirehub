import os
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "flask-secret-key-fallback")
    DEBUG = os.environ.get("FLASK_DEBUG", "True").lower() == "true"
    PORT = int(os.environ.get("PORT", 5000))

    # MongoDB settings
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "hirehub")

    # JWT settings
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-jwt-key-fallback")
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours in seconds

    # Flask-Mail settings
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.mailtrap.io")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", 2525))
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "True").lower() == "true"
    MAIL_USE_SSL = os.environ.get("MAIL_USE_SSL", "False").lower() == "true"
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", "noreply@hirehub.com")

    # File upload settings
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    RESUMES_FOLDER = os.path.join(UPLOAD_FOLDER, "resumes")
    PHOTOS_FOLDER = os.path.join(UPLOAD_FOLDER, "photos")
    
    # 5MB Max Content Length for overall requests
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  
    
    ALLOWED_RESUME_EXTENSIONS = {"pdf"}
    ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

    # Seed Admin settings
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@hirehub.com")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "AdminPass123!")
