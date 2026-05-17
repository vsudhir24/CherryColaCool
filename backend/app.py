from flask import Flask, jsonify
from flask_cors import CORS
from services.scoring_model import calculate_priority_score

app = Flask(__name__)
CORS(app)

sample_properties = [
    {
        "id": 1,
        "address": "1234 Gratiot Ave",
        "lat": 42.3505,
        "lng": -83.0372,
        "vacant": True,
        "blight_violations": 5,
        "tax_delinquent_years": 3,
    },
    {
        "id": 2,
        "address": "2200 Michigan Ave",
        "lat": 42.3314,
        "lng": -83.0739,
        "vacant": True,
        "blight_violations": 2,
        "tax_delinquent_years": 1,
    }
]

for property in sample_properties:
    property["priority_score"] = calculate_priority_score(property)
    
@app.route("/")
def home():
    return jsonify({"message": "Detroit Blight Prioritizer backend is running"})

@app.route("/properties")
def get_properties():
    return jsonify(sample_properties)

if __name__ == "__main__":
    app.run(debug=True, port=5000)