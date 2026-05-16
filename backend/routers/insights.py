from fastapi import APIRouter
from database import get_db
from models.ai_insights import generate_neighborhood_summary

router = APIRouter()

@router.get("/neighborhood/{neighborhood}")
def get_neighborhood_insight(neighborhood: str):
    """Get AI-generated summary for a neighborhood."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.address, p.parcel_id, s.total_score, s.priority_tier, s.ai_explanation
        FROM scored_properties s
        JOIN properties p ON s.parcel_id = p.parcel_id
        WHERE p.neighborhood = ?
        ORDER BY s.total_score DESC
        LIMIT 5
    """, (neighborhood,))
    top = [dict(r) for r in cursor.fetchall()]
    conn.close()

    if not top:
        return {"neighborhood": neighborhood, "summary": "No data available for this neighborhood."}

    summary = generate_neighborhood_summary(neighborhood, top)
    return {"neighborhood": neighborhood, "summary": summary, "top_properties": top}
