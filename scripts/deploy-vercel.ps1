$ErrorActionPreference = 'Stop'
$root = 'd:\English'
$node = Join-Path $root 'tools\node-v20.19.0-win-x64'
$env:Path = "$node;" + $env:Path
$env:COREPACK_HOME = Join-Path $root '.corepack'
$env:TEMP = Join-Path $root '.tmp'
$env:TMP = Join-Path $root '.tmp'
$env:HOME = $root
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
Set-Location $root

Write-Host 'Step 1/2: login to Vercel (if needed)'
corepack pnpm dlx vercel@latest login

Write-Host 'Step 2/2: deploy production site'
corepack pnpm dlx vercel@latest --prod
