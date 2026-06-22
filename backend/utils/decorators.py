from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request

def role_required(*roles):
    """
    Decorator to restrict access to endpoints based on user roles stored in the JWT claims.
    Usage:
        @app.route('/api/admin/dashboard')
        @role_required('admin')
        def admin_dashboard():
            ...
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                # Ensure JWT is present and valid
                verify_jwt_in_request()
            except Exception as e:
                return jsonify({
                    "success": False,
                    "message": "Missing or invalid token. Please log in again."
                }), 401
                
            claims = get_jwt()
            user_role = claims.get("role")
            
            if user_role not in roles:
                return jsonify({
                    "success": False,
                    "message": f"Access forbidden. This endpoint requires role: {', '.join(roles)}. Current role: {user_role}"
                }), 403
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator
