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
