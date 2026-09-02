# REST INFO — статус проекта (handoff)

Обновлено: 2026-09-02 (вечер)

## Текущая фаза

**v2 реализована.** Яндекс.Диск выведен из основного потока (sync + updates). Ожидается production-deploy серверным программистом.

Данные восстановлены на Яндекс.Диск из `REST-INFO-export/` (аварийно, 2 сент.). Production — импорт в PostgreSQL через `import-from-json.js`.

---

## Что сделано

### Сервер (`server/`)

- [x] Express REST API + PostgreSQL миграции (`migrations/001_initial.sql`)
- [x] Auth: JWT, register/login, whitelist, bootstrap admin
- [x] Topics CRUD + optimistic locking + topic locks
- [x] Media upload/download
- [x] Sync: `GET /sync/changes` (full + incremental)
- [x] App updates: `GET /app/update`, download Setup.exe
- [x] Admin: users, roles, whitelist, releases, **PUT /admin/users/:id** (имя/пароль)
- [x] `import-from-json.ts` — импорт из REST-INFO-export
- [x] Docker Compose + nginx prod overlay
- [x] `dev-local.ts` — embedded Postgres для Windows без Docker
- [x] `reset-password.ts` — recovery CLI

### Клиент (`app/`)

- [x] `server-api.ts`, `server-sync.ts`, `pending-operations.ts`
- [x] `sync-backend.ts` — server по умолчанию, yandex legacy
- [x] AuthScreen: URL сервера
- [x] Online CRUD → API, offline → queue
- [x] SettingsPage: пользователи, роли, whitelist, **Изменить** (имя/пароль), скачать Setup
- [x] SyncConflictModal (side-by-side)
- [x] Topic lock при редактировании
- [x] Updates с сервера, **только онлайн**, без Яндекс.Диска
- [x] `upload-release.js` — публикация Setup на сервер
- [x] SettingsPage: роль + Изменить + Удалить в одну строку, модал подтверждения удаления

### Скрипты и восстановление

- [x] `scripts/pull-yandex-export.mjs` — экспорт с Диска
- [x] `scripts/push-yandex-restore.mjs` — восстановление на Диск (`--json-only`, `--media-only`)
- [x] `docs/scripts.md` — описание всех скриптов

### Данные

- [x] `REST-INFO-export/` — полный снимок с Яндекс.Диска:
  - support: 85, lawyers: 10, managers: 1, spp: 11, templates: 8
  - users: 6, whitelist: 7, media: 110 файлов
  - `accounts.json` с passwordHash (настоящие пароли)

### Документация

- [x] `docs/DEPLOY-FOR-PROGRAMMER.md`
- [x] `docs/server-deploy.md`, `migration-from-yandex.md`, `legacy-yandex-disk.md`
- [x] `docs/testing-checklist.md`
- [x] `AGENTS.md`, `PROJECT-STATUS.md`

### Исправления в ходе dev

- [x] `migrate.ts` — путь `../migrations` (не `../../migrations`)
- [x] `dev-local.ts` — skip `initialise()` если кластер уже есть
- [x] `server-sync.ts` — merge users при incremental sync (не wipe)
- [x] CSS: роль / Изменить / Удалить в одной строке
- [x] `updates.ts` — убран Яндекс.Диск, проверка сети перед update check
- [x] Подсказка синхронизации: «на сервер»

---

## Что НЕ сделано / pending

| Задача | Приоритет | Кто |
|---|---|---|
| Production deploy (Docker + HTTPS) | **Высокий** | Серверный программист |
| Передать ZIP `REST-INFO-export/` программисту | **Высокий** | Администратор |
| Импорт на production: `import-from-json.js` | **Высокий** | Программист |
| Собрать и загрузить Setup.exe на production | Средний | Админ / программист |
| Указать production URL в клиентах | Средний | Админ |
| Git tag `v1.yandex-disk` | Низкий | Вручную |
| Wire admin IPC напрямую на server API (не queue) | Низкий | Dev |
| Progress bar full media sync | Низкий | Dev |
| Migration wizard yandexToken → serverUrl | Низкий | Dev |
| E2E по testing-checklist на production | Средний | После deploy |

---

## Локальная dev-среда (Windows пользователя)

| Компонент | Статус |
|---|---|
| Node.js | Установлен, нужен `$env:Path` |
| Docker | **Нет** |
| Dev server | `npm run dev:local` в `server/` |
| Dev client | `npm run dev` в `app/` |
| Local API | http://127.0.0.1:3000 |
| Embedded PG | port 5433 |

**Важно:** локальный сервер — только для разработки. Пароль admin на dev мог быть сброшен через `reset-password.ts`; production использует пароли из `REST-INFO-export/accounts.json`.

---

## Структура репозитория

```
spravochnik-repo/
├── app/                    # Electron клиент (v1.2.0)
├── server/                 # REST API (v1.0.0)
├── docker-compose.yml
├── docker-compose.prod.yml
├── import/                 # mount для docker import
├── REST-INFO-export/       # снимок данных (GITIGNORE)
├── scripts/
│   └── pull-yandex-export.mjs
├── docs/
│   ├── PROJECT-STATUS.md   ← этот файл
│   ├── DEPLOY-FOR-PROGRAMMER.md
│   └── ...
├── AGENTS.md               # инструкция для AI
└── README.md
```

---

## Следующие шаги (для администратора)

1. ZIP `REST-INFO-export/` → программисту
2. Доступ к GitHub репо → программисту + `docs/DEPLOY-FOR-PROGRAMMER.md`
3. Дождаться production URL
4. `npm run dist:ascii` → загрузить Setup на сервер
5. Раздать установщик сотрудникам, указать production URL при входе
6. Отозвать OAuth-токен Яндекс.Диска (больше не нужен)

---

## Следующие шаги (для программиста)

См. [DEPLOY-FOR-PROGRAMMER.md](DEPLOY-FOR-PROGRAMMER.md).
