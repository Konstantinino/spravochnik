#!/usr/bin/env bash
# Обновление REST INFO на сервере: git pull + docker compose (от rest-info).
set -euo pipefail

RESTINFO_HOME="${RESTINFO_HOME:-/home/rest-info}"
APP_DIR="${RESTINFO_APP_DIR:-${RESTINFO_HOME}/spravochnik}"
COMPOSE_FILES=(-f docker-compose.yml)
USE_PROD="${RESTINFO_USE_PROD:-0}"

if [[ "${1:-}" == "--prod" ]]; then
  USE_PROD=1
  shift
fi

if [[ ! -d "$APP_DIR" ]]; then
  echo "Каталог не найден: $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"

bash scripts/server/clone-or-update.sh

if [[ ! -f .env ]]; then
  echo "Файл .env не найден. Скопируйте .env.example → .env и задайте секреты." >&2
  exit 1
fi

if [[ "$USE_PROD" == "1" ]]; then
  COMPOSE_FILES+=(-f docker-compose.prod.yml)
fi

docker compose "${COMPOSE_FILES[@]}" up -d --build "$@"

echo ""
echo "Проверка:"
docker compose "${COMPOSE_FILES[@]}" ps
curl -fsS http://127.0.0.1:3000/health || true
