# Загружает переменные из .env.deploy в текущую сессию PowerShell.
# Использование: . "$PSScriptRoot\Load-DeployEnv.ps1"

param(
  [string]$EnvFile = (Join-Path $PSScriptRoot '..' '.env.deploy')
)

$EnvFile = [System.IO.Path]::GetFullPath($EnvFile)

if (-not (Test-Path -LiteralPath $EnvFile)) {
  Write-Error @"
Файл не найден: $EnvFile
Создайте его из шаблона:
  copy .env.deploy.example .env.deploy
"@
  exit 1
}

Get-Content -LiteralPath $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq '' -or $line.StartsWith('#')) { return }
  $eq = $line.IndexOf('=')
  if ($eq -lt 1) { return }
  $name = $line.Substring(0, $eq).Trim()
  $value = $line.Substring($eq + 1).Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  Set-Item -Path "Env:$name" -Value $value
}
