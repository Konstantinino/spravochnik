# Graph Report - spravochnik-repo  (2026-09-28)

## Corpus Check
- 135 files · ~93,907 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1590 nodes · 3732 edges · 97 communities (76 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fdeff6bb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Viewer.tsx
- lib/fix-media-paths.ts
- index.ts
- compilerOptions
- App
- Viewer
- topic-media.ts
- devDependencies
- compilerOptions
- build
- REST INFO — инструкция для AI-агента
- routes/topics.ts
- dist-ascii.js
- upload-update-manifest.js
- REST INFO
- auth-utils.ts
- devDependencies
- department_subsections
- prefs.ts
- push-yandex-restore.mjs
- focusCursor
- REST INFO — инструкция для серверного программиста
- REST INFO v1 — Яндекс.Диск (legacy)
- Скрипты REST INFO
- compilerOptions
- Миграция с Яндекс.Диска на SQL-сервер
- REST INFO — статус проекта (handoff)
- App.tsx
- pull-yandex-export.mjs
- REST INFO — развёртывание сервера (Docker)
- REST INFO — сервер API
- REST INFO — изолированный пользователь на сервере
- Чеклист тестирования REST INFO v2
- REST INFO — клиент (Electron)
- upload-release.js
- main.ts
- legacy/README.md
- lib/media-layout.ts
- admin.ts
- server-sync.ts
- Deploy keys (REST INFO)
- SettingsPage
- app/package.json
- nsis
- dependencies
- scripts
- 001_initial.sql
- support-phones.ts
- auth-store.ts
- clone-or-update.sh
- fix-media-paths.js
- data.ts
- deploy.sh
- install-git-hooks.sh
- setup-deploy-key.sh
- setup-rest-info-user.sh
- Исправление путей к фото на сервере
- SupportPhonesBar.tsx
- pushToYandex
- План: автообновление «как Telegram Desktop»
- getUserDataRoot
- imageDisplay.ts
- TopicEditorModal.tsx
- departments-store.ts
- paths.ts
- registerIpc
- electron/updates.ts
- media.ts
- win
- readSettings
- session-log.ts
- textInsert.ts
- yandex-sync.ts
- subsections.ts
- guide-merge.ts
- export-for-server.ts
- markdown.ts
- SyncConflictModal.tsx
- departments
- usePreserveTextareaFocus
- types.ts
- topics
- useTopicLinkPicker.ts
- sync-base.ts
- setPendingChanges

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 109 edges
2. `getUserDataRoot()` - 58 edges
3. `readSettings()` - 48 edges
4. `App()` - 47 edges
5. `Viewer()` - 46 edges
6. `SettingsPage()` - 43 edges
7. `readAccounts()` - 29 edges
8. `pullFromServer()` - 28 edges
9. `serverFetch()` - 25 edges
10. `TopicList()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `pushAccountsFile()` --calls--> `isServerReachable()`  [EXTRACTED]
  app/electron/server-sync.ts → app/electron/server-api.ts
- `departmentsConfigPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/departments-store.ts → app/electron/paths.ts
- `writeStoredDepartments()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/departments-store.ts → app/electron/paths.ts
- `getDepartments()` --calls--> `getActiveDepartments()`  [EXTRACTED]
  app/electron/paths.ts → app/electron/departments-store.ts
- `getWorkDepartments()` --calls--> `getActiveDepartments()`  [EXTRACTED]
  app/electron/paths.ts → app/electron/departments-store.ts

## Import Cycles
- None detected.

## Communities (97 total, 9 thin omitted)

### Community 0 - "Viewer.tsx"
Cohesion: 0.23
Nodes (12): fileExtLabel(), ImgMenuState, nodeText(), ScaleEditorState, downloadImage(), openAttachedFile(), renderTopicFile(), renderTopicLink() (+4 more)

### Community 1 - "lib/fix-media-paths.ts"
Cohesion: 0.27
Nodes (10): bumpGlobalVersion(), main(), printLine(), DbRow, DiscoveredFile, fixMediaPaths(), FixMediaPathsLine, FixMediaPathsResult (+2 more)

### Community 2 - "index.ts"
Cohesion: 0.13
Nodes (27): getPool(), query(), withTransaction(), dataDir, __dirname, main(), mediaDir, root (+19 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App"
Cohesion: 0.08
Nodes (33): App(), collectSortIndexChanges(), executeLocalReset(), flashReorderLockBanner(), handleEnterReorderMode(), handleInlineSave(), handleListFilterChange(), handlePush() (+25 more)

### Community 5 - "Viewer"
Cohesion: 0.12
Nodes (9): Viewer(), cancelEditing(), closeFind(), closeScaleEditor(), onKey(), persistDisplay(), findAdminTopicForClient(), getLinkedClientTopicId() (+1 more)

### Community 6 - "topic-media.ts"
Cohesion: 0.07
Nodes (78): resolveImageOwner(), downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc(), absFromRoot(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT (+70 more)

### Community 7 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, electron, electron-builder, @types/react, @types/react-dom, typescript, vite, vite-plugin-electron (+11 more)

### Community 8 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+15 more)

### Community 9 - "build"
Cohesion: 0.18
Nodes (11): build, appId, directories, executableName, extraResources, files, productName, publish (+3 more)

### Community 10 - "REST INFO — инструкция для AI-агента"
Cohesion: 0.11
Nodes (18): graphify, Linux / production, REST INFO — инструкция для AI-агента, UI (`app/src/components/` + `lib/`), Windows (машина пользователя), Архитектура v2 (текущая), Версии, Владелец / bootstrap (+10 more)

### Community 11 - "routes/topics.ts"
Cohesion: 0.17
Nodes (19): getDepartmentById(), isValidDepartmentId(), acquireTopicLock(), acquireTopicOrderLock(), isSupportParty(), normalizeSupportParty(), refreshHasChildren(), releaseTopicLock() (+11 more)

### Community 12 - "dist-ascii.js"
Cohesion: 0.17
Nodes (9): { execSync }, fs, nmDst, nmSrc, path, projectRoot, releaseDst, releaseSrc (+1 more)

### Community 13 - "upload-update-manifest.js"
Cohesion: 0.41
Nodes (11): deleteOldSetups(), deleteRemoteFile(), ensureDir(), folderPath(), fs, listRemoteFiles(), main(), path (+3 more)

### Community 14 - "REST INFO"
Cohesion: 0.22
Nodes (9): Legacy: Яндекс.Диск, REST INFO, Архитектура v2, Данные для production, Документация, Разработка, Синхронизация и обновления, Структура (+1 more)

### Community 16 - "auth-utils.ts"
Cohesion: 0.15
Nodes (27): canEditContent(), canEditDepartment(), CONTENT_EDITOR_ROLES, hashPassword(), isOwnerEmail(), isOwnerRole(), isStaffRole(), isUserRole() (+19 more)

### Community 17 - "devDependencies"
Cohesion: 0.05
Nodes (42): cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cors, express (+34 more)

### Community 19 - "prefs.ts"
Cohesion: 0.14
Nodes (18): AuthScreen(), forgetSavedLogin(), handleSubmit(), ServerUrlForm(), findRememberedLogin(), isDepartmentId(), loadRememberedLogin(), loadRememberedLogins() (+10 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "focusCursor"
Cohesion: 0.36
Nodes (11): handleAnswerPaste(), imageOwnerPayload(), insertFile(), insertPhoto(), handleAnswerPaste(), insertFile(), insertPhoto(), formatFileMarkdownLink() (+3 more)

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

### Community 28 - "App.tsx"
Cohesion: 0.12
Nodes (21): handleAuthenticated(), handleDepartmentChange(), defaultSync, resolveListFilter(), resolveUserDepartment(), SettingsErrorBoundary, Header(), Search() (+13 more)

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

### Community 37 - "main.ts"
Cohesion: 0.09
Nodes (38): PublicUser, requireRole(), SavedWindowBounds, StoredUser, WhitelistEntry, applyClientTopicLink(), attachWindowBoundsPersistence(), attachWindowsInputFixes() (+30 more)

### Community 39 - "lib/media-layout.ts"
Cohesion: 0.18
Nodes (22): discoverMediaFilesOnDisk(), consider(), walk(), absoluteMediaCandidates(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT, deleteTopicMediaFiles(), isMediaDepartmentId() (+14 more)

### Community 40 - "admin.ts"
Cohesion: 0.10
Nodes (25): DepartmentListKey, DepartmentRecord, isDepartmentIdSlug(), isEditableInSettings(), isLostDepartmentId(), isMissingDepartmentsColumnError(), isTemplatesDepartmentId(), isWorkDepartmentRecord() (+17 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.08
Nodes (57): AccountsData, reconcileHasChildren(), departmentById(), DepartmentId, getDepartments(), PENDING_OPERATIONS_FILE, clearPendingOperations(), hasPendingOperations() (+49 more)

### Community 42 - "Deploy keys (REST INFO)"
Cohesion: 0.40
Nodes (4): Deploy keys (REST INFO), GitHub, Дополнительная защита на сервере, Что здесь

### Community 43 - "SettingsPage"
Cohesion: 0.09
Nodes (32): assignableRoles(), coerceUsers(), coerceWhitelist(), formatBytes(), formatDepartmentApiError(), formatLogLine(), formatLogTime(), levelLabel() (+24 more)

### Community 44 - "app/package.json"
Cohesion: 0.18
Nodes (10): author, description, license, main, name, private, repository, type (+2 more)

### Community 46 - "nsis"
Cohesion: 0.17
Nodes (12): nsis, allowElevation, allowToChangeInstallationDirectory, createDesktopShortcut, createStartMenuShortcut, include, installerLanguages, language (+4 more)

### Community 47 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, electron-updater, react, react-dom, react-markdown, remark-gfm, electron-updater, react (+3 more)

### Community 48 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, dist, dist:ascii, electron:dev, pack, preview

### Community 49 - "001_initial.sql"
Cohesion: 0.21
Nodes (11): app_releases, departments, media_files, removed_emails, sync_state, topic_id_counters, topic_locks, topics (+3 more)

### Community 50 - "support-phones.ts"
Cohesion: 0.26
Nodes (9): DEFAULT_SUPPORT_PHONES, formatSupportPhoneDisplay(), normalizeSupportPhones(), normalizeTelDigits(), readSupportPhonesFromDb(), SUPPORT_PHONES_SYNC_KEY, SupportPhoneLine, writeSupportPhonesToDb() (+1 more)

### Community 51 - "auth-store.ts"
Cohesion: 0.14
Nodes (48): accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), coerceAccountsData(), defaultAccounts(), defaultSettings(), deleteUser() (+40 more)

### Community 54 - "fix-media-paths.js"
Cohesion: 0.33
Nodes (6): apply, args, main(), positional, printLine(), serverUrl

### Community 56 - "data.ts"
Cohesion: 0.05
Nodes (63): ParentTopicField(), handleBlur(), handleInputChange(), pick(), resolveBlurSelection(), ParentTopicFieldProps, TopicLinkPicker(), TopicLinkPickerProps (+55 more)

### Community 61 - "Исправление путей к фото на сервере"
Cohesion: 0.20
Nodes (10): Альтернатива — прямо на сервере (SSH), В чём проблема, Если не работает, Исправление путей к фото на сервере, Проверка, Простой способ — с вашего Windows-ПК (как установщик), Шаг 1. Один раз обновить сервер, Шаг 2. Предпросмотр (ничего не меняет) (+2 more)

### Community 62 - "SupportPhonesBar.tsx"
Cohesion: 0.32
Nodes (10): saveSupportPhones(), copyText(), SupportPhonesBar(), handleCopy(), SupportPhonesBarProps, DEFAULT_SUPPORT_PHONES, formatSupportPhoneDisplay(), normalizeSupportPhones() (+2 more)

### Community 63 - "pushToYandex"
Cohesion: 0.22
Nodes (20): acquireSyncLock(), deleteRemoteFile(), downloadRemoteFile(), ensureRemoteDir(), ensureRemoteFolder(), ensureRemoteMediaFolder(), folderPath(), listRemoteMedia() (+12 more)

### Community 64 - "План: автообновление «как Telegram Desktop»"
Cohesion: 0.07
Nodes (30): 1.1 Зависимости и сборка (`app/`), 1.2 Клиент — `app/electron/updates.ts`, 1.3 Клиент — UI, 1.4 Клиент — IPC (`main.ts`, `preload.ts`, `vite-env.d.ts`), 1.5 Сервер — раздача артефактов, 1.6 Публикация — `upload-release.js`, 1.7 Обратная совместимость API, Edge cases (+22 more)

### Community 65 - "getUserDataRoot"
Cohesion: 0.14
Nodes (23): ensureDataReady(), getSeedDataDir(), getUserDataRoot(), require, downloadMediaFile(), downloadMissingMedia(), ensureMediaFilesDownloaded(), ensureTopicMediaDownloaded() (+15 more)

### Community 66 - "imageDisplay.ts"
Cohesion: 0.17
Nodes (14): ImageScaleDialog(), ImageScaleDialogProps, TopicMarkdownImage(), applyDraftScale(), openImageMenu(), clampImageScale(), getImageScale(), getImageScaleForTopicImage() (+6 more)

### Community 67 - "TopicEditorModal.tsx"
Cohesion: 0.25
Nodes (8): newDraftId(), TopicEditorModal(), handleParentIdChange(), handleParentIdChange(), filterTopicsForClientLinkPicker(), filterTopicsForLinkPicker(), filterTopicsForParentPicker(), getItemParty()

### Community 68 - "departments-store.ts"
Cohesion: 0.20
Nodes (17): applyDepartmentsFromSync(), DEFAULT_DEPARTMENTS, departmentById(), departmentFileName(), DEPARTMENTS_CONFIG_FILE, departmentsConfigPath(), ensureGuideFileForDepartment(), getActiveDepartments() (+9 more)

### Community 69 - "paths.ts"
Cohesion: 0.12
Nodes (15): APP_UPDATE_FILE, BOOTSTRAP_ADMIN_EMAIL, canEditContent(), CONTENT_EDITOR_ROLES, Department, DEPARTMENTS, isUserRole(), LOST_DEPARTMENT_ID (+7 more)

### Community 71 - "registerIpc"
Cohesion: 0.11
Nodes (33): asSupportParty(), readGuideFile(), refreshDeptTopicOrderFromServer(), registerIpc(), putUser(), writeGuideFile(), AdminDepartmentDto, AdminSubsectionDto (+25 more)

### Community 73 - "electron/updates.ts"
Cohesion: 0.14
Nodes (28): checkForUpdates(), checkForUpdatesAuto(), checkForUpdatesLegacy(), clearPartialUpdateCache(), configureAutoUpdaterFeed(), downloadLatestRelease(), downloadUpdate(), electronUpdaterCacheDir() (+20 more)

### Community 74 - "media.ts"
Cohesion: 0.20
Nodes (13): CLIENT_VERSION_HEADER, compareVersions(), getLatestAppReleaseVersion(), normalizeVersionLabel(), parseClientVersionHeader(), requireRole(), blockWritesIfClientOutdated(), requireCurrentClientVersion() (+5 more)

### Community 75 - "win"
Cohesion: 0.50
Nodes (4): win, artifactName, icon, target

### Community 80 - "readSettings"
Cohesion: 0.17
Nodes (19): normalizeServerUrl(), parseWindowBounds(), readSettings(), saveWindowBounds(), setAuthToken(), setLastSyncAt(), setServerUrl(), settingsPath() (+11 more)

### Community 81 - "session-log.ts"
Cohesion: 0.22
Nodes (8): clearSessionLogs(), entries, getSessionLogs(), listeners, notify(), onSessionLog(), SessionLogEntry, SessionLogLevel

### Community 82 - "textInsert.ts"
Cohesion: 0.20
Nodes (14): highlightNbspEntities(), TextareaWithNbspButton(), handleTextareaScroll(), insertNbsp(), syncScrollFromTextarea(), TextareaWithNbspButtonProps, copyTopicLink(), escapeMdLinkLabel() (+6 more)

### Community 83 - "yandex-sync.ts"
Cohesion: 0.12
Nodes (22): readBaseGuide(), ConflictResolution, currentStatus, getSyncStatus(), listeners, listKeyForFile(), mergeGuidesWithRemote(), patchBaseForResolutions() (+14 more)

### Community 84 - "subsections.ts"
Cohesion: 0.17
Nodes (14): getGlobalVersion(), allocateSubsectionId(), Client, departmentHasSubsections(), getSubsectionById(), isMissingSubsectionsTable(), listSubsections(), listSubsectionsForClient() (+6 more)

### Community 85 - "guide-merge.ts"
Cohesion: 0.25
Nodes (13): applyConflictResolutions(), asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic, mergeGuideFile(), MergeGuideResult (+5 more)

### Community 86 - "export-for-server.ts"
Cohesion: 0.22
Nodes (11): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+3 more)

### Community 87 - "markdown.ts"
Cohesion: 0.23
Nodes (12): handleAnswerCopy(), copyImageLink(), handleAnswerCopy(), canonicalImageStoragePath(), formatSharedImageMarkdown(), IMAGE_STORAGE_PATH_RE, isAllowedMarkdownImageSrc(), markdownForDisplay() (+4 more)

### Community 88 - "SyncConflictModal.tsx"
Cohesion: 0.32
Nodes (4): SyncConflictModal(), SyncConflictModalProps, ConflictResolution, SyncConflictInfo

### Community 90 - "usePreserveTextareaFocus"
Cohesion: 0.46
Nodes (7): shouldKeepExternalFocus(), usePreserveTextareaFocus(), clearBlurTimer(), onBlur(), onFocusIn(), restoreFocusIfNeeded(), saveSelection()

### Community 91 - "types.ts"
Cohesion: 0.09
Nodes (44): AuthScreenProps, HeaderProps, SettingsPageProps, userIsOwner(), TopicEditorModalProps, TopicListProps, TopicMarkdownImageProps, ViewerProps (+36 more)

### Community 95 - "useTopicLinkPicker.ts"
Cohesion: 0.46
Nodes (6): TopicLinkPickerState, useTopicLinkPicker(), clampPickerPosition(), getTextareaCaretRect(), getActivePlusQuery(), replaceRangeWithTopicLink()

### Community 99 - "sync-base.ts"
Cohesion: 0.67
Nodes (5): baseDir(), basePathFor(), writeAllGuideBasesFromLocal(), writeBaseFromLocalFile(), writeBaseGuide()

### Community 100 - "setPendingChanges"
Cohesion: 0.28
Nodes (9): setPendingChanges(), discardLocalChanges(), markLocalChange(), markOfflinePending(), discardLocalChanges(), emit(), markLocalChange(), pullFromYandex() (+1 more)

## Knowledge Gaps
- **455 isolated node(s):** `Где работать`, `Архитектура v2 (текущая)`, `Обновления приложения (v2)`, `graphify`, `Клиент (`app/electron/`)` (+450 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 565 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalizeSupportPhones()` connect `SupportPhonesBar.tsx` to `main.ts`, `registerIpc`, `SettingsPage`, `readSettings`, `types.ts`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `registerIpc()` connect `registerIpc` to `getUserDataRoot`, `departments-store.ts`, `main.ts`, `topic-media.ts`, `server-sync.ts`, `electron/updates.ts`, `readSettings`, `session-log.ts`, `auth-store.ts`, `SupportPhonesBar.tsx`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `readSettings()` connect `readSettings` to `getUserDataRoot`, `setPendingChanges`, `main.ts`, `registerIpc`, `server-sync.ts`, `electron/updates.ts`, `auth-store.ts`, `yandex-sync.ts`, `pushToYandex`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Где работать`, `Архитектура v2 (текущая)`, `Обновления приложения (v2)` to the rest of the system?**
  _455 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1268939393939394 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._