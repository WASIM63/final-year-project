import pandas as pd
import mysql.connector
import os
from dotenv import load_dotenv

# load environment variable
load_dotenv()

def fetch_price_data(asin):
    conn = mysql.connector.connect(
        host = os.getenv("DB_HOST"),
        user = os.getenv("DB_USER"),
        password = os.getenv("DB_PASSWORD"),
        database = os.getenv("DB_NAME")
    )
    
    query = f"""
    SELECT scrape_date, price
    FROM amazon_products
    WHERE ASIN = '{asin}'
    ORDER BY scrape_date ASC;
    """
    
    # convert into pandas DataFrane
    df = pd.read_sql(query, conn)
    
    conn.close()
    
    return df