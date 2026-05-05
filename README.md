# 📈 Amazon Price Forecasting System

## 🚀 Overview

This project is a **time-series forecasting system** that predicts future prices of Amazon products using historical price data.

Users can input an Amazon product URL, and the system:

* Extracts the **ASIN**
* Fetches historical price data from a MySQL database
* Applies preprocessing (cleaning, outlier removal, smoothing)
* Uses a forecasting model to predict **next 30 days prices**
* Displays results in an interactive **Streamlit dashboard**

---

## 🎯 Features

* 🔗 Amazon URL → ASIN extraction
* 🗄️ MySQL database integration
* 🧹 Data preprocessing:

  * Missing value handling
  * Outlier removal (IQR method)
  * Smoothing (rolling mean)
* 📊 Time-series forecasting using Prophet
* 📉 Interactive visualization (Plotly)
* 💡 Insights:

  * Best time to buy
  * Price trend (increasing/decreasing)
* 📏 Model evaluation:

  * MAE (Mean Absolute Error)
  * RMSE (Root Mean Squared Error)

---

## 🏗️ Project Structure

```
amazon_price_forecast/
│
├── app.py
├── requirements.txt
├── .env
├── .gitignore
│
├── utils/
│   ├── __init__.py
│   ├── asin_extractor.py
│   ├── db.py
│   ├── preprocess.py
│   ├── model.py
│
└── README.md
```

---

## ⚙️ Installation

### 1. Clone the repository

```
git clone https://github.com/your-username/amazon-price-forecast.git
cd amazon-price-forecast
```

### 2. Create virtual environment

```
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows
```

### 3. Install dependencies

```
pip install -r requirements.txt
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database
```

⚠️ Do NOT push `.env` to GitHub.

---

## ▶️ Run the Application

```
streamlit run app.py
```

---

## 📊 Model Details

* Model: **Prophet (Time-Series Forecasting)**
* Enhancements:

  * Log transformation for stability
  * Outlier removal for noise reduction
  * Rolling mean smoothing
  * Non-negative prediction constraint

---

## 📈 Evaluation Metrics

* **MAE (Mean Absolute Error)** → average prediction error
* **RMSE (Root Mean Squared Error)** → penalizes large errors

---

## ⚠️ Challenges

* Price volatility due to sales and discounts
* Missing or irregular data
* External factors (demand, inventory) not included

---

## 🔮 Future Improvements

* Add **XGBoost / LSTM models**
* Deploy on **Streamlit Cloud / AWS**
* Add **price alert system (email/SMS)**
* Include **holiday & sales event features**
* Build **user dashboard with watchlist**

---

## 🧠 Key Learnings

* Time-series forecasting using Prophet
* Data preprocessing for real-world datasets
* Handling noisy and irregular data
* Building end-to-end ML applications with Streamlit

---

## 📌 Author

**Biswajit Adak**
Aspiring Data Analyst / Data Scientist

---

## ⭐ If you like this project

Give it a ⭐ on GitHub!
