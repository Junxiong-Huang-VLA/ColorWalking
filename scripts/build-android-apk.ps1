$ErrorActionPreference = 'Stop'
$root = 'd:\English'
$node = Join-Path $root 'tools\node-v20.19.0-win-x64'
$env:Path = "$node;" + $env:Path
$env:COREPACK_HOME = Join-Path $root '.corepack'
$env:TEMP = Join-Path $root '.tmp'
$env:TMP = Join-Path $root '.tmp'
$env:HOME = $root
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
Set-Location (Join-Path $root 'apps\mobile')

Write-Host 'Step 1/3: check Expo login'
corepack pnpm dlx eas-cli whoami

Write-Host 'Step 2/3: trigger Android APK cloud build'
corepack pnpm dlx eas-cli build -p android --profile preview

Write-Host 'Step 3/3: build submitted. open the printed URL to download APK.'
