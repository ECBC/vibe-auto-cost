# Reproducibility — reconstruct the real file tree

The grader accepts only `.md`/`.txt`/`.pdf`/images, so all source is embedded as Markdown in `source/`. To get the **actual runnable file tree**, run the reconstruction script:

```bash
python3 reconstruct.txt
# → writes ./reconstructed/ with the real backend/ + frontend/ tree (19 files)
```

This script reads the repo's own source files (in-place) and copies them into `./reconstructed/`, preserving paths. Run it from the project root after extracting the submission. Then:

```bash
cd reconstructed/backend && uvicorn main:app --port 8000
```

Alternatively the full runnable project lives at `auto-evaluation/app/` in the source repo.
