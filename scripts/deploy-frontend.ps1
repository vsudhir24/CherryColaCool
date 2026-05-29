# Build and deploy the React frontend to Firebase Hosting.
# Usage:
#   .\scripts\deploy-frontend.ps1 -ApiUrl "https://cherrycolacool-api-xxxxx-uc.a.run.app"
#   .\scripts\deploy-frontend.ps1 -ProjectId YOUR_GCP_PROJECT_ID -ApiUrl "https://..."

param(
    [string]$ProjectId,
    [string]$ApiUrl = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

# Empty ApiUrl = same-origin; Firebase proxies /api/** to Cloud Run (recommended).
$ApiUrl = $ApiUrl.Trim().TrimEnd("/")

$configPath = Join-Path $Root "frontend\public\config.json"
$config = @{
    apiBaseUrl = $ApiUrl
    useMock    = $false
} | ConvertTo-Json
Set-Content -Path $configPath -Value $config -Encoding utf8
Write-Host "Wrote $configPath (apiBaseUrl='$ApiUrl' => same-origin when empty)"

$mapsKey = if ($env:VITE_GOOGLE_MAPS_API_KEY) { $env:VITE_GOOGLE_MAPS_API_KEY } else { "your_google_maps_api_key_here" }
$envProd = @"
VITE_GOOGLE_MAPS_API_KEY=$mapsKey
VITE_USE_MOCK=false
VITE_API_BASE_URL=$ApiUrl
"@
Set-Content -Path (Join-Path $Root "frontend\.env.production") -Value $envProd.Trim() -Encoding utf8
Write-Host "Wrote frontend/.env.production"

if ($ProjectId) {
    if (-not (Test-Path ".firebaserc")) {
        Copy-Item ".firebaserc.example" ".firebaserc"
    }
    (Get-Content ".firebaserc") -replace "YOUR_GCP_PROJECT_ID", $ProjectId | Set-Content ".firebaserc"
}

Write-Host "Building frontend..."
Set-Location frontend
npm run build
Set-Location ..

$assetsDir = Join-Path $Root "frontend\dist\assets"
if (-not (Test-Path $assetsDir)) {
    Write-Error "Build did not produce frontend/dist/assets. Fix build errors first."
}

$jsCount = (Get-ChildItem $assetsDir -Filter "*.js").Count
Write-Host "Found $jsCount JS bundle(s) in frontend/dist/assets."

Write-Host "Deploying to Firebase Hosting..."
firebase deploy --only hosting

Write-Host ""
Write-Host "Done. For production, run: .\scripts\connect-production.ps1 -HostingUrl `"https://cherrycolacool.web.app`""
