# REST INFO — статус проекта (handoff)

Обновлено: 2026-10-29

## Текущая фаза

**v2 реализована.** Яндекс.Диск выведен из основного потока (sync + updates).

**Production-deploy:** миграция **`016_unified_party_and_dept_archive`**, пересборка API (SPA + gate версии только для десктопа), публикация Setup **1.5.1**. Инструкция: [server/migrations/DEPLOY_016.md](../server/migrations/DEPLOY_016.md).

**Веб-клиент (`web/`)** в `main` и на production (**https://info.r-est.ru**): Vite SPA + cookie-auth; UI общий с десктопом (`@app`). SPA **вшита в образ API** (`WEB_DIST=/data/web`, без bind-mount `./web/dist`). Без офлайна. Dev: [web/README.md](../web/README.md).

Данные восстановлены на Яндекс.Диск из `REST-INFO-export/` (аварийно, 2 сент.). Production — импорт в PostgreSQL через `import-from-json.js`.

Локально на Windows (**29 окт.**): клиент **1.5.1**; Setup собран `app/release/REST-INFO-Setup-1.5.1.exe` (+ blockmap). **`web/dist`** в git, вшивается в образ API при `docker compose build api`. **Production web (27 окт.):** медиа URL `/media/media/…`, buffered GET + `/media/status`; favicon R на красном; lock порядка с **`clientId`**; копирование текста в просмотре. Миграции **004–015** в коде; **016** — unified party + per-dept archive (деploy на prod — по чеклисту DEPLOY_016). Host nginx → `:3000`; `CORS_ORIGIN` / `COOKIE_SECURE`.

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
- [x] Миграции `002`–`007` + **`008_client_topic_link.sql`** (`client_topic_id` для admin-тем)
- [x] **`middleware/min-client-version.ts`** — gate версии для **десктопа (Bearer)**; **веб** (httpOnly cookie без Bearer) **не проверяется** — SPA всегда с текущим деплоем (`requestHasWebSessionCookie` в `web-session.ts`)
- [x] **`PUT /departments/:dept/topic-order`** — сохранение `sort_index` (reorder; требует lock + тот же `clientId`)
- [x] **`POST /departments/:dept/topic-order/lock|unlock|renew-lock`** — body `{ clientId }` (миграция **014**); один аккаунт не может держать порядок сразу в вебе и в десктопе
- [x] SPA из `web/dist` в Docker-образе API; `GET /health` → `web` / `media` / `build`; `GET /media/status` (+ `?file=`)
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
- [x] **`lib/support-phones.ts`** — телефоны техподдержки в `sync_state`; **`GET /app/support-phones`** (авторизованные), **`GET/PUT /admin/support-phones`** (admin/owner)
- [x] Миграция **`009_departments_lost.sql`** — динамические разделы, `lost`, `sort_order`; **`GET/POST/PUT/DELETE /admin/departments`**; sync отдаёт `departments`
- [x] Миграция **`010_department_subsections.sql`** — `department_subsections`, `topics.subsection_id`; admin CRUD подразделов; sync `subsections`; `resolveTopicSubsectionId` при создании тем
- [x] **`lib/move-topics-to-lost.ts`** — темы удалённого раздела → «Потерялись»
- [x] **`GET /health`** — флаг `features.adminDepartments` (диагностика деплоя)
- [x] Миграция **`016_unified_party_and_dept_archive.sql`** — `topics.party` для всех отделов; `{deptId}__archive__archived|lost`; удаление верхнего раздела → архив «Потерянные» (`lib/department-archive.ts`, `lib/topic-party.ts`; `routes/topics.ts`, `routes/admin.ts`)
- [x] [DEPLOY_016.md](../server/migrations/DEPLOY_016.md) — handoff для production

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
- [x] **Техподдержка:** фильтры **Все / Поставщик / Заказчик / Ошибки / Администратор** (+ Архив); admin↔client link в редакторе; **«Клиент»/«Админ»** в topbar
- [x] **`server-api.ts`:** заголовок **`X-Rest-Info-Client-Version`**; sync при **426** — «Нужно обновить приложение»
- [x] **Редактировать порядок** (ПКМ): на **любом** фильтре party; порядок общий (`sort_index`); сохранение на сервер **только при «Завершить»**; перед входом — pull порядка + lock (`clientId`); красная плашка ~4 с, если занято
- [x] **Копирование текста** в режиме просмотра: `user-select` на markdown; Electron — меню «Правка» + ПКМ «Копировать» (Setup с этим фиксом — в следующей сборке)
- [x] **Viewer:** рекурсивное дерево подтем; уровень 2+ — opacity **0.7**
- [x] Sidebar: папки **свёрнуты** при старте / Ctrl+R; после **сброса поиска** — раскрытие пути к выбранной теме + скролл в **центр** списка
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
- [x] Пикеры родителя и ссылки «+»: поиск **только по названию** темы; родитель — темы **текущей категории** (party); «+» — все темы отдела (кроме архива)
- [x] **ParentTopicField:** combobox под чекбоксом «Сделать подтемой» (всегда виден; неактивен → «не выбрано»); смена категории сбрасывает чекбокс
- [x] **TopicList ПКМ:** «Редактировать порядок» / «Редактировать тему» (только по строке темы); reorder не открывает редактор
- [x] **Настройки:** скролл по всей ширине страницы (не только по блоку контента)
- [x] **Окно:** размер/позиция в `settings.json` (`windowBounds`); **NSIS** `build/installer.nsh` — не пересоздавать ярлык на рабочем столе при update (pin на панели задач)
- [x] Вставка фото: одна пустая строка **сверху**, без отступа снизу
- [x] **Телефоны техподдержки:** в **синей шапке справа** столбиком (`SUPPORT_PHONES_PLACEMENT` → `'header'`); клик копирует форматированный номер; admin/owner — настройки (название + цифры, без дубля preview)
- [x] **Разделы тем:** настройки по **отделу** (отделы — в шапке); CRUD **разделов** группировки тем; список — секции разделов; новая корневая тема — обязательный select раздела
- [x] **«Потерялись»:** вкладка в шапке только если есть темы; только просмотр
- [x] **`departments-store.ts`**, **`subsections-store.ts`** — локальный кэш + sync
- [x] **Общие фото:** ссылка на файл другой темы (`resolve-image-storage-ref`), вставка из буфера, копирование из редактора; orphan cleanup по всем темам
- [x] Reorder: не раскрывает все папки — только ручное раскрытие, как в обычном режиме
- [x] Клиент **1.5.1** (`REST-INFO-Setup-1.5.1.exe`): patch после 1.5.0; gate версии на API не для веб-cookie
- [x] Клиент **1.5.0** (`REST-INFO-Setup-1.5.0.exe`): веб в `main` + cookie-auth; Setup собран
- [x] Клиент **1.4.9** (`REST-INFO-Setup-1.4.9.exe`): курсор совпадает с текстом при вставке ссылки на фото — глифы рисует сам textarea
- [x] Клиент **1.4.8** (`REST-INFO-Setup-1.4.8.exe`): курсор в редакторе совпадает с видимым текстом (подсветка и textarea — одна раскладка)
- [x] Клиент **1.4.7** (`REST-INFO-Setup-1.4.7.exe`): «Все» — секции разделов во всех отделах; раздел/подраздел обязателен для корневых тем; ограничение admin на «Разделы тем»; auto-update через `electron-updater`
- [x] **1.4.6:** разделы/подразделы, «Потерялись», телефоны в шапке справа
- [x] Валидация URL сервера: `GET /health` перед сохранением → «Неверно указан URL сервера»
- [x] Локальный **«Сбросить»** в панели темы (слева от «Изменить»): модалка подтверждения, откат к снимку до редактирования; fix фокуса input после сброса (`restoreAppFocus`, без `window.confirm`)
- [x] Сохранение фокуса textarea при Alt+Shift (смена раскладки на Windows); fix «мёртвых» input при клике в поиск во время правки
- [x] Fix: фото не пропадают при правке текста — `ensureTopicMediaDownloaded` + учёт `photos`/`documents` при cleanup
- [x] `upload-release.js` / **`publish-release.ps1`** — публикация Setup + `latest.yml` + `.blockmap`; секреты в `.env.deploy` (не в git)
- [x] IPC `focusAppWindow` — восстановление фокуса окна Electron после модалок
- [x] **Унификация с техподдержкой (party + архив):** все отделы с разделами — `topics.party` = id верхнего раздела; список «Все» — `groupRootsByParty`; редактор/«Из архива» без фейкового «Архив» в select; Electron `backfillTopicPartyInList` при `load-guide`; offline delete верхнего раздела → «Потерянные» (`departmentArchive.ts`, `departmentTaxonomy.ts`, `TopicList`, `SettingsPage`, `main.ts`)

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
- [x] `AGENTS.md`, `PROJECT-STATUS.md` (в т.ч. правила **graphify** и «ключевые файлы» для агентов)
- [x] `.cursor/rules/pc-web-sync.mdc` — ПК и веб развиваются синхронно (общий `@app`, исключения — платформенный код)
- [x] `graphify-out/` — карта кода (commit `9f9d1b4+`; не участвует в runtime)

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
- [x] **29 окт.:** min-client-version не для веб-cookie; правило агента **pc-web-sync**

---

## Что НЕ сделано / pending

| Задача | Приоритет | Кто |
|---|---|---|
| Production web **info.r-est.ru** (SPA в образе API) | **Сделано** | — |
| **`git pull` + миграция 016 + rebuild API** (в т.ч. gate версии только для десктопа) | **Высокий** | Программист |
| Setup **1.5.1** + `latest.yml` + blockmap на `/app/updates/` (`upload-release.js`) | **Высокий** | Админ |
| E2E: разделы/party/архив/«Из архива»/удаление раздела (см. testing-checklist) | Средний | QA |
| Git tag `v1.yandex-disk` | Низкий | Вручную |
| Wire remaining whitelist IPC напрямую на server API (не queue) | Низкий | Dev |
| Progress bar full media sync | Низкий | Dev |
| Migration wizard yandexToken → serverUrl | Низкий | Dev |

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
├── app/                    # Electron клиент (v1.5.1)
├── web/                    # Браузерный SPA (cookie-auth)
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
├── AGENTS.md               # инструкция для AI (+ graphify, «ключевые файлы»)
├── graphify-out/           # карта связей кода (опционально для агентов)
└── README.md
```

---

## Следующие шаги (для администратора)

1. После деплоя программистом: https://info.r-est.ru — проверить фильтры/архив в non-support отделах
2. Залить Setup **1.5.1** (`upload-release.js`) и раздать пользователям; URL: `https://info.r-est.ru`
3. Отозвать OAuth-токен Яндекс.Диска (больше не нужен)

---

## Следующие шаги (для программиста)

1. Бекап БД → `git pull` → `docker compose build --no-cache api && docker compose up -d api` (миграция **016** применится в `migrate-cli` при старте; см. [DEPLOY_016.md](../server/migrations/DEPLOY_016.md))
2. Общее: [DEPLOY-FOR-PROGRAMMER.md](DEPLOY-FOR-PROGRAMMER.md)
