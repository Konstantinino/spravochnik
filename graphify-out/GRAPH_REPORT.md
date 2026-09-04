# Graph Report - spravochnik-repo  (2026-09-04)

## Corpus Check
- 96 files · ~63,253 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1094 nodes · 2533 edges · 53 communities (49 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `097a828b`
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
- routes/topics.ts
- dist-ascii.js
- upload-update-manifest.js
- REST INFO
- admin.ts
- devDependencies
- import-from-json.ts
- prefs.ts
- push-yandex-restore.mjs
- media.ts
- REST INFO — инструкция для серверного программиста
- REST INFO v1 — Яндекс.Диск (legacy)
- Скрипты REST INFO
- compilerOptions
- Миграция с Яндекс.Диска на SQL-сервер
- REST INFO — статус проекта (handoff)
- index.ts
- pull-yandex-export.mjs
- REST INFO — развёртывание сервера (Docker)
- REST INFO — сервер API
- Чеклист тестирования REST INFO v2
- REST INFO — клиент (Electron)
- upload-release.js
- electron/updates.ts
- legacy/README.md
- lib/media-layout.ts
- main.ts
- server-sync.ts
- readSettings
- types.ts
- app/package.json
- TopicEditorModal
- nsis
- dependencies
- scripts
- win
- imageDisplay.ts
- Viewer.tsx
- WorkDepartmentId

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 72 edges
2. `getUserDataRoot()` - 46 edges
3. `readSettings()` - 38 edges
4. `Viewer()` - 36 edges
5. `readAccounts()` - 29 edges
6. `App()` - 27 edges
7. `SettingsPage()` - 21 edges
8. `pullFromServer()` - 20 edges
9. `serverFetch()` - 19 edges
10. `pushToYandex()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `closeFind()` --calls--> `clearFindHighlights()`  [EXTRACTED]
  app/src/components/Viewer.tsx → app/src/lib/findHighlight.ts
- `copyTopicLink()` --calls--> `formatTopicMarkdownLink()`  [EXTRACTED]
  app/src/components/Viewer.tsx → app/src/lib/markdown.ts
- `AuthScreenProps` --references--> `PublicUser`  [EXTRACTED]
  app/src/components/AuthScreen.tsx → app/src/types.ts
- `accountsPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts
- `settingsPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts

## Import Cycles
- None detected.

## Communities (53 total, 1 thin omitted)

### Community 0 - "data.ts"
Cohesion: 0.11
Nodes (27): ParentTopicField(), ParentTopicFieldProps, TopicLinkPicker(), TopicLinkPickerProps, TopicLinkPickerState, guideX(), highlightTitle(), rowMarginLeft() (+19 more)

### Community 1 - "yandex-sync.ts"
Cohesion: 0.05
Nodes (83): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+75 more)

### Community 2 - "auth-store.ts"
Cohesion: 0.17
Nodes (40): accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), coerceAccountsData(), defaultAccounts(), defaultSettings(), deleteUser() (+32 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App.tsx"
Cohesion: 0.10
Nodes (24): App(), handleAuthenticated(), handleDepartmentChange(), handleInlineSave(), handleListFilterChange(), handlePush(), handleSave(), navigateBack() (+16 more)

### Community 5 - "Viewer"
Cohesion: 0.10
Nodes (18): fileExtLabel(), nodeText(), Viewer(), closeFind(), closeScaleEditor(), copyTopicLink(), downloadImage(), openAttachedFile() (+10 more)

### Community 6 - "paths.ts"
Cohesion: 0.06
Nodes (78): resolveImageOwner(), downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc(), absFromRoot(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT (+70 more)

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

### Community 11 - "routes/topics.ts"
Cohesion: 0.20
Nodes (16): getGlobalVersion(), acquireTopicLock(), DEPARTMENTS, isValidDepartment(), isWorkDepartmentId(), normalizeWorkDepartmentId(), refreshHasChildren(), releaseTopicLock() (+8 more)

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
Cohesion: 0.15
Nodes (23): canEditContent(), CONTENT_EDITOR_ROLES, generateSalt(), hashPassword(), isOwnerEmail(), isOwnerRole(), isStaffRole(), isWorkDepartmentId() (+15 more)

### Community 17 - "devDependencies"
Cohesion: 0.05
Nodes (41): cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cors, express (+33 more)

### Community 18 - "import-from-json.ts"
Cohesion: 0.24
Nodes (14): bumpGlobalVersion(), getPool(), query(), withTransaction(), AccountsData, copyMediaTree(), DEPARTMENT_FILES, GuideItem (+6 more)

### Community 19 - "prefs.ts"
Cohesion: 0.14
Nodes (18): AuthScreen(), forgetSavedLogin(), handleSubmit(), AuthScreenProps, ServerUrlForm(), findRememberedLogin(), isDepartmentId(), loadRememberedLogin() (+10 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "media.ts"
Cohesion: 0.18
Nodes (11): isUserRole(), JwtUser, parseUserRole(), authMiddleware(), AuthRequest, optionalAuth(), requireRole(), signToken() (+3 more)

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

### Community 28 - "index.ts"
Cohesion: 0.14
Nodes (12): dataDir, __dirname, main(), mediaDir, root, updatesDir, PORT, adminRouter (+4 more)

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

### Community 37 - "electron/updates.ts"
Cohesion: 0.20
Nodes (14): APP_UPDATE_FILE, checkForUpdates(), downloadLatestRelease(), downloadUpdate(), emit(), fetchLatestRelease(), isNetworkOnline(), lastInfo (+6 more)

### Community 39 - "lib/media-layout.ts"
Cohesion: 0.30
Nodes (15): absoluteMediaCandidates(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT, isMediaDepartmentId(), MEDIA_DEPARTMENT_IDS, MediaDepartmentId, mediaRelativePathCandidates(), migrateFolderContents() (+7 more)

### Community 40 - "main.ts"
Cohesion: 0.16
Nodes (28): getWhitelist(), requireRole(), writeSession(), cacheServerUser(), fetchAdminUsersFromServer(), publicUsersFromServer(), readGuideFile(), registerIpc() (+20 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.09
Nodes (47): AccountsData, setPendingChanges(), departmentById(), DEPARTMENTS, PENDING_OPERATIONS_FILE, clearPendingOperations(), hasPendingOperations(), OperationType (+39 more)

### Community 42 - "readSettings"
Cohesion: 0.16
Nodes (23): normalizeServerUrl(), readSettings(), setAuthToken(), setLastSyncAt(), setServerUrl(), settingsPath(), setYandexToken(), writeSettings() (+15 more)

### Community 43 - "types.ts"
Cohesion: 0.06
Nodes (56): HeaderProps, Search(), SearchProps, assignableRoles(), coerceUsers(), coerceWhitelist(), formatBytes(), SettingsPage() (+48 more)

### Community 44 - "app/package.json"
Cohesion: 0.18
Nodes (10): author, description, license, main, name, private, repository, type (+2 more)

### Community 45 - "TopicEditorModal"
Cohesion: 0.18
Nodes (15): newDraftId(), TopicEditorModal(), handleAnswerPaste(), handlePartyChange(), imageOwnerPayload(), insertFile(), insertPhoto(), handleAnswerPaste() (+7 more)

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

### Community 51 - "imageDisplay.ts"
Cohesion: 0.22
Nodes (9): ImageScaleDialog(), ImageScaleDialogProps, applyDraftScale(), clampImageScale(), getImageScale(), IMAGE_SCALE_DEFAULT, IMAGE_SCALE_MAX, IMAGE_SCALE_MIN (+1 more)

### Community 57 - "Viewer.tsx"
Cohesion: 0.17
Nodes (21): TopicEditorModalProps, ImgMenuState, ScaleEditorState, ViewerProps, useTopicLinkPicker(), applyFindHighlights(), clearFindHighlights(), escapeMdLinkLabel() (+13 more)

### Community 58 - "WorkDepartmentId"
Cohesion: 0.50
Nodes (5): PublicUser, StoredUser, WhitelistEntry, UserRole, WorkDepartmentId

## Knowledge Gaps
- **338 isolated node(s):** `Где работать`, `Архитектура v2 (текущая)`, `Обновления приложения (v2)`, `graphify`, `Клиент (`app/electron/`)` (+333 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 407 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getUserDataRoot()` connect `yandex-sync.ts` to `auth-store.ts`, `electron/updates.ts`, `paths.ts`, `main.ts`, `server-sync.ts`, `readSettings`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `electron` connect `yandex-sync.ts` to `main.ts`, `compilerOptions`, `electron/updates.ts`, `paths.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `include` connect `compilerOptions` to `yandex-sync.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Где работать`, `Архитектура v2 (текущая)`, `Обновления приложения (v2)` to the rest of the system?**
  _338 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.112375533428165 - nodes in this community are weakly interconnected._
- **Should `yandex-sync.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052503052503052504 - nodes in this community are weakly interconnected._