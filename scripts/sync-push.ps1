param(
  [string]$Message = "chore: sync update"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$safeRepo = $repoRoot -replace "\\", "/"

Set-Location $repoRoot

function Invoke-Git {
  param([Parameter(Mandatory = $true)][string[]]$Args)
  & git @Args
  if ($LASTEXITCODE -ne 0) {
    throw "git command failed: git $($Args -join ' ')"
  }
}

function Invoke-GitWithRetry {
  param(
    [Parameter(Mandatory = $true)][string[]]$Args,
    [int]$MaxAttempts = 3,
    [int]$DelaySeconds = 2
  )

  $attempt = 1
  while ($attempt -le $MaxAttempts) {
    try {
      Invoke-Git -Args $Args
      return
    } catch {
      if ($attempt -ge $MaxAttempts) {
        throw
      }
      Write-Host "Git command failed (attempt $attempt/$MaxAttempts). Retrying in $DelaySeconds seconds..."
      Start-Sleep -Seconds $DelaySeconds
      $attempt++
    }
  }
}

function Get-AheadCount {
  $upstream = & git -c "safe.directory=$safeRepo" rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $upstream) {
    return -1
  }
  $count = & git -c "safe.directory=$safeRepo" rev-list --count "$upstream..HEAD"
  if ($LASTEXITCODE -ne 0 -or -not $count) {
    return 0
  }
  return [int]$count
}

$dirty = & git -c "safe.directory=$safeRepo" status --porcelain
if (-not $dirty) {
  $ahead = Get-AheadCount
  if ($ahead -gt 0 -or $ahead -lt 0) {
    Invoke-GitWithRetry -Args @("-c", "safe.directory=$safeRepo", "push", "origin", "main")
    $head = & git -c "safe.directory=$safeRepo" rev-parse --short HEAD
    Write-Host "No new file changes. Pushed existing local commits: $head"
    exit 0
  }
  Write-Host "No local changes to commit and no local commits to push."
  exit 0
}

Invoke-Git -Args @("-c", "safe.directory=$safeRepo", "add", "-A")
Invoke-Git -Args @("-c", "safe.directory=$safeRepo", "commit", "-m", $Message)
Invoke-GitWithRetry -Args @("-c", "safe.directory=$safeRepo", "push", "origin", "main")

$head = & git -c "safe.directory=$safeRepo" rev-parse --short HEAD
Write-Host "Committed and pushed: $head"
