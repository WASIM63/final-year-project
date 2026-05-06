import pandas as pd
from datetime import date
from sqlalchemy import create_engine, text
from config import Config


def _get_engine():
    """Create a SQLAlchemy engine for MySQL."""
    url = (
        f"mysql+pymysql://{Config.DB_USER}:{Config.DB_PASSWORD}"
        f"@{Config.DB_HOST}/{Config.DB_NAME}?charset=utf8mb4"
    )
    return create_engine(url)


def fetch_price_data(asin):
    """Fetch historical price data for a given ASIN from MySQL."""
    engine = _get_engine()

    query = text("""
        SELECT scrape_date, price
        FROM amazon_products
        WHERE ASIN = :asin
        ORDER BY scrape_date ASC
    """)

    df = pd.read_sql(query, engine, params={"asin": asin})
    engine.dispose()

    return df


def insert_scraped_price(asin, price):
    """Insert a freshly scraped price into amazon_products for today's date.

    This auto-grows the training dataset. If a record for today already exists,
    we update it instead of duplicating.

    Args:
        asin: The Amazon ASIN identifier.
        price: The current price as a float.

    Returns:
        bool: True if the insert/update succeeded, False otherwise.
    """
    if not price or price <= 0:
        return False

    engine = _get_engine()
    today = date.today().isoformat()

    try:
        with engine.connect() as conn:
            # Check if we already have a record for this ASIN today
            existing = conn.execute(
                text("""
                    SELECT id FROM amazon_products
                    WHERE ASIN = :asin AND scrape_date = :today
                    LIMIT 1
                """),
                {"asin": asin, "today": today},
            ).fetchone()

            if existing:
                # Update existing record
                conn.execute(
                    text("""
                        UPDATE amazon_products
                        SET price = :price
                        WHERE ASIN = :asin AND scrape_date = :today
                    """),
                    {"price": str(price), "asin": asin, "today": today},
                )
            else:
                # Insert new record
                conn.execute(
                    text("""
                        INSERT INTO amazon_products (ASIN, scrape_date, price)
                        VALUES (:asin, :today, :price)
                    """),
                    {"asin": asin, "today": today, "price": str(price)},
                )

            conn.commit()
            print(f"[DB] Stored scraped price for {asin}: {price} on {today}")
            return True

    except Exception as e:
        print(f"[DB] Failed to store scraped price: {e}")
        return False
    finally:
        engine.dispose()
