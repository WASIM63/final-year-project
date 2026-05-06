# PriceCast AI - Prediction Engine Documentation

This document explains exactly how the PriceCast AI prediction pipeline works from start to finish. When a user pastes an Amazon URL and clicks "Predict", a highly sophisticated, multi-stage pipeline is triggered to ensure the most accurate forecast possible.

---

## Stage 1: Live Web Scraping
Instead of relying solely on historical database records, the system always starts by reaching out to Amazon live. 
1. **ASIN Extraction:** The system extracts the unique 10-character Amazon Standard Identification Number (ASIN) from the URL.
2. **Metadata Scraping:** It fetches the product title and high-resolution image.
3. **Current Price Scraping:** Using 12+ different HTML selectors (to handle various Amazon page layouts, deal blocks, and buy boxes), it extracts the exact live price right now.
4. **M.R.P. Extraction:** It also scrapes the "List Price" or "M.R.P." This is critical for establishing the absolute ceiling of what the product is worth, so the model knows how big of a discount is currently active.

## Stage 2: Database Auto-Enrichment (The Learning Loop)
The system is designed to get smarter and more accurate the more you use it.
1. Every time a live price is scraped, it is immediately inserted into the `amazon_products` database table.
2. If multiple users predict the same product on the same day, the system uses "upsert" logic to update the price rather than duplicating it.
3. **Result:** Even if a product had 0 historical data points yesterday, predicting it today gives it 1 data point. Predicting it again tomorrow gives it 2. The training dataset grows automatically without any manual data entry or external cron jobs.

## Stage 3: Data Combination & Preprocessing
1. The system queries the database for all historical prices for the ASIN.
2. Because we just ran Stage 2, this dataset automatically includes the price from exactly *right now*.
3. **Cleaning:** The system removes extreme outliers (glitches in scraping) and resamples the data to a daily frequency, filling in small missing gaps with forward-filling (carrying the last known price forward).

## Stage 4: The Smart Tiered Forecasting Engine
Time-series machine learning models (like ARIMA) require a lot of historical data to work. If you feed them only 2 data points, they crash. To solve this, PriceCast AI uses a "Smart Tiered Pipeline" that automatically selects the best mathematical approach based on exactly how much data is available.

### Tier 1: The Stochastic Simulation (1 Data Point)
*Condition: The product is brand new to the system. We only have the price we just scraped.*
- **Problem:** You can't draw a trend line from a single dot.
- **Solution:** We use **Monte Carlo Simulation** and **Geometric Brownian Motion (GBM)**—the same mathematics used by hedge funds to predict stock market fluctuations.
- **How it works:**
  - We run 500 different parallel simulations of the next 30 days.
  - We apply Amazon-specific daily volatility (prices tend to fluctuate 1-2% a day).
  - We apply a **pseudo-random market drift** seeded by the ASIN. This ensures some new products predict a natural increase in price, and others predict a decrease, avoiding artificial bias.
  - We use the scraped M.R.P. as a hard ceiling.
  - We apply **Mean Reversion**: If the current price is heavily discounted (e.g., 40% off M.R.P.), the math heavily biases the simulation to drift *upward* over the 30 days as the sale ends.
- **Output:** We return the median average of the 500 simulations, plus realistic upper and lower confidence bounds.

### Tier 2: Linear Trend Extrapolation (2 to 4 Data Points)
*Condition: We have very little data, just 2 to 4 days of history.*
- The system plots the points and draws a simple linear regression line (a straight sloped line) into the future.
- Confidence bounds are intentionally set very wide because predicting a 30-day future from 3 days of data is highly uncertain.

### Tier 3: Holt-Winters Exponential Smoothing (5 to 13 Data Points)
*Condition: We have a week or two of data.*
- The system upgrades to the **Holt-Winters model**.
- This model is excellent at understanding short-term "level" and "trend" (is the price generally going up or down).
- It applies a 90% confidence interval based on the mathematical residuals of the training data.

### Tier 4: The ML Ensemble Model (14+ Data Points)
*Condition: We have plenty of data.*
- The system fires up its heaviest machinery: An **Ensemble Model**.
- It trains two separate models simultaneously:
  1. **Holt-Winters (Auto-tuned):** It tests multiple configurations (additive vs. multiplicative seasonality) and picks the one with the lowest error rate.
  2. **ARIMA (Auto-Regressive Integrated Moving Average):** It tests 7 different complex moving-average configurations and picks the best one.
- **The Merge:** It takes the forecast from both models and blends them together (typically weighting ARIMA slightly higher at 60% and Holt-Winters at 40%). This gives the ultimate, highly-accurate prediction curve.

## Stage 5: Holiday & Sale Event Injection (Post-Processing)
Once the mathematical forecast curve is generated (regardless of which Tier was used), the system passes the curve through the `apply_sale_events` logic.
- It checks the next 30 forecasted days against a massive calendar of known major Amazon sales and festivals, including:
  - **Republic Day Sale** (Late Jan)
  - **Valentine's Day Sale** (Mid Feb)
  - **Holi Sale** (Early March)
  - **Eid Festive Sales** (March / May)
  - **Summer Sale** (Early May)
  - **Prime Day** (Mid July)
  - **Independence Sale & Raksha Bandhan** (August)
  - **Great Indian Festival & Dussehra** (October)
  - **Diwali Sale & Black Friday** (November)
  - **Year End Sale** (Late Dec)
- If the forecast overlaps with any of these sale windows, the system forces a realistic "dip" in the predicted price.
- It is intelligent enough to look at the M.R.P.: If the product is already 50% off, the sale dip will be tiny. If it's currently full price, the sale dip will be huge (10-15%).

## Stage 6: Frontend Delivery
Finally, the system packages all this up and sends it to the Next.js frontend.
- It calculates the absolute lowest predicted price day (the "Best Buy Day").
- It calculates the Mean Absolute Error (MAE) and Root Mean Square Error (RMSE) using a sliding-window cross-validation technique to tell the user how accurate the model thinks it is.
- It attaches a `data_source` tag (`scraped`, `database`, or `mixed`) so the frontend can display the appropriate color-coded badge.
- The Recharts library on the frontend renders the historical curve, the future forecast curve, and draws shaded areas behind the line to represent the 90% confidence intervals calculated during the ML stages.
