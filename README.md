# Detroit Blight Prioritizer

A full-stack data visualization and prioritization platform designed to help identify and rank blight-related issues across Detroit neighborhoods using public datasets, geospatial analysis, and weighted scoring.

Built with a FastAPI backend, React frontend, SQLite/Postgres-compatible data layer, and interactive mapping/visualization tooling.

---

## Overview

Detroit Blight Prioritizer was created to explore how municipal and environmental datasets can be transformed into actionable prioritization tools for real-world operations and planning workflows.

The system ingests Detroit open-data sources, processes location-based records, applies configurable weighted scoring logic, and exposes the results through REST APIs and an interactive frontend map interface.

The project was designed with a strong emphasis on:

* modular backend architecture
* maintainable data pipelines
* API-driven workflows
* separation between ingestion, scoring, and presentation layers
* iterative AI-assisted development

---

# Tech Stack

## Backend

* Python
* FastAPI
* SQLite
* Pandas
* GeoPandas

## Frontend

* React
* TypeScript
* Deck.gl

## Infrastructure / Tooling

* Git + GitHub
* Docker
* Linux (Ubuntu)
* Cursor AI-assisted development workflow

---

# Features

* Weighted scoring engine for prioritizing blight-related locations
* REST API endpoints for frontend data consumption
* Interactive geospatial visualization with Deck.gl
* Public dataset ingestion and preprocessing pipelines
* Configurable scoring logic for ranking properties/issues
* Modular backend structure for maintainability and extensibility

---

# Architecture

The backend is organized into separate functional layers:

## Data Ingestion

Responsible for:

* importing Detroit open datasets
* cleaning and normalizing records
* preparing geospatial data structures

## Scoring Engine

Responsible for:

* applying weighted prioritization logic
* ranking properties/issues
* aggregating risk and severity metrics

## API Layer

FastAPI endpoints expose:

* prioritized location data
* filtered datasets
* frontend-consumable JSON responses

## Frontend Visualization

React + Deck.gl render:

* interactive map overlays
* color-coded prioritization layers
* geospatial inspection tools

---

# AI-Assisted Development Workflow

Portions of the backend workflow and implementation were developed using AI-assisted tooling (primarily Cursor).

AI tooling was used to:

* accelerate scaffolding and iteration
* explore implementation approaches
* refactor API/data-flow logic
* speed up debugging and documentation

All generated code was manually reviewed, integrated, and adapted to fit the project's architecture and data model requirements.

This project significantly improved my ability to:

* read and validate diffs
* reason about data flow between services/components
* debug AI-generated code
* identify incorrect assumptions in generated implementations
* maintain consistency across backend and frontend layers

---

# Example Data Flow

```text
Detroit Open Data
        ↓
Data Cleaning / Normalization
        ↓
Weighted Scoring Engine
        ↓
FastAPI Endpoints
        ↓
Frontend Visualization (Deck.gl + React)
```

# Running Locally

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

# Future Improvements

* User-authenticated saved views
* Editable scoring weights from UI
* Historical trend analysis
* PostgreSQL/PostGIS migration
* Automated data refresh jobs
* Expanded GIS analytics

# What I Learned

This project strengthened my understanding of:

* backend API design
* geospatial data processing
* debugging distributed frontend/backend interactions
* AI-assisted software development workflows
* schema consistency and data validation
* designing maintainable systems around evolving requirements

# Repository

[CherryColaCool GitHub Repository](https://github.com/vsudhir24/CherryColaCool.git?utm_source=chatgpt.com)
