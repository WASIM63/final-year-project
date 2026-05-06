import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.arima.model import ARIMA
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=RuntimeWarning)


# ---------------------------------------------------------------------------
#  Holt-Winters (Exponential Smoothing) Model
# ---------------------------------------------------------------------------

def _fit_holt_winters(series_log, n):
    """Fit the best Holt-Winters model with auto-selected seasonality."""
    best_model = None
    best_aic = float("inf")

    configs = []

    if n >= 14:
        configs += [
            {"trend": "add", "seasonal": "add", "seasonal_periods": 7},
            {"trend": "add", "seasonal": "mul", "seasonal_periods": 7},
        ]

    configs += [
        {"trend": "add", "seasonal": None, "seasonal_periods": None},
        {"trend": "mul", "seasonal": None, "seasonal_periods": None},
    ]

    for cfg in configs:
        try:
            model = ExponentialSmoothing(
                series_log,
                trend=cfg["trend"],
                seasonal=cfg["seasonal"],
                seasonal_periods=cfg["seasonal_periods"],
                initialization_method="estimated",
            ).fit(optimized=True)

            if model.aic < best_aic:
                best_aic = model.aic
                best_model = model
        except Exception:
            continue

    # Ultimate fallback
    if best_model is None:
        best_model = ExponentialSmoothing(
            series_log,
            trend="add",
            seasonal=None,
            initialization_method="estimated",
        ).fit(optimized=True)

    return best_model


# ---------------------------------------------------------------------------
#  ARIMA Model
# ---------------------------------------------------------------------------

def _fit_arima(series_log, n):
    """Fit the best ARIMA model by trying common (p,d,q) combinations."""
    best_model = None
    best_aic = float("inf")

    # Common ARIMA orders to try
    orders = [
        (1, 1, 1),
        (2, 1, 1),
        (1, 1, 2),
        (2, 1, 2),
        (1, 0, 1),
        (0, 1, 1),
        (1, 1, 0),
    ]

    # Limit complexity for small datasets
    if n < 20:
        orders = [(1, 1, 1), (1, 0, 1), (0, 1, 1)]

    for order in orders:
        try:
            model = ARIMA(series_log, order=order).fit()
            if model.aic < best_aic:
                best_aic = model.aic
                best_model = model
        except Exception:
            continue

    return best_model


# ---------------------------------------------------------------------------
#  Public API: Training
# ---------------------------------------------------------------------------

def train_model(df):
    """Train an ensemble of Holt-Winters + ARIMA on preprocessed price data.

    Returns a dict containing both models and metadata.
    """
    series = df["price"].copy()
    n = len(series)

    # Log transform for stability
    series_log = np.log(series)

    result = {
        "hw_model": None,
        "arima_model": None,
        "n": n,
        "use_ensemble": False,
    }

    # Always try Holt-Winters (works with 5+ points)
    if n >= 5:
        result["hw_model"] = _fit_holt_winters(series_log, n)

    # Add ARIMA for ensemble when we have enough data
    if n >= 10:
        result["arima_model"] = _fit_arima(series_log, n)

    # Use ensemble if both models succeeded
    result["use_ensemble"] = result["hw_model"] is not None and result["arima_model"] is not None

    return result


# ---------------------------------------------------------------------------
#  Public API: Forecasting
# ---------------------------------------------------------------------------

def make_forecast(model_dict, df):
    """Generate 30-day price forecast with confidence intervals.

    Uses weighted ensemble of Holt-Winters + ARIMA when available.
    Returns a DataFrame with columns: ds, yhat, yhat_lower, yhat_upper.
    """
    n = model_dict["n"]
    hw = model_dict["hw_model"]
    arima = model_dict["arima_model"]
    use_ensemble = model_dict["use_ensemble"]

    # Build future dates
    last_date = df.index[-1]
    future_dates = pd.date_range(
        start=last_date + pd.Timedelta(days=1), periods=30, freq="D"
    )

    if use_ensemble:
        # -- Ensemble: weighted average of HW and ARIMA --
        hw_forecast_log = hw.forecast(30)
        arima_forecast_obj = arima.get_forecast(steps=30)
        arima_forecast_log = arima_forecast_obj.predicted_mean

        # Weight: HW 0.4, ARIMA 0.6 (ARIMA typically better for trends)
        hw_weight = 0.4
        arima_weight = 0.6
        ensemble_log = hw_weight * hw_forecast_log.values + arima_weight * arima_forecast_log.values

        forecast_values = np.exp(ensemble_log)

        # Confidence intervals from ARIMA (more reliable)
        ci = arima_forecast_obj.conf_int(alpha=0.1)  # 90% CI
        lower = np.exp(ci.iloc[:, 0].values)
        upper = np.exp(ci.iloc[:, 1].values)

    elif hw is not None:
        # -- Holt-Winters only --
        hw_forecast_log = hw.forecast(30)
        forecast_values = np.exp(hw_forecast_log.values)

        # Estimate CI from residuals
        residuals = hw.resid
        std_resid = np.std(residuals)
        lower = np.exp(hw_forecast_log.values - 1.645 * std_resid)
        upper = np.exp(hw_forecast_log.values + 1.645 * std_resid)

    else:
        # Should not reach here (handled by caller), but safety net
        last_price = float(df["price"].iloc[-1])
        forecast_values = np.full(30, last_price)
        lower = np.full(30, last_price * 0.95)
        upper = np.full(30, last_price * 1.05)

    # Safety: clip negatives
    forecast_values = np.clip(forecast_values, 0, None)
    lower = np.clip(lower, 0, None)
    upper = np.clip(upper, 0, None)

    forecast_df = pd.DataFrame({
        "ds": future_dates,
        "yhat": forecast_values,
        "yhat_lower": lower,
        "yhat_upper": upper,
    })

    return forecast_df


# ---------------------------------------------------------------------------
#  Public API: Simple/Fallback Forecasters
# ---------------------------------------------------------------------------

def simple_trend_forecast(df):
    """Linear extrapolation forecast for products with 2-4 data points.

    Returns a DataFrame with columns: ds, yhat, yhat_lower, yhat_upper.
    """
    series = df["price"].copy()
    n = len(series)

    # Fit a simple linear regression on day index
    x = np.arange(n, dtype=float)
    y = series.values.astype(float)

    slope, intercept = np.polyfit(x, y, 1)
    residual_std = np.std(y - (slope * x + intercept))

    # Forecast
    last_date = df.index[-1]
    future_dates = pd.date_range(
        start=last_date + pd.Timedelta(days=1), periods=30, freq="D"
    )

    future_x = np.arange(n, n + 30, dtype=float)
    predictions = slope * future_x + intercept
    predictions = np.clip(predictions, 0, None)

    # Wider confidence intervals for fewer data points
    ci_multiplier = max(2.0, 4.0 - n * 0.5)  # wider for fewer points
    lower = np.clip(predictions - ci_multiplier * max(residual_std, predictions.mean() * 0.03), 0, None)
    upper = predictions + ci_multiplier * max(residual_std, predictions.mean() * 0.03)

    return pd.DataFrame({
        "ds": future_dates,
        "yhat": predictions,
        "yhat_lower": lower,
        "yhat_upper": upper,
    })


def stochastic_forecast(current_price, list_price=None):
    """Generate a realistic 30-day price forecast from a single price point.

    Uses Monte Carlo simulation with:
    - Real Amazon List Price (if scraped) as upper bound and mean reversion anchor
    - Geometric Brownian Motion (GBM) for price dynamics
    - Amazon-specific volatility (~5-8% monthly)
    - Weekly seasonality (mid-week dips, weekend rises)

    Runs multiple simulations and returns the median path with CI.
    Returns a DataFrame with columns: ds, yhat, yhat_lower, yhat_upper.
    """
    today = pd.Timestamp.now().normalize()
    future_dates = pd.date_range(start=today + pd.Timedelta(days=1), periods=30, freq="D")

    n_simulations = 500
    n_days = 30

    # Amazon product price parameters
    # Daily volatility: ~1-2% (annualized ~15-30%, typical for consumer goods)
    daily_volatility = 0.012
    # Slight downward drift (Amazon prices tend to decrease over time due to competition)
    daily_drift = -0.0005
    # Mean reversion speed
    mean_reversion = 0.03

    # If we have a list price, use it to establish realistic bounds
    if list_price and list_price > current_price:
        anchor_price = current_price + (list_price - current_price) * 0.3  # Anchor slightly above current
        upper_bound = list_price
        lower_bound = current_price * 0.7  # 30% drop max
        # If deeply discounted, higher chance it reverts upward
        daily_drift = 0.001 if (list_price - current_price) / list_price > 0.2 else -0.0005
    else:
        anchor_price = current_price
        upper_bound = current_price * 1.5
        lower_bound = current_price * 0.5

    # Weekly seasonality pattern (relative adjustments)
    # Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
    weekly_pattern = {
        0: -0.003,   # Monday: slight dip
        1: -0.005,   # Tuesday: lowest (best deals)
        2: -0.004,   # Wednesday: still low
        3: -0.001,   # Thursday: recovering
        4:  0.003,    # Friday: rising for weekend
        5:  0.005,    # Saturday: peak
        6:  0.004,    # Sunday: still high
    }

    # Run simulations
    np.random.seed(None)  # Random seed for variety
    all_paths = np.zeros((n_simulations, n_days))

    for sim in range(n_simulations):
        price = current_price
        for day in range(n_days):
            # Day of week for seasonality
            day_of_week = future_dates[day].dayofweek
            seasonal_adj = weekly_pattern.get(day_of_week, 0)

            # Mean reversion toward anchor price
            reversion = mean_reversion * (np.log(anchor_price) - np.log(price))

            # GBM step: dS/S = (drift + reversion + seasonal) * dt + volatility * dW
            random_shock = np.random.normal(0, 1)
            daily_return = daily_drift + reversion + seasonal_adj + daily_volatility * random_shock

            price = price * np.exp(daily_return)
            # Floor/Cap using real Amazon bounds
            price = np.clip(price, lower_bound, upper_bound)

            all_paths[sim, day] = price

    # Aggregate simulations
    yhat = np.median(all_paths, axis=0)          # Median path
    yhat_lower = np.percentile(all_paths, 5, axis=0)   # 5th percentile (lower CI)
    yhat_upper = np.percentile(all_paths, 95, axis=0)  # 95th percentile (upper CI)

    return pd.DataFrame({
        "ds": future_dates,
        "yhat": yhat,
        "yhat_lower": yhat_lower,
        "yhat_upper": yhat_upper,
    })


# ---------------------------------------------------------------------------
#  Public API: Evaluation
# ---------------------------------------------------------------------------

def evaluate_model(df):
    """Evaluate model using time-series cross-validation.

    Uses a sliding window approach for more robust metrics.
    Returns (mae, rmse).
    """
    series = df["price"].copy()
    n = len(series)

    if n < 8:
        # Not enough data for cross-validation, use simple split
        return _simple_evaluate(series)

    # Time-series cross-validation with 3 folds
    fold_size = max(3, n // 5)
    min_train = max(5, n // 3)

    all_actual = []
    all_predicted = []

    n_folds = min(3, (n - min_train) // fold_size)
    if n_folds < 1:
        return _simple_evaluate(series)

    for i in range(n_folds):
        test_end = n - i * fold_size
        test_start = test_end - fold_size
        if test_start < min_train:
            break

        train = series[:test_start]
        test = series[test_start:test_end]

        try:
            train_log = np.log(train)

            if len(train) >= 14:
                model = ExponentialSmoothing(
                    train_log, trend="add", seasonal="add",
                    seasonal_periods=7, initialization_method="estimated",
                ).fit(optimized=True)
            else:
                model = ExponentialSmoothing(
                    train_log, trend="add", seasonal=None,
                    initialization_method="estimated",
                ).fit(optimized=True)

            preds = np.exp(model.forecast(len(test)))
            all_actual.extend(test.values)
            all_predicted.extend(preds.values)

        except Exception:
            continue

    if len(all_actual) < 2:
        return _simple_evaluate(series)

    mae = mean_absolute_error(all_actual, all_predicted)
    rmse = np.sqrt(mean_squared_error(all_actual, all_predicted))

    return mae, rmse


def _simple_evaluate(series):
    """Simple 80/20 split evaluation fallback."""
    n = len(series)
    train_size = int(n * 0.8)

    if train_size < 4:
        return 0.0, 0.0

    train = series[:train_size]
    test = series[train_size:]

    try:
        train_log = np.log(train)

        model = ExponentialSmoothing(
            train_log, trend="add", seasonal=None,
            initialization_method="estimated",
        ).fit(optimized=True)

        preds = np.exp(model.forecast(len(test)))
        mae = mean_absolute_error(test.values, preds.values)
        rmse = np.sqrt(mean_squared_error(test.values, preds.values))

        return mae, rmse

    except Exception:
        return 0.0, 0.0
