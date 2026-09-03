# REST INFO — инструкция для AI-агента

Корпоративный справочник (Electron + React + Node.js API + PostgreSQL). Репозиторий: https://github.com/Konstantinino/spravochnik

## Где работать

**Единственный канонический репозиторий:** `spravochnik-repo/` (этот каталог).

Не путать с дубликатами в родительской папке `REST INFO/`:
- `app/` — устаревшая копия
- `spravochnik-main/` — устаревшая копия

## Архитектура v2 (текущая)

| Компонент | Путь | Стек |
|---|---|---|
| PC-клиент | `app/` | Electron 35, React 19, Vite, TypeScript |
| Сервер API | `server/` | Node 20, Express, PostgreSQL, JWT |
| Docker | `docker-compose.yml` | postgres:16 + api |
| Данные для деплоя | `REST-INFO-export/` | JSON + media (в `.gitignore`) |

**Синхронизация:** клиент читает локальный кэш (`%AppData%\rest-info\REST-INFO\`), пишет на сервер онлайн, оффлайн — очередь `pending-operations.json`.

**Локальные настройки** (`settings.json` в том же каталоге): `serverUrl`, `authToken`, флаги sync. При установке новой версии Setup **не сбрасываются**.

**Legacy:** Яндекс.Диск — только `STORAGE_BACKEND=yandex` или разовые скрипты в `scripts/`. **Sync и updates в v2 — только сервер.**

## Обновления приложения (v2)

- Проверка: `GET /app/update` на `serverUrl`, **только при наличии сети**
- Публикация: `app/scripts/upload-release.js`
- Яндекс.Диск в `updates.ts` **удалён**

## graphify

Перед исследованием кодовой базы:

```powershell
graphify query "<вопрос>"
```

После изменений кода:

```powershell
graphify update .
```

См. также `graphify-out/GRAPH_REPORT.md`.

## Ключевые модули

### Клиент (`app/electron/`)

| Файл | Назначение |
|---|---|
| `main.ts` | IPC, auth, CRUD, admin |
| `server-api.ts` | HTTP-клиент к REST API |
| `server-sync.ts` | pull/push, конфликты, очередь |
| `sync-backend.ts` | server vs yandex по `STORAGE_BACKEND` |
| `auth-store.ts` | accounts.json, settings, сессия |
| `updates.ts` | проверка/скачивание обновлений с сервера |
| `export-for-server.ts` | упаковка данных (CLI, не UI) |

### Сервер (`server/src/`)

| Файл | Назначение |
|---|---|
| `index.ts` | Express app, роуты |
| `routes/auth.ts` | login, register, JWT |
| `routes/admin.ts` | users, whitelist, releases, PUT users (имя/пароль) |
| `routes/topics.ts` | CRUD тем, блокировки |
| `routes/sync.ts` | GET /sync/changes |
| `routes/media.ts` | upload/download; `updates/*` → UPDATES_DIR; лимит 120 МБ |
| `routes/updates.ts` | GET /app/update, download |
| `import-from-json.ts` | импорт из REST-INFO-export |
| `dev-local.ts` | embedded PostgreSQL без Docker (Windows dev) |
| `reset-password.ts` | сброс пароля (recovery) |

Nginx: `nginx/nginx.conf` — `client_max_body_size 120M` (Setup ~80+ МБ).

### UI (`app/src/components/` + `lib/`)

| Файл | Назначение |
|---|---|
| `AuthScreen.tsx` | вход, URL сервера |
| `SettingsPage.tsx` | admin: пользователи, whitelist, скачать Setup |
| `Viewer.tsx`, `Header.tsx` | просмотр/правка темы; ⋮ → копия ссылки; ← Назад |
| `TopicLinkPicker.tsx` | плавающий выбор темы по `+` у курсора |
| `hooks/useTopicLinkPicker.ts` | состояние пикера, dismiss после пробела |
| `TopicList.tsx` | дерево тем (корни через `buildTree`) |
| `lib/data.ts` | фильтры, `compareTopicsByTitle`, children |
| `lib/markdown.ts` | media src, `parseTopicLinkHref`, формат ссылки темы |
| `lib/textInsert.ts` | вставка / `+query` / обёртка выделения ссылкой |
| `lib/textareaCaret.ts` | координаты каретки для пикера |
| `styles.css` | UI; markdown blockquote/pre — `--header-blue-soft` |

## Документация

| Файл | Для кого |
|---|---|
| [docs/PROJECT-STATUS.md](docs/PROJECT-STATUS.md) | **Текущий статус, блокеры, следующие шаги** |
| [docs/DEPLOY-FOR-PROGRAMMER.md](docs/DEPLOY-FOR-PROGRAMMER.md) | Серверный программист |
| [docs/server-deploy.md](docs/server-deploy.md) | Docker deploy |
| [docs/migration-from-yandex.md](docs/migration-from-yandex.md) | Миграция данных |
| [docs/legacy-yandex-disk.md](docs/legacy-yandex-disk.md) | Откат на v1 |
| [docs/scripts.md](docs/scripts.md) | **Описание скриптов** |
| [docs/testing-checklist.md](docs/testing-checklist.md) | E2E чеклист |

## Команды разработки

### Windows (машина пользователя)

Node.js установлен в `C:\Program Files\nodejs\`, но **не всегда в PATH**:

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
```

**Docker на Windows нет** — сервер локально через embedded Postgres:

```powershell
cd server
npm install
npm run dev:local
# API: http://127.0.0.1:3000, Postgres: port 5433
```

**Клиент:**

```powershell
cd app
npm install
npm run dev
```

### Linux / production

```bash
docker compose up -d --build
docker compose exec api node dist/import-from-json.js /import/REST-INFO-export
```

### Сборка установщика

```powershell
cd app
npm run dist:ascii
# → app/release/REST-INFO-Setup-1.2.1.exe
```

## Владелец / bootstrap

- Email: `kostya.alone18@yandex.ru` (env `BOOTSTRAP_ADMIN_EMAIL`)
- Авто-admin, всегда в whitelist

## Известные проблемы

1. **Windows embedded Postgres (WIN1251):** импорт `templates.json` с emoji может падать локально; в Docker/Linux — OK.
2. **Локальный dev-сервер ≠ production:** `127.0.0.1:3000` содержит тестовые данные; полный снимок — `REST-INFO-export/`.
3. **Admin IPC** (роли, whitelist): частично local + queue, не все операции идут напрямую на API.
4. **`REST-INFO-export/`** в `.gitignore` — не коммитить (пароли в accounts.json).
5. **Incremental sync:** исправлен баг обнуления users; merge вместо replace.

## Правила для агента

- Минимальный diff, не рефакторить без запроса
- Коммиты — только по явной просьбе пользователя
- Работать только в `spravochnik-repo/`
- Не коммитить `.env`, токены, `REST-INFO-export/`
- После правок кода: `graphify update .`
- Фраза **«обнови ключевые файлы»** = `graphify update .` + актуализировать `docs/PROJECT-STATUS.md`, `AGENTS.md`, при необходимости `README.md` и `docs/testing-checklist.md` под свежие изменения сессии (без лишних рефакторингов)

## Версии

- Клиент: **1.2.1** (`app/package.json`)
- Сервер: **1.0.0** (`server/package.json`)
- Git tag `v1.yandex-disk` — **не создан** (нужно вручную при необходимости)
