# CURSOR.md

## Project Overview
Detroit Blight Prioritizer — FastAPI backend, React/Deck.gl frontend.

## Backend
- Entry point: backend/main.py
- Scoring logic: backend/models/scoring.py
- AI insights: backend/models/ai_insights.py (Gemini API)

## Key Conventions
- All endpoints prefixed with /api
- SQLite database at data/blight.db
- Scoring weights defined in scoring.py WEIGHTS dict

## Common Tasks
- Add a new endpoint: create router in backend/routers/
- Change scoring weights: edit WEIGHTS in backend/models/scoring.py
- Seed data: python scripts/ingest_data.py sample
