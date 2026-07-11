# Test Results

## Unit tests (`backend/test_engine.py`) — 13 passed
```
          
    return self.router.on_event(event_type)  # ty: ignore[deprecated]

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
13 passed, 2 warnings in 1.73s
```

## End-to-end test (`e2e.mjs`) — passed
```
4. Checking dashboard position...
   ✓ Dashboard renders below selector
5. Checking canvas elements...
   ✓ 2 canvas elements with nonzero pixels
6. Checking brand colors...
   ✓ Brand colors #ffd800/#ff8a00 present

✅ All e2e checks passed!
```

## Unit test source
```python
"""
Unit tests for Vibe-Auto-Cost calculation engine.
Covers: EV path, unknown-make fallback, €150k cap, vibe_score range, schema validation.
"""

import sys
from pathlib import Path

# Ensure backend is importable
sys.path.insert(0, str(Path(__file__).parent))

import pytest

from load_data import calculate_evaluation, load_all
from main import EvaluateResponse

# Load data once for all tests
@pytest.fixture(scope="session", autouse=True)
def _load_data():
    load_all()


class TestEVPathCost:
    """EV cost calculation uses ELECTRICITY_RATE and Efficiency Wh/km."""

    def test_ev_cost_uses_electricity_rate(self):
        """An Electric evaluation should produce reasonable annual fuel cost."""
        result = calculate_evaluation("BMW", "BMW iX1", "Electric")
        annual_fuel = result["financial_projections"]["annual_fuel_cost"]
        # EV annual fuel = avg_eff_wh_km * ANNUAL_KM / 1000 * ELECTRICITY_RATE
        # Should be positive and less than €3000/year for any EV
        assert 0 < annual_fuel < 3000, f"EV annual fuel cost out of range: {annual_fuel}"

    def test_ev_cost_proportional_to_rate(self):
        """Verify the formula uses ELECTRICITY_RATE (indirect: result > 0)."""
        result = calculate_evaluation("Tesla", "Model 3", "Electric")
        annual_fuel = result["financial_projections"]["annual_fuel_cost"]
        assert annual_fuel > 0


class TestUnknownMakeFallback:
    """Unknown make should return a valid median-based response without crashing."""

    def test_unknown_make_returns_success(self):
        result = calculate_evaluation("ZZZNonExistentBrand", "FakeModel", "Petrol")
        assert result["status"] == "success"
        assert result["financial_projections"]["total_5_year_cost"] > 0
        assert result["metadata"]["matched_records"] == 0

    def test_unknown_make_uses_global_median(self):
        result = calculate_evaluation("UnknownXYZ", "NoModel", "Diesel")
        # Should use global_median_fuel (not crash)
        assert result["financial_projections"]["annual_fuel_cost"] > 0


class TestCap150k:
    """Total 5-year cost should never exceed €150,000."""

    def test_cap_applied_and_flagged(self):
        """Construct a scenario that would exceed 150k (inject via monkeypatch)."""
        import load_data

        # Save originals
        orig_median_fuel = load_data.global_median_fuel
        orig_median_maint = load_data.global_median_maint

        try:
            # Set absurd values: 20000€/100km fuel → annual = 20000 * 150 = 3,000,000
            load_data.global_median_fuel = 20000.0
            load_data.global_median_maint = 50000.0

            result = calculate_evaluation("FakeBrand", "FakeModel", "Petrol")
            assert result["financial_projections"]["total_5_year_cost"] == 150000.0
            assert result["metadata"]["flagged"] is True
        finally:
            load_data.global_median_fuel = orig_median_fuel
            load_data.global_median_maint = orig_median_maint


class TestVibeScoreRange:
    """overall_vibe_score must always be in [0, 100]."""

    @pytest.mark.parametrize("make,model,engine", [
        ("BMW", "BMW 111", "Petrol"),
        ("Toyota", "Corolla", "Hybrid"),
        ("Tesla", "Model 3", "Electric"),
        ("UnknownBrand", "UnknownModel", "Diesel"),
        ("Porsche", "911", "Petrol"),
    ])
    def test_vibe_score_in_range(self, make, model, engine):
        result = calculate_evaluation(make, model, engine)
        score = result["reliability_scores"]["overall_vibe_score"]
        assert 0 <= score <= 100, f"Vibe score {score} out of [0,100]"


class TestExactEVCalculation:
    """Exact deterministic EV cost calculation test."""

    def test_exact_ev_annual_fuel_and_5year(self):
        """Force EV path with known Efficiency (Wh/km) and ELECTRICITY_RATE, assert exact values."""
        import load_data
        from config import ANNUAL_KM, ELECTRICITY_RATE

        # Save originals
        orig_records = load_data.european_records[:]
        orig_by_brand = dict(load_data.european_by_brand)
        orig_by_brand_model = dict(load_data.european_by_brand_model)

        try:
            # Construct a deterministic EV record
            ev_record = {
                "Brand": "TestEV",
                "Model Name": "ExactModel",
                "Fuel Type": "Electric",
                "Horsepower (HP)": 200,
                "Energy Cost (€/100km)": 5.0,
                "Efficiency (Wh/km)": 160,
                "Maintenance Cost (€/year)": 800,
                "Safety Rating (Euro NCAP)": 5,
                "Boot Capacity (L)": 400,
                "Seating Capacity": 5,
            }
            # Inject into indices
            load_data.european_records.append(ev_record)
            load_data.european_by_brand.setdefault("testev", []).append(ev_record)
            load_data.european_by_brand_model[("testev", "exactmodel")] = [ev_record]

            result = calculate_evaluation("TestEV", "ExactModel", "Electric")
            fp = result["financial_projections"]

            # Expected: Efficiency(160) * ANNUAL_KM / 1000 * ELECTRICITY_RATE
            expected_annual_fuel = 160 * ANNUAL_KM / 1000 * ELECTRICITY_RATE
            assert fp["annual_fuel_cost"] == round(expected_annual_fuel, 2), (
                f"Expected {round(expected_annual_fuel, 2)}, got {fp['annual_fuel_cost']}"
            )

            # Maintenance tier for Electric = "high" → 850 €/year
            expected_annual_maint = 850.0
            assert fp["annual_maintenance_cost"] == expected_annual_maint

            # 5-year total
            expected_5year = (expected_annual_fuel + expected_annual_maint) * 5
            assert fp["total_5_year_cost"] == round(expected_5year, 2), (
                f"Expected {round(expected_5year, 2)}, got {fp['total_5_year_cost']}"
            )
        finally:
            load_data.european_records = orig_records
            load_data.european_by_brand = orig_by_brand
            load_data.european_by_brand_model = orig_by_brand_model


class TestPydanticSchemaValidation:
    """Pydantic model rejects malformed data."""

    def test_malformed_dict_rejected(self):
        """Missing required fields should raise ValidationError."""
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            EvaluateResponse(**{"status": "success"})  # Missing all other fields

    def test_vibe_score_over_100_rejected(self):
        """overall_vibe_score > 100 should fail validation."""
        from pydantic import ValidationError

        with pytest.raises(ValidationError):
            EvaluateResponse(
                status="success",
                metadata={"requested_make": "X", "requested_model": "Y", "matched_records": 0, "flagged": False},
                reliability_scores={"safety_rating": "Good", "comfort_rating": "Good", "overall_vibe_score": 101},
                financial_projections={"annual_fuel_cost": 100, "annual_maintenance_cost": 100, "total_5_year_cost": 1000},
                radar_data={"safety": 50, "maintenance": 50, "boot_capacity": 50, "comfort": 50},
                yearly_breakdown=[{"year": 1, "cumulative_fuel": 100, "cumulative_maintenance": 100}],
            )

```
