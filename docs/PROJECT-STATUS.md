# REST INFO — статус проекта (handoff)

Обновлено: 2026-09-17

## Текущая фаза

**v2 реализована.** Яндекс.Диск выведен из основного потока (sync + updates). Ожидается production-deploy серверным программистом.

Данные восстановлены на Яндекс.Диск из `REST-INFO-export/` (аварийно, 2 сент.). Production — импорт в PostgreSQL через `import-from-json.js`.

Локально на Windows (17 сент.): медиа `media/{отдел}/{id}/images|files`, фото на сервер при сохранении темы, автоподгрузка чужих правок без перезапуска, **тема остаётся открытой после сохранения** (Esc закрывает / «← Назад» при переходе по ссылке; ручная смена фильтра списка — сбрасывает выбор). Setup **1.4.2** (reorder, категории, sync UI). Production: nginx `client_max_body_size` ≥120M для upload Setup (~81 МБ), иначе **413**. **Миграции 004–006** на production — перед использованием reorder и категорий «Ошибки»/«Дополнительно».

**Важно:** локальный `127.0.0.1:3000` ≠ production-данные. Клиент с кэшем основного сервера при URL localhost получит «тема не найдена» при сохранении.

---

## Что сделано

### Сервер (`server/`)

- [x] Express REST API + PostgreSQL миграции (`migrations/001_initial.sql`)
- [x] Auth: JWT, register/login, whitelist, bootstrap admin
- [x] Topics CRUD + optimistic locking + topic locks
- [x] Media upload/download (лимит **120 МБ**; пути `updates/*` → `UPDATES_DIR`)
- [x] Sync: `GET /sync/changes` (full + incremental)
- [x] App updates: `GET /app/update`, download Setup.exe; **`GET /app/updates/*`** — static `latest.yml` + blockmap для electron-updater (1.4.0+)
- [x] Admin: users, роли **owner / admin / editor / user**, whitelist, releases, **PUT /admin/users/:id**, **POST /admin/transfer-ownership**, **GET /admin/storage-stats** (только owner)
- [x] Миграции `002_user_department.sql`, `003_owner_role.sql`, **`004_topic_sort_index.sql`**, **`005_topic_party_errors.sql`**, **`006_topic_party_additional.sql`**
- [x] **`PUT /departments/:dept/topic-order`** — сохранение `sort_index` (reorder списка)
- [x] `import-from-json.ts` — импорт из REST-INFO-export
- [x] Docker Compose + nginx prod overlay (`client_max_body_size 120M`)
- [x] Изолированный deploy: пользователь `rest-info`, read-only deploy key, сеть `restinfo_internal`, скрипты `scripts/server/`, [SERVER-USER-SETUP.md](SERVER-USER-SETUP.md)
- [x] `dev-local.ts` — embedded Postgres для Windows без Docker
- [x] `lib/media-layout.ts` — пути `media/{отдел}/{id}/images|files`, миграция legacy → `media/support/…` при старте API и после import
- [x] `GET /sync/status` — `globalVersion` для быстрой проверки изменений
- [x] Дашборд «Место на сервере» считает фото по отделу из пути (не только по JOIN темы)
- [x] Удаление темы: очистка `media_files` + файлов на диске; purge orphan media при старте API
- [x] Редактор API: `department_id` в сессии; мутации только в своём отделе (admin/owner — все)
- [x] **`lib/fix-media-paths.ts`** + `POST /admin/fix-media-paths` (owner) — разовое исправление legacy-путей в `media_files` (`media/images/uuid.jpg` → `media/{отдел}/{id}/images/…`); файлы на диске не перемещает, только БД
- [x] CLI: `node dist/fix-media-paths.js [--apply]` (на сервере в контейнере api)

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
- [x] **`fix-media-paths.js`** — разовое исправление путей медиа на сервере с Windows-ПК (как upload-release; см. [fix-media-paths.md](fix-media-paths.md))
- [x] SettingsPage: роль + Изменить + Удалить в одну строку, модал подтверждения удаления
- [x] Список тем и подтем — **`sort_index`** внутри группы сiblings, иначе алфавит (`compareTopicsForList` в `data.ts`)
- [x] **Техподдержка:** фильтры **Все / Поставщик / Заказчик / Ошибки / Дополнительно** (+ Архив); при «Все» — секции-заголовки в sidebar; категория в редакторе тем
- [x] **Редактировать порядок** (ПКМ в sidebar): pointer-drag + ghost, колёсико при перетаскивании, курсор move/⊘, секции party сохранены; офлайн → очередь `reorder_topics`
- [x] **Viewer:** рекурсивное дерево подтем в режиме просмотра (`ViewerChildrenTree`)
- [x] Sync UI: при pull (в т.ч. фоновом) статус **«Загрузка данных…»**, после — **«Актуально»**
- [x] `ensureRequestedPartyPersisted` — защита категории темы, если API без миграции 005/006 вернул `supplier`
- [x] Markdown: фон цитат `>` и блоков кода в цвет шапки (`--header-blue-soft`)
- [x] Ссылки между темами: в режиме правки **⋮** → «Скопировать ссылку»; в тексте **`+`** → плавающий список тем у курсора (пробел после `+` отменяет до нового `+`); выделение + `+` — ссылка на выделенное; переход + **← Назад**; **Esc** — назад по ссылке или закрыть тему (если открыта из списка)
- [x] После **сохранения** тема остаётся открытой (`syncListFilterAfterPartySave`; pin `selectedId`; sync не вызывает полный `load()` через новый объект `user`)
- [x] Вложение файлов в текст темы (до **10 МБ**): «Вставить файл»; карточка в просмотре; exe/скрипты запрещены
- [x] Медиа на диске: `media/{отдел}/{id темы}/images|files/`; legacy → `media/support/…` при старте; старые пути — fallback
- [x] При **сохранении темы** (онлайн) фото/файлы из очереди сразу на сервер (`flushPendingMedia`), не только по «Синхронизировать»
- [x] **Автоподгрузка** чужих правок: `GET /sync/status` после API-запросов + pull; UI обновляется без перезапуска (60 с, фокус окна); черновик в редакторе не затирается
- [x] `serverUrl` / сессия в `%AppData%\rest-info\REST-INFO\settings.json` — **переживают** установку новой версии Setup
- [x] **Выпадающий список отделов** для всех ролей: читатель/редактор — все отделы кроме «Шаблоны»; редактор правит только свой отдел
- [x] Настройки: **журнал сессии** (ошибки sync/медиа), кнопка **«Синхронизировать с диском»** (full pull)
- [x] Viewer: фиксированная верхняя панель (не скроллится с текстом); исправлен «лишний» значок папки (`has_children` без детей)
- [x] Создание темы онлайн: исправлено **дублирование** (локальный id ≠ серверный → reconcile после POST)
- [x] Пикеры родителя и ссылки «+»: полный список тем/подтем отдела, подпись — только название; при выборе родителя — авто-смена Поставщик/Заказчик
- [x] Клиент **1.4.2** (`REST-INFO-Setup-1.4.2.exe`): auto-update через `electron-updater` (фоновое скачивание, «Обновить» / «Скачивание…» в профиле, версия в шапке вплотную к «REST INFO»)
- [x] Валидация URL сервера: `GET /health` перед сохранением → «Неверно указан URL сервера»
- [x] Локальный **«Сбросить»** в панели темы (слева от «Изменить»): модалка подтверждения, откат к снимку до редактирования; fix фокуса input после сброса (`restoreAppFocus`, без `window.confirm`)
- [x] Сохранение фокуса textarea при Alt+Shift (смена раскладки на Windows); fix «мёртвых» input при клике в поиск во время правки
- [x] Fix: фото не пропадают при правке текста — `ensureTopicMediaDownloaded` + учёт `photos`/`documents` при cleanup
- [x] `upload-release.js` / **`publish-release.ps1`** — публикация Setup + `latest.yml` + `.blockmap`; секреты в `.env.deploy` (не в git)
- [x] IPC `focusAppWindow` — восстановление фокуса окна Electron после модалок

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
- [x] `docs/fix-media-paths.md` — инструкция по разовому fix legacy-путей медиа
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
- [x] `session-log.ts` — ring buffer журнала сессии; `guide-data.ts` — reconcile `has_children`
- [x] Кнопка «Удаление…» в Viewer: сброс состояния в `finally`
- [x] Диагностика sync 404: на production (`info.r-est.ru`) ~107 записей `media_files` с путём `media/images/*`, файлы на диске — `media/support/{id}/images/*`
- [x] **Production (9 сент.):** `fix-media-paths.js --apply` — обновлено **107** путей в `media_files`, `global_version` bumped; sync «media/images/…» 404 устранён

---

## Что НЕ сделано / pending

| Задача | Приоритет | Кто |
|---|---|---|
| Production deploy (Docker + HTTPS) | **Высокий** | Серверный программист |
| Передать ZIP `REST-INFO-export/` программисту | **Высокий** | Администратор |
| Импорт на production: `import-from-json.js` | **Высокий** | Программист |
| Залить Setup **1.4.2** + `latest.yml` + blockmap на production | **Высокий** | Админ / программист |
| **`npm run migrate`** на production (004 sort_index, 005 errors, 006 additional) | **Высокий** | Программист |
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
├── app/                    # Electron клиент (v1.4.2)
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
