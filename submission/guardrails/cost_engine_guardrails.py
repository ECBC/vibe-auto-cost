# Cost engine + guardrails (from load_data.py)

def calculate_evaluation(make: str, model: str, engine: str) -> dict:
    """
    Main evaluation function. Returns the full response dict
    conforming to the logic_guide §4 schema.
    """
    euro_matches, match_type = _find_european_match(make, model, engine)

    # Determine buying/maint tiers for UCI alignment
    buying_tier = _get_buying_tier(make)

    # Get average horsepower from matches for maint tier heuristic
    avg_hp = None
    if euro_matches:
        hps = [r["Horsepower (HP)"] for r in euro_matches if r.get("Horsepower (HP)") and r["Horsepower (HP)"] > 0]
        if hps:
            avg_hp = statistics.mean(hps)

    maint_tier = _get_maint_tier(engine, avg_hp)

    # UCI alignment
    uci_matches = _find_uci_matches(buying_tier, maint_tier)

    # --- Financial Projections ---
    # Annual fuel cost
    if euro_matches:
        fuel_values = [r["Energy Cost (€/100km)"] for r in euro_matches if r.get("Energy Cost (€/100km)") and r["Energy Cost (€/100km)"] > 0]
        if fuel_values:
            energy_cost_per_100km = statistics.mean(fuel_values)
        else:
            energy_cost_per_100km = global_median_fuel
    else:
        energy_cost_per_100km = global_median_fuel

    annual_fuel_cost = energy_cost_per_100km * (ANNUAL_KM / 100)

    # For EV: use Efficiency (Wh/km) if available
    if engine and "electric" in engine.lower() and euro_matches:
        eff_values = [r["Efficiency (Wh/km)"] for r in euro_matches if r.get("Efficiency (Wh/km)") and r["Efficiency (Wh/km)"] > 0]
        if eff_values:
            avg_eff = statistics.mean(eff_values)
            annual_fuel_cost = avg_eff * ANNUAL_KM / 1000 * ELECTRICITY_RATE

    # Annual maintenance cost (UCI-mapped primary, dataset fallback)
    annual_maintenance_cost = float(MAINT_COST_MAP.get(maint_tier, 500))

    # Total 5-year
    total_5_year_cost = (annual_fuel_cost + annual_maintenance_cost) * 5

    # --- Guardrails ---
    flagged = False
    if total_5_year_cost > 150000:
        total_5_year_cost = 150000.0
        flagged = True

    # --- Reliability Scores ---
    # Safety from European dataset
    if euro_matches:
        safety_vals = [r["Safety Rating (Euro NCAP)"] for r in euro_matches if r.get("Safety Rating (Euro NCAP)")]
        avg_safety = statistics.mean([float(s) for s in safety_vals if s]) if safety_vals else 3.0
    else:
        avg_safety = 3.0

    safety_labels = {5: "Excellent", 4: "Good", 3: "Average", 2: "Below Average", 1: "Poor", 0: "Not Rated"}
    safety_rating = safety_labels.get(round(avg_safety), "Average")

    # Comfort rating from boot capacity + seating + ADAS
    if euro_matches:
        boot_vals = [r["Boot Capacity (L)"] for r in euro_matches if r.get("Boot Capacity (L)") and r["Boot Capacity (L)"] > 0]
        seat_vals = [r["Seating Capacity"] for r in euro_matches if r.get("Seating Capacity") and r["Seating Capacity"] > 0]
        avg_boot = statistics.mean(boot_vals) if boot_vals else 350
        avg_seats = statistics.mean(seat_vals) if seat_vals else 5
    else:
        avg_boot = 350
        avg_seats = 5

    comfort_score = min(100, (avg_boot / 600 * 40) + (avg_seats / 7 * 30) + (avg_safety / 5 * 30))
    if comfort_score >= 75:
        comfort_rating = "Excellent"
    elif comfort_score >= 55:
        comfort_rating = "Good"
    elif comfort_score >= 35:
        comfort_rating = "Average"
    else:
        comfort_rating = "Below Average"

    # Overall vibe score: combines safety + UCI class distribution + comfort
    uci_class_scores = {"vgood": 100, "good": 75, "acc": 50, "unacc": 25}
    if uci_matches:
        class_vals = [uci_class_scores.get(r["class"], 50) for r in uci_matches]
        avg_class = statistics.mean(class_vals)
    else:
        avg_class = 50

    overall_vibe_score = int(round(
        (avg_safety / 5 * 35) +  # 35% safety
        (avg_class / 100 * 35) +  # 35% UCI class
        (comfort_score / 100 * 30)  # 30% comfort
    ))
    # Clamp [0, 100]
    overall_vibe_score = max(0, min(100, overall_vibe_score))

    # --- Radar chart data (for frontend) ---
    # Map UCI safety distribution
    safety_map = {"high": 5, "med": 3, "low": 1}
    uci_safety_vals = [safety_map.get(r["safety"], 3) for r in uci_matches] if uci_matches else [3]
    radar_safety = statistics.mean(uci_safety_vals) / 5 * 100

    # Maintenance (inverted: low maint = high score)
    maint_inv_map = {"low": 100, "med": 65, "high": 35, "vhigh": 10}
    radar_maint = maint_inv_map.get(maint_tier, 50)

    # Boot capacity
    lug_map = {"big": 90, "med": 60, "small": 30}
    uci_lug_vals = [lug_map.get(r["lug_boot"], 50) for r in uci_matches] if uci_matches else [50]
    radar_boot = statistics.mean(uci_lug_vals)

    # Comfort (reuse comfort_score)
    radar_comfort = comfort_score

    return {
        "status": "success",
        "metadata": {
            "requested_make": make,
            "requested_model": model,
            "matched_records": len(euro_matches),
            "flagged": flagged,
        },
        "reliability_scores": {
            "safety_rating": safety_rating,
            "comfort_rating": comfort_rating,
            "overall_vibe_score": overall_vibe_score,
        },
        "financial_projections": {
            "annual_fuel_cost": round(annual_fuel_cost, 2),
            "annual_maintenance_cost": round(annual_maintenance_cost, 2),
            "total_5_year_cost": round(total_5_year_cost, 2),
        },
        "radar_data": {
            "safety": round(radar_safety, 1),
            "maintenance": round(radar_maint, 1),
            "boot_capacity": round(radar_boot, 1),
            "comfort": round(radar_comfort, 1),
        },
        "yearly_breakdown": [
            {
                "year": y,
                "cumulative_fuel": round(annual_fuel_cost * y, 2),
                "cumulative_maintenance": round(annual_maintenance_cost * y, 2),
            }
            for y in range(1, 6)
        ],
    }
