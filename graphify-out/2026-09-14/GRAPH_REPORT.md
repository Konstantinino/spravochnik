# Graph Report - spravochnik-repo  (2026-09-14)

## Corpus Check
- 115 files · ~74,878 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1297 nodes · 2956 edges · 74 communities (61 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4944ff4d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- data.ts
- yandex-sync.ts
- index.ts
- compilerOptions
- App
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
- App.tsx
- prefs.ts
- push-yandex-restore.mjs
- Viewer.tsx
- REST INFO — инструкция для серверного программиста
- REST INFO v1 — Яндекс.Диск (legacy)
- Скрипты REST INFO
- compilerOptions
- Миграция с Яндекс.Диска на SQL-сервер
- REST INFO — статус проекта (handoff)
- Header.tsx
- pull-yandex-export.mjs
- REST INFO — развёртывание сервера (Docker)
- REST INFO — сервер API
- REST INFO — изолированный пользователь на сервере
- Чеклист тестирования REST INFO v2
- REST INFO — клиент (Electron)
- upload-release.js
- TopicEditorModal
- legacy/README.md
- lib/media-layout.ts
- types.ts
- server-sync.ts
- Deploy keys (REST INFO)
- SettingsPage
- app/package.json
- nsis
- dependencies
- scripts
- auth-store.ts
- clone-or-update.sh
- fix-media-paths.js
- GuideItem
- deploy.sh
- install-git-hooks.sh
- setup-deploy-key.sh
- setup-rest-info-user.sh
- Исправление путей к фото на сервере
- electron/updates.ts
- main.ts
- План: автообновление «как Telegram Desktop»
- lib/fix-media-paths.ts
- TopicEditorModal.tsx
- media.ts
- usePreserveTextareaFocus
- server-api.ts
- WorkDepartmentId
- export-for-server.ts
- SyncConflictModal.tsx
- getUserDataRoot

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 82 edges
2. `getUserDataRoot()` - 48 edges
3. `readSettings()` - 40 edges
4. `Viewer()` - 39 edges
5. `App()` - 35 edges
6. `readAccounts()` - 29 edges
7. `SettingsPage()` - 28 edges
8. `pullFromServer()` - 22 edges
9. `serverFetch()` - 19 edges
10. `pushToYandex()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `AuthScreenProps` --references--> `PublicUser`  [EXTRACTED]
  app/src/components/AuthScreen.tsx → app/src/types.ts
- `TopicLinkPickerProps` --references--> `GuideItem`  [EXTRACTED]
  app/src/components/TopicLinkPicker.tsx → app/src/types.ts
- `copyTopicLink()` --calls--> `formatTopicMarkdownLink()`  [EXTRACTED]
  app/src/components/Viewer.tsx → app/src/lib/markdown.ts
- `accountsPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts
- `settingsPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts

## Import Cycles
- None detected.

## Communities (74 total, 6 thin omitted)

### Community 0 - "data.ts"
Cohesion: 0.16
Nodes (17): navigateBack(), navigateToTopic(), ParentTopicField(), TopicLinkPicker(), TopicLinkPickerProps, TopicLinkPickerState, compareTopicsByTitle(), filterItemsByParty() (+9 more)

### Community 1 - "yandex-sync.ts"
Cohesion: 0.07
Nodes (65): AccountsData, applyConflictResolutions(), asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic, mergeGuideFile() (+57 more)

### Community 2 - "index.ts"
Cohesion: 0.11
Nodes (23): getPool(), dataDir, __dirname, main(), mediaDir, root, updatesDir, AccountsData (+15 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App"
Cohesion: 0.13
Nodes (17): App(), executeLocalReset(), handleInlineSave(), handleListFilterChange(), handlePush(), handleSave(), handleSaveImageDisplay(), onKey() (+9 more)

### Community 5 - "Viewer"
Cohesion: 0.09
Nodes (22): fileExtLabel(), nodeText(), Viewer(), cancelEditing(), closeFind(), closeScaleEditor(), copyTopicLink(), downloadImage() (+14 more)

### Community 6 - "paths.ts"
Cohesion: 0.06
Nodes (80): resolveImageOwner(), absFromRoot(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT, departmentIdFromMediaPath(), isMediaDepartmentId(), MEDIA_DEPARTMENT_IDS, MediaDepartmentId (+72 more)

### Community 7 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, electron, electron-builder, @types/react, @types/react-dom, typescript, vite, vite-plugin-electron (+11 more)

### Community 8 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+15 more)

### Community 9 - "build"
Cohesion: 0.13
Nodes (15): build, appId, directories, executableName, extraResources, files, productName, publish (+7 more)

### Community 10 - "REST INFO — инструкция для AI-агента"
Cohesion: 0.11
Nodes (18): graphify, Linux / production, REST INFO — инструкция для AI-агента, UI (`app/src/components/` + `lib/`), Windows (машина пользователя), Архитектура v2 (текущая), Версии, Владелец / bootstrap (+10 more)

### Community 11 - "routes/topics.ts"
Cohesion: 0.19
Nodes (18): getGlobalVersion(), query(), withTransaction(), acquireTopicLock(), DEPARTMENTS, isValidDepartment(), isWorkDepartmentId(), normalizeWorkDepartmentId() (+10 more)

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
Cohesion: 0.14
Nodes (29): CONTENT_EDITOR_ROLES, generateSalt(), hashPassword(), isOwnerEmail(), isOwnerRole(), isUserRole(), isWorkDepartmentId(), JwtUser (+21 more)

### Community 17 - "devDependencies"
Cohesion: 0.05
Nodes (42): cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cors, express (+34 more)

### Community 18 - "App.tsx"
Cohesion: 0.16
Nodes (13): defaultSync, resolveListFilter(), SettingsErrorBoundary, Search(), SearchProps, loadSavedListFilter(), DEPARTMENTS, DEPT_VIEW_FILTERS (+5 more)

### Community 19 - "prefs.ts"
Cohesion: 0.18
Nodes (14): AuthScreen(), forgetSavedLogin(), handleSubmit(), AuthScreenProps, ServerUrlForm(), findRememberedLogin(), loadRememberedLogin(), loadRememberedLogins() (+6 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "Viewer.tsx"
Cohesion: 0.16
Nodes (16): ImageScaleDialog(), ImageScaleDialogProps, ImgMenuState, ScaleEditorState, applyDraftScale(), ViewerProps, clampImageScale(), getImageScale() (+8 more)

### Community 22 - "REST INFO — инструкция для серверного программиста"
Cohesion: 0.12
Nodes (16): API (кратко), REST INFO — инструкция для серверного программиста, Troubleshooting, Бэкап, Контакты / файлы документации в репо, Обновление сервера после изменений в Git, Требования к серверу, Что вы получите от администратора (+8 more)

### Community 23 - "REST INFO v1 — Яндекс.Диск (legacy)"
Cohesion: 0.13
Nodes (15): Git-тег, OAuth-токен Яндекс.Диска, REST INFO v1 — Яндекс.Диск (legacy), Архитектура v1, Вариант A — env-переключатель (без git checkout), Вариант B — git checkout, Восстановление данных на Диск из SQL-сервера, Когда использовать (+7 more)

### Community 24 - "Скрипты REST INFO"
Cohesion: 0.09
Nodes (23): `app/scripts/dist-ascii.js`, `app/scripts/fix-media-paths.js`, `app/scripts/publish-release.ps1`, `app/scripts/upload-release.js`, `app/scripts/upload-update-manifest.js`, `scripts/pull-yandex-export.mjs`, `scripts/push-yandex-restore.mjs`, `scripts/server/clone-or-update.sh` (+15 more)

### Community 25 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, declaration, esModuleInterop, module, moduleResolution, outDir, resolveJsonModule, rootDir (+5 more)

### Community 26 - "Миграция с Яндекс.Диска на SQL-сервер"
Cohesion: 0.15
Nodes (13): Миграция с Яндекс.Диска на SQL-сервер, Обзор, Откат на Яндекс.Диск, Поведение нового клиента, Способ A — папка `REST-INFO-export` (готова), Способ B — вручную с Яндекс.Диска, Способ C — повторный экспорт (скрипт), Частые проблемы (+5 more)

### Community 27 - "REST INFO — статус проекта (handoff)"
Cohesion: 0.14
Nodes (14): REST INFO — статус проекта (handoff), Данные, Документация, Исправления в ходе dev, Клиент (`app/`), Локальная dev-среда (Windows пользователя), Сервер (`server/`), Скрипты и восстановление (+6 more)

### Community 28 - "Header.tsx"
Cohesion: 0.20
Nodes (13): handleAuthenticated(), handleDepartmentChange(), resolveUserDepartment(), Header(), isDepartmentId(), loadSavedDepartment(), saveDepartment(), canEditContent() (+5 more)

### Community 29 - "pull-yandex-export.mjs"
Cohesion: 0.32
Nodes (11): countTopics(), __dirname, diskPath(), downloadFile(), JSON_FILES, listDir(), listMediaRecursive(), main() (+3 more)

### Community 30 - "REST INFO — развёртывание сервера (Docker)"
Cohesion: 0.18
Nodes (11): API endpoints (кратко), Production (nginx), REST INFO — развёртывание сервера (Docker), Troubleshooting, Быстрый старт, Бэкап, Обновление, Первичный импорт данных (+3 more)

### Community 31 - "REST INFO — сервер API"
Cohesion: 0.20
Nodes (9): API endpoints, Docker (production / Linux), REST INFO — сервер API, Windows dev (без Docker), Запуск, Импорт данных, Обычный dev (нужен PostgreSQL), Сброс пароля (recovery) (+1 more)

### Community 33 - "REST INFO — изолированный пользователь на сервере"
Cohesion: 0.20
Nodes (10): 1. Системный пользователь, 2. Deploy key (read-only), 3. Изоляция Docker, 4. Ежедневные команды (rest-info), 5. Импорт и бэкап, REST INFO — изолированный пользователь на сервере, Troubleshooting, Быстрый старт (администратор) (+2 more)

### Community 34 - "Чеклист тестирования REST INFO v2"
Cohesion: 0.20
Nodes (10): Legacy, URL сервера, Клиент — онлайн, Клиент — оффлайн, Конфликты, Локальный сброс правки, Медиа, Обновления (+2 more)

### Community 35 - "REST INFO — клиент (Electron)"
Cohesion: 0.33
Nodes (6): REST INFO — клиент (Electron), Запуск dev, Ключевые файлы, Локальные данные, Публикация Setup на сервер, Сборка установщика

### Community 36 - "upload-release.js"
Cohesion: 0.33
Nodes (6): fileName, main(), releaseDir, serverUrl, uploadUpdateFile(), versionMatch

### Community 37 - "TopicEditorModal"
Cohesion: 0.24
Nodes (6): newDraftId(), TopicEditorModal(), handleParentIdChange(), handlePartyChange(), handleParentIdChange(), getItemParty()

### Community 39 - "lib/media-layout.ts"
Cohesion: 0.20
Nodes (23): discoverMediaFilesOnDisk(), consider(), walk(), absoluteMediaCandidates(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT, deleteTopicMediaFiles(), isMediaDepartmentId() (+15 more)

### Community 40 - "types.ts"
Cohesion: 0.12
Nodes (32): HeaderProps, SettingsPageProps, userIsOwner(), CONTENT_EDITOR_ROLES, Department, DepartmentId, DepartmentStorageStats, ExportManifest (+24 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.09
Nodes (51): readSettings(), setPendingChanges(), reconcileHasChildren(), fetchAdminUsersFromServer(), departmentById(), PENDING_OPERATIONS_FILE, clearPendingOperations(), hasPendingOperations() (+43 more)

### Community 42 - "Deploy keys (REST INFO)"
Cohesion: 0.40
Nodes (4): Deploy keys (REST INFO), GitHub, Дополнительная защита на сервере, Что здесь

### Community 43 - "SettingsPage"
Cohesion: 0.12
Nodes (22): assignableRoles(), coerceUsers(), coerceWhitelist(), formatBytes(), formatLogLine(), formatLogTime(), levelLabel(), SettingsPage() (+14 more)

### Community 44 - "app/package.json"
Cohesion: 0.18
Nodes (10): author, description, license, main, name, private, repository, type (+2 more)

### Community 46 - "nsis"
Cohesion: 0.18
Nodes (11): nsis, allowElevation, allowToChangeInstallationDirectory, createDesktopShortcut, createStartMenuShortcut, installerLanguages, language, oneClick (+3 more)

### Community 47 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, electron-updater, react, react-dom, react-markdown, remark-gfm, electron-updater, react (+3 more)

### Community 48 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, dist, dist:ascii, electron:dev, pack, preview

### Community 51 - "auth-store.ts"
Cohesion: 0.17
Nodes (40): accountsPath(), addWhitelistEmail(), coerceAccountsData(), defaultAccounts(), defaultSettings(), deleteUser(), ensureAuthFiles(), ensureLocalOwner() (+32 more)

### Community 54 - "fix-media-paths.js"
Cohesion: 0.33
Nodes (6): apply, args, main(), positional, printLine(), serverUrl

### Community 56 - "GuideItem"
Cohesion: 0.16
Nodes (19): ParentTopicFieldProps, TopicEditorModalProps, guideX(), highlightTitle(), rowMarginLeft(), TopicList(), TopicListProps, TreeNode() (+11 more)

### Community 61 - "Исправление путей к фото на сервере"
Cohesion: 0.20
Nodes (10): Альтернатива — прямо на сервере (SSH), В чём проблема, Если не работает, Исправление путей к фото на сервере, Проверка, Простой способ — с вашего Windows-ПК (как установщик), Шаг 1. Один раз обновить сервер, Шаг 2. Предпросмотр (ничего не меняет) (+2 more)

### Community 62 - "electron/updates.ts"
Cohesion: 0.10
Nodes (35): appendSessionLog(), clearSessionLogs(), entries, listeners, notify(), SessionLogEntry, SessionLogLevel, checkForUpdates() (+27 more)

### Community 63 - "main.ts"
Cohesion: 0.11
Nodes (41): clearEphemeralSessionOnStartup(), clearSession(), getCurrentUser(), getWhitelist(), requireRole(), sessionPath(), setAuthToken(), setServerUrl() (+33 more)

### Community 64 - "План: автообновление «как Telegram Desktop»"
Cohesion: 0.07
Nodes (30): 1.1 Зависимости и сборка (`app/`), 1.2 Клиент — `app/electron/updates.ts`, 1.3 Клиент — UI, 1.4 Клиент — IPC (`main.ts`, `preload.ts`, `vite-env.d.ts`), 1.5 Сервер — раздача артефактов, 1.6 Публикация — `upload-release.js`, 1.7 Обратная совместимость API, Edge cases (+22 more)

### Community 65 - "lib/fix-media-paths.ts"
Cohesion: 0.27
Nodes (10): bumpGlobalVersion(), main(), printLine(), DbRow, DiscoveredFile, fixMediaPaths(), FixMediaPathsLine, FixMediaPathsResult (+2 more)

### Community 66 - "TopicEditorModal.tsx"
Cohesion: 0.19
Nodes (20): handleAnswerPaste(), imageOwnerPayload(), insertFile(), insertPhoto(), handleAnswerPaste(), insertFile(), insertPhoto(), useTopicLinkPicker() (+12 more)

### Community 67 - "media.ts"
Cohesion: 0.21
Nodes (9): canEditContent(), canEditDepartment(), isStaffRole(), requireRole(), ensureMediaDir(), ensureUpdatesDir(), mediaRouter, upload (+1 more)

### Community 68 - "usePreserveTextareaFocus"
Cohesion: 0.46
Nodes (7): shouldKeepExternalFocus(), usePreserveTextareaFocus(), clearBlurTimer(), onBlur(), onFocusIn(), restoreFocusIfNeeded(), saveSelection()

### Community 69 - "server-api.ts"
Cohesion: 0.21
Nodes (17): normalizeServerUrl(), putUser(), authHeaders(), baseUrl(), downloadMediaFile(), INVALID_SERVER_URL_MESSAGE, lockTopic(), renewTopicLock() (+9 more)

### Community 70 - "WorkDepartmentId"
Cohesion: 0.50
Nodes (5): PublicUser, StoredUser, WhitelistEntry, UserRole, WorkDepartmentId

### Community 71 - "export-for-server.ts"
Cohesion: 0.22
Nodes (11): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+3 more)

### Community 72 - "SyncConflictModal.tsx"
Cohesion: 0.32
Nodes (4): SyncConflictModal(), SyncConflictModalProps, ConflictResolution, SyncConflictInfo

### Community 73 - "getUserDataRoot"
Cohesion: 0.23
Nodes (13): ensureDataReady(), downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc(), resolveExistingMediaAbsolutePath(), getSeedDataDir(), getUserDataRoot() (+5 more)

## Knowledge Gaps
- **416 isolated node(s):** `SettingsData`, `SessionData`, `ROLE_RANK`, `defaultSource`, `manifest` (+411 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 496 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getUserDataRoot()` connect `getUserDataRoot` to `yandex-sync.ts`, `server-api.ts`, `paths.ts`, `export-for-server.ts`, `server-sync.ts`, `auth-store.ts`, `electron/updates.ts`, `main.ts`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `Viewer()` connect `Viewer` to `data.ts`, `TopicEditorModal.tsx`, `usePreserveTextareaFocus`, `TopicEditorModal`, `App.tsx`, `Viewer.tsx`, `GuideItem`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `План: автообновление «как Telegram Desktop»` connect `План: автообновление «как Telegram Desktop»` to `AGENTS.md`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsData`, `SessionData`, `ROLE_RANK` to the rest of the system?**
  _416 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `yandex-sync.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0670807453416149 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10752688172043011 - nodes in this community are weakly interconnected._