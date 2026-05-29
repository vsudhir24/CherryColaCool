# Allow your Firebase site to call Cloud Run directly.
# Usage: .\scripts\set-cors.ps1 -HostingUrl "https://cherrycolacool.web.app"

param(
    [Parameter(Mandatory = $true)]
    [string]$HostingUrl,
    [string]$Service = "cherrycolacool-api",
    [string]$Region = "us-central1",
    [switch]$AllowAll
)

$ErrorActionPreference = "Stop"

if ($AllowAll) {
    Write-Host "Setting CORS_ALLOW_ALL=true on $Service ..."
    gcloud run services update $Service --region=$Region `
        --update-env-vars="CORS_ALLOW_ALL=true" `
        --remove-env-vars="CORS_ORIGINS"
    exit 0
}

$hostName = ([uri]$HostingUrl).Host
$firebaseApp = $hostName -replace '\.web\.app$', '.firebaseapp.com'
$origins = "$HostingUrl,https://$firebaseApp,http://localhost:5173,http://127.0.0.1:5173"

$envFile = Join-Path $env:TEMP "cherrycolacool-cors.yaml"
@"
CORS_ORIGINS: "$origins"
CORS_ALLOW_ALL: "false"
"@ | Set-Content -Path $envFile -Encoding utf8

Write-Host "Setting CORS_ORIGINS on $Service ..."
gcloud run services update $Service --region=$Region --env-vars-file=$envFile

Remove-Item $envFile -ErrorAction SilentlyContinue
Write-Host "Done. Allowed origins: $origins"
