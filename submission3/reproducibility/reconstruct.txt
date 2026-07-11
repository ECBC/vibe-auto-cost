#!/usr/bin/env python3
"""
Reconstruction script — copies the project source tree into ./reconstructed/
so a reviewer can reproduce the file layout by running:

    python3 reconstruct.py

Reads the manifest of relative paths and copies each into ./reconstructed/.
"""

import shutil
import sys
from pathlib import Path

# Root of this project
APP_ROOT = Path(__file__).resolve().parent

# Output directory
OUTPUT_DIR = APP_ROOT / "reconstructed"

# Manifest: relative paths to include in reconstruction
MANIFEST = [
    "backend/__init__.py",
    "backend/config.py",
    "backend/load_data.py",
    "backend/main.py",
    "backend/sample_data.py",
    "backend/test_engine.py",
    "frontend/index.html",
    "frontend/styles.css",
    "frontend/app.js",
    "frontend/assets/logo-light.svg",
    "Dockerfile",
    "Makefile",
    "run.sh",
    "pyproject.toml",
    "requirements.txt",
    "README.md",
    "e2e.mjs",
    "reconstruct.py",
    ".env.example",
]


def main():
    # Clean output
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)

    copied = 0
    skipped = []

    for rel_path in MANIFEST:
        src = APP_ROOT / rel_path
        dst = OUTPUT_DIR / rel_path

        if not src.exists():
            skipped.append(rel_path)
            continue

        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        copied += 1

    # Summary
    print(f"✅ Reconstructed {copied} files into ./reconstructed/")
    if skipped:
        print(f"⚠️  Skipped (not found): {', '.join(skipped)}")

    # Verify key dirs exist
    has_backend = (OUTPUT_DIR / "backend").exists()
    has_frontend = (OUTPUT_DIR / "frontend").exists()
    print(f"   backend/  → {'✓' if has_backend else '✗'}")
    print(f"   frontend/ → {'✓' if has_frontend else '✗'}")

    return 0 if copied > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
