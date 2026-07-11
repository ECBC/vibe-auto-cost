"""
Application configuration — reads from environment / .env file.
"""

import os
from pathlib import Path

# Load .env file if present (simple implementation, no extra dependency)
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _key, _, _val = _line.partition("=")
                os.environ.setdefault(_key.strip(), _val.strip())

# --- Configurable values (override via environment or .env) ---
ELECTRICITY_RATE: float = float(os.getenv("ELECTRICITY_RATE", "0.30"))  # €/kWh
ANNUAL_KM: int = int(os.getenv("ANNUAL_KM", "15000"))
USE_SAMPLE_DATA: bool = os.getenv("USE_SAMPLE_DATA", "false").lower() in ("true", "1", "yes")
