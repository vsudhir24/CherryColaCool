from flask import Flask, jsonify, request
from flask_cors import CORS

from services.property_service import get_properties

app = Flask(__name__)
CORS(app)


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


if __name__ == "__main__":
    app.run(debug=True, port=8000)
