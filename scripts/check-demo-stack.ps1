param(
  [int]$BackendPort = 8787
)

$ErrorActionPreference = "Stop"

$base = "http://127.0.0.1:$BackendPort"

Write-Host "== Health =="
Invoke-RestMethod "$base/health" | ConvertTo-Json -Depth 6

Write-Host ""
Write-Host "== Waitlist (top 3) =="
Invoke-RestMethod "$base/api/waitlist?limit=3" | ConvertTo-Json -Depth 8

Write-Host ""
Write-Host "== Bridge Outputs (top 3) =="
Invoke-RestMethod "$base/api/bridge/outputs?limit=3" | ConvertTo-Json -Depth 8

Write-Host ""
Write-Host "== Latest E2E =="
Invoke-RestMethod "$base/api/e2e/latest?suite=investor-demo-baseline" | ConvertTo-Json -Depth 8
