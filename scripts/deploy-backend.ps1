# Build and deploy the Flask API to Cloud Run.
# Usage: .\scripts\deploy-backend.ps1 [-WithSecrets]

param(
    [switch]$WithSecrets
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$config = if ($WithSecrets) { "cloudbuild.with-secrets.yaml" } else { "cloudbuild.yaml" }
Write-Host "Submitting Cloud Build using $config ..."
gcloud builds submit --config=$config .

$Region = "us-central1"
$Service = "cherrycolacool-api"
Write-Host ""
Write-Host "Backend URL:"
gcloud run services describe $Service --region=$Region --format="value(status.url)"
