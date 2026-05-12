from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from db import get_db_connection

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user with name, email, and password."""
    data = request.get_json()

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # Validation
    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"error": "Email already registered"}), 409

        # Hash password
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

        # Insert user
        cursor.execute(
            "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)",
            (name, email, hashed.decode("utf-8")),
        )
        conn.commit()

        # Create access token
        user_id = cursor.lastrowid
        access_token = create_access_token(identity=str(user_id))

        return jsonify({
            "message": "Registration successful",
            "token": access_token,
            "user": {"id": user_id, "name": name, "email": email},
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user with email and password, return JWT token."""
    data = request.get_json()

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "Invalid email or password"}), 401

        # Verify password
        if not bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
            return jsonify({"error": "Invalid email or password"}), 401

        # Create access token
        access_token = create_access_token(identity=str(user["id"]))

        return jsonify({
            "message": "Login successful",
            "token": access_token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
            },
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """Get current authenticated user's profile."""
    user_id = get_jwt_identity()

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT id, name, email, created_at FROM users WHERE id = %s",
            (user_id,),
        )
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Convert datetime to string for JSON serialization
        user["created_at"] = user["created_at"].isoformat() if user["created_at"] else None

        return jsonify({"user": user}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
