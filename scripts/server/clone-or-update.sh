#!/usr/bin/env bash
# Клонирование или git pull через read-only deploy key.
set -euo pipefail

RESTINFO_HOME="${RESTINFO_HOME:-/home/rest-info}"
APP_DIR="${RESTINFO_APP_DIR:-${RESTINFO_HOME}/spravochnik}"
GITHUB_HOST_ALIAS="${GITHUB_HOST_ALIAS:-github.com-restinfo}"
GITHUB_REPO="${GITHUB_REPO:-Konstantinino/spravochnik}"
CLONE_URL="git@${GITHUB_HOST_ALIAS}:${GITHUB_REPO}.git"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -f "${RESTINFO_HOME}/.ssh/rest-info-deploy-key" ]]; then
  echo "Deploy key не найден. Сначала:" >&2
  echo "  bash ${SCRIPT_DIR}/setup-deploy-key.sh" >&2
  exit 1
fi

if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone "$CLONE_URL" "$APP_DIR"
  cd "$APP_DIR"
else
  cd "$APP_DIR"
  git fetch origin
  git pull --ff-only
fi

bash "${SCRIPT_DIR}/install-git-hooks.sh"
echo "Репозиторий готов: $APP_DIR"
