import json
import pandas as pd
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.asin_extractor import extract_asin
from utils.db_queries import fetch_price_data, insert_scraped_price
from utils.preprocess import preprocess
from utils.model import (
    train_model, make_forecast, evaluate_model,
    simple_trend_forecast, stochastic_forecast, apply_sale_events
)
from utils.scraper import get_full_product_data
from db import get_db_connection

predict_bp = Blueprint("predict", __name__, url_prefix="/api")


def _build_response_data(forecast_df, df_processed, data_source, current_price=None):
    """Build the standard response payload from forecast + historical data."""
    forecast_df = forecast_df.copy()
    forecast_df["ds"] = pd.to_datetime(forecast_df["ds"], errors="coerce")
    forecast_df["yhat"] = pd.to_numeric(forecast_df["yhat"], errors="coerce")
    forecast_df["yhat_lower"] = pd.to_numeric(forecast_df["yhat_lower"], errors="coerce")
    forecast_df["yhat_upper"] = pd.to_numeric(forecast_df["yhat_upper"], errors="coerce")
    forecast_df = forecast_df.dropna(subset=["ds", "yhat", "yhat_lower", "yhat_upper"])

    if forecast_df.empty:
        raise ValueError("Forecast contains no valid numeric output.")

    forecast_list = []
    for _, row in forecast_df.iterrows():
        forecast_list.append({
            "date": row["ds"].strftime("%Y-%m-%d"),
            "price": round(float(row["yhat"]), 2),
            "price_lower": round(float(row["yhat_lower"]), 2),
            "price_upper": round(float(row["yhat_upper"]), 2),
        })

    historical_list = []
    for idx, row in df_processed.iterrows():
        if pd.isna(idx):
            continue
        historical_list.append({
            "date": pd.to_datetime(idx, errors="coerce").strftime("%Y-%m-%d"),
            "price": round(float(row["price"]), 2),
        })

    best_day_row = forecast_df.loc[forecast_df["yhat"].idxmin()]
    best_day = {
        "date": best_day_row["ds"].strftime("%Y-%m-%d"),
        "price": round(float(best_day_row["yhat"]), 2),
    }

    if current_price is not None:
        try:
            current_price_value = float(current_price)
            today = pd.Timestamp.now().normalize().strftime("%Y-%m-%d")
            if current_price_value <= best_day["price"]:
                best_day = {
                    "date": today,
                    "price": round(current_price_value, 2),
                }
        except (TypeError, ValueError):
            pass

    trend = (
        "increasing"
        if forecast_df["yhat"].iloc[-1] > forecast_df["yhat"].iloc[0]
        else "decreasing"
    )

    return forecast_list, historical_list, best_day, trend


@predict_bp.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    """
    Smart prediction pipeline:
    1. Extract ASIN from URL
    2. Scrape product title, image, AND current price from Amazon
    3. Store scraped price in DB (auto-grow training data)
    4. Fetch historical price data from DB
    5. Choose prediction strategy based on data volume:
       - 0 points + no scrape: Error
       - 1 point: Flat estimate with wide CI
       - 2-4 points: Linear trend extrapolation
       - 5-13 points: Holt-Winters model
       - 14+ points: Ensemble (Holt-Winters + ARIMA)
    6. Return results with confidence intervals
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    url = data.get("url", "").strip()

    if not url:
        return jsonify({"error": "Amazon product URL is required"}), 400

    # Step 1: Extract ASIN
    asin = extract_asin(url)
    if not asin:
        return jsonify({"error": "Invalid Amazon URL. Could not extract ASIN."}), 400

    # Step 2: Scrape product info + current price + list price
    product_title, product_image_url, current_price, list_price = get_full_product_data(url)

    # Step 3: Store scraped price in DB (enriches training data)
    if current_price:
        insert_scraped_price(asin, current_price)

    # Step 4: Fetch historical data (now includes freshly scraped price)
    df = fetch_price_data(asin)

    try:
        # Determine data availability
        has_db_data = not df.empty
        has_scraped_price = current_price is not None

        data_source = "none"

        if has_db_data and has_scraped_price:
            data_source = "mixed"
        elif has_db_data:
            data_source = "database"
        elif has_scraped_price:
            data_source = "scraped"

        # =========================================================
        # CASE 0: No data at all
        # =========================================================
        if not has_db_data and not has_scraped_price:
            return jsonify({
                "error": (
                    f"No price data found for ASIN: {asin}. "
                    "Amazon may have blocked the price scraper. "
                    "Please try again later or ensure this product exists in the database."
                )
            }), 404

        # =========================================================
        # CASE 1: Only scraped current price (no DB history)
        # =========================================================
        if not has_db_data and has_scraped_price:
            import pandas as pd
            from datetime import datetime

            # Create minimal df for response
            today = pd.Timestamp.now().normalize()
            df_processed = pd.DataFrame(
                {"price": [current_price]},
                index=pd.DatetimeIndex([today], name="scrape_date"),
            )

            forecast_df = stochastic_forecast(current_price, list_price, asin)
            forecast_df = apply_sale_events(forecast_df, current_price, list_price)
            forecast_list, historical_list, best_day, trend = _build_response_data(
                forecast_df, df_processed, data_source, current_price=current_price
            )

            # Save prediction
            prediction_id = _save_prediction(
                user_id, asin, url, product_title, product_image_url,
                forecast_list, historical_list, best_day, trend,
                0.0, 0.0, data_source,
            )

            return jsonify({
                "id": prediction_id,
                "asin": asin,
                "product_title": product_title,
                "product_image_url": product_image_url,
                "forecast": forecast_list,
                "historical": historical_list,
                "best_day": best_day,
                "trend": trend,
                "data_source": data_source,
                "metrics": {"mae": 0.0, "rmse": 0.0},
                "message": (
                    "Limited data: only current price was available. "
                    "Showing a stochastic simulation. Run predictions daily to build real training data."
                ),
            }), 200

        # =========================================================
        # CASE 2+: We have DB data — preprocess it
        # =========================================================
        df_processed = preprocess(df)
        n_points = len(df_processed)

        if n_points < 2:
            # After preprocessing, if only 1 valid point remains
            last_price = float(df_processed["price"].iloc[0]) if n_points == 1 else current_price or 0
            if last_price <= 0:
                return jsonify({"error": "Not enough valid data points after cleaning"}), 400

            df_p = df_processed if n_points == 1 else pd.DataFrame(
                {"price": [last_price]},
                index=pd.DatetimeIndex([pd.Timestamp.now().normalize()], name="scrape_date"),
            )
            forecast_df = stochastic_forecast(last_price, list_price, asin)
            forecast_df = apply_sale_events(forecast_df, last_price, list_price)
            forecast_list, historical_list, best_day, trend = _build_response_data(
                forecast_df, df_p, data_source, current_price=last_price
            )

            prediction_id = _save_prediction(
                user_id, asin, url, product_title, product_image_url,
                forecast_list, historical_list, best_day, trend,
                0.0, 0.0, data_source,
            )

            return jsonify({
                "id": prediction_id,
                "asin": asin,
                "product_title": product_title,
                "product_image_url": product_image_url,
                "forecast": forecast_list,
                "historical": historical_list,
                "best_day": best_day,
                "trend": trend,
                "data_source": data_source,
                "metrics": {"mae": 0.0, "rmse": 0.0},
                "message": "Limited data. Showing a stochastic simulation. Forecast will improve as more price data is collected.",
            }), 200

        # =========================================================
        # CASE 3: 2-4 data points — linear trend
        # =========================================================
        if n_points < 5:
            forecast_df = simple_trend_forecast(df_processed)
            forecast_df = apply_sale_events(forecast_df, float(df_processed["price"].iloc[-1]), list_price)
            forecast_list, historical_list, best_day, trend = _build_response_data(
                forecast_df, df_processed, data_source, current_price=current_price
            )

            prediction_id = _save_prediction(
                user_id, asin, url, product_title, product_image_url,
                forecast_list, historical_list, best_day, trend,
                0.0, 0.0, data_source,
            )

            return jsonify({
                "id": prediction_id,
                "asin": asin,
                "product_title": product_title,
                "product_image_url": product_image_url,
                "forecast": forecast_list,
                "historical": historical_list,
                "best_day": best_day,
                "trend": trend,
                "data_source": data_source,
                "metrics": {"mae": 0.0, "rmse": 0.0},
                "message": (
                    f"Using linear trend with {n_points} data points. "
                    "Accuracy improves significantly with 14+ days of data."
                ),
            }), 200

        # =========================================================
        # CASE 4: 5+ data points — full ML pipeline
        # =========================================================
        model = train_model(df_processed)
        forecast_df = make_forecast(model, df_processed, current_price=current_price)
        forecast_df = apply_sale_events(forecast_df, float(df_processed["price"].iloc[-1]), list_price)
        mae, rmse = evaluate_model(df_processed)

        forecast_list, historical_list, best_day, trend = _build_response_data(
            forecast_df, df_processed, data_source, current_price=current_price
        )

        # Build descriptive message
        model_type = "Ensemble (Holt-Winters + ARIMA)" if model["use_ensemble"] else "Holt-Winters"
        message = f"Model: {model_type} | {n_points} data points"

        prediction_id = _save_prediction(
            user_id, asin, url, product_title, product_image_url,
            forecast_list, historical_list, best_day, trend,
            round(float(mae), 4), round(float(rmse), 4), data_source,
        )

        return jsonify({
            "id": prediction_id,
            "asin": asin,
            "product_title": product_title,
            "product_image_url": product_image_url,
            "forecast": forecast_list,
            "historical": historical_list,
            "best_day": best_day,
            "trend": trend,
            "data_source": data_source,
            "metrics": {
                "mae": round(float(mae), 4),
                "rmse": round(float(rmse), 4),
            },
            "message": message,
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


def _save_prediction(user_id, asin, url, product_title, product_image_url,
                     forecast_list, historical_list, best_day, trend,
                     mae, rmse, data_source):
    """Save a prediction record to the database. Returns the prediction ID."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO predictions 
        (user_id, asin, amazon_url, product_title, product_image_url,
         forecast_data, historical_data,
         best_day_date, best_day_price, trend, mae, rmse, data_source)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            user_id, asin, url, product_title, product_image_url,
            json.dumps(forecast_list), json.dumps(historical_list),
            best_day["date"], best_day["price"], trend,
            mae, rmse, data_source,
        ),
    )
    conn.commit()
    prediction_id = cursor.lastrowid
    cursor.close()
    conn.close()

    return prediction_id


@predict_bp.route("/predictions", methods=["GET"])
@jwt_required()
def get_predictions():
    """Get all predictions for the current user."""
    user_id = get_jwt_identity()

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT id, asin, amazon_url, product_title, product_image_url,
                   best_day_date, best_day_price,
                   trend, mae, rmse, data_source, created_at
            FROM predictions
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        predictions = cursor.fetchall()

        for p in predictions:
            if p["best_day_date"]:
                p["best_day_date"] = p["best_day_date"].isoformat()
            if p["created_at"]:
                p["created_at"] = p["created_at"].isoformat()
            if p["best_day_price"]:
                p["best_day_price"] = float(p["best_day_price"])
            if p["mae"]:
                p["mae"] = float(p["mae"])
            if p["rmse"]:
                p["rmse"] = float(p["rmse"])

        return jsonify({"predictions": predictions}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@predict_bp.route("/predictions/<int:prediction_id>", methods=["GET"])
@jwt_required()
def get_prediction(prediction_id):
    """Get a single prediction with full forecast and historical data."""
    user_id = get_jwt_identity()

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT * FROM predictions
            WHERE id = %s AND user_id = %s
            """,
            (prediction_id, user_id),
        )
        prediction = cursor.fetchone()

        if not prediction:
            return jsonify({"error": "Prediction not found"}), 404

        if prediction["best_day_date"]:
            prediction["best_day_date"] = prediction["best_day_date"].isoformat()
        if prediction["created_at"]:
            prediction["created_at"] = prediction["created_at"].isoformat()
        if prediction["best_day_price"]:
            prediction["best_day_price"] = float(prediction["best_day_price"])
        if prediction["mae"]:
            prediction["mae"] = float(prediction["mae"])
        if prediction["rmse"]:
            prediction["rmse"] = float(prediction["rmse"])

        if isinstance(prediction["forecast_data"], str):
            prediction["forecast_data"] = json.loads(prediction["forecast_data"])
        if isinstance(prediction["historical_data"], str):
            prediction["historical_data"] = json.loads(prediction["historical_data"])

        return jsonify({"prediction": prediction}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@predict_bp.route("/predictions/<int:prediction_id>", methods=["DELETE"])
@jwt_required()
def delete_prediction(prediction_id):
    """Delete a prediction."""
    user_id = get_jwt_identity()

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "DELETE FROM predictions WHERE id = %s AND user_id = %s",
            (prediction_id, user_id),
        )
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Prediction not found"}), 404

        return jsonify({"message": "Prediction deleted successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
