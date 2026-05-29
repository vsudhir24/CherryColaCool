# Deploying CherryColaCool on Google Cloud

This project deploys as two parts:

| Component | Service | URL pattern |
|-----------|---------|-------------|
| **Backend** (Flask API) | Cloud Run | `https://cherrycolacool-api-xxxxx-uc.a.run.app` |
| **Frontend** (React) | Firebase Hosting | `https://YOUR_PROJECT.web.app` |

---

## Prerequisites

1. [Google Cloud account](https://cloud.google.com/) with **billing enabled**
2. [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed
3. [Node.js 18+](https://nodejs.org/) and npm (for frontend build)
4. [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
5. Processed data files present:
   - `backend/data/processed/vacant_properties_clean.csv`
   - `backend/data/processed/blight_tickets_clean.csv`  
   (Run `python utils/clean_blight_data.py` and `python utils/clean_data.py` if missing.)

---

## Step 1 — One-time GCP setup

```powershell
gcloud auth login
.\scripts\gcp-setup.ps1 -ProjectId YOUR_GCP_PROJECT_ID
```

This enables APIs and creates the Docker Artifact Registry repository.

---

## Step 2 — Deploy the backend (Cloud Run)

From the project root:

```powershell
.\scripts\deploy-backend.ps1
```

Or manually:

```powershell
gcloud builds submit --config=cloudbuild.yaml
```

When finished, get your API URL:

```powershell
gcloud run services describe cherrycolacool-api --region=us-central1 --format="value(status.url)"
```

Test it:

```powershell
curl https://YOUR-CLOUD-RUN-URL/health
curl "https://YOUR-CLOUD-RUN-URL/api/properties?limit=5"
```

### CORS (required for the live frontend)

After you know your Firebase Hosting URL, update Cloud Run env vars:

```powershell
gcloud run services update cherrycolacool-api --region=us-central1 `
  --update-env-vars="CORS_ORIGINS=https://YOUR_PROJECT.web.app,https://YOUR_PROJECT.firebaseapp.com,http://localhost:5173"
```

### Gemini AI (optional)

1. Create an API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Store it in Secret Manager:

```powershell
echo -n "YOUR_GEMINI_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-
```

3. Grant Cloud Run access (replace `PROJECT_NUMBER`):

```powershell
gcloud secrets add-iam-policy-binding GEMINI_API_KEY `
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"
```

4. Redeploy with secrets:

```powershell
.\scripts\deploy-backend.ps1 -WithSecrets
```

---

## Step 3 — Deploy the frontend (Firebase Hosting)

1. Copy Firebase project config:

```powershell
copy .firebaserc.example .firebaserc
# Edit .firebaserc — set default project to YOUR_GCP_PROJECT_ID
```

2. Initialize Firebase (first time only):

```powershell
firebase login
firebase init hosting
# Choose: use existing project, public directory = frontend/dist, SPA = Yes
# (firebase.json is already in the repo — you can accept defaults)
```

3. Create production env file:

```powershell
copy frontend\.env.production.example frontend\.env.production
```

Edit `frontend/.env.production`:

```env
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://YOUR-CLOUD-RUN-URL
```

4. Build and deploy (pass your Cloud Run URL):

```powershell
.\scripts\deploy-frontend.ps1 -ApiUrl "https://cherrycolacool-api-xxxxx-uc.a.run.app"
```

Or manually:

```powershell
cd frontend
npm install
npm run build
cd ..
firebase deploy --only hosting
```

5. In [Google Cloud Console → APIs → Maps](https://console.cloud.google.com/google/maps-apis), restrict your Maps API key:
   - **Application restrictions**: HTTP referrers  
   - Add: `https://YOUR_PROJECT.web.app/*` and `http://localhost:5173/*`

6. Update backend **CORS** (Step 2) with your Hosting URL, then test the live app.

---

## Local production test (Docker)

Test the API container before deploying:

```powershell
docker compose up --build
# Visit http://localhost:8080/health
```

---

## Files added for deployment

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Container image for Cloud Run |
| `backend/.dockerignore` | Keeps image smaller |
| `cloudbuild.yaml` | CI build + Cloud Run deploy |
| `cloudbuild.with-secrets.yaml` | Deploy with Gemini secret |
| `firebase.json` | Firebase Hosting config |
| `docker-compose.yml` | Local API container test |
| `scripts/gcp-setup.ps1` | One-time GCP setup |
| `scripts/deploy-backend.ps1` | Deploy API |
| `scripts/deploy-frontend.ps1` | Build + deploy UI |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `503` on `/api/properties` | CSV files missing from image — ensure `data/processed/*.csv` exist before `gcloud builds submit` |
| CORS error in browser | Add your Firebase URL to `CORS_ORIGINS` on Cloud Run |
| Map blank | Set `VITE_GOOGLE_MAPS_API_KEY` and enable Maps JavaScript API + referrer restrictions |
| Cloud Build permission denied | Re-run `.\scripts\gcp-setup.ps1` |
| Container OOM | Cloud Run is set to 2 GiB; increase if needed |
| All scores look the same | Expected for top 3k results — see scoring notes in README |
| `Network Error` / 0 properties on live site | Production build still points at `localhost`. Redeploy with `-ApiUrl`, then run `set-cors.ps1` |
| `MIME type 'text/html'` for `.js` file | Wrong Hosting folder — `firebase.json` must use `"public": "frontend/dist"`. Rebuild (`npm run build` in `frontend/`) and redeploy from **repo root** |
| `listener indicated an asynchronous response` | Usually a **browser extension** (ad blockers, password managers). Try incognito or disable extensions — not an app bug |

---

## Cost tips

- Cloud Run scales to zero when idle (`min-instances=0`)
- Set a [billing budget alert](https://console.cloud.google.com/billing/budgets)
- Maps and Gemini usage are billed separately — restrict API keys
