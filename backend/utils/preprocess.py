import pandas as pd


def remove_outliers(df):
    """Remove outliers from price data using IQR method."""
    q1 = df["price"].quantile(0.25)
    q3 = df["price"].quantile(0.75)

    iqr = q3 - q1

    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr

    return df[(df["price"] >= lower) & (df["price"] <= upper)]


def preprocess(df):
    """
    Full preprocessing pipeline:
    - Parse dates
    - Clean price column (remove currency symbols, commas)
    - Remove outliers
    - Daily resampling
    - Forward fill missing values
    - Rolling mean smoothing
    """
    # Try parsing with common formats, then fallback
    try:
        df["scrape_date"] = pd.to_datetime(df["scrape_date"], format="%Y-%m-%d", errors="coerce")
    except Exception:
        df["scrape_date"] = pd.to_datetime(df["scrape_date"], format="mixed", errors="coerce")

    # clean price column
    df["price"] = df["price"].astype("str")

    # remove currency symbol and commas
    df["price"] = df["price"].str.replace("₹", "", regex=False)
    df["price"] = df["price"].str.replace(",", "", regex=False)

    # convert price column into numeric
    df["price"] = pd.to_numeric(df["price"], errors="coerce")

    # remove outliers
    df = remove_outliers(df)

    # set index
    df.set_index("scrape_date", inplace=True)

    # Daily resampling
    df = df.resample("D").agg({"price": "mean"})

    # Fill the missing values
    df["price"] = df["price"].ffill()

    # Smooth short-term noise (reduced window to minimize lag)
    df["price"] = df["price"].rolling(window=2, min_periods=1).mean()

    return df
