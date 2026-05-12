import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()


class Config:
    """Application configuration loaded from environment variables."""

    # Database
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "amazon_scraping")

    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    # Flask
    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"
