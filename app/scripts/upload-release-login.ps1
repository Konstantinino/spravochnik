# Публикация релиза на production: Setup.exe + latest.yml + .blockmap + POST /admin/releases.
# Usage:
#   .\scripts\upload-release-login.ps1
#   .\scripts\upload-release-login.ps1 release\REST-INFO-Setup-1.5.1.exe
#
# Пароль: параметр -Password, или $env:RESTINFO_ADMIN_PASSWORD, или запрос в консоли.

param(
  [string]$SetupPath = '',
  [string]$ServerUrl = 'https://info.r-est.ru',
  [string]$Email = 'kostya.alone18@yandex.ru',
  [string]$Password = ''
)

$ErrorActionPreference = 'Stop'
$env:Path = "C:\Program Files\nodejs;" + $env:Path

$appRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $appRoot

function Resolve-SetupPath {
  if ($SetupPath) {
    return (Resolve-Path -LiteralPath $SetupPath).Path
  }
  $releaseDir = Join-Path $appRoot 'release'
  $latest = Get-ChildItem -Path $releaseDir -Filter 'REST-INFO-Setup-*.exe' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if (-not $latest) {
    throw "Setup не найден в $releaseDir. Сначала: npm run dist:ascii"
  }
  return $latest.FullName
}

function Ensure-ReleaseSidecars {
  param([string]$ExePath)
  $releaseDir = Split-Path -Parent $ExePath
  $exeName = [System.IO.Path]::GetFileName($ExePath)
  $blockmapName = "$exeName.blockmap"
  $yml = Join-Path $releaseDir 'latest.yml'
  $blockmap = Join-Path $releaseDir $blockmapName

  $asciiRelease = 'C:\spravochnik-build\app\release'
  if (Test-Path -LiteralPath $asciiRelease) {
    foreach ($name in @('latest.yml', $blockmapName)) {
      $dest = Join-Path $releaseDir $name
      if (-not (Test-Path -LiteralPath $dest)) {
        $src = Join-Path $asciiRelease $name
        if (Test-Path -LiteralPath $src) {
          Copy-Item -LiteralPath $src -Destination $dest -Force
          Write-Host "Скопировано из ASCII-сборки: $name"
        }
      }
    }
  }

  if (-not (Test-Path -LiteralPath $yml)) {
    throw @"
Не найден latest.yml в $releaseDir.
Он создаётся вместе с Setup (npm run dist:ascii). Без него кнопка «Обновить» в клиенте не появится.
"@
  }
  if (-not (Test-Path -LiteralPath $blockmap)) {
    throw @"
Не найден $blockmap.
Соберите установщик заново (npm run dist:ascii) или скопируйте blockmap из C:\spravochnik-build\app\release\
"@
  }
}

$setup = Resolve-SetupPath
Ensure-ReleaseSidecars -ExePath $setup

if (-not $Password) { $Password = $env:RESTINFO_ADMIN_PASSWORD }
if (-not $Password) {
  $secure = Read-Host 'Пароль REST INFO' -AsSecureString
  $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  )
}

$loginUrl = ($ServerUrl.TrimEnd('/')) + '/auth/login'
$body = @{ email = $Email; password = $Password } | ConvertTo-Json -Compress
$r = Invoke-RestMethod -Uri $loginUrl -Method POST -ContentType 'application/json' -Body $body
if (-not $r.token) { throw 'Login не вернул token' }

$env:RESTINFO_ADMIN_TOKEN = $r.token
$env:RESTINFO_SERVER_URL = $ServerUrl.TrimEnd('/')

Write-Host "Загрузка на сервер: Setup + latest.yml + blockmap..."
node (Join-Path $PSScriptRoot 'upload-release.js') $setup

Write-Host 'Готово. Проверка:'
Write-Host "  curl -s $env:RESTINFO_SERVER_URL/app/updates/latest.yml | head -3"
