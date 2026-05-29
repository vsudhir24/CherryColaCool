# Wire live site (Firebase) -> Cloud Run API -> redeploy frontend.
# Usage:
#   .\scripts\connect-production.ps1 -HostingUrl "https://cherrycolacool.web.app"

param(
    [string]$HostingUrl = "https://cherrycolacool.web.app",
    [string]$Service = "cherrycolacool-api",
    [string]$Region = "us-central1"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "Fetching Cloud Run URL for $Service ..."
$ApiUrl = (gcloud run services describe $Service --region=$Region --format="value(status.url)").Trim()
if (-not $ApiUrl) {
    Write-Error "Could not read Cloud Run URL. Deploy the backend first: .\scripts\deploy-backend.ps1"
}
Write-Host "API URL: $ApiUrl"

Write-Host "Testing API ..."
$health = Invoke-RestMethod -Uri "$ApiUrl/health" -Method Get
Write-Host "Health: $($health.status)"

Write-Host "Updating CORS for $HostingUrl ..."
& (Join-Path $Root "scripts\set-cors.ps1") -HostingUrl $HostingUrl

$configPath = Join-Path $Root "frontend\public\config.json"
@{
    apiBaseUrl = $ApiUrl
    useMock    = $false
} | ConvertTo-Json | Set-Content -Path $configPath -Encoding utf8
Write-Host "Wrote $configPath"

$mapsKey = if ($env:VITE_GOOGLE_MAPS_API_KEY) { $env:VITE_GOOGLE_MAPS_API_KEY } else { "your_google_maps_api_key_here" }
@"
VITE_GOOGLE_MAPS_API_KEY=$mapsKey
VITE_USE_MOCK=false
VITE_API_BASE_URL=$ApiUrl
"@ | Set-Content -Path (Join-Path $Root "frontend\.env.production") -Encoding utf8

Write-Host "Building frontend..."
Set-Location (Join-Path $Root "frontend")
npm run build
Set-Location $Root

Write-Host "Deploying Firebase Hosting..."
firebase deploy --only hosting

Write-Host ""
Write-Host "Connected."
Write-Host "  Site:  $HostingUrl"
Write-Host "  API:   $ApiUrl/api/properties?limit=3  (should return JSON in browser)"
Write-Host "  Note:  $HostingUrl/api/... will show the web app — that is normal (no /api proxy)."
