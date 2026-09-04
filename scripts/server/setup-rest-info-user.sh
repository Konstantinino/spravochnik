#!/usr/bin/env bash
# Создание изолированного системного пользователя rest-info (запускать от root).
set -euo pipefail

RESTINFO_USER="${RESTINFO_USER:-rest-info}"
RESTINFO_HOME="${RESTINFO_HOME:-/home/rest-info}"
RESTINFO_APP_DIR="${RESTINFO_APP_DIR:-${RESTINFO_HOME}/spravochnik}"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Запустите от root: sudo $0" >&2
  exit 1
fi

if ! getent group docker >/dev/null 2>&1; then
  echo "Группа docker не найдена. Установите Docker и повторите." >&2
  exit 1
fi

if id "$RESTINFO_USER" >/dev/null 2>&1; then
  echo "Пользователь $RESTINFO_USER уже существует — пропускаю useradd."
else
  useradd \
    --create-home \
    --home-dir "$RESTINFO_HOME" \
    --shell /bin/bash \
    --comment "REST INFO deploy user" \
    "$RESTINFO_USER"
  echo "Создан пользователь $RESTINFO_USER ($RESTINFO_HOME)"
fi

usermod -aG docker "$RESTINFO_USER"

mkdir -p "$RESTINFO_APP_DIR"
chown -R "${RESTINFO_USER}:${RESTINFO_USER}" "$RESTINFO_HOME"
chmod 750 "$RESTINFO_HOME"

# Запрет sudo для rest-info (если sudoers.d доступен).
if [[ -d /etc/sudoers.d ]]; then
  cat >"/etc/sudoers.d/99-rest-info-deny" <<EOF
# REST INFO: без sudo/root
${RESTINFO_USER} ALL=(ALL) !ALL
EOF
  chmod 440 /etc/sudoers.d/99-rest-info-deny
fi

echo ""
echo "Готово:"
echo "  пользователь: $RESTINFO_USER"
echo "  домашняя:     $RESTINFO_HOME"
echo "  каталог app:  $RESTINFO_APP_DIR"
echo "  группы:       $(id -Gn "$RESTINFO_USER" | tr ' ' ',')"
echo ""
echo "Дальше (от $RESTINFO_USER):"
echo "  sudo -u $RESTINFO_USER bash scripts/server/setup-deploy-key.sh"
echo "  sudo -u $RESTINFO_USER bash scripts/server/clone-or-update.sh"
echo ""
echo "Внимание: группа docker даёт управление контейнерами (≈ root на хосте)."
echo "Пользователь не имеет доступа к чужим каталогам вне $RESTINFO_HOME."
