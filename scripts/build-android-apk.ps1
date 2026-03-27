$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir '..')
$tmpDir = Join-Path $env:LOCALAPPDATA 'Temp\colorwalking-eas'

$env:COREPACK_HOME = Join-Path $root '.corepack'
$env:TEMP = $tmpDir
$env:TMP = $tmpDir
$env:HOME = $root
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

function Invoke-Step {
  param([Parameter(Mandatory = $true)][string]$Command)
  Invoke-Expression $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $Command"
  }
}

function Invoke-StepWithRetry {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [int]$MaxAttempts = 3
  )

  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    try {
      Invoke-Step $Command
      return
    } catch {
      if ($attempt -ge $MaxAttempts) {
        throw
      }
      Write-Host "Build upload failed on attempt $attempt/$MaxAttempts, retrying in 5s..."
      Start-Sleep -Seconds 5
    }
  }
}

Set-Location $root

Write-Host 'Step 1/3: check Expo login'
Invoke-Step "corepack pnpm dlx eas-cli whoami"

Write-Host 'Step 2/3: trigger Android APK cloud build'
Set-Location (Join-Path $root 'apps\mobile')
Invoke-StepWithRetry "corepack pnpm dlx eas-cli build -p android --profile preview --non-interactive"

Write-Host 'Step 3/3: build submitted. open the printed URL to download APK.'
