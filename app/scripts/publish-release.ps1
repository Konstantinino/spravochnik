# Публикация Setup на production. Секреты — только в .env.deploy (не в git).
# Usage: .\scripts\publish-release.ps1 [path\to\Setup.exe]

$ErrorActionPreference = 'Stop'
$env:Path = "C:\Program Files\nodejs;" + $env:Path

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..' '..')).Path
. (Join-Path $repoRoot 'scripts' 'Load-DeployEnv.ps1')

if (-not $env:RESTINFO_SERVER_URL) {
  Write-Error 'RESTINFO_SERVER_URL не задан в .env.deploy'
}

if (-not $env:RESTINFO_ADMIN_TOKEN) {
  if ($env:RESTINFO_ADMIN_EMAIL -and $env:RESTINFO_ADMIN_PASSWORD) {
    $body = @{
      email    = $env:RESTINFO_ADMIN_EMAIL
      password = $env:RESTINFO_ADMIN_PASSWORD
    } | ConvertTo-Json -Compress
    $loginUrl = ($env:RESTINFO_SERVER_URL -replace '/+$', '') + '/auth/login'
    $r = Invoke-RestMethod -Uri $loginUrl -Method POST -ContentType 'application/json' -Body $body
    $env:RESTINFO_ADMIN_TOKEN = $r.token
  } else {
    Write-Error 'Задайте RESTINFO_ADMIN_TOKEN или RESTINFO_ADMIN_EMAIL + RESTINFO_ADMIN_PASSWORD в .env.deploy'
  }
}

$setupArg = $args[0]
if (-not $setupArg) {
  $releaseDir = Join-Path $PSScriptRoot '..' 'release'
  $latest = Get-ChildItem -Path $releaseDir -Filter 'REST-INFO-Setup-*.exe' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if (-not $latest) {
    Write-Error "Setup не найден в $releaseDir. Сначала: npm run dist:ascii"
  }
  $setupArg = $latest.FullName
}

Set-Location (Join-Path $PSScriptRoot '..')
node scripts/upload-release.js $setupArg
