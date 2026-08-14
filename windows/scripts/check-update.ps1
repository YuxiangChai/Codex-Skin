[CmdletBinding()]
param(
  [switch]$Json,
  [switch]$Interactive
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0
$engineRoot = Split-Path -Parent $PSScriptRoot
$versionPath = Join-Path $engineRoot 'VERSION'
$repository = 'YuxiangChai/Codex-Skin'
$releasePage = "https://github.com/$repository/releases/latest"
$maximumInstallerBytes = 134217728L
. (Join-Path $PSScriptRoot 'theme-windows.ps1')
. (Join-Path $PSScriptRoot 'localization-windows.ps1')
$stateRoot = Join-Path $env:LOCALAPPDATA 'CodexDreamSkin'
$language = Resolve-DreamSkinLanguage -StateRoot $stateRoot

function Get-DreamSkinUpdateText {
  param([Parameter(Mandatory = $true)][string]$Key, [object[]]$FormatArguments = @())
  Get-DreamSkinText -Key $Key -Language $language -FormatArguments $FormatArguments
}

function ConvertTo-DreamSkinVersion {
  param([Parameter(Mandatory = $true)][string]$Value)
  $normalized = $Value.Trim()
  if ($normalized.StartsWith('v', [System.StringComparison]::OrdinalIgnoreCase)) {
    $normalized = $normalized.Substring(1)
  }
  if ($normalized -cnotmatch '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*))?$') {
    throw "Invalid release version: $Value"
  }
  $parsed = $null
  if (-not [version]::TryParse($normalized, [ref]$parsed)) {
    throw "Invalid release version: $Value"
  }
  return $parsed
}

function Get-DreamSkinRelease {
  if ($env:CODEX_DREAM_SKIN_TEST_RESPONSE_FILE) {
    $fixturePath = [System.IO.Path]::GetFullPath($env:CODEX_DREAM_SKIN_TEST_RESPONSE_FILE)
    if (-not (Test-Path -LiteralPath $fixturePath -PathType Leaf)) {
      throw 'Test update response does not exist.'
    }
    $fixtureInfo = Get-Item -LiteralPath $fixturePath -Force
    if (($fixtureInfo.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0 -or
      $fixtureInfo.Length -le 0 -or $fixtureInfo.Length -gt 1048576) {
      throw 'Test update response is linked, empty, or oversized.'
    }
    return [System.IO.File]::ReadAllText(
      $fixturePath,
      [System.Text.UTF8Encoding]::new($false, $true)
    ) | ConvertFrom-Json
  }
  $headers = @{ Accept = 'application/vnd.github+json'; 'User-Agent' = 'CodexDreamSkin' }
  $previousProtocol = [Net.ServicePointManager]::SecurityProtocol
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repository/releases/latest" `
      -Headers $headers -Method Get -TimeoutSec 12
    return $release
  } finally {
    [Net.ServicePointManager]::SecurityProtocol = $previousProtocol
  }
}

function Get-DreamSkinUpdateResult {
  param(
    [Parameter(Mandatory = $true)][version]$Current,
    [Parameter(Mandatory = $true)][string]$CurrentText,
    [Parameter(Mandatory = $true)][object]$Release
  )
  if (-not $Release.tag_name) { throw 'GitHub did not return a release tag.' }
  $latest = ConvertTo-DreamSkinVersion -Value "$($Release.tag_name)"
  $latestText = $latest.ToString()
  $assetName = "CodexDreamSkin-Setup-v$latestText.exe"
  $assetUrl = "https://github.com/$repository/releases/download/v$latestText/$assetName"
  $assetMatches = @($Release.assets | Where-Object {
    "$($_.name)" -ceq $assetName -and "$($_.browser_download_url)" -ceq $assetUrl
  })
  if ($assetMatches.Count -ne 1) {
    throw 'GitHub release does not contain exactly one expected Windows installer.'
  }
  $asset = $assetMatches[0]
  $assetBytes = 0L
  if (-not [long]::TryParse("$($asset.size)", [ref]$assetBytes) -or
    $assetBytes -le 0 -or $assetBytes -gt $maximumInstallerBytes) {
    throw 'GitHub returned an unsupported Windows installer size.'
  }
  $digest = "$($asset.digest)"
  $digestMatch = [regex]::Match(
    $digest,
    '\Asha256:([0-9a-f]{64})\z',
    [System.Text.RegularExpressions.RegexOptions]::CultureInvariant
  )
  if (-not $digestMatch.Success) {
    throw 'GitHub release does not contain a valid Windows installer digest.'
  }
  return [pscustomobject]@{
    currentVersion = "v$CurrentText"
    latestVersion = "v$latestText"
    updateAvailable = $latest -gt $Current
    releaseUrl = $releasePage
    assetName = $assetName
    assetUrl = $assetUrl
    assetBytes = $assetBytes
    assetSha256 = $digestMatch.Groups[1].Value
  }
}

function Save-DreamSkinBoundedHttpsFile {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][string]$Destination,
    [Parameter(Mandatory = $true)][long]$MaximumBytes
  )
  $currentUri = [System.Uri]$Uri
  if (-not $currentUri.IsAbsoluteUri -or $currentUri.Scheme -cne 'https') {
    throw 'Update installer URL must use HTTPS.'
  }

  Add-Type -AssemblyName System.Net.Http
  $handler = [System.Net.Http.HttpClientHandler]::new()
  $handler.AllowAutoRedirect = $false
  $client = [System.Net.Http.HttpClient]::new($handler)
  $client.Timeout = [TimeSpan]::FromMinutes(15)
  try {
    for ($redirectCount = 0; $redirectCount -le 5; $redirectCount += 1) {
      $response = $client.GetAsync(
        $currentUri,
        [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead
      ).GetAwaiter().GetResult()
      $statusCode = [int]$response.StatusCode
      if ($statusCode -ge 300 -and $statusCode -lt 400) {
        try {
          $location = $response.Headers.Location
          if ($null -eq $location) { throw 'Update download redirect has no location.' }
          if ($redirectCount -ge 5) { throw 'Update download exceeded the redirect limit.' }
          if ($location.IsAbsoluteUri) {
            $nextUri = $location
          } else {
            $nextUri = [System.Uri]::new($currentUri, "$location")
          }
          if ($nextUri.Scheme -cne 'https') {
            throw 'Update download refused a non-HTTPS redirect.'
          }
          $currentUri = $nextUri
        } finally {
          $response.Dispose()
        }
        continue
      }

      try {
        if (-not $response.IsSuccessStatusCode) {
          throw "Update download failed with HTTP status $statusCode."
        }
        $contentLength = $response.Content.Headers.ContentLength
        if ($null -ne $contentLength -and
          ($contentLength -le 0 -or $contentLength -gt $MaximumBytes)) {
          throw 'Update download content length is outside the allowed size.'
        }
        $inputStream = $response.Content.ReadAsStreamAsync().GetAwaiter().GetResult()
        $outputStream = [System.IO.File]::Open(
          $Destination,
          [System.IO.FileMode]::CreateNew,
          [System.IO.FileAccess]::Write,
          [System.IO.FileShare]::None
        )
        try {
          $buffer = New-Object byte[] 65536
          $totalBytes = 0L
          while (($read = $inputStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
            $totalBytes += $read
            if ($totalBytes -gt $MaximumBytes) {
              throw 'Update download exceeded the allowed size.'
            }
            $outputStream.Write($buffer, 0, $read)
          }
          $outputStream.Flush($true)
        } finally {
          $outputStream.Dispose()
          $inputStream.Dispose()
        }
      } finally {
        $response.Dispose()
      }
      return
    }
    throw 'Update download exceeded the redirect limit.'
  } finally {
    $client.Dispose()
    $handler.Dispose()
  }
}

function Assert-DreamSkinUpdateDirectory {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$StateRoot
  )
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  Ensure-DreamSkinManagedDirectory -Path $fullPath -Root $StateRoot
  return $fullPath
}

function Save-DreamSkinUpdate {
  param([Parameter(Mandatory = $true)][object]$Result)
  if (-not $Result.updateAvailable) { throw 'The installed version is already current.' }
  if (-not $env:LOCALAPPDATA) { throw 'LOCALAPPDATA is unavailable.' }

  $stateRoot = [System.IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'CodexDreamSkin'))
  Ensure-DreamSkinManagedDirectory -Path $stateRoot -Root $stateRoot
  $updateRoot = Assert-DreamSkinUpdateDirectory `
    -Path (Join-Path $stateRoot 'updates') -StateRoot $stateRoot
  $stagingRoot = Join-Path $updateRoot ('.staging-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $stagingRoot | Out-Null
  try {
    $stagedInstaller = Join-Path $stagingRoot $Result.assetName
    Save-DreamSkinBoundedHttpsFile -Uri $Result.assetUrl `
      -Destination $stagedInstaller -MaximumBytes $maximumInstallerBytes
    $installerInfo = Get-Item -LiteralPath $stagedInstaller -Force
    if (($installerInfo.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw 'Downloaded installer cannot be a reparse point.'
    }
    if ($installerInfo.Length -ne [long]$Result.assetBytes) {
      throw 'Downloaded installer size does not match release metadata.'
    }
    $actualSha256 = (Get-FileHash -LiteralPath $stagedInstaller -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualSha256 -cne "$($Result.assetSha256)") {
      throw 'Downloaded installer SHA-256 does not match release metadata.'
    }

    $installerPath = Join-Path $updateRoot $Result.assetName
    $previousInstaller = ''
    if (Test-Path -LiteralPath $installerPath) {
      $existing = Get-Item -LiteralPath $installerPath -Force
      if (($existing.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
        throw 'Refusing to replace a linked update installer.'
      }
      $previousInstaller = Join-Path $updateRoot (
        '.previous-' + [guid]::NewGuid().ToString('N') + '.exe'
      )
      Move-Item -LiteralPath $installerPath -Destination $previousInstaller
    }
    try {
      Move-Item -LiteralPath $stagedInstaller -Destination $installerPath
    } catch {
      if ($previousInstaller -and (Test-Path -LiteralPath $previousInstaller)) {
        Move-Item -LiteralPath $previousInstaller -Destination $installerPath
      }
      throw
    }
    if ($previousInstaller -and (Test-Path -LiteralPath $previousInstaller)) {
      Remove-Item -LiteralPath $previousInstaller -Force
    }
    Start-Process -FilePath $installerPath | Out-Null
    return $installerPath
  } finally {
    if (Test-Path -LiteralPath $stagingRoot) {
      Remove-Item -LiteralPath $stagingRoot -Recurse -Force
    }
  }
}

function Show-DreamSkinUpdateResult {
  param([Parameter(Mandatory = $true)][object]$Result)
  Add-Type -AssemblyName System.Windows.Forms
  if ($Result.updateAvailable) {
    $choice = [System.Windows.Forms.MessageBox]::Show(
      ((Get-DreamSkinUpdateText -Key 'UpdateAvailable' -FormatArguments @($Result.latestVersion)) +
        [Environment]::NewLine + [Environment]::NewLine +
        (Get-DreamSkinUpdateText -Key 'UpdateQuestion')),
      (Get-DreamSkinUpdateText -Key 'UpdateTitle'),
      [System.Windows.Forms.MessageBoxButtons]::YesNo,
      [System.Windows.Forms.MessageBoxIcon]::Information
    )
    if ($choice -eq [System.Windows.Forms.DialogResult]::Yes) {
      [void](Save-DreamSkinUpdate -Result $Result)
    }
    return
  }
  [void][System.Windows.Forms.MessageBox]::Show(
    (Get-DreamSkinUpdateText -Key 'UpToDate' -FormatArguments @($Result.currentVersion)),
    (Get-DreamSkinUpdateText -Key 'UpdateTitle'),
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
  )
}

try {
  if (-not (Test-Path -LiteralPath $versionPath -PathType Leaf)) {
    throw "Installed version file is missing: $versionPath"
  }
  $currentText = ([System.IO.File]::ReadAllText($versionPath)).Trim()
  $current = ConvertTo-DreamSkinVersion -Value $currentText
  $release = Get-DreamSkinRelease
  $result = Get-DreamSkinUpdateResult -Current $current -CurrentText $currentText -Release $release
  if ($Json) { $result | ConvertTo-Json -Compress }
  if ($Interactive) { Show-DreamSkinUpdateResult -Result $result }
  if (-not $Json -and -not $Interactive) {
    Write-Host "$($result.currentVersion) -> $($result.latestVersion); update=$($result.updateAvailable)"
  }
} catch {
  if ($Json) {
    [pscustomobject]@{ error = $_.Exception.Message; releaseUrl = $releasePage } | ConvertTo-Json -Compress
  }
  if ($Interactive) {
    Add-Type -AssemblyName System.Windows.Forms
    [void][System.Windows.Forms.MessageBox]::Show(
      ((Get-DreamSkinUpdateText -Key 'UpdateFailed') + [Environment]::NewLine +
        [Environment]::NewLine + $_.Exception.Message),
      (Get-DreamSkinUpdateText -Key 'UpdateTitle'),
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Warning
    )
  }
  if (-not $Json -and -not $Interactive) { throw }
  exit 1
}
