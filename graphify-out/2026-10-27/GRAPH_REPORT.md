# Graph Report - spravochnik-repo  (2026-10-27)

## Corpus Check
- 164 files · ~114,726 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1945 nodes · 4630 edges · 110 communities (85 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b3354ec3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- normalizeSupportEmail
- TopicList
- query
- compilerOptions
- App.tsx
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
- browser-spravochnik.ts
- web/package.json
- push-yandex-restore.mjs
- usePreserveTextareaFocus
- REST INFO — инструкция для серверного программиста
- REST INFO v1 — Яндекс.Диск (legacy)
- Скрипты REST INFO
- compilerOptions
- Миграция с Яндекс.Диска на SQL-сервер
- REST INFO — статус проекта (handoff)
- types.ts
- pull-yandex-export.mjs
- REST INFO — развёртывание сервера (Docker)
- REST INFO — сервер API
- REST INFO — изолированный пользователь на сервере
- Чеклист тестирования REST INFO v2
- REST INFO — клиент (Electron)
- upload-release.js
- readSettings
- legacy/README.md
- lib/media-layout.ts
- prefs.ts
- server-sync.ts
- Deploy keys (REST INFO)
- SettingsPage
- app/package.json
- nsis
- dependencies
- scripts
- 001_initial.sql
- normalizeSupportPhones
- auth-store.ts
- clone-or-update.sh
- fix-media-paths.js
- TopicViewFilter
- deploy.sh
- install-git-hooks.sh
- setup-deploy-key.sh
- setup-rest-info-user.sh
- Исправление путей к фото на сервере
- REST INFO — план веб-версии
- compilerOptions
- План: автообновление «как Telegram Desktop»
- registerIpc
- imageDisplay.ts
- subsections-store.ts
- session-log.ts
- TopicList.tsx
- support-sections-store.ts
- electron/updates.ts
- cacheServerUser
- TopicEditorModal.tsx
- api-client.ts
- paths.ts
- 012_support_sections_archive_lost.sql
- yandex-sync.ts
- subsections.ts
- admin.ts
- query-subsections.mjs
- guide-merge.ts
- media.ts
- cleanupTopicFileOrphans
- departments-store.ts
- Viewer.tsx
- routes/updates.ts
- electron/media-layout.ts
- SyncConflictModal.tsx
- pending-operations.ts
- getCurrentUser
- export-for-server.ts
- pending-media.ts
- resolveImageStorageRef
- REST INFO — веб-клиент
- resolveExistingMediaAbsolutePath
- WorkDepartmentId
- web/vite.config.ts
- main.ts

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 136 edges
2. `Viewer()` - 64 edges
3. `getUserDataRoot()` - 61 edges
4. `SettingsPage()` - 52 edges
5. `App()` - 51 edges
6. `readSettings()` - 50 edges
7. `pullFromServer()` - 34 edges
8. `TopicEditorModal()` - 31 edges
9. `readAccounts()` - 29 edges
10. `TopicList()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `resolveMediaHttpUrl()` --calls--> `canonicalImageStoragePath()`  [EXTRACTED]
  web/src/platform/browser-spravochnik.ts → app/src/lib/markdown.ts
- `copyImageLink()` --calls--> `formatSharedImageMarkdown()`  [EXTRACTED]
  app/src/components/Viewer.tsx → app/src/lib/markdown.ts
- `copyTopicLink()` --calls--> `formatTopicMarkdownLink()`  [EXTRACTED]
  app/src/components/Viewer.tsx → app/src/lib/markdown.ts
- `StoredSubsection` --references--> `SupportParty`  [EXTRACTED]
  web/src/platform/guide-store.ts → app/src/types.ts
- `AuthScreenProps` --references--> `PublicUser`  [EXTRACTED]
  app/src/components/AuthScreen.tsx → app/src/types.ts

## Import Cycles
- None detected.

## Communities (110 total, 9 thin omitted)

### Community 0 - "normalizeSupportEmail"
Cohesion: 0.33
Nodes (10): saveSupportEmails(), copyText(), SupportEmailsBar(), handleCopy(), SupportEmailsBarProps, DEFAULT_SUPPORT_EMAILS, isPlausibleSupportEmail(), normalizeSupportEmail() (+2 more)

### Community 1 - "TopicList"
Cohesion: 0.12
Nodes (30): autoScrollContainer(), deptLevelSubsections(), findScrollParent(), groupRootsBySubsections(), isDeptSectionFilter(), isRowVisibleInScroll(), renderTreeNode(), scrollRowToListCenter() (+22 more)

### Community 2 - "query"
Cohesion: 0.13
Nodes (26): bumpGlobalVersion(), getPool(), query(), withTransaction(), dataDir, __dirname, main(), mediaDir (+18 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App.tsx"
Cohesion: 0.07
Nodes (42): App(), collectSortIndexChanges(), executeLocalReset(), flashReorderLockBanner(), handleEnterReorderMode(), handleInlineSave(), handleListFilterChange(), handleReorderSiblings() (+34 more)

### Community 5 - "Viewer"
Cohesion: 0.08
Nodes (28): handleParentIdChange(), fileExtLabel(), nodeText(), Viewer(), cancelEditing(), closeFind(), closeScaleEditor(), copyImageLink() (+20 more)

### Community 6 - "topic-media.ts"
Cohesion: 0.17
Nodes (27): draftFileRelativePath(), draftImageRelativePath(), getDraftFilesDir(), getDraftImagesDir(), getMediaDir(), getTopicFilesDir(), getTopicImagesDir(), BLOCKED_FILE_EXT (+19 more)

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
Cohesion: 0.10
Nodes (39): getGlobalVersion(), ensureArchiveArchivedSubsection(), DepartmentListKey, DepartmentRecord, getDepartmentById(), isDepartmentIdSlug(), isEditableInSettings(), isLostDepartmentId() (+31 more)

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
Cohesion: 0.11
Nodes (38): canEditContent(), canEditDepartment(), CONTENT_EDITOR_ROLES, generateSalt(), hashPassword(), isOwnerEmail(), isOwnerRole(), isStaffRole() (+30 more)

### Community 17 - "devDependencies"
Cohesion: 0.04
Nodes (46): cookie-parser, cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cookie-parser (+38 more)

### Community 18 - "browser-spravochnik.ts"
Cohesion: 0.07
Nodes (48): SupportParty, api, appendLog(), emitSync(), fileExtFromName(), imageExtFromName(), mapSubsection(), mapSupportSection() (+40 more)

### Community 19 - "web/package.json"
Cohesion: 0.07
Nodes (29): dependencies, react, react-dom, react-markdown, remark-gfm, description, devDependencies, @types/react (+21 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "usePreserveTextareaFocus"
Cohesion: 0.42
Nodes (8): shouldKeepExternalFocus(), usePreserveTextareaFocus(), clearBlurTimer(), onBlur(), onFocusIn(), restoreFocusIfNeeded(), saveSelection(), isStaleAppShellFocus()

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

### Community 28 - "types.ts"
Cohesion: 0.08
Nodes (50): handleDepartmentChange(), Header(), HeaderProps, assignableRoles(), formatBytes(), levelLabel(), SettingsPageProps, SUPPORT_PHONES_PLACEMENT (+42 more)

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
Cohesion: 0.18
Nodes (11): Legacy, URL сервера, Веб (https://info.r-est.ru), Клиент — онлайн, Клиент — оффлайн, Конфликты, Локальный сброс правки, Медиа (+3 more)

### Community 35 - "REST INFO — клиент (Electron)"
Cohesion: 0.33
Nodes (6): REST INFO — клиент (Electron), Запуск dev, Ключевые файлы, Локальные данные, Публикация Setup на сервер, Сборка установщика

### Community 36 - "upload-release.js"
Cohesion: 0.27
Nodes (8): __dirname, fileName, main(), releaseDir, serverUrl, uploadHeaders(), uploadUpdateFile(), versionMatch

### Community 37 - "readSettings"
Cohesion: 0.26
Nodes (14): readSettings(), saveWindowBounds(), setLastSyncAt(), setPendingChanges(), settingsPath(), writeSettings(), cacheSupportEmails(), cacheSupportPhones() (+6 more)

### Community 39 - "lib/media-layout.ts"
Cohesion: 0.11
Nodes (32): main(), printLine(), DbRow, DiscoveredFile, discoverMediaFilesOnDisk(), consider(), walk(), fixMediaPaths() (+24 more)

### Community 40 - "prefs.ts"
Cohesion: 0.12
Nodes (22): handleAuthenticated(), resolveListFilter(), resolveUserDepartment(), AuthScreen(), forgetSavedLogin(), handleSubmit(), AuthScreenProps, ServerUrlForm() (+14 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.10
Nodes (55): reconcileHasChildren(), departmentById(), hasPendingOperations(), downloadMediaFile(), isServerReachable(), applyTopicToLocal(), currentStatus, discardLocalChanges() (+47 more)

### Community 42 - "Deploy keys (REST INFO)"
Cohesion: 0.40
Nodes (4): Deploy keys (REST INFO), GitHub, Дополнительная защита на сервере, Что здесь

### Community 43 - "SettingsPage"
Cohesion: 0.08
Nodes (36): coerceUsers(), coerceWhitelist(), formatLogLine(), formatLogTime(), formatTopicSectionsApiError(), SettingsPage(), addEmail(), beginAddSubsection() (+28 more)

### Community 44 - "app/package.json"
Cohesion: 0.18
Nodes (10): author, description, license, main, name, private, repository, type (+2 more)

### Community 46 - "nsis"
Cohesion: 0.17
Nodes (12): nsis, allowElevation, allowToChangeInstallationDirectory, createDesktopShortcut, createStartMenuShortcut, include, installerLanguages, language (+4 more)

### Community 47 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, electron-updater, react, react-dom, react-markdown, remark-gfm, react, react-dom (+3 more)

### Community 48 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, dist, dist:ascii, electron:dev, pack, preview

### Community 49 - "001_initial.sql"
Cohesion: 0.17
Nodes (12): app_releases, departments, media_files, removed_emails, sync_state, topic_id_counters, topic_locks, topics (+4 more)

### Community 50 - "normalizeSupportPhones"
Cohesion: 0.24
Nodes (12): saveSupportPhones(), SupportContactBars(), SupportContactBarsProps, copyText(), SupportPhonesBar(), handleCopy(), SupportPhonesBarProps, DEFAULT_SUPPORT_PHONES (+4 more)

### Community 51 - "auth-store.ts"
Cohesion: 0.16
Nodes (42): accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), coerceAccountsData(), defaultAccounts(), defaultSettings(), deleteUser() (+34 more)

### Community 54 - "fix-media-paths.js"
Cohesion: 0.33
Nodes (6): apply, args, main(), positional, printLine(), serverUrl

### Community 56 - "TopicViewFilter"
Cohesion: 0.50
Nodes (4): Search(), SearchProps, TOPIC_VIEW_FILTER_LABELS, TopicViewFilter

### Community 61 - "Исправление путей к фото на сервере"
Cohesion: 0.20
Nodes (10): Альтернатива — прямо на сервере (SSH), В чём проблема, Если не работает, Исправление путей к фото на сервере, Проверка, Простой способ — с вашего Windows-ПК (как установщик), Шаг 1. Один раз обновить сервер, Шаг 2. Предпросмотр (ничего не меняет) (+2 more)

### Community 62 - "REST INFO — план веб-версии"
Cohesion: 0.10
Nodes (21): Git-ветка, MVP → полная версия (фазы), REST INFO — план веб-версии, Архитектура, Безопасность (главный минус веба), Влияние на работающую систему, Зафиксированные решения (23.09.2026), Критерий готовности merge в `main` (+13 more)

### Community 63 - "compilerOptions"
Cohesion: 0.10
Nodes (19): ../app/src/*, compilerOptions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+11 more)

### Community 64 - "План: автообновление «как Telegram Desktop»"
Cohesion: 0.07
Nodes (30): 1.1 Зависимости и сборка (`app/`), 1.2 Клиент — `app/electron/updates.ts`, 1.3 Клиент — UI, 1.4 Клиент — IPC (`main.ts`, `preload.ts`, `vite-env.d.ts`), 1.5 Сервер — раздача артефактов, 1.6 Публикация — `upload-release.js`, 1.7 Обратная совместимость API, Edge cases (+22 more)

### Community 65 - "registerIpc"
Cohesion: 0.08
Nodes (47): normalizeServerUrl(), setServerUrl(), registerIpc(), putUser(), AdminDepartmentDto, AdminSupportSectionDto, authHeaders(), baseUrl() (+39 more)

### Community 66 - "imageDisplay.ts"
Cohesion: 0.15
Nodes (16): ImageScaleDialog(), ImageScaleDialogProps, TopicMarkdownImage(), TopicMarkdownImageProps, applyDraftScale(), openImageMenu(), clampImageScale(), getImageScale() (+8 more)

### Community 67 - "subsections-store.ts"
Cohesion: 0.16
Nodes (24): ensureArchiveArchivedSubsectionLocal(), applySubsectionsFromSync(), getSubsectionsForDepartment(), mergeSubsectionPatch(), mergeSubsectionRecords(), mergeSubsectionsLists(), normalizePartyField(), normalizeStoredSubsection() (+16 more)

### Community 68 - "session-log.ts"
Cohesion: 0.22
Nodes (8): clearSessionLogs(), entries, getSessionLogs(), listeners, notify(), onSessionLog(), SessionLogEntry, SessionLogLevel

### Community 69 - "TopicList.tsx"
Cohesion: 0.07
Nodes (47): ParentTopicField(), handleBlur(), handleInputChange(), pick(), resolveBlurSelection(), ParentTopicFieldProps, TopicLinkPicker(), TopicLinkPickerProps (+39 more)

### Community 71 - "support-sections-store.ts"
Cohesion: 0.32
Nodes (11): applySupportSectionsFromSync(), configPath(), DEFAULT_SUPPORT_SECTIONS, defaultSupportSections(), mergeSupportSectionPatch(), readStoredSupportSections(), removeSupportSectionLocal(), StoredSupportSection (+3 more)

### Community 73 - "electron/updates.ts"
Cohesion: 0.14
Nodes (27): checkForUpdates(), checkForUpdatesAuto(), checkForUpdatesLegacy(), clearPartialUpdateCache(), configureAutoUpdaterFeed(), downloadUpdate(), electronUpdaterCacheDir(), emit() (+19 more)

### Community 74 - "cacheServerUser"
Cohesion: 0.40
Nodes (6): cacheServerUser(), fetchAdminUsersFromServer(), publicUsersFromServer(), roleFromServerUser(), isWorkDepartmentId(), parseUserRole()

### Community 75 - "TopicEditorModal.tsx"
Cohesion: 0.11
Nodes (28): newDraftId(), TopicEditorModal(), handleAnswerCopy(), handleSubmit(), TopicEditorModalProps, handleSave(), ADMIN_CLIENT_TOPIC_LINK_UI_ENABLED, assignableSubsectionsForDeptEditor() (+20 more)

### Community 80 - "api-client.ts"
Cohesion: 0.21
Nodes (15): ApiError, apiFetch(), hasConfiguredServer(), INVALID_SERVER_URL_MESSAGE, uploadMediaFile(), validateServerUrl(), WEB_CLIENT_VERSION, createBrowserSpravochnik() (+7 more)

### Community 81 - "paths.ts"
Cohesion: 0.10
Nodes (19): LOST_DEPARTMENT_ID, TEMPLATES_DEPARTMENT_ID, APP_UPDATE_FILE, BOOTSTRAP_ADMIN_EMAIL, canEditContent(), CONTENT_EDITOR_ROLES, Department, DepartmentId (+11 more)

### Community 83 - "yandex-sync.ts"
Cohesion: 0.09
Nodes (56): AccountsData, applyConflictResolutions(), ensureDataReady(), DATA_FILES, getSeedDataDir(), getUserDataRoot(), require, baseDir() (+48 more)

### Community 84 - "subsections.ts"
Cohesion: 0.12
Nodes (26): ARCHIVE_ARCHIVED_SUBSECTION_ID, ARCHIVE_LOST_SUBSECTION_ID, Client, ensureArchiveLostSubsection(), isSupportArchiveSubsectionId(), moveTopicsToArchiveLostByParty(), moveTopicsToArchiveLostBySubsection(), resolveSupportArchiveSubsectionId() (+18 more)

### Community 85 - "admin.ts"
Cohesion: 0.10
Nodes (21): canManageTopicSectionsForDepartment(), LOST_DEPARTMENT_ID, Client, moveDepartmentTopicsToLost(), TopicMoveRow, allocateSupportSectionId(), Client, getSupportSectionById() (+13 more)

### Community 89 - "guide-merge.ts"
Cohesion: 0.27
Nodes (12): asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic, mergeGuideFile(), MergeGuideResult, sortValue() (+4 more)

### Community 90 - "media.ts"
Cohesion: 0.18
Nodes (14): CLIENT_VERSION_HEADER, compareVersions(), getLatestAppReleaseVersion(), normalizeVersionLabel(), parseClientVersionHeader(), requiredClientVersion(), blockWritesIfClientOutdated(), requireCurrentClientVersion() (+6 more)

### Community 91 - "cleanupTopicFileOrphans"
Cohesion: 0.33
Nodes (9): topicFileRelativePath(), cleanupTopicFileOrphans(), collectAllReferencedFileStoragePaths(), collectReferencedFileBasenames(), extractFileRefsFromMarkdown(), filesBasename(), isReferencedFileOnDisk(), mediaFilePathsFromTopic() (+1 more)

### Community 92 - "departments-store.ts"
Cohesion: 0.26
Nodes (14): applyDepartmentsFromSync(), DEFAULT_DEPARTMENTS, departmentById(), departmentFileName(), DEPARTMENTS_CONFIG_FILE, departmentsConfigPath(), ensureGuideFileForDepartment(), getActiveDepartments() (+6 more)

### Community 93 - "Viewer.tsx"
Cohesion: 0.10
Nodes (45): handleAnswerPaste(), imageOwnerPayload(), insertFile(), insertPhoto(), resolvedTextareaSelection(), ImgMenuState, ScaleEditorState, handleAnswerCopy() (+37 more)

### Community 94 - "routes/updates.ts"
Cohesion: 0.15
Nodes (17): DEFAULT_SUPPORT_EMAILS, isPlausibleSupportEmail(), normalizeSupportEmail(), normalizeSupportEmails(), readSupportEmailsFromDb(), SUPPORT_EMAILS_SYNC_KEY, SupportEmailLine, writeSupportEmailsToDb() (+9 more)

### Community 95 - "electron/media-layout.ts"
Cohesion: 0.26
Nodes (14): resolveImageOwner(), absFromRoot(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT, departmentIdFromMediaPath(), isMediaDepartmentId(), MEDIA_DEPARTMENT_IDS, MediaDepartmentId (+6 more)

### Community 96 - "SyncConflictModal.tsx"
Cohesion: 0.33
Nodes (3): SyncConflictModal(), SyncConflictModalProps, SyncConflictInfo

### Community 97 - "pending-operations.ts"
Cohesion: 0.24
Nodes (12): PENDING_OPERATIONS_FILE, clearPendingMedia(), clearPendingOperations(), OperationType, opsPath(), PendingOperation, PendingOperationsData, queueOperation() (+4 more)

### Community 101 - "getCurrentUser"
Cohesion: 0.40
Nodes (6): getCurrentUser(), requireRole(), requireEditDepartment(), requireManageTopicSections(), canEditDepartment(), canManageTopicSectionsForDepartment()

### Community 102 - "export-for-server.ts"
Cohesion: 0.24
Nodes (10): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+2 more)

### Community 103 - "pending-media.ts"
Cohesion: 0.42
Nodes (10): PENDING_MEDIA_FILE, hasPendingMedia(), normalizeRel(), PendingMedia, pendingPath(), queueMediaRemoteDelete(), queueMediaUpload(), readPendingMedia() (+2 more)

### Community 104 - "resolveImageStorageRef"
Cohesion: 0.35
Nodes (11): topicImageRelativePath(), cleanupTopicImageOrphans(), collectAllReferencedImageStoragePaths(), collectReferencedImageBasenames(), extractImageRefsFromMarkdown(), imagesBasename(), isReferencedImageOnDisk(), mediaImagePathsFromTopic() (+3 more)

### Community 105 - "REST INFO — веб-клиент"
Cohesion: 0.40
Nodes (5): Dev (Windows), Production, REST INFO — веб-клиент, Решения, Сборка

### Community 106 - "resolveExistingMediaAbsolutePath"
Cohesion: 0.33
Nodes (7): downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc(), resolveExistingMediaAbsolutePath(), flushPendingMedia(), electron

### Community 107 - "WorkDepartmentId"
Cohesion: 0.50
Nodes (5): PublicUser, StoredUser, WhitelistEntry, UserRole, WorkDepartmentId

### Community 109 - "main.ts"
Cohesion: 0.06
Nodes (59): SavedWindowBounds, setAuthToken(), setYandexToken(), applyClientTopicLink(), archiveSupportTopicsLocally(), attachWindowBoundsPersistence(), attachWindowsInputFixes(), clearSupportSubsectionLocally() (+51 more)

## Knowledge Gaps
- **551 isolated node(s):** `SUPPORT_PARTY_VALUES`, `SupportPartyValue`, `defaultSync`, `SettingsPageProps`, `TopicEditorModalProps` (+546 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 675 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalizeSubsectionLabelInput()` connect `subsections-store.ts` to `registerIpc`, `TopicList.tsx`, `SettingsPage`, `TopicEditorModal.tsx`, `main.ts`, `types.ts`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `registerIpc()` connect `registerIpc` to `normalizeSupportEmail`, `topic-media.ts`, `readSettings`, `server-sync.ts`, `normalizeSupportPhones`, `auth-store.ts`, `subsections-store.ts`, `session-log.ts`, `support-sections-store.ts`, `electron/updates.ts`, `cacheServerUser`, `yandex-sync.ts`, `cleanupTopicFileOrphans`, `departments-store.ts`, `electron/media-layout.ts`, `pending-operations.ts`, `getCurrentUser`, `pending-media.ts`, `resolveImageStorageRef`, `resolveExistingMediaAbsolutePath`, `main.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `electron` connect `resolveExistingMediaAbsolutePath` to `registerIpc`, `compilerOptions`, `electron/updates.ts`, `server-sync.ts`, `main.ts`, `yandex-sync.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SUPPORT_PARTY_VALUES`, `SupportPartyValue`, `defaultSync` to the rest of the system?**
  _551 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TopicList` be split into smaller, more focused modules?**
  _Cohesion score 0.11553030303030302 - nodes in this community are weakly interconnected._
- **Should `query` be split into smaller, more focused modules?**
  _Cohesion score 0.12688172043010754 - nodes in this community are weakly interconnected._