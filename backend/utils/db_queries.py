import pandas as pd
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
