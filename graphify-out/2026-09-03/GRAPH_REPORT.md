# Graph Report - spravochnik-repo  (2026-09-03)

## Corpus Check
- 89 files · ~51,867 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 938 nodes · 1996 edges · 39 communities (36 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4a79d5d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- data.ts
- yandex-sync.ts
- main.ts
- compilerOptions
- App
- Viewer.tsx
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
- vite-env.d.ts
- prefs.ts
- push-yandex-restore.mjs
- TopicEditorModal.tsx
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
- Чеклист тестирования REST INFO v2
- REST INFO — клиент (Electron)
- upload-release.js
- App.tsx
- legacy/README.md
- server-sync.ts

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 58 edges
2. `getUserDataRoot()` - 45 edges
3. `readSettings()` - 37 edges
4. `Viewer()` - 28 edges
5. `readAccounts()` - 24 edges
6. `App()` - 24 edges
7. `pushToYandex()` - 19 edges
8. `compilerOptions` - 18 edges
9. `writeAccounts()` - 16 edges
10. `serverFetch()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `accountsPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts
- `settingsPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts
- `sessionPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts
- `exportForServer()` --calls--> `readAccounts()`  [EXTRACTED]
  app/electron/export-for-server.ts → app/electron/auth-store.ts
- `pullFromServer()` --calls--> `readAccounts()`  [EXTRACTED]
  app/electron/server-sync.ts → app/electron/auth-store.ts

## Import Cycles
- None detected.

## Communities (39 total, 1 thin omitted)

### Community 0 - "data.ts"
Cohesion: 0.13
Nodes (24): ParentTopicField(), ParentTopicFieldProps, guideX(), highlightTitle(), rowMarginLeft(), TopicList(), TopicListProps, TreeNode() (+16 more)

### Community 1 - "yandex-sync.ts"
Cohesion: 0.10
Nodes (59): readSettings(), setPendingChanges(), getUserDataRoot(), baseDir(), basePathFor(), readBaseGuide(), writeAllGuideBasesFromLocal(), writeBaseFromLocalFile() (+51 more)

### Community 2 - "main.ts"
Cohesion: 0.06
Nodes (85): accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), defaultAccounts(), defaultSettings(), deleteUser(), ensureAuthFiles() (+77 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App"
Cohesion: 0.11
Nodes (20): App(), handleAuthenticated(), handleDepartmentChange(), handleInlineSave(), handleListFilterChange(), handlePush(), handleSave(), navigateBack() (+12 more)

### Community 5 - "Viewer.tsx"
Cohesion: 0.07
Nodes (39): ImageScaleDialog(), ImageScaleDialogProps, handleAnswerPaste(), imageOwnerPayload(), insertPhoto(), ImgMenuState, ScaleEditorState, Viewer() (+31 more)

### Community 6 - "paths.ts"
Cohesion: 0.08
Nodes (46): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+38 more)

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
Cohesion: 0.11
Nodes (18): graphify, Linux / production, REST INFO — инструкция для AI-агента, UI (`app/src/components/` + `lib/`), Windows (машина пользователя), Архитектура v2 (текущая), Версии, Владелец / bootstrap (+10 more)

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
Cohesion: 0.22
Nodes (9): Legacy: Яндекс.Диск, REST INFO, Архитектура v2, Данные для production, Документация, Разработка, Синхронизация и обновления, Структура (+1 more)

### Community 16 - "routes/topics.ts"
Cohesion: 0.07
Nodes (56): bumpGlobalVersion(), getGlobalVersion(), getPool(), query(), withTransaction(), dataDir, __dirname, main() (+48 more)

### Community 17 - "devDependencies"
Cohesion: 0.05
Nodes (41): cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cors, express (+33 more)

### Community 18 - "vite-env.d.ts"
Cohesion: 0.19
Nodes (15): AuthScreenProps, Header(), HeaderProps, ASSIGNABLE_ROLES, SettingsPageProps, DepartmentId, GuideFile, LatestReleaseInfo (+7 more)

### Community 19 - "prefs.ts"
Cohesion: 0.19
Nodes (13): AuthScreen(), forgetSavedLogin(), handleSubmit(), ServerUrlForm(), findRememberedLogin(), loadRememberedLogin(), loadRememberedLogins(), normalizeEmail() (+5 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "TopicEditorModal.tsx"
Cohesion: 0.22
Nodes (11): newDraftId(), TopicEditorModal(), handlePartyChange(), TopicEditorModalProps, filterItemsByParty(), filterItemsByView(), getItemParty(), DEPARTMENTS (+3 more)

### Community 22 - "REST INFO — инструкция для серверного программиста"
Cohesion: 0.12
Nodes (16): API (кратко), REST INFO — инструкция для серверного программиста, Troubleshooting, Бэкап, Контакты / файлы документации в репо, Обновление сервера после изменений в Git, Требования к серверу, Что вы получите от администратора (+8 more)

### Community 23 - "REST INFO v1 — Яндекс.Диск (legacy)"
Cohesion: 0.13
Nodes (15): Git-тег, OAuth-токен Яндекс.Диска, REST INFO v1 — Яндекс.Диск (legacy), Архитектура v1, Вариант A — env-переключатель (без git checkout), Вариант B — git checkout, Восстановление данных на Диск из SQL-сервера, Когда использовать (+7 more)

### Community 24 - "Скрипты REST INFO"
Cohesion: 0.15
Nodes (13): `app/scripts/dist-ascii.js`, `app/scripts/upload-release.js`, `app/scripts/upload-update-manifest.js`, `scripts/pull-yandex-export.mjs`, `scripts/push-yandex-restore.mjs`, `server/src/import-from-json.ts` → `npm run import-json`, `server/src/reset-password.ts`, Импорт на SQL-сервер (+5 more)

### Community 25 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, declaration, esModuleInterop, module, moduleResolution, outDir, resolveJsonModule, rootDir (+5 more)

### Community 26 - "Миграция с Яндекс.Диска на SQL-сервер"
Cohesion: 0.15
Nodes (13): Миграция с Яндекс.Диска на SQL-сервер, Обзор, Откат на Яндекс.Диск, Поведение нового клиента, Способ A — папка `REST-INFO-export` (готова), Способ B — вручную с Яндекс.Диска, Способ C — повторный экспорт (скрипт), Частые проблемы (+5 more)

### Community 27 - "REST INFO — статус проекта (handoff)"
Cohesion: 0.14
Nodes (14): REST INFO — статус проекта (handoff), Данные, Документация, Исправления в ходе dev, Клиент (`app/`), Локальная dev-среда (Windows пользователя), Сервер (`server/`), Скрипты и восстановление (+6 more)

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

### Community 34 - "Чеклист тестирования REST INFO v2"
Cohesion: 0.29
Nodes (7): Legacy, Клиент — онлайн, Клиент — оффлайн, Конфликты, Обновления, Сервер, Чеклист тестирования REST INFO v2

### Community 35 - "REST INFO — клиент (Electron)"
Cohesion: 0.33
Nodes (6): REST INFO — клиент (Electron), Запуск dev, Ключевые файлы, Локальные данные, Публикация Setup на сервер, Сборка установщика

### Community 36 - "upload-release.js"
Cohesion: 0.40
Nodes (3): fileName, serverUrl, versionMatch

### Community 37 - "App.tsx"
Cohesion: 0.15
Nodes (16): defaultSync, Search(), SearchProps, SyncConflictModal(), SyncConflictModalProps, ConflictResolution, Department, DEPT_VIEW_FILTERS (+8 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.08
Nodes (52): AccountsData, normalizeServerUrl(), departmentById(), clearPendingOperations(), hasPendingOperations(), OperationType, opsPath(), PendingOperation (+44 more)

## Knowledge Gaps
- **324 isolated node(s):** `Где работать`, `Архитектура v2 (текущая)`, `Обновления приложения (v2)`, `graphify`, `Клиент (`app/electron/`)` (+319 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 385 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getUserDataRoot()` connect `yandex-sync.ts` to `server-sync.ts`, `main.ts`, `paths.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `electron` connect `main.ts` to `yandex-sync.ts`, `compilerOptions`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `include` connect `compilerOptions` to `main.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Где работать`, `Архитектура v2 (текущая)`, `Обновления приложения (v2)` to the rest of the system?**
  _324 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12903225806451613 - nodes in this community are weakly interconnected._
- **Should `yandex-sync.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0967741935483871 - nodes in this community are weakly interconnected._