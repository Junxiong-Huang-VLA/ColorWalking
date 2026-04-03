param(
  [string]$FollowupWebhookUrl = "",
  [string]$BridgeWebhookUrl = "",
  [int]$BackendPort = 8787,
  [int]$SitePort = 5173
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$dbPath = Join-Path $repoRoot "apps\backend\data\colorwalking.db"
$backendUrl = "http://127.0.0.1:$BackendPort"
$apiBase = "$backendUrl/api"

$backendCmd = @"
`$ErrorActionPreference = 'Stop'
Set-Location '$repoRoot'
`$env:CW_DB_PATH = '$dbPath'
`$env:CW_FOLLOWUP_WEBHOOK_URL = '$FollowupWebhookUrl'
`$env:CW_BRIDGE_WEBHOOK_URL = '$BridgeWebhookUrl'
`$env:PORT = '$BackendPort'
pnpm --filter @colorwalking/backend run dev
"@

Write-Host "[demo] starting backend window..."
Start-Process -FilePath powershell -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendCmd) | Out-Null

$ready = $false
for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Milliseconds 600
  try {
    $health = Invoke-RestMethod -Method Get -Uri "$backendUrl/health" -TimeoutSec 2
    if ($health.ok -eq $true) {
      $ready = $true
      break
    }
  } catch {
    # wait retry
  }
}

if (-not $ready) {
  Write-Host "[demo] backend health check failed. Please check the new backend window."
  exit 1
}

Write-Host "[demo] backend ready: $backendUrl"
Write-Host "[demo] api base:      $apiBase"
Write-Host "[demo] opening site dev server..."

$env:VITE_API_BASE_URL = $apiBase
Set-Location $repoRoot
pnpm --filter @colorwalking/site run dev -- --host 127.0.0.1 --port $SitePort
