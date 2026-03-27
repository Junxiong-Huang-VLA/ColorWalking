param(
  [Parameter(Mandatory = $true)]
  [string]$ApkPath
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir '..')
$resolvedApk = Resolve-Path $ApkPath
$targetMirrorDir = Join-Path $root 'apps\site\public\downloads'
$targetMirrorFile = Join-Path $targetMirrorDir 'colorwalking-latest.apk'
$targetBrandDir = Join-Path $root 'apps\site\public\download'
$targetBrandFile = Join-Path $targetBrandDir 'app.apk'

New-Item -ItemType Directory -Force -Path $targetMirrorDir | Out-Null
New-Item -ItemType Directory -Force -Path $targetBrandDir | Out-Null

Copy-Item -LiteralPath $resolvedApk -Destination $targetMirrorFile -Force
Copy-Item -LiteralPath $resolvedApk -Destination $targetBrandFile -Force

Write-Host "APK published to:"
Write-Host "  - $targetBrandFile"
Write-Host "  - $targetMirrorFile"
Write-Host "After Vercel deploy, browser URL:"
Write-Host "  - /download/app.apk (brand URL)"
Write-Host "  - /downloads/colorwalking-latest.apk (mirror URL)"
