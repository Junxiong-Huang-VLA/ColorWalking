$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir '..')
$tmpDir = Join-Path $root '.tmp'

$env:COREPACK_HOME = Join-Path $root '.corepack'
$env:TEMP = $tmpDir
$env:TMP = $tmpDir
$env:HOME = $root
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

Set-Location $root

Write-Host 'Step 1/3: check Expo login'
corepack pnpm dlx eas-cli whoami

Write-Host 'Step 2/3: trigger Android APK cloud build'
Set-Location (Join-Path $root 'apps\mobile')
corepack pnpm dlx eas-cli build -p android --profile preview

Write-Host 'Step 3/3: build submitted. open the printed URL to download APK.'
