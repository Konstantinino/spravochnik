#!/usr/bin/env bash
# Блокирует git push с production-сервера (дополнительно к read-only deploy key).
set -euo pipefail

RESTINFO_HOME="${RESTINFO_HOME:-/home/rest-info}"
APP_DIR="${RESTINFO_APP_DIR:-${RESTINFO_HOME}/spravochnik}"
HOOKS_DIR="${APP_DIR}/.git/hooks"

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Репозиторий не найден: $APP_DIR/.git" >&2
  echo "Сначала: bash scripts/server/clone-or-update.sh" >&2
  exit 1
fi

mkdir -p "$HOOKS_DIR"

cat >"${HOOKS_DIR}/pre-push" <<'EOF'
#!/usr/bin/env bash
echo "git push запрещён на production-сервере (read-only deploy)." >&2
exit 1
EOF
chmod +x "${HOOKS_DIR}/pre-push"

echo "Установлен pre-push hook: ${HOOKS_DIR}/pre-push"
