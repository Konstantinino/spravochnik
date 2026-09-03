# Graph Report - spravochnik-repo  (2026-09-03)

## Corpus Check
- 92 files · ~53,435 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 960 nodes · 2058 edges · 42 communities (36 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.85)
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
- App.tsx
- Viewer.tsx
- paths.ts
- app/package.json
- compilerOptions
- build
- REST INFO — инструкция для AI-агента
- TopicList.tsx
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
- Header
- Чеклист тестирования REST INFO v2
- REST INFO — клиент (Electron)
- upload-release.js
- Search.tsx
- legacy/README.md
- server-sync.ts

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 58 edges
2. `getUserDataRoot()` - 45 edges
3. `readSettings()` - 37 edges
4. `Viewer()` - 32 edges
5. `readAccounts()` - 24 edges
6. `App()` - 24 edges
7. `pushToYandex()` - 19 edges
8. `GuideItem` - 18 edges
9. `compilerOptions` - 18 edges
10. `writeAccounts()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `pushAccountsFile()` --calls--> `isServerReachable()`  [EXTRACTED]
  app/electron/server-sync.ts → app/electron/server-api.ts
- `handlePartyChange()` --calls--> `getItemParty()`  [EXTRACTED]
  app/src/components/TopicEditorModal.tsx → app/src/lib/data.ts
- `SearchHit` --references--> `GuideItem`  [EXTRACTED]
  app/src/lib/search.ts → app/src/types.ts
- `StoredUser` --references--> `UserRole`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts
- `accountsPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts

## Import Cycles
- None detected.

## Communities (42 total, 2 thin omitted)

### Community 0 - "data.ts"
Cohesion: 0.20
Nodes (13): ParentTopicField(), ParentTopicFieldProps, TopicEditorModalProps, TopicLinkPicker(), TopicLinkPickerProps, TopicLinkPickerState, compareTopicsByTitle(), getDescendantIds() (+5 more)

### Community 1 - "yandex-sync.ts"
Cohesion: 0.07
Nodes (69): setPendingChanges(), applyConflictResolutions(), asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic, mergeGuideFile() (+61 more)

### Community 2 - "main.ts"
Cohesion: 0.06
Nodes (95): accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), defaultAccounts(), defaultSettings(), deleteUser(), ensureAuthFiles() (+87 more)

### Community 3 - "compilerOptions"
Cohesion: 0.08
Nodes (25): downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc(), compilerOptions, allowImportingTsExtensions, isolatedModules, lib (+17 more)

### Community 4 - "App.tsx"
Cohesion: 0.10
Nodes (26): App(), handleAuthenticated(), handleDepartmentChange(), handleInlineSave(), handleListFilterChange(), handlePush(), handleSave(), navigateBack() (+18 more)

### Community 5 - "Viewer.tsx"
Cohesion: 0.05
Nodes (49): ImageScaleDialog(), ImageScaleDialogProps, newDraftId(), TopicEditorModal(), handleAnswerPaste(), handlePartyChange(), imageOwnerPayload(), insertPhoto() (+41 more)

### Community 6 - "paths.ts"
Cohesion: 0.08
Nodes (48): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+40 more)

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

### Community 11 - "TopicList.tsx"
Cohesion: 0.36
Nodes (9): guideX(), highlightTitle(), rowMarginLeft(), TopicList(), TopicListProps, TreeNode(), buildTree(), getChildren() (+1 more)

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

### Community 18 - "types.ts"
Cohesion: 0.14
Nodes (23): AuthScreenProps, HeaderProps, ASSIGNABLE_ROLES, SettingsPageProps, SyncConflictModalProps, ConflictResolution, Department, DepartmentId (+15 more)

### Community 19 - "prefs.ts"
Cohesion: 0.18
Nodes (14): AuthScreen(), forgetSavedLogin(), handleSubmit(), ServerUrlForm(), findRememberedLogin(), loadRememberedLogin(), loadRememberedLogins(), normalizeEmail() (+6 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "search.ts"
Cohesion: 0.36
Nodes (7): getItemPath(), buildTopicSearchFilter(), SearchHit, searchItems(), splitSearchTokens(), textHasAllTokens(), TopicSearchMatch

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

### Community 37 - "Search.tsx"
Cohesion: 0.50
Nodes (4): Search(), SearchProps, TOPIC_VIEW_FILTER_LABELS, TopicViewFilter

### Community 41 - "server-sync.ts"
Cohesion: 0.10
Nodes (38): AccountsData, departmentById(), clearPendingOperations(), hasPendingOperations(), OperationType, opsPath(), PendingOperation, PendingOperationsData (+30 more)

## Knowledge Gaps
- **320 isolated node(s):** `SettingsData`, `SessionData`, `ROLE_RANK`, `defaultSource`, `manifest` (+315 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 392 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getUserDataRoot()` connect `yandex-sync.ts` to `server-sync.ts`, `main.ts`, `compilerOptions`, `paths.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `electron` connect `compilerOptions` to `yandex-sync.ts`, `main.ts`, `paths.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsData`, `SessionData`, `ROLE_RANK` to the rest of the system?**
  _320 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `yandex-sync.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07404664938911515 - nodes in this community are weakly interconnected._
- **Should `main.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.060866318147871544 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07936507936507936 - nodes in this community are weakly interconnected._