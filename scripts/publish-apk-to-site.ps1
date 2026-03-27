param(
  [Parameter(Mandatory = $true)]
  [string]$ApkPath
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir '..')
$resolvedApk = Resolve-Path $ApkPath
$targetDir = Join-Path $root 'apps\site\public\downloads'
$targetFile = Join-Path $targetDir 'colorwalking-latest.apk'

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
Copy-Item -LiteralPath $resolvedApk -Destination $targetFile -Force

Write-Host "APK published to: $targetFile"
Write-Host "After Vercel deploy, browser URL: /downloads/colorwalking-latest.apk"
