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

**Синхронизация:** клиент читает локальный кэш (`%AppData%\rest-info\REST-INFO\`), пишет на сервер онлайн, оффлайн — очередь `pending-operations.json` + `pending-media.json`. При сохранении темы фото/файлы уходят на сервер сразу (если есть сеть). Чужие правки подтягиваются автоматически: после API-запросов проверяется `GET /sync/status` (`globalVersion`), при изменении — incremental pull без перезапуска (также каждые 60 с и при фокусе окна). **Во время pull** в шапке: «Загрузка данных…»; после успеха — «Актуально».

**Локальные настройки** (`settings.json` в том же каталоге): `serverUrl`, `authToken`, флаги sync. При установке новой версии Setup **не сбрасываются**.

**Legacy:** Яндекс.Диск — только `STORAGE_BACKEND=yandex` или разовые скрипты в `scripts/`. **Sync и updates в v2 — только сервер.**

## Обновления приложения (v2)

- **1.4.0+:** `electron-updater` — фоновая проверка каждые 60 с, скачивание `latest.yml` + delta через `GET /app/updates/*`; установка из попапа профиля («Обновить» / «Скачивание…»)
- **Legacy (<1.4.0):** `GET /app/update` — скачать Setup.exe вручную
- Публикация: `app/scripts/upload-release.js` (Setup + `latest.yml` + `.blockmap`)
- Разовый fix legacy-путей медиа после import: `app/scripts/fix-media-paths.js` → `POST /admin/fix-media-paths` (см. `docs/fix-media-paths.md`)
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
| `main.ts` | IPC, auth, CRUD, admin, storage-stats, `requireEditDepartment`, `updates:install`, `app:focus-window`, валидация URL сервера |
| `server-api.ts` | HTTP-клиент к REST API; `validateServerUrl()` через `GET /health` |
| `server-sync.ts` | pull/push, конфликты, очередь (`reorder_topics`), flush медиа при save, reconcile create (без дублей id), `ensureTopicMediaDownloaded`, `tryPushReorderOnline`, `ensureRequestedPartyPersisted`, `showSyncLoadingIfOnline` |
| `session-log.ts` | журнал сессии (ring buffer), IPC для настроек |
| `guide-data.ts` | reconcile `has_children` в локальном JSON |
| `media-layout.ts` | пути `media/{отдел}/{id}/images|files`, миграция legacy → `support/` |
| `sync-backend.ts` | server vs yandex по `STORAGE_BACKEND` |
| `auth-store.ts` | accounts.json, settings, сессия, **`windowBounds`** |
| `topic-media.ts` | фото темы + вложения файлов (до 10 МБ); диск: `media/{отдел}/{id темы}/images|files/`; cleanup с учётом `photos`/`documents` |
| `updates.ts` | `electron-updater`: фоновая проверка/скачивание, `installUpdate()` |
| `export-for-server.ts` | упаковка данных (CLI, не UI) |

### Сервер (`server/src/`)

| Файл | Назначение |
|---|---|
| `index.ts` | Express app, роуты |
| `routes/auth.ts` | login, register, JWT |
| `routes/admin.ts` | users, роли (owner/admin/editor/user), whitelist, releases, передача владения, **место на сервере** (owner), **`POST /admin/fix-media-paths`** (owner, разовый fix legacy-путей медиа) |
| `routes/topics.ts` | CRUD тем, блокировки, **`PUT /:dept/topic-order`**, **`POST …/topic-order/lock|unlock|renew-lock`** |
| `routes/sync.ts` | GET /sync/changes, GET /sync/status |
| `lib/media-layout.ts` | канонические пути медиа, миграция на диске при старте API |
| `routes/media.ts` | upload/download; `updates/*` → UPDATES_DIR; лимит 120 МБ |
| `routes/updates.ts` | GET /app/update (legacy), GET /app/updates/* (latest.yml, blockmap, Setup) |
| `import-from-json.ts` | импорт из REST-INFO-export |
| `lib/fix-media-paths.ts` | reconcile `media_files.relative_path` с файлами на диске (по basename) |
| `fix-media-paths.ts` | CLI на сервере: `node dist/fix-media-paths.js [--apply]` |
| `dev-local.ts` | embedded PostgreSQL без Docker (Windows dev) |
| `reset-password.ts` | сброс пароля (recovery) |

Nginx: `nginx/nginx.conf` — `client_max_body_size 120M` (Setup ~80+ МБ).

### UI (`app/src/components/` + `lib/`)

| Файл | Назначение |
|---|---|
| `AuthScreen.tsx` | вход, URL сервера |
| `SettingsPage.tsx` | owner/admin: пользователи, роли, whitelist, передача владения, скачать Setup; **владелец** — место на сервере; журнал сессии; full pull |
| `Viewer.tsx`, `Header.tsx` | просмотр/правка; фиксированный topbar; версия в шапке; профиль → «Обновить»; **«Сбросить»** (локальный откат); ⋮ → копия ссылки; ← Назад; Esc |
| `hooks/usePreserveTextareaFocus.ts` | сохранение фокуса textarea при Alt+Shift (Windows) |
| `lib/restoreAppFocus.ts` | восстановление фокуса Electron после модалок / сброса |
| `ParentTopicField.tsx`, `TopicLinkPicker.tsx` | родитель: combobox, поиск по названию, фильтр party; «+»: весь отдел без архива |
| `hooks/useTopicLinkPicker.ts` | состояние пикера, dismiss после пробела |
| `TopicList.tsx` | дерево тем, секции party, **reorder**, ПКМ «редактировать тему/порядок» |
| `lib/data.ts` | фильтры, `reorderSiblingTopics` + party scope, `getAncestorIds`, `getItemParty`, `topicDisplayLabel` |
| `lib/markdown.ts` | media src, ссылки тем, вложения `files/` |
| `lib/textInsert.ts` | вставка / `+query` / обёртка выделения ссылкой |
| `lib/textareaCaret.ts` | координаты каретки для пикера |
| `styles.css` | UI; markdown blockquote/pre — `--header-blue-soft` |

## Документация

| Файл | Для кого |
|---|---|
| [docs/PROJECT-STATUS.md](docs/PROJECT-STATUS.md) | **Текущий статус, блокеры, следующие шаги** |
| [docs/DEPLOY-FOR-PROGRAMMER.md](docs/DEPLOY-FOR-PROGRAMMER.md) | Серверный программист |
| [docs/server-deploy.md](docs/server-deploy.md) | Docker deploy |
| [docs/SERVER-USER-SETUP.md](docs/SERVER-USER-SETUP.md) | Пользователь rest-info, deploy key, изоляция Docker |
| [docs/migration-from-yandex.md](docs/migration-from-yandex.md) | Миграция данных |
| [docs/legacy-yandex-disk.md](docs/legacy-yandex-disk.md) | Откат на v1 |
| [docs/scripts.md](docs/scripts.md) | **Описание скриптов** |
| [docs/fix-media-paths.md](docs/fix-media-paths.md) | Разовый fix `media/images/*` в БД после import |
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
# → app/release/REST-INFO-Setup-1.4.4.exe
```

## Владелец / bootstrap

- Email: `kostya.alone18@yandex.ru` (env `BOOTSTRAP_ADMIN_EMAIL`)
- Первый владелец: роль `owner` (не `admin`), всегда в whitelist
- Владелец может выдавать роль `admin` другим; править/удалять владельца может только он сам
- Удаление владельца — только после передачи владения другому пользователю (`POST /admin/transfer-ownership` или `DELETE` с `successorId`)

## Известные проблемы

1. **Windows embedded Postgres (WIN1251):** импорт `templates.json` с emoji может падать локально; в Docker/Linux — OK.
2. **Локальный dev-сервер ≠ production:** `127.0.0.1:3000` содержит тестовые данные; полный снимок — `REST-INFO-export/`. Правка темы с production-кэшем при URL локального сервера → «тема не найдена».
3. **Admin IPC** (whitelist set/remove): частично local + queue; роли, удаление пользователя, передача владения и **место на сервере** идут на API онлайн.
4. **`REST-INFO-export/`** в `.gitignore` — не коммитить (пароли в accounts.json). Не коммитить `REST-INFO-export.rar` / `.zip`.
5. **Incremental sync:** исправлен баг обнуления users; merge вместо replace.
6. **Оффлайн-удаление темы** (admin/owner): в очередь `delete_topic`; «Синхронизировать» удаляет на сервере вместе с подтемами.
7. **Автоподгрузка с сервера** не перезаписывает локальные правки темы, пока в очереди `pending-operations` или `hasPendingChanges` (кроме force sync).
8. **Legacy-пути медиа в БД после import:** в `media_files` могут остаться `media/images/uuid.jpg`, файлы на диске — `media/{отдел}/{id}/images/uuid.jpg` → sync 404 при «Синхронизировать». Fix: один раз `fix-media-paths.js --apply` (см. `docs/fix-media-paths.md`); файлы на диске не перемещает. **Production (9 сент.):** fix применён (107 записей).
9. **Auto-update 1.4.0:** требует deploy сервера с `GET /app/updates/*` и публикации `latest.yml` + blockmap через `upload-release.js`.
10. **Reorder + party categories:** на production нужны миграции **004–006**; **007** (`topic_order_locks`) — для одновременного reorder; без 007 lock API 404, без 004–006 reorder не сохраняется на сервере.
11. **Reorder:** порядок на сервер уходит только при «Завершить редактирование»; перед входом — pull порядка + lock; unlock после успешного PUT.
12. **Первый вход в reorder:** локально проставляет `sort_index` по текущему порядку (без push до «Завершить»).

## Правила для агента

- Минимальный diff, не рефакторить без запроса
- Коммиты — только по явной просьбе пользователя
- Работать только в `spravochnik-repo/`
- Не коммитить `.env`, токены, `REST-INFO-export/`
- После правок кода: `graphify update .`
- Фраза **«обнови ключевые файлы»** = `graphify update .` + актуализировать `docs/PROJECT-STATUS.md`, `AGENTS.md`, при необходимости `README.md` и `docs/testing-checklist.md` под свежие изменения сессии (без лишних рефакторингов)

## Версии

- Клиент: **1.4.4** (`app/package.json`)
- Сервер: **1.0.0** (`server/package.json`)
- Git tag `v1.yandex-disk` — **не создан** (нужно вручную при необходимости)
