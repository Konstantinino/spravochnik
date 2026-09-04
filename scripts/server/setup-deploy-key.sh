#!/usr/bin/env bash
# Deploy-ключ только на чтение: git pull без push (запускать от rest-info).
set -euo pipefail

RESTINFO_USER="${RESTINFO_USER:-rest-info}"
RESTINFO_HOME="${RESTINFO_HOME:-/home/rest-info}"
SSH_DIR="${RESTINFO_HOME}/.ssh"
KEY_PATH="${SSH_DIR}/rest-info-deploy-key"
PUB_PATH="${KEY_PATH}.pub"
SSH_CONFIG="${SSH_DIR}/config"
GITHUB_HOST_ALIAS="${GITHUB_HOST_ALIAS:-github.com-restinfo}"
GITHUB_REPO="${GITHUB_REPO:-Konstantinino/spravochnik}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PUB_IN_REPO="${REPO_ROOT}/deploy/keys/rest-info-deploy.pub"

if [[ "$(id -un)" != "$RESTINFO_USER" ]]; then
  echo "Запустите от пользователя $RESTINFO_USER:" >&2
  echo "  sudo -u $RESTINFO_USER bash $0" >&2
  exit 1
fi

umask 077
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

if [[ ! -f "$KEY_PATH" ]]; then
  ssh-keygen -t ed25519 -f "$KEY_PATH" -N "" -C "rest-info-deploy-readonly@$(hostname -f 2>/dev/null || hostname)"
  echo "Создан ключ: $KEY_PATH"
else
  echo "Ключ уже есть: $KEY_PATH"
fi

chmod 600 "$KEY_PATH"
chmod 644 "$PUB_PATH"

cat >"$SSH_CONFIG" <<EOF
Host ${GITHUB_HOST_ALIAS}
  HostName github.com
  User git
  IdentityFile ${KEY_PATH}
  IdentitiesOnly yes
EOF
chmod 600 "$SSH_CONFIG"

mkdir -p "$(dirname "$PUB_IN_REPO")"
cp "$PUB_PATH" "$PUB_IN_REPO"
chmod 644 "$PUB_IN_REPO"

echo ""
echo "=== Публичный ключ (read-only deploy key на GitHub) ==="
cat "$PUB_PATH"
echo ""
echo "GitHub → Settings → Deploy keys → Add deploy key"
echo "  Title: rest-info-$(hostname -s 2>/dev/null || echo server)"
echo "  Key:   (см. выше или deploy/keys/rest-info-deploy.pub)"
echo "  Allow write access: ВЫКЛ"
echo ""
echo "Clone URL для rest-info:"
echo "  git@${GITHUB_HOST_ALIAS}:${GITHUB_REPO}.git"
echo ""
echo "После добавления ключа на GitHub:"
echo "  bash scripts/server/clone-or-update.sh"
