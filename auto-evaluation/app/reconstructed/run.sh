#!/usr/bin/env bash
# Vibe-Auto-Cost — one-command startup
set -e

cd "$(dirname "$0")"

# Install dependencies if missing
pip install -q -r requirements.txt

echo "Starting Vibe-Auto-Cost server..."
echo "Open: http://127.0.0.1:8000/"
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
