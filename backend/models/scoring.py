import sqlite3
from datetime import datetime
from database import get_db

# Weights for each scoring dimension (must sum to 1.0)
WEIGHTS = {
    "blight_violations": 0.35,
    "vacancy_duration": 0.25,
    "tax_delinquency": 0.25,
    "complaint_volume": 0.15,
}

def score_blight_violations(parcel_id: str, conn) -> float:
    """Score based on number and severity of blight violations."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) as count, SUM(fine_amount) as total_fines
        FROM blight_violations WHERE parcel_id = ?
    """, (parcel_id,))
    row = cursor.fetchone()
    count = row["count"] or 0
    fines = row["total_fines"] or 0

    # Normalize: cap at 10 violations = max score
    violation_score = min(count / 10.0, 1.0)
    fine_score = min(fines / 5000.0, 1.0)
    return (violation_score * 0.6) + (fine_score * 0.4)

def score_vacancy_duration(parcel_id: str, conn) -> float:
    """Score based on how long the property has been vacant."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT vacancy_since FROM properties WHERE parcel_id = ?
    """, (parcel_id,))
    row = cursor.fetchone()
    if not row or not row["vacancy_since"]:
        return 0.0
    try:
        since = datetime.strptime(row["vacancy_since"], "%Y-%m-%d")
        years = (datetime.now() - since).days / 365.0
        return min(years / 10.0, 1.0)  # Cap at 10 years
    except:
        return 0.0

def score_tax_delinquency(parcel_id: str, conn) -> float:
    """Score based on tax delinquency status and duration."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT tax_delinquent, years_delinquent FROM properties WHERE parcel_id = ?
    """, (parcel_id,))
    row = cursor.fetchone()
    if not row or not row["tax_delinquent"]:
        return 0.0
    return min(row["years_delinquent"] / 5.0, 1.0)  # Cap at 5 years

def score_complaints(parcel_id: str, conn) -> float:
    """Score based on 311 complaint volume."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) as count FROM complaints WHERE parcel_id = ?
    """, (parcel_id,))
    row = cursor.fetchone()
    count = row["count"] or 0
    return min(count / 20.0, 1.0)  # Cap at 20 complaints

def get_priority_tier(score: float) -> str:
    if score >= 0.75:
        return "CRITICAL"
    elif score >= 0.50:
        return "HIGH"
    elif score >= 0.25:
        return "MEDIUM"
    else:
        return "LOW"

def score_property(parcel_id: str) -> dict:
    conn = get_db()
    try:
        blight = score_blight_violations(parcel_id, conn)
        vacancy = score_vacancy_duration(parcel_id, conn)
        tax = score_tax_delinquency(parcel_id, conn)
        complaints = score_complaints(parcel_id, conn)

        total = (
            blight * WEIGHTS["blight_violations"] +
            vacancy * WEIGHTS["vacancy_duration"] +
            tax * WEIGHTS["tax_delinquency"] +
            complaints * WEIGHTS["complaint_volume"]
        )

        return {
            "parcel_id": parcel_id,
            "blight_score": round(blight, 3),
            "vacancy_score": round(vacancy, 3),
            "tax_score": round(tax, 3),
            "complaint_score": round(complaints, 3),
            "total_score": round(total, 3),
            "priority_tier": get_priority_tier(total),
        }
    finally:
        conn.close()

def score_all_properties() -> list:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT parcel_id FROM properties")
    parcels = [row["parcel_id"] for row in cursor.fetchall()]
    conn.close()

    results = []
    for parcel_id in parcels:
        result = score_property(parcel_id)
        results.append(result)

    return sorted(results, key=lambda x: x["total_score"], reverse=True)
