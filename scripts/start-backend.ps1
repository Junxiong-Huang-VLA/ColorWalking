param(
  [string]$DbPath = "",
  [string]$FollowupWebhookUrl = "",
  [string]$BridgeWebhookUrl = "",
  [int]$Port = 8787
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $DbPath) {
  $DbPath = Join-Path $repoRoot "apps\backend\data\colorwalking.db"
}

$env:CW_DB_PATH = $DbPath
$env:CW_FOLLOWUP_WEBHOOK_URL = $FollowupWebhookUrl
$env:CW_BRIDGE_WEBHOOK_URL = $BridgeWebhookUrl
$env:PORT = "$Port"

Set-Location $repoRoot
Write-Host "[backend] repo: $repoRoot"
Write-Host "[backend] db:   $DbPath"
Write-Host "[backend] port: $Port"
pnpm --filter @colorwalking/backend run dev
