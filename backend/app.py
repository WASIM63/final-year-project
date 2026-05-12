from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from db import init_db
from routes.auth import auth_bp
from routes.predict import predict_bp


def create_app():
    """Application factory for the Flask backend."""
    app = Flask(__name__)

    # Configuration
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = Config.JWT_ACCESS_TOKEN_EXPIRES

    # Extensions
    CORS(app, origins=["http://localhost:3000"], supports_credentials=True)
    JWTManager(app)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(predict_bp)

    # Health check
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return {"status": "ok", "message": "Amazon Price Forecast API is running"}, 200

    # Initialize database tables
    with app.app_context():
        init_db()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=Config.DEBUG)
