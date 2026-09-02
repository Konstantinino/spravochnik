# Graph Report - spravochnik-repo  (2026-09-02)

## Corpus Check
- 89 files · ~51,191 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 939 nodes · 1983 edges · 41 communities (36 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e99c08d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Viewer.tsx
- yandex-sync.ts
- main.ts
- compilerOptions
- App.tsx
- Viewer
- paths.ts
- app/package.json
- compilerOptions
- build
- REST INFO — инструкция для AI-агента
- guide-merge.ts
- dist-ascii.js
- upload-update-manifest.js
- REST INFO
- routes/topics.ts
- devDependencies
- types.ts
- prefs.ts
- push-yandex-restore.mjs
- search.ts
- REST INFO — инструкция для серверного программиста
- REST INFO v1 — Яндекс.Диск (legacy)
- Скрипты REST INFO
- compilerOptions
- Миграция с Яндекс.Диска на SQL-сервер
- REST INFO — статус проекта (handoff)
- SettingsPage
- pull-yandex-export.mjs
- REST INFO — развёртывание сервера (Docker)
- REST INFO — сервер API
- SyncConflictModal.tsx
- Чеклист тестирования REST INFO v2
- REST INFO — клиент (Electron)
- upload-release.js
- Search.tsx
- legacy/README.md

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 58 edges
2. `getUserDataRoot()` - 45 edges
3. `readSettings()` - 37 edges
4. `Viewer()` - 26 edges
5. `readAccounts()` - 24 edges
6. `App()` - 24 edges
7. `pushToYandex()` - 19 edges
8. `compilerOptions` - 18 edges
9. `writeAccounts()` - 16 edges
10. `serverFetch()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `pushAccountsFile()` --calls--> `isServerReachable()`  [EXTRACTED]
  app/electron/server-sync.ts → app/electron/server-api.ts
- `AuthScreenProps` --references--> `PublicUser`  [EXTRACTED]
  app/src/components/AuthScreen.tsx → app/src/types.ts
- `StoredUser` --references--> `UserRole`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts
- `accountsPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts
- `sessionPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts

## Import Cycles
- None detected.

## Communities (41 total, 1 thin omitted)

### Community 0 - "Viewer.tsx"
Cohesion: 0.11
Nodes (29): ParentTopicField(), ParentTopicFieldProps, newDraftId(), TopicEditorModal(), handleAnswerPaste(), handlePartyChange(), imageOwnerPayload(), insertPhoto() (+21 more)

### Community 1 - "yandex-sync.ts"
Cohesion: 0.05
Nodes (104): AccountsData, readSettings(), setLastSyncAt(), setPendingChanges(), settingsPath(), writeSettings(), DATA_FILES, departmentById() (+96 more)

### Community 2 - "main.ts"
Cohesion: 0.06
Nodes (88): accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), defaultAccounts(), defaultSettings(), deleteUser(), ensureAuthFiles() (+80 more)

### Community 3 - "compilerOptions"
Cohesion: 0.08
Nodes (25): downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc(), compilerOptions, allowImportingTsExtensions, isolatedModules, lib (+17 more)

### Community 4 - "App.tsx"
Cohesion: 0.09
Nodes (21): App(), handleAuthenticated(), handleDepartmentChange(), handleInlineSave(), handleListFilterChange(), handlePush(), handleSave(), runPush() (+13 more)

### Community 5 - "Viewer"
Cohesion: 0.08
Nodes (23): ImageScaleDialog(), ImageScaleDialogProps, Viewer(), applyDraftScale(), closeFind(), closeScaleEditor(), openImageMenu(), openLightbox() (+15 more)

### Community 6 - "paths.ts"
Cohesion: 0.08
Nodes (45): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+37 more)

### Community 7 - "app/package.json"
Cohesion: 0.04
Nodes (46): author, dependencies, react, react-dom, react-markdown, remark-gfm, description, devDependencies (+38 more)

### Community 8 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+15 more)

### Community 9 - "build"
Cohesion: 0.09
Nodes (23): build, appId, directories, executableName, extraResources, files, nsis, productName (+15 more)

### Community 10 - "REST INFO — инструкция для AI-агента"
Cohesion: 0.12
Nodes (17): graphify, Linux / production, REST INFO — инструкция для AI-агента, UI (`app/src/components/`), Windows (машина пользователя), Архитектура v2 (текущая), Версии, Владелец / bootstrap (+9 more)

### Community 11 - "guide-merge.ts"
Cohesion: 0.25
Nodes (13): applyConflictResolutions(), asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic, mergeGuideFile(), MergeGuideResult (+5 more)

### Community 12 - "dist-ascii.js"
Cohesion: 0.17
Nodes (9): { execSync }, fs, nmDst, nmSrc, path, projectRoot, releaseDst, releaseSrc (+1 more)

### Community 13 - "upload-update-manifest.js"
Cohesion: 0.41
Nodes (11): deleteOldSetups(), deleteRemoteFile(), ensureDir(), folderPath(), fs, listRemoteFiles(), main(), path (+3 more)

### Community 14 - "REST INFO"
Cohesion: 0.12
Nodes (16): Legacy: Яндекс.Диск, REST INFO, Архитектура v2, Данные для production, Документация, Импорт данных, Клиент, Обновления приложения (+8 more)

### Community 16 - "routes/topics.ts"
Cohesion: 0.07
Nodes (56): bumpGlobalVersion(), getGlobalVersion(), getPool(), query(), withTransaction(), dataDir, __dirname, main() (+48 more)

### Community 17 - "devDependencies"
Cohesion: 0.05
Nodes (41): cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cors, express (+33 more)

### Community 18 - "types.ts"
Cohesion: 0.20
Nodes (19): HeaderProps, ASSIGNABLE_ROLES, SettingsPageProps, Department, DepartmentId, DEPARTMENTS, ExportManifest, GuideDocument (+11 more)

### Community 19 - "prefs.ts"
Cohesion: 0.18
Nodes (14): AuthScreen(), forgetSavedLogin(), handleSubmit(), AuthScreenProps, ServerUrlForm(), findRememberedLogin(), loadRememberedLogin(), loadRememberedLogins() (+6 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "search.ts"
Cohesion: 0.21
Nodes (14): guideX(), highlightTitle(), rowMarginLeft(), TopicList(), TopicListProps, TreeNode(), getChildren(), getItemPath() (+6 more)

### Community 22 - "REST INFO — инструкция для серверного программиста"
Cohesion: 0.12
Nodes (16): API (кратко), REST INFO — инструкция для серверного программиста, Troubleshooting, Бэкап, Контакты / файлы документации в репо, Обновление сервера после изменений в Git, Требования к серверу, Что вы получите от администратора (+8 more)

### Community 23 - "REST INFO v1 — Яндекс.Диск (legacy)"
Cohesion: 0.13
Nodes (15): Git-тег, OAuth-токен Яндекс.Диска, REST INFO v1 — Яндекс.Диск (legacy), Архитектура v1, Вариант A — env-переключатель (без git checkout), Вариант B — git checkout, Восстановление данных на Диск из SQL-сервера, Когда использовать (+7 more)

### Community 24 - "Скрипты REST INFO"
Cohesion: 0.14
Nodes (13): `app/scripts/dist-ascii.js`, `app/scripts/upload-release.js`, `app/scripts/upload-update-manifest.js`, `scripts/pull-yandex-export.mjs`, `scripts/push-yandex-restore.mjs`, `server/src/import-from-json.ts` → `npm run import-json`, `server/src/reset-password.ts`, Импорт на SQL-сервер (+5 more)

### Community 25 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, declaration, esModuleInterop, module, moduleResolution, outDir, resolveJsonModule, rootDir (+5 more)

### Community 26 - "Миграция с Яндекс.Диска на SQL-сервер"
Cohesion: 0.15
Nodes (13): Миграция с Яндекс.Диска на SQL-сервер, Обзор, Откат на Яндекс.Диск, Поведение нового клиента, Способ A — папка `REST-INFO-export` (готова), Способ B — вручную с Яндекс.Диска, Способ C — повторный экспорт (скрипт), Частые проблемы (+5 more)

### Community 27 - "REST INFO — статус проекта (handoff)"
Cohesion: 0.15
Nodes (13): REST INFO — статус проекта (handoff), Данные, Документация, Исправления в ходе dev, Клиент (`app/`), Локальная dev-среда (Windows пользователя), Сервер (`server/`), Следующие шаги (для администратора) (+5 more)

### Community 28 - "SettingsPage"
Cohesion: 0.20
Nodes (5): SettingsPage(), closeDeleteUser(), closeEditUser(), confirmDeleteUser(), saveEditedUser()

### Community 29 - "pull-yandex-export.mjs"
Cohesion: 0.32
Nodes (11): countTopics(), __dirname, diskPath(), downloadFile(), JSON_FILES, listDir(), listMediaRecursive(), main() (+3 more)

### Community 30 - "REST INFO — развёртывание сервера (Docker)"
Cohesion: 0.18
Nodes (11): API endpoints (кратко), Production (nginx), REST INFO — развёртывание сервера (Docker), Troubleshooting, Быстрый старт, Бэкап, Обновление, Первичный импорт данных (+3 more)

### Community 31 - "REST INFO — сервер API"
Cohesion: 0.20
Nodes (9): API endpoints, Docker (production / Linux), REST INFO — сервер API, Windows dev (без Docker), Запуск, Импорт данных, Обычный dev (нужен PostgreSQL), Сброс пароля (recovery) (+1 more)

### Community 33 - "SyncConflictModal.tsx"
Cohesion: 0.32
Nodes (4): SyncConflictModal(), SyncConflictModalProps, ConflictResolution, SyncConflictInfo

### Community 34 - "Чеклист тестирования REST INFO v2"
Cohesion: 0.29
Nodes (7): Legacy, Клиент — онлайн, Клиент — оффлайн, Конфликты, Обновления, Сервер, Чеклист тестирования REST INFO v2

### Community 35 - "REST INFO — клиент (Electron)"
Cohesion: 0.33
Nodes (6): REST INFO — клиент (Electron), Запуск dev, Ключевые файлы, Локальные данные, Публикация Setup на сервер, Сборка установщика

### Community 36 - "upload-release.js"
Cohesion: 0.40
Nodes (3): fileName, serverUrl, versionMatch

### Community 37 - "Search.tsx"
Cohesion: 0.50
Nodes (4): Search(), SearchProps, TOPIC_VIEW_FILTER_LABELS, TopicViewFilter

## Knowledge Gaps
- **322 isolated node(s):** `SettingsData`, `SessionData`, `ROLE_RANK`, `defaultSource`, `manifest` (+317 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 389 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getUserDataRoot()` connect `yandex-sync.ts` to `main.ts`, `compilerOptions`, `paths.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `electron` connect `compilerOptions` to `yandex-sync.ts`, `main.ts`, `paths.ts`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsData`, `SessionData`, `ROLE_RANK` to the rest of the system?**
  _322 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Viewer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11153846153846154 - nodes in this community are weakly interconnected._
- **Should `yandex-sync.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051597051597051594 - nodes in this community are weakly interconnected._
- **Should `main.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06099656357388316 - nodes in this community are weakly interconnected._