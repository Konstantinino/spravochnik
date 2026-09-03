# Graph Report - spravochnik-repo  (2026-09-03)

## Corpus Check
- 94 files · ~58,558 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1025 nodes · 2296 edges · 55 communities (49 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f4b3c5e8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- data.ts
- yandex-sync.ts
- auth-store.ts
- compilerOptions
- App.tsx
- Viewer
- paths.ts
- devDependencies
- compilerOptions
- build
- REST INFO — инструкция для AI-агента
- TopicList.tsx
- dist-ascii.js
- upload-update-manifest.js
- REST INFO
- admin.ts
- devDependencies
- types.ts
- prefs.ts
- push-yandex-restore.mjs
- SettingsErrorBoundary
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
- Viewer.tsx
- Чеклист тестирования REST INFO v2
- REST INFO — клиент (Electron)
- upload-release.js
- imageDisplay.ts
- legacy/README.md
- SyncConflictModal.tsx
- main.ts
- server-sync.ts
- server-api.ts
- vite-env.d.ts
- app/package.json
- TopicEditorModal
- nsis
- dependencies
- scripts
- win
- search.ts
- readSettings
- WorkDepartmentId

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 66 edges
2. `getUserDataRoot()` - 46 edges
3. `readSettings()` - 37 edges
4. `Viewer()` - 32 edges
5. `readAccounts()` - 29 edges
6. `App()` - 27 edges
7. `SettingsPage()` - 20 edges
8. `pushToYandex()` - 19 edges
9. `normalizeEmail()` - 18 edges
10. `serverFetch()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `AuthScreenProps` --references--> `PublicUser`  [EXTRACTED]
  app/src/components/AuthScreen.tsx → app/src/types.ts
- `SettingsPageProps` --references--> `PublicUser`  [EXTRACTED]
  app/src/components/SettingsPage.tsx → app/src/types.ts
- `handlePartyChange()` --calls--> `getItemParty()`  [EXTRACTED]
  app/src/components/TopicEditorModal.tsx → app/src/lib/data.ts
- `accountsPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts
- `settingsPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts

## Import Cycles
- None detected.

## Communities (55 total, 2 thin omitted)

### Community 0 - "data.ts"
Cohesion: 0.16
Nodes (17): ParentTopicField(), ParentTopicFieldProps, TopicEditorModalProps, TopicLinkPicker(), TopicLinkPickerProps, TopicLinkPickerState, compareTopicsByTitle(), getDescendantIds() (+9 more)

### Community 1 - "yandex-sync.ts"
Cohesion: 0.05
Nodes (89): applyConflictResolutions(), asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic, mergeGuideFile(), MergeGuideResult (+81 more)

### Community 2 - "auth-store.ts"
Cohesion: 0.17
Nodes (40): accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), coerceAccountsData(), defaultAccounts(), deleteUser(), ensureAuthFiles() (+32 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App.tsx"
Cohesion: 0.12
Nodes (23): App(), handleAuthenticated(), handleDepartmentChange(), handleInlineSave(), handleListFilterChange(), handlePush(), handleSave(), navigateBack() (+15 more)

### Community 5 - "Viewer"
Cohesion: 0.11
Nodes (11): Viewer(), closeFind(), closeScaleEditor(), openImageMenu(), openLightbox(), persistDisplay(), renderTopicImage(), renderTopicLink() (+3 more)

### Community 6 - "paths.ts"
Cohesion: 0.07
Nodes (51): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+43 more)

### Community 7 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, electron, electron-builder, @types/react, @types/react-dom, typescript, vite, vite-plugin-electron (+11 more)

### Community 8 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+15 more)

### Community 9 - "build"
Cohesion: 0.20
Nodes (10): build, appId, directories, executableName, extraResources, files, productName, output (+2 more)

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

### Community 16 - "admin.ts"
Cohesion: 0.05
Nodes (76): bumpGlobalVersion(), getGlobalVersion(), getPool(), query(), withTransaction(), dataDir, __dirname, main() (+68 more)

### Community 17 - "devDependencies"
Cohesion: 0.05
Nodes (41): cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cors, express (+33 more)

### Community 18 - "types.ts"
Cohesion: 0.14
Nodes (16): Search(), SearchProps, CONTENT_EDITOR_ROLES, Department, DEPT_VIEW_FILTERS, ExportManifest, GuideDocument, isUserRole() (+8 more)

### Community 19 - "prefs.ts"
Cohesion: 0.14
Nodes (18): AuthScreen(), forgetSavedLogin(), handleSubmit(), AuthScreenProps, ServerUrlForm(), findRememberedLogin(), isDepartmentId(), loadRememberedLogin() (+10 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

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
Cohesion: 0.15
Nodes (21): assignableRoles(), coerceUsers(), coerceWhitelist(), SettingsPage(), addEmail(), changeRole(), closeDeleteUser(), closeEditUser() (+13 more)

### Community 29 - "pull-yandex-export.mjs"
Cohesion: 0.32
Nodes (11): countTopics(), __dirname, diskPath(), downloadFile(), JSON_FILES, listDir(), listMediaRecursive(), main() (+3 more)

### Community 30 - "REST INFO — развёртывание сервера (Docker)"
Cohesion: 0.18
Nodes (11): API endpoints (кратко), Production (nginx), REST INFO — развёртывание сервера (Docker), Troubleshooting, Быстрый старт, Бэкап, Обновление, Первичный импорт данных (+3 more)

### Community 31 - "REST INFO — сервер API"
Cohesion: 0.20
Nodes (9): API endpoints, Docker (production / Linux), REST INFO — сервер API, Windows dev (без Docker), Запуск, Импорт данных, Обычный dev (нужен PostgreSQL), Сброс пароля (recovery) (+1 more)

### Community 33 - "Viewer.tsx"
Cohesion: 0.18
Nodes (17): ImgMenuState, ScaleEditorState, copyTopicLink(), ViewerProps, useTopicLinkPicker(), escapeMdLinkLabel(), formatTopicMarkdownLink(), isAllowedMarkdownImageSrc() (+9 more)

### Community 34 - "Чеклист тестирования REST INFO v2"
Cohesion: 0.29
Nodes (7): Legacy, Клиент — онлайн, Клиент — оффлайн, Конфликты, Обновления, Сервер, Чеклист тестирования REST INFO v2

### Community 35 - "REST INFO — клиент (Electron)"
Cohesion: 0.33
Nodes (6): REST INFO — клиент (Electron), Запуск dev, Ключевые файлы, Локальные данные, Публикация Setup на сервер, Сборка установщика

### Community 36 - "upload-release.js"
Cohesion: 0.40
Nodes (3): fileName, serverUrl, versionMatch

### Community 37 - "imageDisplay.ts"
Cohesion: 0.22
Nodes (9): ImageScaleDialog(), ImageScaleDialogProps, applyDraftScale(), clampImageScale(), getImageScale(), IMAGE_SCALE_DEFAULT, IMAGE_SCALE_MAX, IMAGE_SCALE_MIN (+1 more)

### Community 39 - "SyncConflictModal.tsx"
Cohesion: 0.32
Nodes (4): SyncConflictModal(), SyncConflictModalProps, ConflictResolution, SyncConflictInfo

### Community 40 - "main.ts"
Cohesion: 0.15
Nodes (29): getWhitelist(), requireRole(), cacheServerUser(), fetchAdminUsersFromServer(), publicUsersFromServer(), readGuideFile(), registerIpc(), roleFromServerUser() (+21 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.10
Nodes (39): AccountsData, setPendingChanges(), departmentById(), DEPARTMENTS, PENDING_OPERATIONS_FILE, clearPendingOperations(), hasPendingOperations(), OperationType (+31 more)

### Community 42 - "server-api.ts"
Cohesion: 0.22
Nodes (15): normalizeServerUrl(), putUser(), authHeaders(), baseUrl(), downloadMediaFile(), lockTopic(), renewTopicLock(), ServerApiError (+7 more)

### Community 43 - "vite-env.d.ts"
Cohesion: 0.32
Nodes (12): HeaderProps, DepartmentId, GuideFile, LatestReleaseInfo, PublicUser, SyncStatus, UpdateInfo, UserRole (+4 more)

### Community 44 - "app/package.json"
Cohesion: 0.18
Nodes (10): author, description, license, main, name, private, repository, type (+2 more)

### Community 45 - "TopicEditorModal"
Cohesion: 0.19
Nodes (11): newDraftId(), TopicEditorModal(), handleAnswerPaste(), handlePartyChange(), imageOwnerPayload(), insertPhoto(), handleAnswerPaste(), insertPhoto() (+3 more)

### Community 46 - "nsis"
Cohesion: 0.22
Nodes (9): nsis, allowToChangeInstallationDirectory, createDesktopShortcut, createStartMenuShortcut, installerLanguages, language, oneClick, shortcutName (+1 more)

### Community 47 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, react, react-dom, react-markdown, remark-gfm, react, react-dom, react-markdown (+1 more)

### Community 48 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, dist, dist:ascii, electron:dev, pack, preview

### Community 49 - "win"
Cohesion: 0.50
Nodes (4): win, artifactName, icon, target

### Community 52 - "search.ts"
Cohesion: 0.43
Nodes (6): getItemPath(), buildTopicSearchFilter(), searchItems(), splitSearchTokens(), textHasAllTokens(), TopicSearchMatch

### Community 53 - "readSettings"
Cohesion: 0.36
Nodes (9): defaultSettings(), readSettings(), setAuthToken(), setLastSyncAt(), setServerUrl(), settingsPath(), setYandexToken(), writeSettings() (+1 more)

### Community 54 - "WorkDepartmentId"
Cohesion: 0.50
Nodes (5): PublicUser, StoredUser, WhitelistEntry, UserRole, WorkDepartmentId

## Knowledge Gaps
- **326 isolated node(s):** `SettingsData`, `SessionData`, `ROLE_RANK`, `defaultSource`, `manifest` (+321 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 397 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getUserDataRoot()` connect `yandex-sync.ts` to `auth-store.ts`, `paths.ts`, `main.ts`, `server-sync.ts`, `server-api.ts`, `readSettings`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `electron` connect `yandex-sync.ts` to `main.ts`, `compilerOptions`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `include` connect `compilerOptions` to `yandex-sync.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsData`, `SessionData`, `ROLE_RANK` to the rest of the system?**
  _326 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `yandex-sync.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05111683848797251 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._