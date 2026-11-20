<#
  Installs and keeps up to date agent-desktop (https://github.com/vercel-labs/agent-desktop, Apache-2.0) for the
  zero1code skill "controllo-app-desktop". Windows PowerShell 5.1 compatible, no admin rights, no other tools needed.

  Usage:
    agent-desktop.ps1            -> prints AGENT_DESKTOP=<path>; installs by itself the newest version approved by
                                    zero1code (approved.json, next to this skill's SKILL.md)
    agent-desktop.ps1 -Install   -> first installation, or accepts a new major version (only after the user said yes)
    agent-desktop.ps1 -Check     -> forces the upstream check now
    agent-desktop.ps1 -Rollback  -> goes back to the previous installed version and stays there until -Install

  Exit codes: 0 ready (path printed), 2 not installed yet (ask the user, then -Install), 1 error.
  Other lines: INSTALLED / UPDATED / REVOKED / ROLLED_BACK / CONSENT_NEEDED (new major version: ask the user, then
  -Install) / WARNING.

  Trust model: only versions listed in approved.json are installed, and only if the downloaded archive has exactly the
  sha256 written there. zero1code approves a version (desktop/scripts/approve-agent-desktop.mjs) after it has been public
  for at least 7 days and its GitHub build attestation has been verified with Sigstore (gh attestation verify). A new
  approved.json reaches users with the skill, through the app's default-skill updates. The archive must also match
  GitHub's upload digest, the release's checksums.txt and the attestation read from GitHub's API (defense in depth,
  not independent proof). A version removed from approved.json is replaced (REVOKED); a release that disappears or
  changes upstream is reported.
#>
[CmdletBinding()]
param([switch]$Install, [switch]$Check, [switch]$Rollback)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

$Repo = 'vercel-labs/agent-desktop'
$Api = "https://api.github.com/repos/$Repo"
$DownloadPrefix = "https://github.com/$Repo/releases/download/"
$ApprovedFile = Join-Path (Split-Path -Parent $PSScriptRoot) 'approved.json'
$CheckEveryHours = 24
$RetryAfterFailureHours = 3
$TagPattern = '^v[0-9]+\.[0-9]+\.[0-9]+\z'
$Headers = @{ 'User-Agent' = 'zero1code-skill'; 'Accept' = 'application/vnd.github+json' }

function Read-State {
  for ($i = 0; $i -lt 3; $i++) {
    try { return Get-Content -Raw -LiteralPath $StateFile | ConvertFrom-Json } catch { Start-Sleep -Milliseconds 200 }
  }
  return $null
}

function Write-State($s) {
  $tmp = "$StateFile.$PID.tmp"
  ($s | ConvertTo-Json) | Set-Content -LiteralPath $tmp -Encoding UTF8
  Move-Item -LiteralPath $tmp -Destination $StateFile -Force
}

function New-State($version, $sha, $previous, $archiveDigest, [bool]$pinned = $false) {
  return [ordered]@{ version = $version; sha256 = $sha; archiveDigest = $archiveDigest; previous = $previous
    pinned = $pinned; checkedAt = (Get-Date).ToUniversalTime().ToString('o'); lastAttempt = $null }
}

function Set-Checked($s, [bool]$failed) {
  $now = (Get-Date).ToUniversalTime().ToString('o')
  $s | Add-Member -NotePropertyName lastAttempt -NotePropertyValue $(if ($failed) { $now } else { $null }) -Force
  if (-not $failed) { $s | Add-Member -NotePropertyName checkedAt -NotePropertyValue $now -Force }
  Write-State $s
}

function Test-Tag([string]$tag) { return ($tag -cmatch $TagPattern) }
function Get-VersionOf([string]$tag) { return [version]($tag.Substring(1)) }
function Get-ExePath([string]$tag) { return (Join-Path (Join-Path $Root $tag) 'agent-desktop.exe') }
function Get-Sha256([string]$path) { return (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Get-Utc($value) { return ([datetime]$value).ToUniversalTime() }

function Get-Arch {
  $a = $env:PROCESSOR_ARCHITEW6432; if (-not $a) { $a = $env:PROCESSOR_ARCHITECTURE }
  switch ($a) { 'AMD64' { 'x86_64' } 'ARM64' { 'aarch64' } default { throw "Unsupported processor: $a" } }
}

function Get-AssetName([string]$tag) { return "agent-desktop-$tag-$(Get-Arch)-pc-windows-msvc.tar.gz" }

# approved.json: [{ "version": "vX.Y.Z", "sha256": { "x86_64": "<hex>", "aarch64": "<hex>" } }, ...]
function Get-Approved {
  $arch = Get-Arch
  # assigned first: Windows PowerShell's ConvertFrom-Json emits a JSON array as ONE object, piping the variable enumerates it
  $list = ConvertFrom-Json (Get-Content -Raw -LiteralPath $ApprovedFile)
  $ok = @($list | ForEach-Object { $_ } | Where-Object { (Test-Tag $_.version) -and ([string]$_.sha256.$arch) -cmatch '^[0-9a-f]{64}\z' } |
    ForEach-Object { [pscustomobject]@{ version = $_.version; sha256 = [string]$_.sha256.$arch } })
  return @($ok | Sort-Object { Get-VersionOf $_.version } -Descending)
}

function Get-ApprovedFor($approved, [string]$tag) { return (@($approved | Where-Object { $_.version -ceq $tag }) | Select-Object -First 1) }

# installed exe = folder derived from the version (never a path read from the state), with the recorded sha256
function Get-InstalledExe($s) {
  if (-not $s -or -not (Test-Tag $s.version) -or -not $s.sha256) { return $null }
  $exe = Get-ExePath $s.version
  if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) { return $null }
  if ((Get-Sha256 $exe) -ne $s.sha256) { return $null }
  return $exe
}

function Get-Releases {
  return @(Invoke-RestMethod -Uri "$Api/releases?per_page=30" -Headers $Headers -UseBasicParsing -TimeoutSec 30)
}

function Get-Asset($release, [string]$name) {
  $asset = @($release.assets | Where-Object { $_.name -ceq $name })
  if ($asset.Count -ne 1) { throw "Release $($release.tag_name) has no single asset $name" }
  $asset = $asset[0]
  if (-not $asset.browser_download_url.StartsWith($DownloadPrefix)) { throw "Unexpected download URL for $name" }
  if ($asset.digest -cnotmatch '^sha256:[0-9a-f]{64}\z') { throw "No sha256 digest published for $name" }
  return $asset
}

function Test-Attestation([string]$name, [string]$sha) {
  $res = Invoke-RestMethod -Uri "$Api/attestations/sha256:$sha" -Headers $Headers -UseBasicParsing -TimeoutSec 30
  foreach ($att in @($res.attestations)) {
    try {
      $json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($att.bundle.dsseEnvelope.payload))
      $p = $json | ConvertFrom-Json
      if ($p.predicateType -cne 'https://slsa.dev/provenance/v1') { continue }
      $wf = $p.predicate.buildDefinition.externalParameters.workflow
      if ($wf.repository -cne "https://github.com/$Repo" -or $wf.path -cne '.github/workflows/release.yml' -or
          $wf.ref -cne 'refs/heads/main') { continue }
      if ($p.predicate.runDetails.builder.id -cne "https://github.com/$Repo/.github/workflows/release.yml@refs/heads/main") { continue }
      $hit = @($p.subject) | Where-Object { $_.name -ceq $name -and $_.digest.sha256 -ceq $sha }
      if ($hit) { return $true }
    } catch { continue }
  }
  return $false
}

function Test-Starts([string]$exe, [string]$work) {
  $p = Start-Process -FilePath $exe -ArgumentList 'version' -NoNewWindow -PassThru `
    -RedirectStandardOutput (Join-Path $work 'v.out') -RedirectStandardError (Join-Path $work 'v.err')
  $null = $p.Handle # without reading the handle first, ExitCode stays empty in Windows PowerShell
  if (-not $p.WaitForExit(20000)) { try { $p.Kill() } catch { }; throw 'agent-desktop version timed out' }
  if ($p.ExitCode -ne 0) { throw 'The downloaded agent-desktop.exe does not start' }
}

function Install-Release($release, $prevState, [string]$expected) {
  $tag = $release.tag_name
  $name = Get-AssetName $tag
  $asset = Get-Asset $release $name
  $sums = Get-Asset $release 'checksums.txt'
  if ($asset.digest -cne "sha256:$expected") { throw "$name on GitHub does not match the approved sha256" }

  $work = Join-Path $Root (".tmp-" + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $work | Out-Null
  try {
    $archive = Join-Path $work 'archive.tar.gz'
    $sumsFile = Join-Path $work 'checksums.txt'
    $dl = @{ 'User-Agent' = 'zero1code-skill' }
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $archive -Headers $dl -UseBasicParsing -TimeoutSec 300
    Invoke-WebRequest -Uri $sums.browser_download_url -OutFile $sumsFile -Headers $dl -UseBasicParsing -TimeoutSec 60

    if ((Get-Sha256 $archive) -ne $expected) { throw "sha256 of $name is not the approved one" }
    if ((Get-Sha256 $sumsFile) -ne $sums.digest.Substring(7)) { throw 'sha256 mismatch for checksums.txt' }
    $listed = @(Get-Content -LiteralPath $sumsFile | Where-Object { $_ -cmatch "^([0-9a-f]{64})\s+\*?$([regex]::Escape($name))\z" } |
      ForEach-Object { $Matches[1] })
    if ($listed.Count -ne 1 -or $listed[0] -ne $expected) { throw "$name is not listed once with the same sha256 in checksums.txt" }
    if (-not (Test-Attestation $name $expected)) { throw "No GitHub build attestation from $Repo release workflow for $name" }

    $tar = Join-Path $env:SystemRoot 'System32\tar.exe'
    if (-not (Test-Path -LiteralPath $tar)) { throw 'tar.exe not found (Windows 10 1803 or later is required)' }
    $entries = @(& $tar -tzf $archive)
    if ($LASTEXITCODE -ne 0) { throw 'Cannot read the archive' }
    if ($entries.Count -ne 1 -or $entries[0] -notin @('agent-desktop.exe', './agent-desktop.exe')) {
      throw "Unexpected archive content: $($entries -join ', ')"
    }
    $out = Join-Path $work 'out'
    New-Item -ItemType Directory -Path $out | Out-Null
    & $tar -xzf $archive -C $out $entries[0]
    if ($LASTEXITCODE -ne 0) { throw 'Cannot extract the archive' }
    $exe = Join-Path $out 'agent-desktop.exe'
    if (-not (Test-Path -LiteralPath $exe -PathType Leaf)) { throw 'agent-desktop.exe missing from the archive' }
    if ((Get-Item -LiteralPath $exe).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'agent-desktop.exe is a link' }
    $sha = Get-Sha256 $exe
    Test-Starts $exe $work

    $dest = Join-Path $Root $tag
    if (Test-Path -LiteralPath $dest) { Remove-Item -LiteralPath $dest -Recurse -Force }
    Move-Item -LiteralPath $out -Destination $dest

    $previous = $null
    if ($prevState -and (Test-Tag $prevState.version) -and $prevState.version -ne $tag) {
      $previous = [ordered]@{ version = $prevState.version; sha256 = $prevState.sha256; archiveDigest = $prevState.archiveDigest }
    }
    Write-State (New-State $tag $sha $previous $asset.digest)
    # keep the current and the previous version, remove older ones; a folder in use is left for next time
    Get-ChildItem -LiteralPath $Root -Directory | Where-Object {
      (Test-Tag $_.Name) -and $_.Name -ne $tag -and (-not $previous -or $_.Name -ne $previous.version)
    } | ForEach-Object { try { Remove-Item -LiteralPath $_.FullName -Recurse -Force } catch { } }
  } finally {
    Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
  }
}

$mutex = $null
try {
  $base = $env:LOCALAPPDATA
  if (-not $base -or -not [IO.Path]::IsPathRooted($base) -or $base.StartsWith('\\')) { $base = [Environment]::GetFolderPath('LocalApplicationData') }
  if (-not $base -or -not [IO.Path]::IsPathRooted($base) -or $base.StartsWith('\\')) { throw 'Local application data folder not available' }
  $Root = Join-Path $base 'zero1code\tools\agent-desktop'
  $StateFile = Join-Path $Root 'state.json'
  New-Item -ItemType Directory -Force -Path $Root | Out-Null

  # one installer at a time (several agents or sessions may use the skill together)
  $mutex = New-Object Threading.Mutex($false, 'Local\zero1code-agent-desktop')
  try { if (-not $mutex.WaitOne(300000)) { throw 'Another installation is still running' } } catch [Threading.AbandonedMutexException] { }

  $approved = Get-Approved
  if ($approved.Count -eq 0) { throw 'No approved agent-desktop version for this processor' }
  $target = $approved[0]

  $state = Read-State
  $exe = Get-InstalledExe $state
  if ($state -and $state.version -and -not $exe) { Write-Output "WARNING: installed agent-desktop $($state.version) is missing or changed on disk; reinstalling it." }

  if ($Rollback) {
    $prev = $state.previous
    if (-not $prev -or -not (Get-InstalledExe $prev)) { throw 'No previous version available' }
    if (-not (Get-ApprovedFor $approved $prev.version)) { throw "Previous version $($prev.version) is no longer approved" }
    Write-State (New-State $prev.version $prev.sha256 $null $prev.archiveDigest $true)
    Write-Output "ROLLED_BACK: agent-desktop $($state.version) -> $($prev.version)"
    Write-Output "AGENT_DESKTOP=$(Get-ExePath $prev.version)"
    exit 0
  }

  # the user already agreed once (a state exists): a missing or altered copy is reinstalled without asking again
  $consented = $Install -or ($state -and (Test-Tag $state.version))
  if (-not $exe -and -not $consented) {
    Write-Output 'NOT_INSTALLED: agent-desktop is not installed. Ask the user, then run this script with -Install.'
    exit 2
  }

  $mineOk = [bool]($exe -and (Get-ApprovedFor $approved $state.version))
  $pinned = [bool]($exe -and $state.pinned -and -not $Install)
  # work that does not wait for the daily check: first install, revoked version, newer approved version
  $wanted = (-not $exe) -or (-not $mineOk) -or ((-not $pinned) -and (Get-VersionOf $target.version) -gt (Get-VersionOf $state.version))
  $major = $exe -and $mineOk -and -not $Install -and (Get-VersionOf $target.version).Major -ne (Get-VersionOf $state.version).Major

  $due = $Check -or $Install -or ($wanted -and -not $major)
  if (-not $due) {
    try { $due = ((Get-Date).ToUniversalTime() - (Get-Utc $state.checkedAt)).TotalHours -ge $CheckEveryHours } catch { $due = $true }
  }
  if ($due -and $exe -and -not $Check -and -not $Install -and $state.lastAttempt) {
    try { $due = ((Get-Date).ToUniversalTime() - (Get-Utc $state.lastAttempt)).TotalHours -ge $RetryAfterFailureHours } catch { }
  }
  if ($major) {
    Write-Output "CONSENT_NEEDED: new major version $($target.version) (installed $($state.version)). Ask the user, then run with -Install."
  }

  if ($due) {
    try {
      $releases = Get-Releases
      if ($exe) {
        # the installed release must still exist upstream with the same asset
        $mine = @($releases | Where-Object { $_.tag_name -ceq $state.version })
        if ($mine.Count -eq 1) {
          $a = @($mine[0].assets | Where-Object { $_.name -ceq (Get-AssetName $state.version) })
          if ($a.Count -ne 1 -or ($state.archiveDigest -and $a[0].digest -cne $state.archiveDigest)) {
            Write-Output "WARNING: the installed release $($state.version) was changed upstream; tell the user."
          }
        } elseif (@($releases).Count -lt 30) {
          Write-Output "WARNING: the installed release $($state.version) was withdrawn upstream; tell the user."
        }
      }
      if ($wanted -and -not $major) {
        $release = @($releases | Where-Object { $_.tag_name -ceq $target.version -and -not $_.draft })
        if ($release.Count -ne 1) { throw "Approved release $($target.version) not found on GitHub" }
        Install-Release $release[0] $(if ($mineOk) { $state } else { $null }) $target.sha256
        if (-not $state -or -not $state.version) { Write-Output "INSTALLED: agent-desktop $($target.version)" }
        elseif (-not $exe) { Write-Output "INSTALLED: agent-desktop $($target.version) (reinstalled)" }
        elseif (-not $mineOk) { Write-Output "REVOKED: agent-desktop $($state.version) is no longer approved; replaced by $($target.version)" }
        else { Write-Output "UPDATED: agent-desktop $($state.version) -> $($target.version)" }
        $state = Read-State
        $exe = Get-InstalledExe $state
      } else {
        Set-Checked $state $false
      }
    } catch {
      if (-not $exe) { throw }
      # offline or a check failed: keep the installed version, try again in a few hours
      try { Set-Checked $state $true } catch { }
      Write-Output "WARNING: update failed, using installed $($state.version): $($_.Exception.Message)"
    }
  }

  if (-not $exe) { throw 'agent-desktop is not available' }
  Write-Output "AGENT_DESKTOP=$exe"
  exit 0
} catch {
  Write-Output "ERROR: $($_.Exception.Message)"
  exit 1
} finally {
  if ($mutex) { try { $mutex.ReleaseMutex() } catch { }; $mutex.Dispose() }
}
