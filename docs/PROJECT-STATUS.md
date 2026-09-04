# REST INFO — статус проекта (handoff)

Обновлено: 2026-09-04

## Текущая фаза

**v2 реализована.** Яндекс.Диск выведен из основного потока (sync + updates). Ожидается production-deploy серверным программистом.

Данные восстановлены на Яндекс.Диск из `REST-INFO-export/` (аварийно, 2 сент.). Production — импорт в PostgreSQL через `import-from-json.js`.

Локально на Windows (4 сент.): медиа `media/{отдел}/{id}/images|files`, фото на сервер при сохранении темы, автоподгрузка чужих правок без перезапуска, **тема остаётся открытой после сохранения** (Esc закрывает / «← Назад» при переходе по ссылке; ручная смена фильтра списка — сбрасывает выбор), Setup **1.3.2**. Production: nginx `client_max_body_size` ≥120M для upload Setup (~81 МБ), иначе **413**.

**Важно:** локальный `127.0.0.1:3000` ≠ production-данные. Клиент с кэшем основного сервера при URL localhost получит «тема не найдена» при сохранении.

---

## Что сделано

### Сервер (`server/`)

- [x] Express REST API + PostgreSQL миграции (`migrations/001_initial.sql`)
- [x] Auth: JWT, register/login, whitelist, bootstrap admin
- [x] Topics CRUD + optimistic locking + topic locks
- [x] Media upload/download (лимит **120 МБ**; пути `updates/*` → `UPDATES_DIR`)
- [x] Sync: `GET /sync/changes` (full + incremental)
- [x] App updates: `GET /app/update`, download Setup.exe
- [x] Admin: users, роли **owner / admin / editor / user**, whitelist, releases, **PUT /admin/users/:id**, **POST /admin/transfer-ownership**, **GET /admin/storage-stats** (только owner)
- [x] Миграции `002_user_department.sql`, `003_owner_role.sql`
- [x] `import-from-json.ts` — импорт из REST-INFO-export
- [x] Docker Compose + nginx prod overlay (`client_max_body_size 120M`)
- [x] Изолированный deploy: пользователь `rest-info`, read-only deploy key, сеть `restinfo_internal`, скрипты `scripts/server/`, [SERVER-USER-SETUP.md](SERVER-USER-SETUP.md)
- [x] `dev-local.ts` — embedded Postgres для Windows без Docker
- [x] `lib/media-layout.ts` — пути `media/{отдел}/{id}/images|files`, миграция legacy → `media/support/…` при старте API и после import
- [x] `GET /sync/status` — `globalVersion` для быстрой проверки изменений
- [x] Дашборд «Место на сервере» считает фото по отделу из пути (не только по JOIN темы)

### Клиент (`app/`)

- [x] `server-api.ts`, `server-sync.ts`, `pending-operations.ts`
- [x] `sync-backend.ts` — server по умолчанию, yandex legacy
- [x] AuthScreen: URL сервера
- [x] Online CRUD → API, offline → queue
- [x] SettingsPage: пользователи, роли (**админ выдаёт владелец**), whitelist, **Изменить** / **Удалить**, передача владения, скачать Setup
- [x] Владелец: в настройках блок «Место на сервере» — объём по отделам (текст / фото / файлы)
- [x] SyncConflictModal (side-by-side)
- [x] Topic lock при редактировании
- [x] Updates с сервера, **только онлайн**, без Яндекс.Диска
- [x] `upload-release.js` — публикация Setup на сервер
- [x] SettingsPage: роль + Изменить + Удалить в одну строку, модал подтверждения удаления
- [x] Список тем и подтем — **алфавит** (`compareTopicsByTitle` в `data.ts`)
- [x] Markdown: фон цитат `>` и блоков кода в цвет шапки (`--header-blue-soft`)
- [x] Ссылки между темами: в режиме правки **⋮** → «Скопировать ссылку»; в тексте **`+`** → плавающий список тем у курсора (пробел после `+` отменяет до нового `+`); выделение + `+` — ссылка на выделенное; переход + **← Назад**; **Esc** — назад по ссылке или закрыть тему (если открыта из списка)
- [x] После **сохранения** тема остаётся открытой (`syncListFilterAfterPartySave`; pin `selectedId`; sync не вызывает полный `load()` через новый объект `user`)
- [x] Вложение файлов в текст темы (до **10 МБ**): «Вставить файл»; карточка в просмотре; exe/скрипты запрещены
- [x] Медиа на диске: `media/{отдел}/{id темы}/images|files/`; legacy → `media/support/…` при старте; старые пути — fallback
- [x] При **сохранении темы** (онлайн) фото/файлы из очереди сразу на сервер (`flushPendingMedia`), не только по «Синхронизировать»
- [x] **Автоподгрузка** чужих правок: `GET /sync/status` после API-запросов + pull; UI обновляется без перезапуска (30 с, фокус окна); черновик в редакторе не затирается
- [x] `serverUrl` / сессия в `%AppData%\rest-info\REST-INFO\settings.json` — **переживают** установку новой версии Setup
- [x] Клиент **1.3.2** (`REST-INFO-Setup-1.3.2.exe`); публикация на production может упираться в nginx 413 до деплоя лимита 120M

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
- [x] Инпут заголовка темы при правке — на всю ширину колонки
- [x] Поле текста в модалке создания темы — меньше по высоте (`rows={10}`)
- [x] `media-layout.ts` / `lib/media-layout.ts` — единые пути медиа клиент + сервер
- [x] `settings.json`: `lastGlobalVersion` для автоподгрузки
- [x] Сохранение темы не закрывает просмотр; `syncListFilterAfterPartySave` вместо сброса `selectedId`
- [x] Esc в Viewer: отмена правки → «← Назад» по ссылке → закрыть тему
- [x] После save sync больше не сбрасывает выбор: `load()` зависит от `user?.id`; `setUser` без смены identity; pin при update/save
- [x] Ручная смена фильтра списка (Поставщик/Покупатель/…) по-прежнему закрывает тему

---

## Что НЕ сделано / pending

| Задача | Приоритет | Кто |
|---|---|---|
| Production deploy (Docker + HTTPS) | **Высокий** | Серверный программист |
| Передать ZIP `REST-INFO-export/` программисту | **Высокий** | Администратор |
| Импорт на production: `import-from-json.js` | **Высокий** | Программист |
| Задеплоить nginx 120M + media `updates/` fix; залить Setup 1.3.2 | **Высокий** | Админ / программист |
| Указать production URL в клиентах | Средний | Админ |
| Git tag `v1.yandex-disk` | Низкий | Вручную |
| Wire remaining whitelist IPC напрямую на server API (не queue) | Низкий | Dev |
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
├── app/                    # Electron клиент (v1.3.2)
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
