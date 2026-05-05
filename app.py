import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import plotly.graph_objects as go

from utils.asin_extractor import extract_asin
from utils.db import fetch_price_data
from utils.preprocess import preprocess
from utils.model import train_model, make_forecast, evaluate_prophet

st.set_page_config(page_title = "Amazon Price Forecast", layout = 'wide')

st.title("📈 Amazon Product Price Forecast")

# Input Box
url = st.text_input("Enter Amazon Product Url")

# predict button
if st.button("predict Price"):
    
    asin = extract_asin(url)
    
    if not asin:
        st.error("Invalid Amazon url")
        st.stop()
        
    st.success(f"ASIN: {asin}")
    
    # Load data
    df = fetch_price_data(asin)
    
    if df.empty:
        st.warning("No Price data found for this product")
        st.stop()
    
    # preprocess
    df = preprocess(df)
    
    # train model
    model = train_model(df)
    
    # Forecast
    forecast_df = make_forecast(model, df)
    
    # forecast table
    st.subheader("📅 Forecast (Next 30 Days)")
    st.dataframe(forecast_df)
    
    # Best buying day
    best_day = forecast_df.loc[forecast_df['yhat'].idxmin()]
    st.info(f"💰 Best time to buy: {best_day['ds'].date()} at ₹{round(best_day['yhat'],2)}")
    
    # Trend insight
    if forecast_df['yhat'].iloc[-1] > forecast_df['yhat'].iloc[0]:
        st.warning("📈 Price likely to increase")
    else:
        st.success("📉 Price likely to decrease")
        
    # plot(Interactive)
    st.subheader("📊 Price Trend")
    
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x = df.index,
        y = df['price'],
        mode = "lines",
        name = "Historical Price"
    ))
    
    fig.add_trace(go.Scatter(
        x = forecast_df['ds'],
        y = forecast_df['yhat'],
        mode = "lines",
        name = "Forecast Price"
    ))
    
    fig.update_layout(
        xaxis_title = "Date",
        yaxis_title = "Price",
        template = "plotly_white"
    )
    
    st.plotly_chart(fig, use_container_width = True)
    
    st.subheader("📊 Model Evaluation")
    
    mae, rmse = evaluate_prophet(df)
    
    eval_df = pd.DataFrame({
        "Metrics" : ["MAE", "RMSE"],
        "Value" : [mae, rmse]
    })
    
    st.dataframe(eval_df)