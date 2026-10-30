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
| Веб-клиент | `web/` | Vite SPA, общий UI из `app/src`, httpOnly cookie |
| Сервер API | `server/` | Node 20, Express, PostgreSQL, JWT (+ cookie-auth для веба) |
| Docker | `docker-compose.yml` | postgres:16 + api (context = repo root; **`web/dist` baked into image**) |
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

## graphify — навигация по коду (не часть runtime)

Graphify **не участвует** в сборке, Docker, API и клиенте. Это карта связей (код + доки) для людей и агентов: только **корень** `graphify-out/` (`graph.json`, `graph.html`, `GRAPH_REPORT.md`). `graphify-out/cache/` и `graphify-out/20XX-…/` — локально, **не в git**.

### Когда агент **обязан** вспомнить про graphify

Перед разбором — **один** `graphify query` (из корня `spravochnik-repo/`), если задача **обзорная** и адрес в коде неочевиден:

- «как устроено …», «где обрабатывается …», «кто вызывает …» без известного файла/символа;
- сквозной сценарий: UI → IPC → sync → API → migrations;
- новый агент / handoff после давних правок;
- рефакторинг, затрагивающий **несколько слоёв** (client + server + migrations).

```powershell
cd spravochnik-repo
graphify query "<краткий вопрос по-русски или по терминам проекта>"
```

После ответа query — **всё равно** открыть и прочитать найденные файлы (`Read`/grep). Graphify показывает связи, не семантику и не edge cases.

### Когда graphify **не нужен** (не трать время)

- Узкая правка: известный путь, один символ, текст UI, тип, миграция по номеру.
- Точный поиск: `grep` / `rg` по имени функции, IPC-каналу, `016_unified_party`.
- Проверка поведения: только чтение кода и при необходимости запуск команд.

**Не** делать `graphify update` после каждого мелкого патча **во время работы** — только перед **git commit** (см. ниже).

### Когда обновлять граф в git

**Перед каждым commit** (любые правки в репо), из корня:

```powershell
cd spravochnik-repo
graphify update .
```

Stage только корень `graphify-out/` (`graph.json`, `graph.html`, `GRAPH_REPORT.md`, `manifest.json`, labels при изменении). **Не** stage `graphify-out/cache/` и `graphify-out/20XX-…/`. Подробно: `.cursor/rules/graphify-commit.mdc`.

Проверка: `Built from commit:` в `GRAPH_REPORT.md` = `git rev-parse HEAD`. Hook на `git commit` может пересобрать граф в фоне, но **не коммитит** — не полагаться на него.

Дополнительно вне commit: после **крупной** серии изменений структуры/связей или по запросу «обнови ключевые файлы» — тот же `graphify update .` + commit по правилу выше.

Опционально: `graphify label` — если communities переименовались и нужны свежие LLM-названия (нужен API key).

См. обзор: `graphify-out/GRAPH_REPORT.md`.

## Ключевые модули

### Клиент (`app/electron/`)

| Файл | Назначение |
|---|---|
| `main.ts` | IPC, auth, CRUD, admin, storage-stats, `requireEditDepartment`, `updates:install`, `app:focus-window`, валидация URL; **Edit menu + context Copy** (выделение текста) |
| `server-api.ts` | HTTP-клиент; `validateServerUrl()`; **`X-Rest-Info-Client-Version`**; **`getTopicOrderClientId()`** для lock порядка |
| `server-sync.ts` | pull/push, конфликты, очередь, flush медиа, reconcile create, `ensureRequestedPartyPersisted`, **`ensureRequestedClientLinkPersisted`**, `mergeTopicAfterPush`, **`applySubsectionsFromSync`**, ответ **426** → «Нужно обновить приложение» |
| `departments-store.ts` | локальный `departments.json`, merge из sync/admin |
| `subsections-store.ts` | локальный `subsections.json`, merge из sync/admin |
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
| `routes/auth.ts` | login/register (Bearer JWT); **`/login-web`**, **`/register-web`**, **`/logout-web`** (httpOnly cookie) |
| `lib/web-session.ts` | cookie сессии для браузерного клиента |
| `routes/admin.ts` | users, роли (owner/admin/editor/user), whitelist, releases, передача владения, **место на сервере** (owner), **`POST /admin/fix-media-paths`**, **`GET/POST/PUT/DELETE /admin/departments`**, **подразделы** (`/admin/departments/:id/subsections`, `/admin/subsections/:id`) |
| `lib/departments.ts` | CRUD разделов, `lost`, `sort_order`, `system_locked` |
| `lib/subsections.ts` | CRUD подразделов, `resolveTopicSubsectionId` |
| `lib/department-archive.ts` | per-dept `{id}__archive__archived|lost`, `moveTopicsToArchiveLostByParty` |
| `lib/topic-party.ts` | `resolveRootTopicPartyForWrite` (party = id верхнего раздела) |
| `lib/move-topics-to-lost.ts` | перенос тем в отдел `lost` при удалении **отдела** (009) |
| `routes/topics.ts` | CRUD тем, архив с bucket subsection, party на write, topic-order + **`clientId`** |
| `middleware/min-client-version.ts` | gate версии для **Electron (Bearer)**; веб cookie-сессия пропускается (`web-session.ts`) |
| `routes/sync.ts` | GET /sync/changes, GET /sync/status; в changes: **`departments`**, **`subsections`** |
| `lib/media-layout.ts` | канонические пути медиа, миграция на диске при старте API |
| `routes/media.ts` | upload/download по `originalUrl`; `GET /media/status`; `updates/*` → UPDATES_DIR; лимит 120 МБ |
| `index.ts` | Express; **`WEB_DIST`** static SPA; `/health` → `web`/`media`/`build` |
| `routes/updates.ts` | GET /app/update (legacy), GET /app/updates/*, **GET /app/support-phones** |
| `lib/support-phones.ts` | sync_state, normalize + format display from tel |
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
| `SettingsPage.tsx` | owner/admin: пользователи, роли, whitelist, **разделы тем** (внутри отдела; отделы — в шапке), телефоны support, передача владения, скачать Setup; **владелец** — место на сервере; журнал сессии; full pull |
| `Viewer.tsx`, `Header.tsx` | просмотр/правка; topbar: ← Назад, **«Клиент»/«Админ»** (связанные темы), телефоны support; профиль → «Обновить»; **«Сбросить»** |
| `SupportPhonesBar.tsx`, `lib/supportPhones.ts`, `lib/supportPhonesUi.ts` | телефоны техподдержки: формат из цифр, копирование, placement header/strip |
| `TopicMarkdownImage.tsx` | resolve shared image paths, retry download |
| `hooks/usePreserveTextareaFocus.ts` | сохранение фокуса textarea при Alt+Shift (Windows) |
| `lib/restoreAppFocus.ts` | восстановление фокуса Electron после модалок / сброса |
| `ParentTopicField.tsx`, `TopicLinkPicker.tsx` | родитель: combobox, поиск по названию, фильтр party; «+»: весь отдел без архива |
| `hooks/useTopicLinkPicker.ts` | состояние пикера, dismiss после пробела |
| `TopicList.tsx` | дерево тем, секции **party** / **разделов тем** (отступ), **reorder**, ПКМ «редактировать тему/порядок» |
| `TopicEditorModal.tsx` | обязательный выбор **раздела**, если в отделе настроены разделы (корневая тема) |
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

На хосте, где запрещён `docker compose -f`, использовать env:

```bash
cd /home/opt/info-rest   # пример
git pull
# web/dist уже в git и вшивается в образ при build — отдельный npm run build на сервере не обязателен
COMPOSE_FILE=docker-compose.yml docker compose up -d --build
# проверка: curl -s https://info.r-est.ru/health → build + web.assets > 0
```

```bash
docker compose exec api node dist/import-from-json.js /import/REST-INFO-export
```

Фраза **«обнови ключевые файлы»** — см. раздел [«Ключевые файлы проекта»](#ключевые-файлы-проекта-handoff-и-агенты) (это **не** «пересобрать весь код», а handoff + инструкции для агентов). Setup — только по явной просьбе.

### Сборка и публикация установщика

`latest.yml` и `.blockmap` **не в Git** (`app/release/` в gitignore) — их создаёт **electron-builder** рядом с Setup. В GitHub уходит только исходники; на production — через скрипт.

```powershell
cd app
npm run dist:ascii
# → release/REST-INFO-Setup-x.y.z.exe + latest.yml + .blockmap

# Обязательно для кнопки «Обновить» в клиенте (нужен .env.deploy в корне репо):
.\scripts\publish-release.ps1
```

Агент: после **`dist:ascii` по просьбе пользователя** — если есть `.env.deploy`, **сразу** запустить `publish-release.ps1`; иначе явно напомнить, что без upload `latest.yml` автообновление не заработает (даже если релиз зарегистрирован вручную).

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
10. **Reorder + party categories:** на production нужны миграции **004–007**; **008** — `client_topic_id` (admin↔client).
11. **Reorder:** порядок на сервер уходит только при «Завершить редактирование»; перед входом — pull порядка + lock; unlock после успешного PUT.
12. **Первый вход в reorder:** локально проставляет `sort_index` по текущему порядку (без push до «Завершить»).
13. **Минимальная версия клиента (только десктоп):** запись с **Bearer** отклоняется (426), если `X-Rest-Info-Client-Version` старее последнего `app_releases`. **Веб** (httpOnly cookie, без Bearer) — gate не применяется. Без записи в `app_releases` проверка выключена.
14. **Admin↔client link:** пока production API без **008**, связь держится локально после push; для общей БД — деплой **008** + клиент с заголовком версии.
15. **Терминология UI:** **отдел** = support/СПП/юристы (шапка); **раздел** = группировка тем внутри отдела (`department_subsections`, поле `subsection_id` в JSON/API). Не путать с CRUD `/admin/departments` (отдельные JSON-справочники на диске; в настройках не редактируются).
16. **«Потерялись»:** отдел `lost` (009) в шапке только при наличии тем. **Разделы тем:** **010**; **016** — party + архивные подразделы в каждом рабочем отделе; без **016** на prod — рассинхрон party/архива с клиентом 1.5.0.
17. **Телефоны в шапке:** блок справа (`supportPhonesUi.ts` → `header`); копирование форматированного номера.
18. **Разделы тем (настройки):** `canManageTopicSectionsForDepartment` — owner все отделы, admin только `departmentId` пользователя (UI + `admin.ts` + IPC `admin:*-subsection` / `admin:*-support-section`).
19. **Список «Все»:** `groupRootsByParty` для всех отделов; non-support — плашки `department_subsections`; support — party + подразделы.
20. **Редактор темы:** корневая тема — обязательный **раздел** (верхний уровень, все отделы с настроенными разделами); **подраздел** — select только если у выбранного раздела есть записи-подразделы; в select всегда **«- без подраздела -»** (корень раздела); без подразделов в разделе поле скрыто → тема в корне автоматически (`topicSectionPickers.ts`, `TopicEditorModal`, `Viewer`). Client link только support / party `additional`. Имена `showSupportSubsectionPicker` / party-модель — legacy: то же для СПП и др., не только support.

## Ключевые файлы проекта (handoff и агенты)

Когда пользователь просит **«обнови ключевые файлы»**, он имеет в виду **не исходники приложения**, а **систему сопровождения**: актуальные инструкции, статус и карта кода для следующих людей/агентов.

### Чеклист (выполнить по смыслу сессии, без лишних рефакторингов)

1. **`docs/PROJECT-STATUS.md`** — что сделано, что в проде, блокеры, следующие шаги.
2. **`AGENTS.md`** (этот файл) — архитектура, модули, правила, версии, если изменились.
3. **Deploy / миграции** — при новых SQL: `server/migrations/DEPLOY_*.md` или правки `docs/server-deploy.md`, `docs/DEPLOY-FOR-PROGRAMMER.md`.
4. **Чеклисты и README** — при изменении UX/сценариев: `docs/testing-checklist.md`, корневой `README.md`, `web/README.md` по необходимости.
5. **Graphify** — `graphify update .` + commit `graphify-out/` (см. раздел [graphify](#graphify--навигация-по-коду-не-часть-runtime)), если менялась **структура** кода или пользователь ждёт актуальную карту.
6. **Commit + push** — только по просьбе пользователя; не включать `.env`, токены, `REST-INFO-export/`, `graphify-out/cache/` (если не принято иное).

### Не входит в «ключевые файлы» по умолчанию

- **`npm run dist`** (Setup) — только если явно просят установщик/десктоп-релиз.
- **Commit/push по запросу пользователя** после правок UI (`app/src`, `web/src`): перед commit **`cd web && npm run build`**, в git — **`web/dist/`** (иначе production-веб не меняется). См. `.cursor/rules/pc-web-sync.mdc`.
- Правка бизнес-логики без запроса «обнови ключевые» — только код задачи.

## Правила для агента

- Минимальный diff, не рефакторить без запроса
- Коммиты — только по явной просьбе пользователя; при commit/push UI-изменений — всегда свежий **`web/dist`** в том же commit
- Работать только в `spravochnik-repo/`
- Не коммитить `.env`, токены, `REST-INFO-export/`
- **Graphify:** обзорная задача без адреса в коде → `graphify query`; **перед каждым commit** → `graphify update .` и stage по `.cursor/rules/graphify-commit.mdc`
- **«Обнови ключевые файлы»** → раздел [«Ключевые файлы проекта»](#ключевые-файлы-проекта-handoff-и-агенты)

## Версии

- Клиент: **1.5.1** (`app/package.json`)
- Сервер: **1.0.0** (`server/package.json`)
- Git tag `v1.yandex-disk` — **не создан** (нужно вручную при необходимости)
