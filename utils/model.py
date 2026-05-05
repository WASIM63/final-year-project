from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np

# build forecast model function
def train_model(df):
    df_prophet = df.reset_index()
    df_prophet.columns = ['ds', 'y']
    
    # log transform
    df_prophet['y'] = np.log(df_prophet['y'])
    
    model = Prophet(growth = 'linear', changepoint_prior_scale = 0.1)
    
    model.fit(df_prophet)
    
    return model

# Forecast Function
def make_forecast(model, df):
    future = model.make_future_dataframe(periods = 30)
    forecast = model.predict(future)
    
    # convert back from log
    forecast['yhat'] = np.exp(forecast['yhat'])
    
    # safty avoid negative value
    forecast['yhat'] = forecast['yhat'].clip(lower = 0)
    
    return forecast[['ds', 'yhat']].tail(30)

# Evaluation metrics
def evaluate_prophet(df):
    df_prophet = df.reset_index()
    df_prophet.columns = ['ds', 'y']
    
    # split the data into train(80%) and test(20%)
    train_size = int(len(df_prophet) * 0.8)
    train = df_prophet[ : train_size]
    test = df_prophet[train_size : ]
    
    model = Prophet()
    model.fit(train)
    
    
    # create future dates equal to test size
    future = model.make_future_dataframe(periods = len(test))
    forecast = model.predict(future)
    
    # Extract predictions for test period
    preds = forecast[['ds', 'yhat']].tail(len(test))
    
    # calculate metrics
    mae = mean_absolute_error(test['y'], preds['yhat'])
    rmse = np.sqrt(mean_squared_error(test['y'], preds['yhat']))
    
    return mae, rmse