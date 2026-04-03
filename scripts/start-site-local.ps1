$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if (-not $env:VITE_API_BASE_URL) {
  $env:VITE_API_BASE_URL = "http://127.0.0.1:8787/api"
}

$port = 5173
$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  $ownerPid = $listener[0].OwningProcess
  try {
    Stop-Process -Id $ownerPid -Force -ErrorAction Stop
    Start-Sleep -Milliseconds 300
  } catch {
    Write-Host "Port $port is occupied by PID $ownerPid and could not be stopped." -ForegroundColor Yellow
    exit 1
  }
}

Write-Host "Site Env:"
Write-Host "VITE_API_BASE_URL=$env:VITE_API_BASE_URL"
Write-Host ""
Write-Host "Starting site on http://127.0.0.1:5173 ..."

Set-Location $repoRoot
pnpm --filter @colorwalking/site run dev --host 0.0.0.0 --port 5173 --strictPort
