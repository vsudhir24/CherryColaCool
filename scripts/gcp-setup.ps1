# One-time GCP project setup for CherryColaCool.
# Usage: .\scripts\gcp-setup.ps1 -ProjectId YOUR_PROJECT_ID [-Region us-central1]

param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,
    [string]$Region = "us-central1",
    [string]$Repository = "cherrycola"
)

$ErrorActionPreference = "Stop"

Write-Host "Setting project to $ProjectId..."
gcloud config set project $ProjectId

Write-Host "Enabling APIs..."
gcloud services enable `
    run.googleapis.com `
    cloudbuild.googleapis.com `
    artifactregistry.googleapis.com `
    secretmanager.googleapis.com `
    firebase.googleapis.com `
    firebasehosting.googleapis.com

Write-Host "Creating Artifact Registry repository (ignore error if it already exists)..."
gcloud artifacts repositories create $Repository `
    --repository-format=docker `
    --location=$Region `
    2>$null

Write-Host "Granting Cloud Build permission to deploy Cloud Run..."
$ProjectNumber = (gcloud projects describe $ProjectId --format="value(projectNumber)")
$CloudBuildSa = "$ProjectNumber@cloudbuild.gserviceaccount.com"

gcloud projects add-iam-policy-binding $ProjectId `
    --member="serviceAccount:$CloudBuildSa" `
    --role="roles/run.admin" `
    --quiet | Out-Null

gcloud projects add-iam-policy-binding $ProjectId `
    --member="serviceAccount:$CloudBuildSa" `
    --role="roles/iam.serviceAccountUser" `
    --quiet | Out-Null

Write-Host ""
Write-Host "Done. Next steps:"
Write-Host "  1. Deploy backend:  gcloud builds submit --config=cloudbuild.yaml"
Write-Host "  2. Note Cloud Run URL, then configure frontend/.env.production"
Write-Host "  3. See docs/DEPLOYMENT.md for Firebase Hosting setup"
