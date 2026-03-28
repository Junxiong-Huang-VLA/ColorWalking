$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir '..')
$tmpDir = Join-Path $env:LOCALAPPDATA 'Temp\colorwalking-eas-sync'
$mobileDir = Join-Path $root 'apps\mobile'

$env:COREPACK_HOME = Join-Path $root '.corepack'
$env:TEMP = $tmpDir
$env:TMP = $tmpDir
$env:npm_config_ignore_scripts = 'true'
$env:NODE_OPTIONS = '--dns-result-order=ipv4first'
$env:EAS_SKIP_AUTO_FINGERPRINT = '1'
$env:CI = '1'
if (-not $env:GIT_CONFIG_GLOBAL -and $env:USERPROFILE) {
  $env:GIT_CONFIG_GLOBAL = Join-Path $env:USERPROFILE '.gitconfig'
}

New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

function Ensure-ExpoToken {
  if ($env:EXPO_TOKEN) { return }
  $userToken = [Environment]::GetEnvironmentVariable('EXPO_TOKEN', 'User')
  if ($userToken) { $env:EXPO_TOKEN = $userToken; return }
  $machineToken = [Environment]::GetEnvironmentVariable('EXPO_TOKEN', 'Machine')
  if ($machineToken) { $env:EXPO_TOKEN = $machineToken; return }
  throw 'EXPO_TOKEN not found. Set it once with: [Environment]::SetEnvironmentVariable("EXPO_TOKEN","<your-token>","User")'
}

function Ensure-GitSafeDirectory {
  Set-Location $root
  $rootPath = (Resolve-Path $root).Path
  $safeList = @(git config --global --get-all safe.directory 2>$null)
  if ($safeList -contains $rootPath) { return }
  Write-Host "[git] add safe.directory => $rootPath"
  git config --global --add safe.directory $rootPath
  if ($LASTEXITCODE -ne 0) { throw "Failed to set git safe.directory for $rootPath" }
}

function Ensure-CleanWorktree {
  Set-Location $root
  $status = git status --porcelain
  if ($status) { throw "Worktree not clean. Commit or stash changes before sync release." }
}

function Restore-MobileAppConfigIfDirty {
  $status = git -C $root status --porcelain -- 'apps/mobile/app.json'
  if ($status) {
    Write-Host '[cleanup] restore apps/mobile/app.json (remove auto-bumped versionCode)'
    git -C $root restore -- 'apps/mobile/app.json'
  }
}

function Invoke-CommandWithTimeoutRetry {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [string]$WorkingDirectory,
    [int]$TimeoutSeconds = 180,
    [int]$MaxAttempts = 3,
    [int]$BaseSleepSeconds = 8,
    [switch]$CaptureStdout
  )

  $cwd = if ($WorkingDirectory) { $WorkingDirectory } else { $root }

  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    Write-Host "[run] attempt $attempt/$MaxAttempts (timeout ${TimeoutSeconds}s): $Command"

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'cmd.exe'
    $psi.Arguments = "/d /s /c ""$Command"""
    $psi.WorkingDirectory = $cwd
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $psi
    if (-not $p.Start()) { throw "Failed to start command: $Command" }

    $outBuilder = New-Object System.Text.StringBuilder
    $errBuilder = New-Object System.Text.StringBuilder
    $state = [hashtable]::Synchronized(@{ LastOutputAt = Get-Date; LastHeartbeatAt = Get-Date })

    $outHandler = [System.Diagnostics.DataReceivedEventHandler]{ param($sender, $e) if ($null -ne $e.Data) { [void]$outBuilder.AppendLine($e.Data); Write-Host $e.Data; $state.LastOutputAt = Get-Date } }
    $errHandler = [System.Diagnostics.DataReceivedEventHandler]{ param($sender, $e) if ($null -ne $e.Data) { [void]$errBuilder.AppendLine($e.Data); Write-Host $e.Data; $state.LastOutputAt = Get-Date } }

    $p.add_OutputDataReceived($outHandler)
    $p.add_ErrorDataReceived($errHandler)
    $p.BeginOutputReadLine()
    $p.BeginErrorReadLine()

    $startAt = Get-Date
    $timedOut = $false
    while (-not $p.HasExited) {
      Start-Sleep -Seconds 1
      $elapsed = (Get-Date) - $startAt
      if ($elapsed.TotalSeconds -ge $TimeoutSeconds) {
        $timedOut = $true
        try { $p.Kill() } catch {}
        try { $p.WaitForExit() } catch {}
        Write-Host "[timeout] command exceeded ${TimeoutSeconds}s and was terminated."
        break
      }

      $silence = (Get-Date) - $state.LastOutputAt
      $beatGap = (Get-Date) - $state.LastHeartbeatAt
      if ($silence.TotalSeconds -ge 20 -and $beatGap.TotalSeconds -ge 15) {
        Write-Host "[heartbeat] command still running ({0}s elapsed, no new output for {1}s)..." -f [int]$elapsed.TotalSeconds, [int]$silence.TotalSeconds
        $state.LastHeartbeatAt = Get-Date
      }
    }

    try { $p.CancelOutputRead() } catch {}
    try { $p.CancelErrorRead() } catch {}
    try { $p.remove_OutputDataReceived($outHandler) } catch {}
    try { $p.remove_ErrorDataReceived($errHandler) } catch {}

    $stdout = $outBuilder.ToString()
    if (-not $timedOut -and $p.ExitCode -eq 0) {
      if ($CaptureStdout) { return $stdout }
      return
    }

    if ($attempt -ge $MaxAttempts) {
      if ($timedOut) { throw "Command timed out after $MaxAttempts attempts: $Command" }
      throw "Command failed after $MaxAttempts attempts: $Command"
    }

    $wait = $BaseSleepSeconds * $attempt
    Write-Host "[retry] restart in ${wait}s..."
    Start-Sleep -Seconds $wait
  }
}

function Wait-BuildFinished {
  param(
    [Parameter(Mandatory = $true)][string]$BuildId,
    [int]$TimeoutMinutes = 45
  )

  $deadline = (Get-Date).AddMinutes($TimeoutMinutes)
  while ((Get-Date) -lt $deadline) {
    $jsonRaw = Invoke-CommandWithTimeoutRetry -Command "corepack pnpm dlx eas-cli build:view $BuildId --json" -WorkingDirectory $mobileDir -TimeoutSeconds 90 -MaxAttempts 3 -BaseSleepSeconds 6 -CaptureStdout
    $obj = $jsonRaw | ConvertFrom-Json
    $status = "$($obj.status)"
    Write-Host "[build] $BuildId => $status"
    if ($status -eq 'finished') { return $obj }
    if ($status -eq 'errored' -or $status -eq 'canceled') { throw "Build ended with status: $status" }
    Write-Host '[build] still running, check again in 20s...'
    Start-Sleep -Seconds 20
  }
  throw "Timeout waiting for build to finish: $BuildId"
}

Ensure-ExpoToken
Ensure-GitSafeDirectory
Ensure-CleanWorktree

try {
  Write-Host 'Step 1/7: check Expo token'
  if (-not $env:EXPO_TOKEN) { throw 'EXPO_TOKEN missing in current session.' }
  Write-Host '[expo] EXPO_TOKEN loaded. skip whoami to avoid CLI hang.'

  Write-Host 'Step 2/7: capture release commit'
  $releaseCommit = (git -C $root rev-parse HEAD).Trim()
  Write-Host "[release] commit = $releaseCommit"

  Write-Host 'Step 3/7: trigger Android APK build'
  $buildRaw = Invoke-CommandWithTimeoutRetry -Command 'corepack pnpm dlx eas-cli build -p android --profile preview --non-interactive --json' -WorkingDirectory $mobileDir -TimeoutSeconds 1200 -MaxAttempts 3 -BaseSleepSeconds 10 -CaptureStdout
  Restore-MobileAppConfigIfDirty

  $buildObj = $buildRaw | ConvertFrom-Json
  if ($buildObj -is [System.Array]) { $buildId = "$($buildObj[0].id)" } else { $buildId = "$($buildObj.id)" }
  if (-not $buildId) { throw 'Unable to parse build id from EAS output' }
  Write-Host "[release] build id = $buildId"

  Write-Host 'Step 4/7: wait build complete'
  $final = Wait-BuildFinished -BuildId $buildId

  $apkUrl = "$($final.artifacts.applicationArchiveUrl)"
  if (-not $apkUrl) { throw 'Build finished but no application archive URL found.' }
  Write-Host "[release] apk url = $apkUrl"

  Write-Host 'Step 5/7: publish site redirect to Expo artifact'
  Invoke-CommandWithTimeoutRetry -Command "powershell -ExecutionPolicy Bypass -File .\scripts\publish-apk-to-site.ps1 -ArtifactUrl '$apkUrl'" -WorkingDirectory $root -TimeoutSeconds 300 -MaxAttempts 2 -BaseSleepSeconds 5

  Write-Host 'Step 6/7: write release meta'
  $metaDir = Join-Path $root 'apps\site\public\downloads'
  $metaPath = Join-Path $metaDir 'release-meta.json'
  $meta = [ordered]@{ commit = $releaseCommit; buildId = $buildId; apkUrl = $apkUrl; releasedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss') }
  $metaJson = $meta | ConvertTo-Json
  [System.IO.File]::WriteAllText($metaPath, $metaJson, (New-Object System.Text.UTF8Encoding($false)))

  Write-Host 'Step 7/7: commit and push synchronized release'
  git -C $root add vercel.json apps/site/vercel.json apps/site/public/downloads/release-meta.json

  $staged = git -C $root diff --cached --name-only
  if (-not $staged) {
    Write-Host '[release] no redirect/meta diff to commit. skip git push.'
  } else {
    git -C $root commit -m "chore(release): sync redirect from $($releaseCommit.Substring(0,7))"
    Invoke-CommandWithTimeoutRetry -Command 'git push -u origin main' -WorkingDirectory $root -TimeoutSeconds 90 -MaxAttempts 3 -BaseSleepSeconds 8
  }

  Write-Host '[done] Sync release completed.'
  Write-Host "- Build ID: $buildId"
  Write-Host "- APK URL : $apkUrl"
  Write-Host '- Site URL: /download/app.apk (redirect)'
} finally {
  Set-Location $root
  Restore-MobileAppConfigIfDirty
}
