# Phase 2 — Config, Ops & Reproducibility


### `requirements.txt`

```text
fastapi==0.139.0
uvicorn[standard]==0.51.0
pydantic==2.13.4
openpyxl==3.1.5
python-multipart==0.0.32

```


### `.env.example`

```text
# Vibe-Auto-Cost configuration
# Copy to .env and adjust as needed.

ELECTRICITY_RATE=0.30
ANNUAL_KM=15000

```


### `.python-version`

```text
3.11.2

```


### `pyproject.toml`

```toml
[project]
name = "vibe-auto-cost"
version = "2.0.0"
requires-python = ">=3.11"

[tool.ruff]
target-version = "py311"
line-length = 120

[tool.ruff.lint]
select = ["E", "F", "W", "I"]
ignore = ["E501", "I001"]  # line length handled softly; I001 false-positives from sys.path manipulation

[tool.mypy]
python_version = "3.11"
ignore_missing_imports = true
warn_unused_configs = true

[tool.pytest.ini_options]
testpaths = ["backend"]

```


### `run.sh`

```bash
#!/usr/bin/env bash
# Vibe-Auto-Cost — one-command startup
set -e

cd "$(dirname "$0")"

# Install dependencies if missing
pip install -q -r requirements.txt

echo "Starting Vibe-Auto-Cost server..."
echo "Open: http://127.0.0.1:8000/"
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000

```


### `Makefile`

```makefile
.PHONY: run install lint test

run: install
	@echo "Open: http://127.0.0.1:8000/"
	uvicorn backend.main:app --host 0.0.0.0 --port 8000

install:
	pip install -q -r requirements.txt

lint:
	ruff check backend/

test:
	pytest backend/test_engine.py -q

```


### `Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

```

