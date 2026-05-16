# Detroit Blight Prioritizer
AI-powered tool to help Detroit city officials identify and prioritize vacant/blighted properties for intervention.

## Stack
- **Backend**: FastAPI + SQLite + scikit-learn scoring + Claude API
- **Frontend**: React + Deck.gl + Mapbox GL JS + Recharts + Tailwind

## Setup

### 1. Get API Keys (do this first)
- **Anthropic API key**: https://console.anthropic.com
- **Mapbox token**: https://account.mapbox.com (free tier works)

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env   # fill in ANTHROPIC_API_KEY
```

### 3. Load Data
```bash
# Use sample data (fast, good for demo)
python ../scripts/ingest_data.py sample

# Or try real Detroit open data
python ../scripts/ingest_data.py real
```

### 4. Score Properties
```bash
python -c "from models.scoring import score_all_properties; score_all_properties()"
```

### 5. Run Backend
```bash
uvicorn main:app --reload
# API runs at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### 6. Frontend
```bash
cd frontend
npm install
cp ../.env.example .env  # fill in VITE_MAPBOX_TOKEN
npm run dev
# Runs at http://localhost:5173
```

## Demo Flow (for judges)
1. Show the map with color-coded property dots
2. Toggle heatmap to show blight intensity across Detroit
3. Click a CRITICAL property → show the AI explanation
4. Show the score breakdown radar chart
5. Filter by tier to show only CRITICAL properties
6. Mention the data sources: Detroit Open Data Portal, blight violations CSV

## Data Sources
- Blight Violations: https://apis.detroitmi.gov/data/blight_violations.zip
- Vacant Properties: https://data-detroitmi.hub.arcgis.com/datasets/vacant-property-registrations-1
- Building Footprints: https://catalog.data.gov/dataset/vacant-and-blighted-building-footprints

## Team Split
- **Person 1**: Backend (FastAPI, scoring model, Claude API)
- **Person 2**: Data ingestion + cleaning (scripts/ingest_data.py)
- **Person 3**: Frontend (Map, Sidebar, PropertyPanel)
