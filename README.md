# 📈 PriceCast AI - Amazon Price Forecasting Platform

PriceCast AI is an enterprise-grade, full-stack machine learning application designed to predict the future prices of Amazon products. It helps users pinpoint the exact best day to buy a product to maximize savings.

## 🚀 Overview

Users can input any Amazon product URL, and the system dynamically:
* Scrapes the **live current price** and **M.R.P.** directly from Amazon.
* Enriches the database automatically, learning from every search.
* Uses a **Smart Tiered Forecasting Engine** to predict the next 30 days of prices.
* Detects upcoming **major sale events** and adjusts forecasts accordingly.
* Displays results in a premium, dark-themed **Next.js interactive dashboard**.

---

## 🎯 Features

* **Full-Stack Architecture**: Next.js 15 frontend powered by a Flask Python REST API.
* **Authentication**: JWT-based secure user authentication and personalized dashboards.
* **Live Amazon Scraping**: Real-time extraction of product titles, images, and pricing bounds.
* **Smart Tiered ML Pipeline**:
  * *1 Data Point*: Monte Carlo Stochastic Simulation with Geometric Brownian Motion (GBM).
  * *2-4 Data Points*: Linear Trend Extrapolation.
  * *5-13 Data Points*: Holt-Winters Exponential Smoothing.
  * *14+ Data Points*: Massive Ensemble Model blending Auto-tuned ARIMA + Holt-Winters.
* **Holiday & Sale Intelligence**: Automatically detects 10+ major global and Indian sales (Prime Day, Great Indian Festival, Black Friday) and injects realistic price drops into the forecast.
* **Confidence Intervals**: 90% mathematically calculated confidence bands rendered visually on the chart.
* **Premium UI/UX**: Built with Recharts, Lucide icons, glassmorphism, and responsive mobile-first CSS.

---

## 🏗️ Project Structure

```
Amazon-Product-Price-Forecast/
│
├── frontend/                 # Next.js 15 React Application
│   ├── src/app/              # App Router (Auth, Dashboard, Marketing)
│   ├── src/components/       # Reusable UI components (ForecastChart, Navbar)
│   └── src/lib/              # Axios API clients
│
├── backend/                  # Flask REST API & ML Engine
│   ├── app.py                # Main server entrypoint
│   ├── db.py                 # MySQL database connection & schemas
│   ├── routes/               # API endpoints (auth, predict)
│   └── utils/                
│       ├── model.py          # ARIMA, Holt-Winters, and Monte Carlo models
│       ├── scraper.py        # Live Amazon BeautifulSoup scraper
│       └── db_queries.py     # Auto-enrichment queries
│
├── PREDICTION_ENGINE.md      # Detailed documentation of the AI pipeline
└── README.md                 # Project overview
```

---

## ⚙️ Installation & Setup

### 1. Database Setup
Ensure you have MySQL running locally. Create a database for the project (e.g., `pricecast_db`).

### 2. Backend Setup

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pricecast_db
JWT_SECRET_KEY=your_super_secret_jwt_key
```

Run the backend server:
```bash
python app.py
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 📊 Model & Evaluation Metrics

The engine automatically evaluates itself using Time-Series Cross-Validation (Sliding Window):
* **MAE (Mean Absolute Error)** → Average prediction error in raw currency.
* **RMSE (Root Mean Squared Error)** → Heavily penalizes large deviation errors.
* The frontend visually indicates whether a prediction relies on **Database Data**, **Live Scraped Data**, or **Mixed Data**.

---

## 🔮 Future Improvements

* Add email/SMS push notifications when a product reaches its "Best Buy Day".
* Extend scraper support to other e-commerce platforms (Flipkart, Myntra).
* Introduce global category-level decay rates for the Monte Carlo simulation.

---

## 📌 Author

**Biswajit Adak**  
Aspiring Data Analyst / Data Scientist

---

## ⭐ Support
If you like this project, please give it a ⭐ on GitHub!
