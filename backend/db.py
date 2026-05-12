import pymysql
from config import Config


def get_db_connection():
    """Create and return a new MySQL database connection."""
    return pymysql.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
        cursorclass=pymysql.cursors.DictCursor,
        charset="utf8mb4",
    )


def init_db():
    """Initialize database tables for users and predictions."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Predictions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            asin VARCHAR(20) NOT NULL,
            amazon_url TEXT,
            product_title TEXT,
            product_image_url TEXT,
            forecast_data JSON,
            historical_data JSON,
            best_day_date DATE,
            best_day_price DECIMAL(12, 2),
            trend VARCHAR(20),
            mae DECIMAL(12, 4),
            rmse DECIMAL(12, 4),
            data_source VARCHAR(20) DEFAULT 'database',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # Migration: add product columns to existing tables that lack them
    try:
        cursor.execute("""
            ALTER TABLE predictions
            ADD COLUMN product_title TEXT AFTER amazon_url
        """)
    except Exception:
        pass  # Column already exists

    try:
        cursor.execute("""
            ALTER TABLE predictions
            ADD COLUMN product_image_url TEXT AFTER product_title
        """)
    except Exception:
        pass  # Column already exists

    try:
        cursor.execute("""
            ALTER TABLE predictions
            ADD COLUMN data_source VARCHAR(20) DEFAULT 'database' AFTER rmse
        """)
    except Exception:
        pass  # Column already exists

    conn.commit()
    cursor.close()
    conn.close()
    print("[OK] Database tables initialized successfully.")

