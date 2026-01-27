<#
PowerShell script: Get-Env.ps1
Load, validate and export environment variables for PowerShell session.
Usage:
- Source into your session to export vars: . Sub-Son1k-2.3/scripts/Get-Env.ps1
- Or specify a custom .env: . Sub-Son1k-2.3/scripts/Get-Env.ps1 -EnvFile ".env"
#>
param([string]$EnvFile = "$PSScriptRoot\.env")

# Load env from file and export to current session
function Load-EnvFromFile {
  param([string]$Path)
  if (Test-Path $Path) {
    Write-Host "Loading environment from $Path..."
    foreach ($line in Get-Content $Path) {
      $l = $line.Trim()
      if ([string]::IsNullOrWhiteSpace($l) -or $l.StartsWith('#')) { continue }
      if ($l -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        $key = $Matches[1]
        $val = $Matches[2]
        if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Substring(1, $val.Length - 2) }
        elseif ($val.StartsWith("'") -and $val.EndsWith("'")) { $val = $val.Substring(1, $val.Length - 2) }
        # Export to PowerShell session (process scope -> visible to child processes)
        $env:$key = $val
        # Also update environment provider for completeness
        [System.Environment]::SetEnvironmentVariable($key, $val, [System.EnvironmentVariableTarget]::Process)
      }
    }
  } else {
    Write-Host "No .env file found at $Path"
  }
}

function Prompt-ForVars {
  if (-not $env:JWT_SECRET) {
    $JWT_SECRET = Read-Host -Prompt "JWT_SECRET"
    $env:JWT_SECRET = $JWT_SECRET
  } else {
    $JWT_SECRET = $env:JWT_SECRET
  }
  if (-not $env:DATABASE_URL) {
    $DATABASE_URL = Read-Host -Prompt "DATABASE_URL"
    $env:DATABASE_URL = $DATABASE_URL
  } else {
    $DATABASE_URL = $env:DATABASE_URL
  }
  if (-not $env:REDIS_URL) {
    $REDIS_URL = Read-Host -Prompt "REDIS_URL"
    $env:REDIS_URL = $REDIS_URL
  } else {
    $REDIS_URL = $env:REDIS_URL
  }

  # Persist to .env for future runs
  $lines = @("JWT_SECRET=$JWT_SECRET","DATABASE_URL=$DATABASE_URL","REDIS_URL=$REDIS_URL")
  $envPath = $EnvFile
  $dir = Split-Path -Parent $envPath
  if (-not (Test-Path $dir)) { New-Item -Path $dir -ItemType Directory -Force | Out-Null }
  $lines | Set-Content -Path $envPath -Encoding UTF8
  Write-Host "Saved env to $envPath"
  # Export to session (in case not already)
  $env:JWT_SECRET = $JWT_SECRET
  $env:DATABASE_URL = $DATABASE_URL
  $env:REDIS_URL = $REDIS_URL
}

function Show-Summary {
  $jwtLen = if ($env:JWT_SECRET) { $env:JWT_SECRET.Length } else { 0 }
  $dbLen  = if ($env:DATABASE_URL) { $env:DATABASE_URL.Length } else { 0 }
  $redisLen = if ($env:REDIS_URL) { $env:REDIS_URL.Length } else { 0 }
  Write-Host "ENV summary (lengths): JWT_SECRET=$jwtLen; DATABASE_URL=$dbLen; REDIS_URL=$redisLen"
  Write-Host "Note: secrets are not printed for security."
}

# Main flow
Write-Host "Get-Env.ps1: exporting environment for the current PowerShell session"
Load-EnvFromFile -Path $EnvFile

if (-not $env:JWT_SECRET -or -not $env:DATABASE_URL -or -not $env:REDIS_URL) {
  Write-Host "One or more environment variables missing. Enter them now."
  Prompt-ForVars
} else {
  Write-Host "Environment variables loaded from .env or existing session."
}
Show-Summary

# The script is intended to be dot-sourced to affect the current shell
Write-Host "Variables prepared. To use in this shell, run: . ./scripts/Get-Env.ps1" -ForegroundColor Yellow
