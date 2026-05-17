def calculate_priority_score(property_data):
    score = 0

    if property_data["vacant"]:
        score += 40

    score += property_data["blight_violations"] * 8

    score += property_data["tax_delinquent_years"] * 10

    return min(score, 100)