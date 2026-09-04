# REST INFO

Windows-приложение — корпоративный справочник ответов по отделам (техподдержка, юристы, менеджеры, СПП, шаблоны) с ролями пользователей и синхронизацией через **self-hosted SQL-сервер** (PostgreSQL + Docker).

Репозиторий: https://github.com/Konstantinino/spravochnik

> **Для AI-агента:** см. [AGENTS.md](AGENTS.md) и [docs/PROJECT-STATUS.md](docs/PROJECT-STATUS.md)

## Архитектура v2

- **PC-клиент** — Electron + React (`app/`), оффлайн-чтение из локального кэша
- **Сервер** — Node.js REST API + PostgreSQL (`server/`), Docker Compose
- **Синхронизация** — инкрементальный pull + прямая запись правок на **сервер** (не Яндекс.Диск)
- **Владелец** — роль `owner`, настройки: пользователи, whitelist, место на сервере по отделам
- **Вложения** — фото и файлы до 10 МБ в тексте темы

## Документация

| Документ | Назначение |
|---|---|
| [docs/PROJECT-STATUS.md](docs/PROJECT-STATUS.md) | Текущий статус, handoff |
| [docs/DEPLOY-FOR-PROGRAMMER.md](docs/DEPLOY-FOR-PROGRAMMER.md) | **Инструкция для серверного программиста** |
| [docs/server-deploy.md](docs/server-deploy.md) | Docker deploy |
| [docs/SERVER-USER-SETUP.md](docs/SERVER-USER-SETUP.md) | Пользователь rest-info, read-only deploy key |
| [docs/migration-from-yandex.md](docs/migration-from-yandex.md) | Миграция данных |
| [docs/legacy-yandex-disk.md](docs/legacy-yandex-disk.md) | Откат на v1 (Яндекс.Диск) |
| [docs/scripts.md](docs/scripts.md) | Описание всех скриптов |

## Данные для production

Папка **`REST-INFO-export/`** — полный снимок справочника (темы, пользователи, media). **Не в Git.** Передаётся программисту ZIP-архивом.

## Установка на ПК

1. Администратор поднимает сервер (см. `docs/DEPLOY-FOR-PROGRAMMER.md`)
2. Скачайте `REST-INFO-Setup-*.exe` **с сервера**
3. Установите, укажите **URL сервера** (шестерёнка на экране входа)
4. Войдите с почтой из whitelist

URL сервера и сессия сохраняются в `%AppData%\rest-info\REST-INFO\` и **остаются** после обновления Setup.

Почта **`kostya.alone18@yandex.ru`** — владелец (авто-admin).

## Синхронизация и обновления

- **Синхронизация** — кнопка «Синхронизировать» отправляет очередь **на сервер**; чужие правки подтягиваются **автоматически** (без перезапуска приложения)
- **Обновления приложения** — только **с сервера** и **при наличии сети** (`GET /app/update`)
- Яндекс.Диск в v2 **не используется** (legacy: `STORAGE_BACKEND=yandex`)

```bash
cd app && npm run dist:ascii
RESTINFO_SERVER_URL=https://your-server RESTINFO_ADMIN_TOKEN=<jwt> \
  node scripts/upload-release.js release/REST-INFO-Setup-1.3.2.exe
```

## Разработка

```powershell
# Клиент
cd app && npm install && npm run dev

# Сервер (Windows без Docker)
$env:Path = "C:\Program Files\nodejs;" + $env:Path
cd server && npm install && npm run dev:local
# → http://127.0.0.1:3000
```

```bash
# Сервер (Docker)
cp .env.example .env && docker compose up -d --build
docker compose exec api node dist/import-from-json.js /import/REST-INFO-export
```

## Структура

```
docker-compose.yml
server/                     REST API, миграции, import
app/                        Electron + React (v1.3.2)
docs/                       документация + scripts.md
scripts/                    pull/push yandex export (разово)
graphify-out/               карта кода (graphify)
AGENTS.md
```

## Legacy: Яндекс.Диск

Переключение: `STORAGE_BACKEND=yandex`. Подробнее — [docs/legacy-yandex-disk.md](docs/legacy-yandex-disk.md).
