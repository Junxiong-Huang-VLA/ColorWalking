param(
  [Parameter(Mandatory = $true)]
  [string]$ArtifactUrl
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir '..')
$metaDir = Join-Path $root 'apps\site\public\downloads'
$metaPath = Join-Path $metaDir 'release-meta.json'

function Update-VercelRedirects {
  param(
    [Parameter(Mandatory = $true)][string]$ConfigPath,
    [Parameter(Mandatory = $true)][string]$Url
  )

  $raw = Get-Content -Raw $ConfigPath
  $cfg = $raw | ConvertFrom-Json

  $redirects = @(
    [ordered]@{ source = '/download/app.apk'; destination = $Url; statusCode = 302 },
    [ordered]@{ source = '/downloads/lambroll-isle-latest.apk'; destination = $Url; statusCode = 302 },
    [ordered]@{ source = '/downloads/colorwalking-latest.apk'; destination = $Url; statusCode = 302 }
  )

  if ($cfg.PSObject.Properties.Name -contains 'redirects') {
    $cfg.redirects = $redirects
  } else {
    $cfg | Add-Member -NotePropertyName 'redirects' -NotePropertyValue $redirects -Force
  }

  $json = $cfg | ConvertTo-Json -Depth 30
  [System.IO.File]::WriteAllText((Resolve-Path $ConfigPath), $json, (New-Object System.Text.UTF8Encoding($false)))
}

if (-not ($ArtifactUrl -match '^https://expo\.dev/artifacts/eas/.+\.apk$')) {
  throw "ArtifactUrl must be a valid Expo artifact APK URL. Got: $ArtifactUrl"
}

New-Item -ItemType Directory -Force -Path $metaDir | Out-Null

$meta = [ordered]@{
  artifactUrl = $ArtifactUrl
  updatedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
}
$metaJson = $meta | ConvertTo-Json
[System.IO.File]::WriteAllText($metaPath, $metaJson, (New-Object System.Text.UTF8Encoding($false)))

Update-VercelRedirects -ConfigPath (Join-Path $root 'vercel.json') -Url $ArtifactUrl
Update-VercelRedirects -ConfigPath (Join-Path $root 'apps\site\vercel.json') -Url $ArtifactUrl

Write-Host 'APK redirect published to Expo Artifact:'
Write-Host "  - $ArtifactUrl"
Write-Host 'After Vercel deploy, browser URL:'
Write-Host '  - /download/app.apk (302 to Expo Artifact)'
Write-Host '  - /downloads/lambroll-isle-latest.apk (302 to Expo Artifact)'
Write-Host '  - /downloads/colorwalking-latest.apk (302 to Expo Artifact)'
