# Test Results — Phase 2 unit tests (`backend/test_engine.py`)

## pytest output (12 passed)
```
  
          Read more about it in the
          [FastAPI docs for Lifespan Events](https://fastapi.tiangolo.com/advanced/events/).
          
    return self.router.on_event(event_type)  # ty: ignore[deprecated]

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
12 passed, 2 warnings in 1.75s
```

## Test source
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
