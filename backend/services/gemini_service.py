import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")


def explain_property(property_data: dict) -> dict:
    """
    Return a short natural-language brief for city staff.
    Uses Gemini when configured; otherwise a deterministic fallback.
    """
    if GEMINI_API_KEY:
        try:
            text = _generate_with_gemini(property_data)
            return {"explanation": text, "ai": True, "model": GEMINI_MODEL}
        except Exception as exc:
            return {
                "explanation": _fallback_explanation(property_data),
                "ai": False,
                "error": str(exc),
            }

    return {"explanation": _fallback_explanation(property_data), "ai": False}


def _generate_with_gemini(property_data: dict) -> str:
    import json

    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)

    payload = {
        "address": property_data.get("address"),
        "zip": property_data.get("zip"),
        "priorityScore": property_data.get("priorityScore"),
        "vacancyStatus": property_data.get("vacancyStatus"),
        "blightViolations": property_data.get("blightViolations"),
        "taxDelinquentYears": property_data.get("taxDelinquentYears"),
        "taxDelinquentAmount": property_data.get("taxDelinquentAmount"),
        "complaints311": property_data.get("complaints311"),
        "rankReasons": property_data.get("rankReasons", []),
        "suggestedAction": property_data.get("suggestedAction"),
    }

    prompt = f"""You advise Detroit, Michigan blight and housing intervention staff with a limited budget.

Using ONLY the facts in this JSON, write 2–3 concise sentences that:
1) Explain why this property ranks highly for intervention
2) Note community impact (safety, neighborhood decline, nuisance)
3) Align with the suggested action

Tone: professional, direct, no bullet points, no markdown, no invented facts.

Property data:
{json.dumps(payload, indent=2)}
"""

    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.35,
            "max_output_tokens": 220,
        },
    )
    text = (response.text or "").strip()
    if not text:
        raise ValueError("Empty response from Gemini")
    return text


def _fallback_explanation(property_data: dict) -> str:
    address = property_data.get("address", "This property")
    score = property_data.get("priorityScore", 0)
    action = property_data.get("suggestedAction", "monitor")
    reasons = property_data.get("rankReasons") or []
    reason_text = reasons[0].lower() if reasons else "multiple risk indicators on record"

    return (
        f"{address} scores {score}/100 for intervention priority, largely because {reason_text}. "
        f"Given limited city resources, staff should consider a {action} pathway while monitoring "
        f"nearby parcels for spreading vacancy or repeat complaints."
    )
