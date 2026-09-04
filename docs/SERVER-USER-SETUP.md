# REST INFO — изолированный пользователь на сервере

Инструкция для **root / серверного администратора** и для пользователя **`rest-info`**.

Цели:

1. Отдельный системный пользователь `rest-info` с домашней `/home/rest-info/`
2. Docker только через группу `docker` (без sudo/root)
3. Нет доступа к чужим каталогам
4. Deploy key **только на чтение** — `git pull`, без `git push`
5. Контейнеры в отдельной сети `restinfo_internal` и с именованными volume

---

## Быстрый старт (администратор)

```bash
# 1. От root — создать пользователя и добавить в группу docker
sudo bash scripts/server/setup-rest-info-user.sh

# 2. От rest-info — deploy key + clone
sudo -u rest-info bash scripts/server/setup-deploy-key.sh
# → добавить deploy/keys/rest-info-deploy.pub в GitHub (read-only)

sudo -u rest-info bash scripts/server/clone-or-update.sh

# 3. Настроить .env и данные
sudo -u rest-info cp /home/rest-info/spravochnik/.env.example /home/rest-info/spravochnik/.env
# положить REST-INFO-export в import/

# 4. Запуск / обновление
sudo -u rest-info bash /home/rest-info/spravochnik/scripts/server/deploy.sh --prod
```

---

## 1. Системный пользователь

Скрипт `scripts/server/setup-rest-info-user.sh` (root):

- создаёт `rest-info` с `--home-dir /home/rest-info`
- добавляет в группу `docker` (без `sudo`)
- создаёт `/home/rest-info/spravochnik/` для клона репозитория
- `chmod 750` на домашнюю директорию
- `/etc/sudoers.d/99-rest-info-deny` — явный запрет sudo

Проверка:

```bash
id rest-info
# groups: rest-info docker
sudo -u rest-info sudo true   # должно отказать
```

**Важно:** членство в группе `docker` даёт полный контроль над Docker Engine (эквивалент root для контейнеров). Это осознанный компромисс для пересборки своих контейнеров без выдачи root на весь сервер.

---

## 2. Deploy key (read-only)

Скрипт `scripts/server/setup-deploy-key.sh` (от `rest-info`):

- генерирует Ed25519 ключ в `~/.ssh/rest-info-deploy-key`
- настраивает `~/.ssh/config` с алиасом `github.com-restinfo`
- копирует **публичный** ключ в `deploy/keys/rest-info-deploy.pub`

На GitHub (владелец репозитория):

1. **Settings → Deploy keys → Add deploy key**
2. Key = `deploy/keys/rest-info-deploy.pub`
3. **Allow write access — OFF**

Клонирование:

```bash
git clone git@github.com-restinfo:Konstantinino/spravochnik.git
```

Или скриптом: `scripts/server/clone-or-update.sh`

### Защита от push

| Уровень | Механизм |
|---|---|
| GitHub | Deploy key без write |
| Сервер | `pre-push` hook → exit 1 |

---

## 3. Изоляция Docker

В `docker-compose.yml`:

- `name: restinfo` — префикс проекта
- сеть `restinfo_internal` (bridge, имя фиксировано)
- volume: `restinfo_postgres_data`, `restinfo_media_data`, `restinfo_updates_data`

Контейнеры REST INFO не подключаются к сетям/volume других compose-проектов.

Проверка:

```bash
docker network ls | grep restinfo
docker volume ls | grep restinfo
```

---

## 4. Ежедневные команды (rest-info)

```bash
# Обновить код и пересобрать (dev/test, порт 3000)
bash ~/spravochnik/scripts/server/deploy.sh

# Production (nginx + HTTPS overlay)
bash ~/spravochnik/scripts/server/deploy.sh --prod

# Только git pull
bash ~/spravochnik/scripts/server/clone-or-update.sh

# Логи
cd ~/spravochnik && docker compose logs -f api
```

---

## 5. Импорт и бэкап

См. [DEPLOY-FOR-PROGRAMMER.md](DEPLOY-FOR-PROGRAMMER.md) и [server-deploy.md](server-deploy.md).

Volume после изоляции:

```bash
docker volume ls | grep restinfo
# restinfo_postgres_data, restinfo_media_data, restinfo_updates_data
```

---

## Переменные окружения скриптов

| Переменная | По умолчанию |
|---|---|
| `RESTINFO_USER` | `rest-info` |
| `RESTINFO_HOME` | `/home/rest-info` |
| `RESTINFO_APP_DIR` | `/home/rest-info/spravochnik` |
| `GITHUB_REPO` | `Konstantinino/spravochnik` |
| `RESTINFO_USE_PROD` | `0` (для deploy.sh — флаг `--prod`) |

---

## Troubleshooting

| Проблема | Решение |
|---|---|
| `Permission denied (publickey)` | Deploy key не добавлен на GitHub или write включён/ключ другой |
| `git push` всё же нужен | Не на production-сервере; push с dev-машины |
| `permission denied` docker | `usermod -aG docker rest-info`, перелогиниться |
| Конфликт сети/volume | Убедитесь, что используется `name: restinfo` в compose |
