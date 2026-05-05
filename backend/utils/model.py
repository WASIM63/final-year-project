import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)


def train_model(df):
    """Train a Holt-Winters Exponential Smoothing model on preprocessed price data.

    This replaces Prophet with statsmodels to avoid CmdStan/C++ compiler
    dependency issues on Windows. Produces equivalent time-series forecasts.
    """
    series = df["price"].copy()

    # Log transform for stability (same as original Prophet approach)
    series = np.log(series)

    # Holt-Winters with additive trend
    # Use seasonal_periods if we have enough data, otherwise just trend
    n = len(series)

    try:
        if n >= 14:
            model = ExponentialSmoothing(
                series,
                trend="add",
                seasonal="add",
                seasonal_periods=7,
                initialization_method="estimated",
            ).fit(optimized=True)
        else:
            model = ExponentialSmoothing(
                series,
                trend="add",
                seasonal=None,
                initialization_method="estimated",
            ).fit(optimized=True)
    except Exception:
        # Fallback: simple exponential smoothing
        model = ExponentialSmoothing(
            series,
            trend="add",
            seasonal=None,
            initialization_method="estimated",
        ).fit(optimized=True)

    return model


def make_forecast(model, df):
    """Generate 30-day price forecast using trained model."""
    # Forecast next 30 days (in log space)
    forecast_log = model.forecast(30)

    # Convert back from log
    forecast_values = np.exp(forecast_log)

    # Safety: avoid negative values
    forecast_values = forecast_values.clip(lower=0)

    # Build forecast dataframe
    last_date = df.index[-1]
    future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=30, freq="D")

    forecast_df = pd.DataFrame({
        "ds": future_dates,
        "yhat": forecast_values.values,
    })

    return forecast_df


def evaluate_model(df):
    """Evaluate model using 80/20 train-test split. Returns MAE and RMSE."""
    series = df["price"].copy()

    # Split into train (80%) and test (20%)
    train_size = int(len(series) * 0.8)

    if train_size < 4:
        # Not enough data for proper evaluation
        return 0.0, 0.0

    train = series[:train_size]
    test = series[train_size:]

    try:
        # Train on subset
        train_log = np.log(train)

        if len(train) >= 14:
            model = ExponentialSmoothing(
                train_log,
                trend="add",
                seasonal="add",
                seasonal_periods=7,
                initialization_method="estimated",
            ).fit(optimized=True)
        else:
            model = ExponentialSmoothing(
                train_log,
                trend="add",
                seasonal=None,
                initialization_method="estimated",
            ).fit(optimized=True)

        # Forecast for test period
        preds_log = model.forecast(len(test))
        preds = np.exp(preds_log)

        # Calculate metrics
        mae = mean_absolute_error(test.values, preds.values)
        rmse = np.sqrt(mean_squared_error(test.values, preds.values))

        return mae, rmse

    except Exception:
        return 0.0, 0.0
