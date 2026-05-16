import anthropic
import json
from database import get_db

client = anthropic.Anthropic()  # uses ANTHROPIC_API_KEY env var

def build_property_context(parcel_id: str) -> dict:
    """Pull all relevant data for a property to send to Claude."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM properties WHERE parcel_id = ?", (parcel_id,))
    prop = dict(cursor.fetchone() or {})

    cursor.execute("""
        SELECT violation_code, description, fine_amount, violation_date, status
        FROM blight_violations WHERE parcel_id = ?
        ORDER BY violation_date DESC LIMIT 10
    """, (parcel_id,))
    violations = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT complaint_text, complaint_date FROM complaints
        WHERE parcel_id = ? ORDER BY complaint_date DESC LIMIT 5
    """, (parcel_id,))
    complaints = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM scored_properties WHERE parcel_id = ?", (parcel_id,))
    scores = dict(cursor.fetchone() or {})

    conn.close()

    return {
        "property": prop,
        "violations": violations,
        "complaints": complaints,
        "scores": scores,
    }

def generate_explanation(parcel_id: str, score_data: dict) -> str:
    """Use Claude to generate a human-readable explanation for why a property scored high."""
    context = build_property_context(parcel_id)

    prompt = f"""You are an urban planning AI assistant helping Detroit city officials prioritize vacant and blighted properties for intervention.

Here is the data for property {parcel_id}:

Address: {context['property'].get('address', 'Unknown')}
Neighborhood: {context['property'].get('neighborhood', 'Unknown')}
Vacancy Status: {context['property'].get('vacancy_status', 'Unknown')}
Vacant Since: {context['property'].get('vacancy_since', 'Unknown')}
Tax Delinquent: {context['property'].get('tax_delinquent', False)}
Years Delinquent: {context['property'].get('years_delinquent', 0)}

Priority Score: {score_data.get('total_score', 0)} / 1.0
Priority Tier: {score_data.get('priority_tier', 'UNKNOWN')}

Score Breakdown:
- Blight Violations Score: {score_data.get('blight_score', 0)}
- Vacancy Duration Score: {score_data.get('vacancy_score', 0)}
- Tax Delinquency Score: {score_data.get('tax_score', 0)}
- Community Complaints Score: {score_data.get('complaint_score', 0)}

Recent Blight Violations:
{json.dumps(context['violations'], indent=2) if context['violations'] else 'None on record'}

Recent Community Complaints:
{json.dumps(context['complaints'], indent=2) if context['complaints'] else 'None on record'}

Write a clear, 3-4 sentence explanation for a city official explaining:
1. Why this property received this priority tier
2. What the most urgent issues are
3. What type of intervention is recommended (demolition, rehabilitation, land bank sale, etc.)

Be specific, concise, and actionable. Do not use jargon."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )

    return message.content[0].text

def generate_neighborhood_summary(neighborhood: str, top_properties: list) -> str:
    """Generate a neighborhood-level summary for the dashboard."""
    prompt = f"""You are an urban planning AI assistant. Summarize the blight situation in the {neighborhood} neighborhood of Detroit based on these top priority properties:

{json.dumps(top_properties[:5], indent=2)}

Write 2-3 sentences summarizing the key patterns and what the city should prioritize in this neighborhood. Be specific and actionable."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}]
    )

    return message.content[0].text
