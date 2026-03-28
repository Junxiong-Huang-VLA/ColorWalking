$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir '..')
$tmpDir = Join-Path $root '.tmp'
$mobileDir = Join-Path $root 'apps\mobile'

$env:COREPACK_HOME = Join-Path $root '.corepack'
$env:TEMP = $tmpDir
$env:TMP = $tmpDir
$env:npm_config_ignore_scripts = 'true'
if (-not $env:GIT_CONFIG_GLOBAL -and $env:USERPROFILE) {
  $env:GIT_CONFIG_GLOBAL = Join-Path $env:USERPROFILE '.gitconfig'
}

New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

function Invoke-Step {
  param([Parameter(Mandatory = $true)][string]$Command)
  Invoke-Expression $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $Command"
  }
}

function Ensure-GitSafeDirectory {
  Set-Location $root
  $rootPath = (Resolve-Path $root).Path
  $safeList = @(git config --global --get-all safe.directory 2>$null)
  if ($safeList -contains $rootPath) {
    return
  }

  Write-Host "[git] add safe.directory => $rootPath"
  git config --global --add safe.directory $rootPath
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to set git safe.directory for $rootPath"
  }
}

function Ensure-CleanWorktree {
  Set-Location $root
  $status = git status --porcelain
  if ($status) {
    throw "Worktree not clean. Commit or stash changes before sync release."
  }
}

function Wait-BuildFinished {
  param(
    [Parameter(Mandatory = $true)][string]$BuildId,
    [int]$TimeoutMinutes = 40
  )

  $deadline = (Get-Date).AddMinutes($TimeoutMinutes)
  while ((Get-Date) -lt $deadline) {
    $jsonRaw = corepack pnpm dlx eas-cli build:view $BuildId --json
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to query build status for $BuildId"
    }

    $obj = $jsonRaw | ConvertFrom-Json
    $status = "$($obj.status)"
    Write-Host "[build] $BuildId => $status"

    if ($status -eq 'finished') {
      return $obj
    }
    if ($status -eq 'errored' -or $status -eq 'canceled') {
      throw "Build ended with status: $status"
    }

    Start-Sleep -Seconds 20
  }

  throw "Timeout waiting for build to finish: $BuildId"
}

Ensure-GitSafeDirectory
Ensure-CleanWorktree

Write-Host 'Step 1/7: verify Expo login'
Set-Location $root
Invoke-Step "corepack pnpm dlx eas-cli whoami"

Write-Host 'Step 2/7: capture release commit'
$releaseCommit = (git -C $root rev-parse HEAD).Trim()
Write-Host "[release] commit = $releaseCommit"

Write-Host 'Step 3/7: trigger Android APK build'
Set-Location $mobileDir
$buildRaw = corepack pnpm dlx eas-cli build -p android --profile preview --non-interactive --json
if ($LASTEXITCODE -ne 0) {
  throw 'Failed to trigger EAS build'
}

$buildObj = $buildRaw | ConvertFrom-Json
if ($buildObj -is [System.Array]) {
  $buildId = "$($buildObj[0].id)"
} else {
  $buildId = "$($buildObj.id)"
}
if (-not $buildId) {
  throw 'Unable to parse build id from EAS output'
}
Write-Host "[release] build id = $buildId"

Write-Host 'Step 4/7: wait build complete'
$final = Wait-BuildFinished -BuildId $buildId

$apkUrl = "$($final.artifacts.applicationArchiveUrl)"
if (-not $apkUrl) {
  throw 'Build finished but no application archive URL found.'
}
Write-Host "[release] apk url = $apkUrl"

Write-Host 'Step 5/7: download APK and publish to site public paths'
$apkLocal = Join-Path $tmpDir 'sync-release-latest.apk'
Invoke-WebRequest -Uri $apkUrl -OutFile $apkLocal

Set-Location $root
Invoke-Step "powershell -ExecutionPolicy Bypass -File .\scripts\publish-apk-to-site.ps1 -ApkPath '$apkLocal'"

Write-Host 'Step 6/7: write release meta'
$metaDir = Join-Path $root 'apps\site\public\downloads'
$metaPath = Join-Path $metaDir 'release-meta.json'
$meta = [ordered]@{
  commit = $releaseCommit
  buildId = $buildId
  apkUrl = $apkUrl
  releasedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
}
$metaJson = $meta | ConvertTo-Json
[System.IO.File]::WriteAllText($metaPath, $metaJson, (New-Object System.Text.UTF8Encoding($false)))

Write-Host 'Step 7/7: commit and push synchronized release'
Invoke-Step "git -C $root add apps/site/public/download/app.apk apps/site/public/downloads/colorwalking-latest.apk apps/site/public/downloads/release-meta.json"
Invoke-Step "git -C $root commit -m 'chore(release): sync app+web from $($releaseCommit.Substring(0,7))'"
Invoke-Step "git -C $root push -u origin main"

Write-Host '[done] Sync release completed.'
Write-Host "- Build ID: $buildId"
Write-Host "- APK URL : $apkUrl"
Write-Host '- Site URL: /download/app.apk'
