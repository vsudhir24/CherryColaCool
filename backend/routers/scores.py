from fastapi import APIRouter, BackgroundTasks
from database import get_db
from models.scoring import score_property, score_all_properties
from models.ai_insights import generate_explanation
from datetime import datetime

router = APIRouter()

@router.post("/run")
def run_scoring(background_tasks: BackgroundTasks):
    """Trigger scoring for all properties."""
    background_tasks.add_task(_score_and_store_all)
    return {"message": "Scoring started in background"}

@router.post("/{parcel_id}")
def score_single(parcel_id: str):
    """Score a single property and store result."""
    result = score_property(parcel_id)
    explanation = generate_explanation(parcel_id, result)
    _store_score(result, explanation)
    return {**result, "ai_explanation": explanation}

@router.get("/top")
def get_top_properties(limit: int = 20):
    """Get top priority properties."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.address, p.neighborhood, p.latitude, p.longitude,
               s.total_score, s.priority_tier, s.ai_explanation, s.parcel_id
        FROM scored_properties s
        JOIN properties p ON s.parcel_id = p.parcel_id
        ORDER BY s.total_score DESC
        LIMIT ?
    """, (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"top_properties": rows}

@router.get("/stats")
def get_stats():
    """Get aggregate stats for the dashboard."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM properties")
    total = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT priority_tier, COUNT(*) as count
        FROM scored_properties
        GROUP BY priority_tier
    """)
    tiers = {r["priority_tier"]: r["count"] for r in cursor.fetchall()}

    cursor.execute("""
        SELECT neighborhood, COUNT(*) as count, AVG(total_score) as avg_score
        FROM scored_properties s
        JOIN properties p ON s.parcel_id = p.parcel_id
        GROUP BY neighborhood
        ORDER BY avg_score DESC
        LIMIT 10
    """)
    neighborhoods = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {
        "total_properties": total,
        "by_tier": tiers,
        "top_neighborhoods": neighborhoods,
    }

def _store_score(result: dict, explanation: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO scored_properties
        (parcel_id, blight_score, vacancy_score, tax_score, complaint_score,
         total_score, priority_tier, ai_explanation, scored_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        result["parcel_id"], result["blight_score"], result["vacancy_score"],
        result["tax_score"], result["complaint_score"], result["total_score"],
        result["priority_tier"], explanation, datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()

def _score_and_store_all():
    results = score_all_properties()
    for result in results:
        explanation = generate_explanation(result["parcel_id"], result)
        _store_score(result, explanation)
    print(f"Scored {len(results)} properties.")
