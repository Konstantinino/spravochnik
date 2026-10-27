# Graph Report - spravochnik-repo  (2026-10-27)

## Corpus Check
- 163 files · ~113,013 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1925 nodes · 4559 edges · 113 communities (86 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3da0930d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- normalizeSupportEmail
- TopicList.tsx
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
- browser-spravochnik.ts
- web/package.json
- push-yandex-restore.mjs
- data.ts
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
- pullFromServer
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
- App.tsx
- deploy.sh
- install-git-hooks.sh
- setup-deploy-key.sh
- setup-rest-info-user.sh
- Исправление путей к фото на сервере
- REST INFO — план веб-версии (отдельная ветка)
- compilerOptions
- План: автообновление «как Telegram Desktop»
- main.ts
- DepartmentId
- usePreserveTextareaFocus
- session-log.ts
- ParentTopicField
- support-sections-store.ts
- electron/updates.ts
- markdown.ts
- Viewer.tsx
- registerIpc
- paths.ts
- 012_support_sections_archive_lost.sql
- yandex-sync.ts
- admin.ts
- departments.ts
- query-subsections.mjs
- guide-merge.ts
- media.ts
- GuideItem
- departments-store.ts
- TopicEditorModal
- query
- electron/media-layout.ts
- SyncConflictModal.tsx
- pending-operations.ts
- sync-base.ts
- export-for-server.ts
- pending-media.ts
- resolveImageStorageRef
- REST INFO — веб-клиент
- media-download.ts
- requireRole
- web/vite.config.ts
- WorkDepartmentId
- ensureLocalUpdateManifest

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 137 edges
2. `getUserDataRoot()` - 61 edges
3. `Viewer()` - 60 edges
4. `SettingsPage()` - 52 edges
5. `readSettings()` - 50 edges
6. `App()` - 49 edges
7. `pullFromServer()` - 34 edges
8. `readAccounts()` - 29 edges
9. `TopicEditorModal()` - 28 edges
10. `TopicList()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `publicUserFromRow()` --calls--> `normalizeWorkDepartmentId()`  [EXTRACTED]
  web/src/platform/browser-spravochnik.ts → app/src/types.ts
- `getWorkDepartments()` --calls--> `getActiveDepartments()`  [EXTRACTED]
  app/electron/paths.ts → app/electron/departments-store.ts
- `putUser()` --calls--> `serverFetch()`  [EXTRACTED]
  app/electron/main.ts → app/electron/server-api.ts
- `AuthScreenProps` --references--> `PublicUser`  [EXTRACTED]
  app/src/components/AuthScreen.tsx → app/src/types.ts
- `ParentTopicFieldProps` --references--> `GuideItem`  [EXTRACTED]
  app/src/components/ParentTopicField.tsx → app/src/types.ts

## Import Cycles
- None detected.

## Communities (113 total, 9 thin omitted)

### Community 0 - "normalizeSupportEmail"
Cohesion: 0.25
Nodes (12): saveSupportEmails(), SupportContactBars(), SupportContactBarsProps, copyText(), SupportEmailsBar(), handleCopy(), SupportEmailsBarProps, DEFAULT_SUPPORT_EMAILS (+4 more)

### Community 1 - "TopicList.tsx"
Cohesion: 0.06
Nodes (61): ensureArchiveArchivedSubsectionLocal(), applySubsectionsFromSync(), getSubsectionsForDepartment(), mergeSubsectionPatch(), mergeSubsectionRecords(), mergeSubsectionsLists(), normalizePartyField(), normalizeStoredSubsection() (+53 more)

### Community 2 - "index.ts"
Cohesion: 0.10
Nodes (30): getPool(), withTransaction(), dataDir, __dirname, main(), mediaDir, root, updatesDir (+22 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App"
Cohesion: 0.09
Nodes (28): App(), collectSortIndexChanges(), executeLocalReset(), flashReorderLockBanner(), handleEnterReorderMode(), handleInlineSave(), handleListFilterChange(), handleReorderSiblings() (+20 more)

### Community 5 - "Viewer"
Cohesion: 0.08
Nodes (24): onKey(), openLocalResetConfirm(), fileExtLabel(), nodeText(), Viewer(), cancelEditing(), closeBranchAction(), closeFind() (+16 more)

### Community 6 - "topic-media.ts"
Cohesion: 0.15
Nodes (32): DepartmentId, draftFileRelativePath(), draftImageRelativePath(), getDraftFilesDir(), getDraftImagesDir(), getMediaDir(), getTopicFilesDir(), getTopicImagesDir() (+24 more)

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
Cohesion: 0.13
Nodes (25): ARCHIVE_ARCHIVED_SUBSECTION_ID, ARCHIVE_LOST_SUBSECTION_ID, Client, ensureArchiveArchivedSubsection(), ensureArchiveLostSubsection(), moveTopicsToArchiveLostByParty(), moveTopicsToArchiveLostBySubsection(), resolveSupportArchiveSubsectionId() (+17 more)

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
Cohesion: 0.13
Nodes (27): getGlobalVersion(), CONTENT_EDITOR_ROLES, isOwnerEmail(), isOwnerRole(), isUserRole(), JwtUser, LOST_DEPARTMENT_ID, parseUserRole() (+19 more)

### Community 17 - "devDependencies"
Cohesion: 0.04
Nodes (46): cookie-parser, cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cookie-parser (+38 more)

### Community 18 - "browser-spravochnik.ts"
Cohesion: 0.06
Nodes (59): DEPARTMENTS, SupportParty, ApiError, apiFetch(), hasConfiguredServer(), INVALID_SERVER_URL_MESSAGE, uploadMediaFile(), validateServerUrl() (+51 more)

### Community 19 - "web/package.json"
Cohesion: 0.07
Nodes (29): dependencies, react, react-dom, react-markdown, remark-gfm, description, devDependencies, @types/react (+21 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "data.ts"
Cohesion: 0.16
Nodes (22): handleParentIdChange(), handleParentIdChange(), buildTree(), compareTopicsByTitle(), compareTopicsForList(), filterItemsByParty(), filterItemsByView(), filterTopicsForClientLinkPicker() (+14 more)

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
Cohesion: 0.10
Nodes (39): HeaderProps, assignableRoles(), formatBytes(), levelLabel(), AdminDepartment, canManageTopicSectionsForDepartment(), CONTENT_EDITOR_ROLES, Department (+31 more)

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
Cohesion: 0.27
Nodes (8): __dirname, fileName, main(), releaseDir, serverUrl, uploadHeaders(), uploadUpdateFile(), versionMatch

### Community 37 - "pullFromServer"
Cohesion: 0.18
Nodes (22): getDepartments(), discardLocalChanges(), emit(), emitUpToDateOrOutdated(), finishPullStatus(), getSyncStatus(), hasUnsyncedLocalWork(), isLocalClientOutdated() (+14 more)

### Community 39 - "lib/media-layout.ts"
Cohesion: 0.12
Nodes (33): bumpGlobalVersion(), main(), printLine(), DbRow, DiscoveredFile, discoverMediaFilesOnDisk(), consider(), walk() (+25 more)

### Community 40 - "prefs.ts"
Cohesion: 0.16
Nodes (16): AuthScreen(), forgetSavedLogin(), handleSubmit(), AuthScreenProps, ServerUrlForm(), findRememberedLogin(), loadRememberedLogin(), loadRememberedLogins() (+8 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.11
Nodes (41): reconcileHasChildren(), fetchAdminUsersFromServer(), resolveExistingMediaAbsolutePath(), departmentById(), getUserDataRoot(), downloadMediaFile(), isServerReachable(), setAfterServerRequest() (+33 more)

### Community 42 - "Deploy keys (REST INFO)"
Cohesion: 0.40
Nodes (4): Deploy keys (REST INFO), GitHub, Дополнительная защита на сервере, Что здесь

### Community 43 - "SettingsPage"
Cohesion: 0.08
Nodes (33): coerceUsers(), coerceWhitelist(), formatLogLine(), formatLogTime(), formatTopicSectionsApiError(), SettingsPage(), addEmail(), beginAddSubsection() (+25 more)

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
Cohesion: 0.32
Nodes (10): saveSupportPhones(), copyText(), SupportPhonesBar(), handleCopy(), SupportPhonesBarProps, DEFAULT_SUPPORT_PHONES, formatSupportPhoneDisplay(), normalizeSupportPhones() (+2 more)

### Community 51 - "auth-store.ts"
Cohesion: 0.14
Nodes (47): accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), coerceAccountsData(), defaultAccounts(), defaultSettings(), deleteUser() (+39 more)

### Community 54 - "fix-media-paths.js"
Cohesion: 0.33
Nodes (6): apply, args, main(), positional, printLine(), serverUrl

### Community 56 - "App.tsx"
Cohesion: 0.11
Nodes (22): handleAuthenticated(), handleDepartmentChange(), defaultSync, resolveListFilter(), resolveUserDepartment(), SettingsErrorBoundary, Header(), Search() (+14 more)

### Community 61 - "Исправление путей к фото на сервере"
Cohesion: 0.20
Nodes (10): Альтернатива — прямо на сервере (SSH), В чём проблема, Если не работает, Исправление путей к фото на сервере, Проверка, Простой способ — с вашего Windows-ПК (как установщик), Шаг 1. Один раз обновить сервер, Шаг 2. Предпросмотр (ничего не меняет) (+2 more)

### Community 62 - "REST INFO — план веб-версии (отдельная ветка)"
Cohesion: 0.10
Nodes (21): Git-ветка, MVP → полная версия (фазы), REST INFO — план веб-версии (отдельная ветка), Архитектура, Безопасность (главный минус веба), Влияние на работающую систему, Зафиксированные решения (23.09.2026), Критерий готовности merge в `main` (+13 more)

### Community 63 - "compilerOptions"
Cohesion: 0.10
Nodes (19): ../app/src/*, compilerOptions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+11 more)

### Community 64 - "План: автообновление «как Telegram Desktop»"
Cohesion: 0.07
Nodes (30): 1.1 Зависимости и сборка (`app/`), 1.2 Клиент — `app/electron/updates.ts`, 1.3 Клиент — UI, 1.4 Клиент — IPC (`main.ts`, `preload.ts`, `vite-env.d.ts`), 1.5 Сервер — раздача артефактов, 1.6 Публикация — `upload-release.js`, 1.7 Обратная совместимость API, Edge cases (+22 more)

### Community 65 - "main.ts"
Cohesion: 0.07
Nodes (58): normalizeServerUrl(), SavedWindowBounds, saveWindowBounds(), applyClientTopicLink(), attachWindowBoundsPersistence(), attachWindowsInputFixes(), compareTopicRows(), createWindow() (+50 more)

### Community 66 - "DepartmentId"
Cohesion: 0.14
Nodes (19): ImageScaleDialog(), ImageScaleDialogProps, TopicMarkdownImage(), TopicMarkdownImageProps, applyDraftScale(), openImageMenu(), clampImageScale(), getImageScale() (+11 more)

### Community 67 - "usePreserveTextareaFocus"
Cohesion: 0.24
Nodes (11): shouldKeepExternalFocus(), usePreserveTextareaFocus(), clearBlurTimer(), onBlur(), onFocusIn(), restoreFocusIfNeeded(), saveSelection(), focusTextControl() (+3 more)

### Community 68 - "session-log.ts"
Cohesion: 0.22
Nodes (8): clearSessionLogs(), entries, getSessionLogs(), listeners, notify(), onSessionLog(), SessionLogEntry, SessionLogLevel

### Community 69 - "ParentTopicField"
Cohesion: 0.16
Nodes (14): ParentTopicField(), handleBlur(), handleInputChange(), pick(), resolveBlurSelection(), ParentTopicFieldProps, TopicLinkPicker(), TopicLinkPickerProps (+6 more)

### Community 71 - "support-sections-store.ts"
Cohesion: 0.32
Nodes (11): applySupportSectionsFromSync(), configPath(), DEFAULT_SUPPORT_SECTIONS, defaultSupportSections(), mergeSupportSectionPatch(), readStoredSupportSections(), removeSupportSectionLocal(), StoredSupportSection (+3 more)

### Community 73 - "electron/updates.ts"
Cohesion: 0.12
Nodes (30): getSeedDataDir(), checkForUpdates(), checkForUpdatesAuto(), checkForUpdatesLegacy(), clearPartialUpdateCache(), configureAutoUpdaterFeed(), downloadLatestRelease(), downloadUpdate() (+22 more)

### Community 74 - "markdown.ts"
Cohesion: 0.17
Nodes (17): handleAnswerCopy(), copyImageLink(), handleAnswerCopy(), escapeMdLinkLabel(), formatFileMarkdownLink(), formatSharedImageMarkdown(), IMAGE_STORAGE_PATH_RE, isAllowedMarkdownImageSrc() (+9 more)

### Community 75 - "Viewer.tsx"
Cohesion: 0.17
Nodes (20): handleSubmit(), ImgMenuState, ScaleEditorState, handleSave(), ADMIN_CLIENT_TOPIC_LINK_UI_ENABLED, applyFindHighlights(), clearFindHighlights(), markdownFromEdit() (+12 more)

### Community 80 - "registerIpc"
Cohesion: 0.07
Nodes (47): setAuthToken(), setLastSyncAt(), setServerUrl(), setYandexToken(), writeSettings(), archiveSupportTopicsLocally(), clearSupportSubsectionLocally(), ensureArchiveLostSubsectionLocal() (+39 more)

### Community 81 - "paths.ts"
Cohesion: 0.10
Nodes (20): LOST_DEPARTMENT_ID, TEMPLATES_DEPARTMENT_ID, APP_UPDATE_FILE, BOOTSTRAP_ADMIN_EMAIL, CONTENT_EDITOR_ROLES, Department, DEPARTMENTS, getWorkDepartments() (+12 more)

### Community 83 - "yandex-sync.ts"
Cohesion: 0.10
Nodes (52): AccountsData, readSettings(), setPendingChanges(), applyConflictResolutions(), acquireSyncLock(), ConflictResolution, currentStatus, deleteRemoteFile() (+44 more)

### Community 84 - "admin.ts"
Cohesion: 0.08
Nodes (39): canManageTopicSectionsForDepartment(), isWorkDepartmentId(), normalizeWorkDepartmentId(), allocateSubsectionId(), Client, departmentHasSubsections(), filterSubsectionsForTopicScope(), getSubsectionById() (+31 more)

### Community 85 - "departments.ts"
Cohesion: 0.12
Nodes (22): DepartmentListKey, DepartmentRecord, getDepartmentById(), isDepartmentIdSlug(), isEditableInSettings(), isLostDepartmentId(), isMissingDepartmentsColumnError(), isTemplatesDepartmentId() (+14 more)

### Community 89 - "guide-merge.ts"
Cohesion: 0.27
Nodes (12): asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic, mergeGuideFile(), MergeGuideResult, sortValue() (+4 more)

### Community 90 - "media.ts"
Cohesion: 0.14
Nodes (19): CLIENT_VERSION_HEADER, compareVersions(), getLatestAppReleaseVersion(), normalizeVersionLabel(), parseClientVersionHeader(), requiredClientVersion(), canEditContent(), canEditDepartment() (+11 more)

### Community 91 - "GuideItem"
Cohesion: 0.19
Nodes (16): SettingsPageProps, TopicEditorModalProps, TopicListProps, ViewerProps, getItemPath(), topicLabelWithPath(), buildTopicSearchFilter(), SearchHit (+8 more)

### Community 92 - "departments-store.ts"
Cohesion: 0.26
Nodes (14): applyDepartmentsFromSync(), DEFAULT_DEPARTMENTS, departmentById(), departmentFileName(), DEPARTMENTS_CONFIG_FILE, departmentsConfigPath(), ensureGuideFileForDepartment(), getActiveDepartments() (+6 more)

### Community 93 - "TopicEditorModal"
Cohesion: 0.14
Nodes (23): newDraftId(), TopicEditorModal(), handleAnswerPaste(), imageOwnerPayload(), insertFile(), insertPhoto(), resolvedTextareaSelection(), handleAnswerPaste() (+15 more)

### Community 94 - "query"
Cohesion: 0.17
Nodes (17): query(), DEFAULT_SUPPORT_EMAILS, isPlausibleSupportEmail(), normalizeSupportEmail(), normalizeSupportEmails(), readSupportEmailsFromDb(), SUPPORT_EMAILS_SYNC_KEY, SupportEmailLine (+9 more)

### Community 95 - "electron/media-layout.ts"
Cohesion: 0.26
Nodes (14): resolveImageOwner(), absFromRoot(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT, departmentIdFromMediaPath(), isMediaDepartmentId(), MEDIA_DEPARTMENT_IDS, MediaDepartmentId (+6 more)

### Community 96 - "SyncConflictModal.tsx"
Cohesion: 0.32
Nodes (4): SyncConflictModal(), SyncConflictModalProps, ConflictResolution, SyncConflictInfo

### Community 97 - "pending-operations.ts"
Cohesion: 0.23
Nodes (14): PENDING_OPERATIONS_FILE, clearPendingMedia(), clearPendingOperations(), hasPendingOperations(), OperationType, opsPath(), PendingOperation, PendingOperationsData (+6 more)

### Community 101 - "sync-base.ts"
Cohesion: 0.46
Nodes (7): DATA_FILES, baseDir(), basePathFor(), readBaseGuide(), writeAllGuideBasesFromLocal(), writeBaseFromLocalFile(), writeBaseGuide()

### Community 102 - "export-for-server.ts"
Cohesion: 0.24
Nodes (10): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+2 more)

### Community 103 - "pending-media.ts"
Cohesion: 0.44
Nodes (10): hasPendingMedia(), normalizeRel(), PendingMedia, pendingPath(), queueMediaRemoteDelete(), queueMediaUpload(), readPendingMedia(), rewritePendingMediaPaths() (+2 more)

### Community 104 - "resolveImageStorageRef"
Cohesion: 0.30
Nodes (12): topicImageRelativePath(), cleanupTopicImageOrphans(), collectAllReferencedImageStoragePaths(), collectReferencedImageBasenames(), extractImageRefsFromMarkdown(), imagesBasename(), isReferencedImageOnDisk(), mediaImagePathsFromTopic() (+4 more)

### Community 105 - "REST INFO — веб-клиент"
Cohesion: 0.40
Nodes (5): Dev (Windows), Production, REST INFO — веб-клиент, Решения, Сборка

### Community 106 - "media-download.ts"
Cohesion: 0.70
Nodes (4): downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc()

### Community 107 - "requireRole"
Cohesion: 0.29
Nodes (7): requireRole(), requireEditDepartment(), requireManageTopicSections(), canEditContent(), canEditDepartment(), canManageTopicSectionsForDepartment(), isStaffRole()

### Community 109 - "WorkDepartmentId"
Cohesion: 0.50
Nodes (5): PublicUser, StoredUser, WhitelistEntry, UserRole, WorkDepartmentId

### Community 110 - "ensureLocalUpdateManifest"
Cohesion: 0.50
Nodes (4): ensureDataReady(), compareVersions(), ensureLocalUpdateManifest(), parseManifest()

## Knowledge Gaps
- **545 isolated node(s):** `SettingsData`, `SessionData`, `ROLE_RANK`, `DEPARTMENTS_CONFIG_FILE`, `StoredDepartment` (+540 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 670 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalizeSubsectionLabelInput()` connect `TopicList.tsx` to `main.ts`, `Viewer.tsx`, `SettingsPage`, `registerIpc`, `types.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `registerIpc()` connect `registerIpc` to `normalizeSupportEmail`, `TopicList.tsx`, `topic-media.ts`, `pullFromServer`, `server-sync.ts`, `normalizeSupportPhones`, `auth-store.ts`, `main.ts`, `session-log.ts`, `support-sections-store.ts`, `electron/updates.ts`, `paths.ts`, `yandex-sync.ts`, `departments-store.ts`, `electron/media-layout.ts`, `pending-operations.ts`, `pending-media.ts`, `resolveImageStorageRef`, `media-download.ts`, `requireRole`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `SettingsPage()` connect `SettingsPage` to `App.tsx`, `normalizeSupportEmail`, `normalizeSupportPhones`, `types.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsData`, `SessionData`, `ROLE_RANK` to the rest of the system?**
  _545 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TopicList.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06241519674355495 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10317460317460317 - nodes in this community are weakly interconnected._