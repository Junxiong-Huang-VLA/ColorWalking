param(
  [string]$BaseUrl = "http://127.0.0.1:8787"
)

$ErrorActionPreference = "Stop"

Write-Host "Verifying backend: $BaseUrl"

$health = Invoke-RestMethod -Method Get -Uri "$BaseUrl/health"
Write-Host ""
Write-Host "[health]"
$health | ConvertTo-Json -Depth 6

$waitlist = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/waitlist?limit=3"
Write-Host ""
Write-Host "[waitlist]"
$waitlist | ConvertTo-Json -Depth 6

$bridge = Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/bridge/outputs?limit=3"
Write-Host ""
Write-Host "[bridge]"
$bridge | ConvertTo-Json -Depth 6
