import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from services.gemini_service import explain_property
from services.property_service import get_properties

load_dotenv()

app = Flask(__name__)

def _configure_cors(application: Flask) -> None:
    """Apply CORS to all routes (required for Firebase -> Cloud Run)."""
    if os.getenv("CORS_ALLOW_ALL", "").lower() in ("1", "true", "yes"):
        CORS(application)
        return

    origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,https://cherrycolacool.web.app,https://cherrycolacool.firebaseapp.com",
    )
    CORS(
        application,
        origins=[origin.strip() for origin in origins.split(",") if origin.strip()],
    )


_configure_cors(app)


def _parse_bool(value):
    if value is None:
        return None
    return str(value).lower() in ("1", "true", "yes")


def _parse_int(value):
    if value is None or value == "":
        return None
    return int(value)


@app.route("/")
def home():
    return jsonify({"message": "Detroit Blight Prioritizer backend is running"})


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/properties")
def api_properties():
    filters = {
        "address": request.args.get("address"),
        "zip": request.args.get("zip"),
        "score_min": _parse_int(request.args.get("score_min")),
        "score_max": _parse_int(request.args.get("score_max")),
        "tax_delinquent": _parse_bool(request.args.get("tax_delinquent")),
        "vacant_blight": _parse_bool(request.args.get("vacant_blight")),
    }

    limit_arg = request.args.get("limit")
    limit = _parse_int(limit_arg) if limit_arg is not None else 3000
    if limit_arg == "0" or limit_arg == "all":
        limit = None

    try:
        properties = get_properties(filters=filters, limit=limit)
    except FileNotFoundError as exc:
        return jsonify({"error": str(exc)}), 503

    return jsonify(properties)


@app.route("/api/ai/explain", methods=["POST"])
def api_ai_explain():
    body = request.get_json(silent=True) or {}
    property_data = body.get("property") or body
    if not property_data.get("address"):
        return jsonify({"error": "property object with address is required"}), 400

    result = explain_property(property_data)
    return jsonify(result)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    debug = os.getenv("FLASK_DEBUG", "false").lower() in ("1", "true", "yes")
    app.run(debug=debug, host="0.0.0.0", port=port)
