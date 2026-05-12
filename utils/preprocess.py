import pandas as pd

def remove_outliers(df):
    q1 = df['price'].quantile(0.25)
    q3 = df['price'].quantile(0.75)
    
    iqr = q3 - q1
    
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5*iqr
    
    return df[(df['price'] >= lower) & (df['price'] <= upper)]

def preprocess(df):
    df['scrape_date'] = pd.to_datetime(df['scrape_date'], errors = 'coerce')
    
    # clean price column
    df['price'] = df['price'].astype('str')
    
    # remove currency symbol and commas
    df['price'] = df['price'].str.replace('₹', '', regex = False)
    df['price'] = df['price'].str.replace(',', '', regex = False)
    
    # convert price column into numeric
    df['price'] = pd.to_numeric(df['price'], errors = 'coerce')
    
    # remove outliers
    df = remove_outliers(df)
    
    # set index
    df.set_index('scrape_date', inplace = True)
    
    # Daily resampling
    df = df.resample('D').agg({'price' : 'mean'})
    
    # Fill the missing values
    df['price'] = df['price'].ffill()
    
    # Smooth short-term noise
    df['price'] = df['price'].rolling(window = 3, min_periods = 1).mean()
    
    return df