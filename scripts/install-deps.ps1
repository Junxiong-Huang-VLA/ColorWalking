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
corepack pnpm install
