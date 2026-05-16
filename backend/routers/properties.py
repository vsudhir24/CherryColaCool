from fastapi import APIRouter, HTTPException, Query
from database import get_db
from typing import Optional

router = APIRouter()

@router.get("/")
def get_properties(
    neighborhood: Optional[str] = Query(None),
    priority_tier: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0)
):
    """Get all properties with optional filters, joined with scores."""
    conn = get_db()
    cursor = conn.cursor()

    query = """
        SELECT p.*, s.total_score, s.priority_tier, s.ai_explanation,
               s.blight_score, s.vacancy_score, s.tax_score, s.complaint_score
        FROM properties p
        LEFT JOIN scored_properties s ON p.parcel_id = s.parcel_id
        WHERE 1=1
    """
    params = []

    if neighborhood:
        query += " AND p.neighborhood = ?"
        params.append(neighborhood)
    if priority_tier:
        query += " AND s.priority_tier = ?"
        params.append(priority_tier.upper())

    query += " ORDER BY s.total_score DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"properties": rows, "count": len(rows)}

@router.get("/geojson")
def get_properties_geojson(
    priority_tier: Optional[str] = Query(None),
    neighborhood: Optional[str] = Query(None),
):
    """Return properties as GeoJSON for Mapbox/Deck.gl."""
    conn = get_db()
    cursor = conn.cursor()

    query = """
        SELECT p.parcel_id, p.address, p.neighborhood, p.latitude, p.longitude,
               s.total_score, s.priority_tier, s.ai_explanation
        FROM properties p
        LEFT JOIN scored_properties s ON p.parcel_id = s.parcel_id
        WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
    """
    params = []
    if priority_tier:
        query += " AND s.priority_tier = ?"
        params.append(priority_tier.upper())
    if neighborhood:
        query += " AND p.neighborhood = ?"
        params.append(neighborhood)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    features = []
    for r in rows:
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [r["longitude"], r["latitude"]]},
            "properties": {
                "parcel_id": r["parcel_id"],
                "address": r["address"],
                "neighborhood": r["neighborhood"],
                "total_score": r["total_score"],
                "priority_tier": r["priority_tier"],
                "ai_explanation": r["ai_explanation"],
            }
        })

    return {"type": "FeatureCollection", "features": features}

@router.get("/{parcel_id}")
def get_property(parcel_id: str):
    """Get a single property with full details."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.*, s.total_score, s.priority_tier, s.ai_explanation,
               s.blight_score, s.vacancy_score, s.tax_score, s.complaint_score
        FROM properties p
        LEFT JOIN scored_properties s ON p.parcel_id = s.parcel_id
        WHERE p.parcel_id = ?
    """, (parcel_id,))
    row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Property not found")

    cursor.execute("""
        SELECT * FROM blight_violations WHERE parcel_id = ?
        ORDER BY violation_date DESC
    """, (parcel_id,))
    violations = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT * FROM complaints WHERE parcel_id = ?
        ORDER BY complaint_date DESC
    """, (parcel_id,))
    complaints = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        **dict(row),
        "violations": violations,
        "complaints": complaints,
    }
