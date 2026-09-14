# git pull + docker compose на production (через SSH).
# SSH-ключ — в ~/.ssh/, пароль в .env.deploy не нужен.
# Usage: .\scripts\server-deploy-remote.ps1 [--prod]

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\Load-DeployEnv.ps1"

$hostName = $env:RESTINFO_SSH_HOST
$user = $env:RESTINFO_SSH_USER
if (-not $hostName -or -not $user) {
  Write-Error 'Задайте RESTINFO_SSH_HOST и RESTINFO_SSH_USER в .env.deploy'
}

$prodFlag = if ($args -contains '--prod') { ' --prod' } else { '' }
$remoteCmd = "bash ~/spravochnik/scripts/server/clone-or-update.sh && bash ~/spravochnik/scripts/server/deploy.sh$prodFlag"

Write-Host "Deploy на ${user}@${hostName} ..."
ssh "${user}@${hostName}" $remoteCmd
