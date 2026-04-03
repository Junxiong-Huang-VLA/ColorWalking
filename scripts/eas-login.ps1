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
corepack pnpm dlx eas-cli login
