import math


def calculate_priority_score(property_data: dict) -> int:
    """
    Priority score 0–100 with diminishing returns on violation count so
    scores spread across the dataset instead of clustering at the cap.
    """
    score = 0.0

    vacant = property_data.get("vacant", False)
    violations = int(property_data.get("blight_violations", 0))
    tax_years = int(property_data.get("tax_delinquent_years", 0))
    balance = float(property_data.get("outstanding_balance", 0))
    complaints = int(property_data.get("complaints_311", 0))

    if vacant:
        score += 35
    elif violations >= 5:
        score += 12

    if violations > 0:
        score += min(50, round(22 * math.log1p(violations)))

    if vacant and violations >= 20:
        score += 10

    score += min(tax_years * 10, 15)
    score += min(complaints * 2, 10)
    score += min(balance / 5000, 8)

    return min(100, round(score))


def build_rank_reasons(
    *,
    vacant: bool,
    blight_violations: int,
    tax_delinquent_years: int,
    outstanding_balance: float,
    complaints_311: int,
) -> list[str]:
    reasons: list[str] = []

    if vacant:
        reasons.append("Registered vacant property")
    if blight_violations >= 10:
        reasons.append(f"{blight_violations} active blight violations")
    elif blight_violations >= 5:
        reasons.append(f"{blight_violations} repeat blight violations")
    elif blight_violations > 0:
        reasons.append(f"{blight_violations} blight violation(s) on record")

    if tax_delinquent_years >= 4:
        reasons.append(f"{tax_delinquent_years}+ years tax delinquent")
    elif tax_delinquent_years > 0:
        reasons.append(f"{tax_delinquent_years} year(s) tax delinquent")

    if outstanding_balance >= 5000:
        reasons.append(f"${outstanding_balance:,.0f} outstanding blight fines")
    elif outstanding_balance > 0:
        reasons.append("Unpaid blight fines on record")

    if complaints_311 >= 5:
        reasons.append(f"{complaints_311} recent 311 complaints")
    elif complaints_311 > 0:
        reasons.append(f"{complaints_311} 311 complaint(s)")

    if not reasons:
        reasons.append("Lower composite risk — monitor for escalation")

    return reasons


def suggest_action(
    *,
    priority_score: int,
    vacant: bool,
    blight_violations: int,
    outstanding_balance: float,
) -> str:
    if priority_score >= 88 and vacant and blight_violations >= 15:
        return "demolish"
    if blight_violations >= 8 or outstanding_balance >= 10000:
        return "fine"
    if priority_score >= 70 or blight_violations >= 5:
        return "inspect"
    if vacant and priority_score >= 50:
        return "rehab"
    return "monitor"
