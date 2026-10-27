# Graph Report - spravochnik-repo  (2026-10-27)

## Corpus Check
- 161 files · ~110,929 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1911 nodes · 4534 edges · 109 communities (84 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0b658399`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- normalizeSupportPhones
- TopicList.tsx
- query
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
- App.tsx
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
- main.ts
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
- getUserDataRoot
- auth-store.ts
- clone-or-update.sh
- fix-media-paths.js
- WorkDepartmentId
- deploy.sh
- install-git-hooks.sh
- setup-deploy-key.sh
- setup-rest-info-user.sh
- Исправление путей к фото на сервере
- REST INFO — план веб-версии (отдельная ветка)
- compilerOptions
- План: автообновление «как Telegram Desktop»
- subsections-store.ts
- Viewer.tsx
- usePreserveTextareaFocus
- departments-store.ts
- data.ts
- support-sections-store.ts
- electron/updates.ts
- markdown.ts
- TopicEditorModal.tsx
- SyncConflictModal.tsx
- paths.ts
- 012_support_sections_archive_lost.sql
- yandex-sync.ts
- subsections.ts
- admin.ts
- electron/media-layout.ts
- query-subsections.mjs
- media-download.ts
- media.ts
- search.ts
- guide-merge.ts
- textInsert.ts
- routes/updates.ts
- pending-media.ts
- resolveImageStorageRef
- export-for-server.ts
- ensureUpdateDownloaded
- normalizeSupportEmail
- cleanupTopicFileOrphans
- createWindow
- cacheServerUser
- REST INFO — веб-клиент

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
- `onKey()` --calls--> `restoreAppFocus()`  [EXTRACTED]
  app/src/App.tsx → app/src/lib/restoreAppFocus.ts
- `openLocalResetConfirm()` --calls--> `releaseStaleFocus()`  [EXTRACTED]
  app/src/App.tsx → app/src/lib/restoreAppFocus.ts
- `openImageMenu()` --calls--> `normalizeImageDisplayKey()`  [EXTRACTED]
  app/src/components/Viewer.tsx → app/src/lib/imageDisplay.ts

## Import Cycles
- None detected.

## Communities (109 total, 8 thin omitted)

### Community 0 - "normalizeSupportPhones"
Cohesion: 0.32
Nodes (10): saveSupportPhones(), copyText(), SupportPhonesBar(), handleCopy(), SupportPhonesBarProps, DEFAULT_SUPPORT_PHONES, formatSupportPhoneDisplay(), normalizeSupportPhones() (+2 more)

### Community 1 - "TopicList.tsx"
Cohesion: 0.08
Nodes (45): SubsectionDividerPreview(), autoScrollContainer(), deptLevelSubsections(), findScrollParent(), groupRootsBySubsections(), guideX(), highlightTitle(), isDeptSectionFilter() (+37 more)

### Community 2 - "query"
Cohesion: 0.12
Nodes (27): getPool(), query(), withTransaction(), dataDir, __dirname, main(), mediaDir, root (+19 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App"
Cohesion: 0.08
Nodes (31): App(), collectSortIndexChanges(), executeLocalReset(), flashReorderLockBanner(), handleEnterReorderMode(), handleInlineSave(), handleListFilterChange(), handleReorderSiblings() (+23 more)

### Community 5 - "Viewer"
Cohesion: 0.08
Nodes (24): fileExtLabel(), nodeText(), Viewer(), applyDraftScale(), cancelEditing(), closeBranchAction(), closeFind(), closeScaleEditor() (+16 more)

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
Cohesion: 0.12
Nodes (28): getGlobalVersion(), ARCHIVE_ARCHIVED_SUBSECTION_ID, ARCHIVE_LOST_SUBSECTION_ID, Client, ensureArchiveArchivedSubsection(), ensureArchiveLostSubsection(), moveTopicsToArchiveLostByParty(), moveTopicsToArchiveLostBySubsection() (+20 more)

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
Cohesion: 0.10
Nodes (41): canEditContent(), canEditDepartment(), canManageTopicSectionsForDepartment(), CONTENT_EDITOR_ROLES, generateSalt(), hashPassword(), isOwnerEmail(), isOwnerRole() (+33 more)

### Community 17 - "devDependencies"
Cohesion: 0.04
Nodes (46): cookie-parser, cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cookie-parser (+38 more)

### Community 18 - "browser-spravochnik.ts"
Cohesion: 0.06
Nodes (58): SupportParty, ApiError, apiFetch(), hasConfiguredServer(), INVALID_SERVER_URL_MESSAGE, uploadMediaFile(), validateServerUrl(), WEB_CLIENT_VERSION (+50 more)

### Community 19 - "web/package.json"
Cohesion: 0.07
Nodes (28): dependencies, react, react-dom, react-markdown, remark-gfm, description, devDependencies, @types/react (+20 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "App.tsx"
Cohesion: 0.10
Nodes (21): handleAuthenticated(), handleDepartmentChange(), defaultSync, resolveListFilter(), resolveUserDepartment(), SettingsErrorBoundary, Search(), SearchProps (+13 more)

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
Cohesion: 0.09
Nodes (38): Header(), HeaderProps, AdminDepartment, canEditContent(), canEditDepartment(), canSwitchDepartment(), ConflictResolution, CONTENT_EDITOR_ROLES (+30 more)

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

### Community 37 - "main.ts"
Cohesion: 0.06
Nodes (84): SavedWindowBounds, applyClientTopicLink(), archiveSupportTopicsLocally(), clearSupportSubsectionLocally(), compareTopicRows(), inferSubsectionsFromLocalGuides(), normalizeClientTopicId(), normalizeSupportPartyId() (+76 more)

### Community 39 - "lib/media-layout.ts"
Cohesion: 0.12
Nodes (32): bumpGlobalVersion(), main(), printLine(), DbRow, DiscoveredFile, discoverMediaFilesOnDisk(), consider(), walk() (+24 more)

### Community 40 - "prefs.ts"
Cohesion: 0.14
Nodes (18): AuthScreen(), forgetSavedLogin(), handleSubmit(), AuthScreenProps, ServerUrlForm(), SettingsPageProps, findRememberedLogin(), loadRememberedLogin() (+10 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.05
Nodes (95): normalizeServerUrl(), readSettings(), saveWindowBounds(), setAuthToken(), setLastSyncAt(), setPendingChanges(), setServerUrl(), setYandexToken() (+87 more)

### Community 42 - "Deploy keys (REST INFO)"
Cohesion: 0.40
Nodes (4): Deploy keys (REST INFO), GitHub, Дополнительная защита на сервере, Что здесь

### Community 43 - "SettingsPage"
Cohesion: 0.07
Nodes (41): assignableRoles(), coerceUsers(), coerceWhitelist(), formatBytes(), formatLogLine(), formatLogTime(), formatTopicSectionsApiError(), levelLabel() (+33 more)

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

### Community 50 - "getUserDataRoot"
Cohesion: 0.20
Nodes (20): ensureDataReady(), getSeedDataDir(), getUserDataRoot(), require, baseDir(), basePathFor(), readBaseGuide(), writeAllGuideBasesFromLocal() (+12 more)

### Community 51 - "auth-store.ts"
Cohesion: 0.12
Nodes (50): AccountsData, accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), coerceAccountsData(), defaultAccounts(), defaultSettings() (+42 more)

### Community 54 - "fix-media-paths.js"
Cohesion: 0.33
Nodes (6): apply, args, main(), positional, printLine(), serverUrl

### Community 56 - "WorkDepartmentId"
Cohesion: 0.50
Nodes (5): PublicUser, StoredUser, WhitelistEntry, UserRole, WorkDepartmentId

### Community 61 - "Исправление путей к фото на сервере"
Cohesion: 0.20
Nodes (10): Альтернатива — прямо на сервере (SSH), В чём проблема, Если не работает, Исправление путей к фото на сервере, Проверка, Простой способ — с вашего Windows-ПК (как установщик), Шаг 1. Один раз обновить сервер, Шаг 2. Предпросмотр (ничего не меняет) (+2 more)

### Community 62 - "REST INFO — план веб-версии (отдельная ветка)"
Cohesion: 0.10
Nodes (21): Git-ветка, MVP → полная версия (фазы), REST INFO — план веб-версии (отдельная ветка), Архитектура, Безопасность (главный минус веба), Влияние на работающую систему, Зафиксированные решения (23.09.2026), Критерий готовности merge в `main` (+13 more)

### Community 63 - "compilerOptions"
Cohesion: 0.11
Nodes (18): ../app/src/*, compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 64 - "План: автообновление «как Telegram Desktop»"
Cohesion: 0.07
Nodes (30): 1.1 Зависимости и сборка (`app/`), 1.2 Клиент — `app/electron/updates.ts`, 1.3 Клиент — UI, 1.4 Клиент — IPC (`main.ts`, `preload.ts`, `vite-env.d.ts`), 1.5 Сервер — раздача артефактов, 1.6 Публикация — `upload-release.js`, 1.7 Обратная совместимость API, Edge cases (+22 more)

### Community 65 - "subsections-store.ts"
Cohesion: 0.23
Nodes (18): ensureArchiveArchivedSubsectionLocal(), ensureArchiveLostSubsectionLocal(), rootSubsectionsForTopic(), applySubsectionsFromSync(), getSubsectionsForDepartment(), mergeSubsectionPatch(), mergeSubsectionRecords(), mergeSubsectionsLists() (+10 more)

### Community 66 - "Viewer.tsx"
Cohesion: 0.12
Nodes (25): ImageScaleDialog(), ImageScaleDialogProps, TopicMarkdownImage(), TopicMarkdownImageProps, ImgMenuState, ScaleEditorState, ViewerProps, ADMIN_CLIENT_TOPIC_LINK_UI_ENABLED (+17 more)

### Community 67 - "usePreserveTextareaFocus"
Cohesion: 0.38
Nodes (8): shouldKeepExternalFocus(), usePreserveTextareaFocus(), clearBlurTimer(), onBlur(), onFocusIn(), restoreFocusIfNeeded(), saveSelection(), isStaleAppShellFocus()

### Community 68 - "departments-store.ts"
Cohesion: 0.26
Nodes (14): applyDepartmentsFromSync(), DEFAULT_DEPARTMENTS, departmentById(), departmentFileName(), DEPARTMENTS_CONFIG_FILE, departmentsConfigPath(), ensureGuideFileForDepartment(), getActiveDepartments() (+6 more)

### Community 69 - "data.ts"
Cohesion: 0.10
Nodes (30): ParentTopicField(), handleBlur(), handleInputChange(), pick(), resolveBlurSelection(), ParentTopicFieldProps, TopicLinkPicker(), TopicLinkPickerProps (+22 more)

### Community 71 - "support-sections-store.ts"
Cohesion: 0.32
Nodes (11): applySupportSectionsFromSync(), configPath(), DEFAULT_SUPPORT_SECTIONS, defaultSupportSections(), mergeSupportSectionPatch(), readStoredSupportSections(), removeSupportSectionLocal(), StoredSupportSection (+3 more)

### Community 73 - "electron/updates.ts"
Cohesion: 0.16
Nodes (20): APP_UPDATE_FILE, checkForUpdates(), checkForUpdatesAuto(), checkForUpdatesLegacy(), clearPartialUpdateCache(), configureAutoUpdaterFeed(), electronUpdaterCacheDir(), emit() (+12 more)

### Community 74 - "markdown.ts"
Cohesion: 0.20
Nodes (14): handleAnswerCopy(), copyImageLink(), handleAnswerCopy(), formatSharedImageMarkdown(), IMAGE_STORAGE_PATH_RE, isAllowedMarkdownImageSrc(), markdownForDisplay(), nbspFormsToLiteral() (+6 more)

### Community 75 - "TopicEditorModal.tsx"
Cohesion: 0.13
Nodes (27): newDraftId(), TopicEditorModal(), handleParentIdChange(), handleSubmit(), TopicEditorModalProps, TopicListProps, handleParentIdChange(), handleSave() (+19 more)

### Community 80 - "SyncConflictModal.tsx"
Cohesion: 0.33
Nodes (3): SyncConflictModal(), SyncConflictModalProps, SyncConflictInfo

### Community 81 - "paths.ts"
Cohesion: 0.10
Nodes (19): LOST_DEPARTMENT_ID, TEMPLATES_DEPARTMENT_ID, BOOTSTRAP_ADMIN_EMAIL, canEditContent(), CONTENT_EDITOR_ROLES, Department, DepartmentId, DEPARTMENTS (+11 more)

### Community 83 - "yandex-sync.ts"
Cohesion: 0.11
Nodes (38): acquireSyncLock(), ConflictResolution, currentStatus, deleteRemoteFile(), discardLocalChanges(), downloadRemoteFile(), emit(), ensureRemoteDir() (+30 more)

### Community 84 - "subsections.ts"
Cohesion: 0.19
Nodes (18): allocateSubsectionId(), Client, departmentHasSubsections(), filterSubsectionsForTopicScope(), getSubsectionById(), isMissingColumn(), isMissingSubsectionsTable(), listSubsections() (+10 more)

### Community 85 - "admin.ts"
Cohesion: 0.08
Nodes (33): DepartmentListKey, DepartmentRecord, isDepartmentIdSlug(), isEditableInSettings(), isLostDepartmentId(), isMissingDepartmentsColumnError(), isTemplatesDepartmentId(), isWorkDepartmentRecord() (+25 more)

### Community 87 - "electron/media-layout.ts"
Cohesion: 0.26
Nodes (14): resolveImageOwner(), absFromRoot(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT, departmentIdFromMediaPath(), isMediaDepartmentId(), MEDIA_DEPARTMENT_IDS, MediaDepartmentId (+6 more)

### Community 89 - "media-download.ts"
Cohesion: 0.70
Nodes (4): downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc()

### Community 90 - "media.ts"
Cohesion: 0.21
Nodes (13): CLIENT_VERSION_HEADER, compareVersions(), getLatestAppReleaseVersion(), normalizeVersionLabel(), parseClientVersionHeader(), requiredClientVersion(), requireRole(), blockWritesIfClientOutdated() (+5 more)

### Community 91 - "search.ts"
Cohesion: 0.27
Nodes (9): getItemPath(), topicLabelWithPath(), buildTopicSearchFilter(), SearchHit, searchItems(), splitSearchTokens(), textHasAllTokens(), TopicSearchFilter (+1 more)

### Community 92 - "guide-merge.ts"
Cohesion: 0.25
Nodes (13): applyConflictResolutions(), asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic, mergeGuideFile(), MergeGuideResult (+5 more)

### Community 93 - "textInsert.ts"
Cohesion: 0.18
Nodes (22): handleAnswerPaste(), imageOwnerPayload(), insertFile(), insertPhoto(), resolvedTextareaSelection(), handleAnswerPaste(), insertFile(), insertPhoto() (+14 more)

### Community 94 - "routes/updates.ts"
Cohesion: 0.16
Nodes (16): DEFAULT_SUPPORT_EMAILS, isPlausibleSupportEmail(), normalizeSupportEmail(), normalizeSupportEmails(), readSupportEmailsFromDb(), SUPPORT_EMAILS_SYNC_KEY, SupportEmailLine, writeSupportEmailsToDb() (+8 more)

### Community 95 - "pending-media.ts"
Cohesion: 0.39
Nodes (11): clearPendingMedia(), hasPendingMedia(), normalizeRel(), PendingMedia, pendingPath(), queueMediaRemoteDelete(), queueMediaUpload(), readPendingMedia() (+3 more)

### Community 96 - "resolveImageStorageRef"
Cohesion: 0.35
Nodes (11): topicImageRelativePath(), cleanupTopicImageOrphans(), collectAllReferencedImageStoragePaths(), collectReferencedImageBasenames(), extractImageRefsFromMarkdown(), imagesBasename(), isReferencedImageOnDisk(), mediaImagePathsFromTopic() (+3 more)

### Community 97 - "export-for-server.ts"
Cohesion: 0.22
Nodes (11): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+3 more)

### Community 100 - "ensureUpdateDownloaded"
Cohesion: 0.24
Nodes (10): downloadLatestRelease(), downloadUpdate(), ensureUpdateDownloaded(), fetchLatestRelease(), getUpdateStatus(), installUpdate(), isNetworkOnline(), onUpdateStatus() (+2 more)

### Community 101 - "normalizeSupportEmail"
Cohesion: 0.33
Nodes (10): saveSupportEmails(), copyText(), SupportEmailsBar(), handleCopy(), SupportEmailsBarProps, DEFAULT_SUPPORT_EMAILS, isPlausibleSupportEmail(), normalizeSupportEmail() (+2 more)

### Community 102 - "cleanupTopicFileOrphans"
Cohesion: 0.39
Nodes (8): topicFileRelativePath(), cleanupTopicFileOrphans(), collectAllReferencedFileStoragePaths(), collectReferencedFileBasenames(), extractFileRefsFromMarkdown(), filesBasename(), isReferencedFileOnDisk(), mediaFilePathsFromTopic()

### Community 103 - "createWindow"
Cohesion: 0.29
Nodes (7): attachWindowBoundsPersistence(), attachWindowsInputFixes(), createWindow(), isWindowBoundsVisible(), loadSavedWindowBounds(), persistWindowBounds(), rectsOverlap()

### Community 104 - "cacheServerUser"
Cohesion: 0.40
Nodes (6): cacheServerUser(), fetchAdminUsersFromServer(), publicUsersFromServer(), roleFromServerUser(), isWorkDepartmentId(), parseUserRole()

### Community 105 - "REST INFO — веб-клиент"
Cohesion: 0.40
Nodes (5): Dev (Windows), Production, REST INFO — веб-клиент, Решения (зафиксировано), Сборка

## Knowledge Gaps
- **539 isolated node(s):** `SettingsData`, `SessionData`, `ROLE_RANK`, `DEPARTMENTS_CONFIG_FILE`, `StoredDepartment` (+534 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 659 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalizeSubsectionLabelInput()` connect `TopicList.tsx` to `subsections-store.ts`, `TopicEditorModal.tsx`, `SettingsPage`, `main.ts`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `registerIpc()` connect `main.ts` to `resolveImageStorageRef`, `subsections-store.ts`, `TopicList.tsx`, `normalizeSupportPhones`, `departments-store.ts`, `ensureUpdateDownloaded`, `topic-media.ts`, `support-sections-store.ts`, `cacheServerUser`, `server-sync.ts`, `cleanupTopicFileOrphans`, `electron/updates.ts`, `normalizeSupportEmail`, `getUserDataRoot`, `auth-store.ts`, `electron/media-layout.ts`, `media-download.ts`, `pending-media.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `SettingsPage()` connect `SettingsPage` to `normalizeSupportPhones`, `normalizeSupportEmail`, `types.ts`, `App.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsData`, `SessionData`, `ROLE_RANK` to the rest of the system?**
  _539 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TopicList.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08081632653061224 - nodes in this community are weakly interconnected._
- **Should `query` be split into smaller, more focused modules?**
  _Cohesion score 0.11895161290322581 - nodes in this community are weakly interconnected._