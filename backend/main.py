from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import properties, scores, insights

app = FastAPI(title="Detroit Blight Prioritizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(properties.router, prefix="/api/properties", tags=["properties"])
app.include_router(scores.router, prefix="/api/scores", tags=["scores"])
app.include_router(insights.router, prefix="/api/insights", tags=["insights"])

@app.get("/")
def root():
    return {"status": "Detroit Blight Prioritizer API running"}
