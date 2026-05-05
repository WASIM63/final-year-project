import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.asin_extractor import extract_asin
from utils.db_queries import fetch_price_data
from utils.preprocess import preprocess
from utils.model import train_model, make_forecast, evaluate_model
from db import get_db_connection

predict_bp = Blueprint("predict", __name__, url_prefix="/api")


@predict_bp.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    """
    Accept an Amazon product URL, run the full ML pipeline:
    1. Extract ASIN
    2. Fetch historical price data from MySQL
    3. Preprocess (clean, outlier removal, smoothing)
    4. Train Prophet model
    5. Generate 30-day forecast
    6. Evaluate model (MAE, RMSE)
    7. Save prediction to database
    8. Return results
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

    # Step 2: Fetch historical data
    df = fetch_price_data(asin)
    if df.empty:
        return jsonify({"error": f"No price data found for ASIN: {asin}"}), 404

    try:
        # Step 3: Preprocess
        df_processed = preprocess(df)

        if len(df_processed) < 5:
            return jsonify({"error": "Not enough data points for forecasting (minimum 5 required)"}), 400

        # Step 4: Train model
        model = train_model(df_processed)

        # Step 5: Forecast
        forecast_df = make_forecast(model, df_processed)

        # Step 6: Evaluate
        mae, rmse = evaluate_model(df_processed)

        # Prepare response data
        forecast_list = [
            {"date": row["ds"].strftime("%Y-%m-%d"), "price": round(float(row["yhat"]), 2)}
            for _, row in forecast_df.iterrows()
        ]

        historical_list = [
            {"date": idx.strftime("%Y-%m-%d"), "price": round(float(row["price"]), 2)}
            for idx, row in df_processed.iterrows()
        ]

        # Best buying day
        best_day_row = forecast_df.loc[forecast_df["yhat"].idxmin()]
        best_day = {
            "date": best_day_row["ds"].strftime("%Y-%m-%d"),
            "price": round(float(best_day_row["yhat"]), 2),
        }

        # Trend
        trend = "increasing" if forecast_df["yhat"].iloc[-1] > forecast_df["yhat"].iloc[0] else "decreasing"

        # Step 7: Save prediction to database
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO predictions 
            (user_id, asin, amazon_url, forecast_data, historical_data,
             best_day_date, best_day_price, trend, mae, rmse)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                asin,
                url,
                json.dumps(forecast_list),
                json.dumps(historical_list),
                best_day["date"],
                best_day["price"],
                trend,
                round(float(mae), 4),
                round(float(rmse), 4),
            ),
        )
        conn.commit()
        prediction_id = cursor.lastrowid
        cursor.close()
        conn.close()

        # Step 8: Return results
        return jsonify({
            "id": prediction_id,
            "asin": asin,
            "forecast": forecast_list,
            "historical": historical_list,
            "best_day": best_day,
            "trend": trend,
            "metrics": {
                "mae": round(float(mae), 4),
                "rmse": round(float(rmse), 4),
            },
        }), 200

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


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
            SELECT id, asin, amazon_url, best_day_date, best_day_price,
                   trend, mae, rmse, created_at
            FROM predictions
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,),
        )
        predictions = cursor.fetchall()

        # Serialize dates
        for p in predictions:
            if p["best_day_date"]:
                p["best_day_date"] = p["best_day_date"].isoformat()
            if p["created_at"]:
                p["created_at"] = p["created_at"].isoformat()
            # Convert Decimal types to float
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

        # Serialize
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

        # Parse JSON fields
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
