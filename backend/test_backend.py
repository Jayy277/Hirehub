import sys
import os

# Ensure the backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app import app
    from models.db import get_db
    print("[SUCCESS] Successfully imported Flask app!")
except Exception as e:
    print(f"[ERROR] Failed to import Flask app: {e}")
    sys.exit(1)

# Test MongoDB connection
try:
    db = get_db()
    # List collections to verify connectivity
    collections = db.list_collection_names()
    print("[SUCCESS] Connected to MongoDB successfully!")
    print(f"Collections in '{db.name}' database: {collections}")
except Exception as e:
    print(f"[ERROR] Failed to connect to MongoDB: {e}")
    print("Please make sure MongoDB is running on your machine.")
    sys.exit(1)

# Test default admin seeding
try:
    admin = db.admins.find_one({"email": "admin@hirehub.com"})
    if admin:
        print(f"[SUCCESS] Default admin account found in database: {admin['email']}")
    else:
        print("[ERROR] Default admin account not found. Seeding may have failed.")
        sys.exit(1)
except Exception as e:
    print(f"[ERROR] Failed to verify admin seeding: {e}")
    sys.exit(1)

print("\nALL BACKEND CHECKS PASSED SUCCESSFULLY! Ready to start frontend development.")
