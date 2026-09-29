# Graph Report - spravochnik-repo  (2026-09-29)

## Corpus Check
- 144 files · ~100,687 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1681 nodes · 4011 edges · 98 communities (74 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `04b6274e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SettingsPage.tsx
- TopicList
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
- departmentById
- vite-env.d.ts
- push-yandex-restore.mjs
- win
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
- Header.tsx
- server-sync.ts
- Deploy keys (REST INFO)
- SettingsPage
- app/package.json
- nsis
- dependencies
- scripts
- 001_initial.sql
- sync.ts
- auth-store.ts
- clone-or-update.sh
- fix-media-paths.js
- WorkDepartmentId
- deploy.sh
- install-git-hooks.sh
- setup-deploy-key.sh
- setup-rest-info-user.sh
- Исправление путей к фото на сервере
- План: автообновление «как Telegram Desktop»
- subsections-store.ts
- imageDisplay.ts
- usePreserveTextareaFocus
- departments-store.ts
- data.ts
- support-sections-store.ts
- electron/updates.ts
- lib/fix-media-paths.ts
- App.tsx
- SyncConflictModal.tsx
- session-log.ts
- 012_support_sections_archive_lost.sql
- yandex-sync.ts
- subsections.ts
- departments.ts
- pullFromServer
- query-subsections.mjs
- getUserDataRoot
- pending-operations.ts
- TopicList.tsx
- Viewer.tsx
- textInsert.ts
- query
- readSettings

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 127 edges
2. `getUserDataRoot()` - 61 edges
3. `Viewer()` - 50 edges
4. `App()` - 49 edges
5. `readSettings()` - 48 edges
6. `SettingsPage()` - 47 edges
7. `pullFromServer()` - 31 edges
8. `readAccounts()` - 29 edges
9. `TopicList()` - 28 edges
10. `serverFetch()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `pushAccountsFile()` --calls--> `isServerReachable()`  [EXTRACTED]
  app/electron/server-sync.ts → app/electron/server-api.ts
- `AuthScreenProps` --references--> `PublicUser`  [EXTRACTED]
  app/src/components/AuthScreen.tsx → app/src/types.ts
- `SearchProps` --references--> `TopicViewFilter`  [EXTRACTED]
  app/src/components/Search.tsx → app/src/types.ts
- `accountsPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts
- `settingsPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts

## Import Cycles
- None detected.

## Communities (98 total, 8 thin omitted)

### Community 0 - "SettingsPage.tsx"
Cohesion: 0.18
Nodes (17): assignableRoles(), formatBytes(), levelLabel(), saveSupportPhones(), copyText(), SupportPhonesBar(), handleCopy(), SupportPhonesBarProps (+9 more)

### Community 1 - "TopicList"
Cohesion: 0.11
Nodes (31): autoScrollContainer(), deptLevelSubsections(), findScrollParent(), groupRootsBySubsections(), isDeptSectionFilter(), isRowVisibleInScroll(), renderTreeNode(), scrollRowToListCenter() (+23 more)

### Community 2 - "index.ts"
Cohesion: 0.12
Nodes (25): bumpGlobalVersion(), getPool(), withTransaction(), dataDir, __dirname, main(), mediaDir, root (+17 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App"
Cohesion: 0.05
Nodes (52): App(), collectSortIndexChanges(), executeLocalReset(), flashReorderLockBanner(), handleAuthenticated(), handleEnterReorderMode(), handleInlineSave(), handleListFilterChange() (+44 more)

### Community 5 - "Viewer"
Cohesion: 0.11
Nodes (19): handleParentIdChange(), fileExtLabel(), Viewer(), cancelEditing(), closeFind(), closeScaleEditor(), downloadImage(), handleParentIdChange() (+11 more)

### Community 6 - "paths.ts"
Cohesion: 0.05
Nodes (90): resolveImageOwner(), absFromRoot(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT, departmentIdFromMediaPath(), isMediaDepartmentId(), MEDIA_DEPARTMENT_IDS, MediaDepartmentId (+82 more)

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
Cohesion: 0.13
Nodes (26): ARCHIVE_ARCHIVED_SUBSECTION_ID, ARCHIVE_LOST_SUBSECTION_ID, Client, ensureArchiveArchivedSubsection(), ensureArchiveLostSubsection(), moveTopicsToArchiveLostByParty(), moveTopicsToArchiveLostBySubsection(), resolveSupportArchiveSubsectionId() (+18 more)

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
Cohesion: 0.10
Nodes (39): canEditContent(), canEditDepartment(), canManageTopicSectionsForDepartment(), CONTENT_EDITOR_ROLES, generateSalt(), hashPassword(), isOwnerEmail(), isOwnerRole() (+31 more)

### Community 17 - "devDependencies"
Cohesion: 0.05
Nodes (42): cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cors, express (+34 more)

### Community 18 - "departmentById"
Cohesion: 0.18
Nodes (14): archiveSupportTopicsLocally(), clearSupportSubsectionLocally(), inferSubsectionsFromLocalGuides(), readGuideFile(), refreshDeptTopicOrderFromServer(), writeGuideFile(), departmentById(), ensureRequestedPartyPersisted() (+6 more)

### Community 19 - "vite-env.d.ts"
Cohesion: 0.30
Nodes (11): AdminDepartment, GuideFile, LatestReleaseInfo, SessionLogEntry, StorageStats, UpdateInfo, UserRole, WhitelistEntry (+3 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "win"
Cohesion: 0.50
Nodes (4): win, artifactName, icon, target

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
Nodes (27): handleDepartmentChange(), Search(), SearchProps, buildTopicViewFilterLabels(), canEditContent(), canEditDepartment(), CONTENT_EDITOR_ROLES, departmentsForUser() (+19 more)

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
Cohesion: 0.06
Nodes (74): normalizeServerUrl(), SavedWindowBounds, applyClientTopicLink(), attachWindowBoundsPersistence(), attachWindowsInputFixes(), createWindow(), ensureDataReady(), fetchAdminUsersFromServer() (+66 more)

### Community 39 - "lib/media-layout.ts"
Cohesion: 0.15
Nodes (26): discoverMediaFilesOnDisk(), consider(), walk(), absoluteMediaCandidates(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT, deleteTopicMediaFiles(), isMediaDepartmentId() (+18 more)

### Community 40 - "Header.tsx"
Cohesion: 0.20
Nodes (10): Header(), HeaderProps, SettingsPageProps, SUPPORT_PHONES_PLACEMENT, SupportPhonesPlacement, canSwitchDepartment(), Department, PublicUser (+2 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.12
Nodes (26): reconcileHasChildren(), setAfterServerRequest(), applyTopicToLocal(), ConflictResolution, currentStatus, ensureRequestedClientLinkPersisted(), isAdditionalParty(), listeners (+18 more)

### Community 42 - "Deploy keys (REST INFO)"
Cohesion: 0.40
Nodes (4): Deploy keys (REST INFO), GitHub, Дополнительная защита на сервере, Что здесь

### Community 43 - "SettingsPage"
Cohesion: 0.09
Nodes (34): coerceUsers(), coerceWhitelist(), formatLogLine(), formatLogTime(), formatTopicSectionsApiError(), SettingsPage(), addEmail(), beginAddSubsection() (+26 more)

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
Cohesion: 0.17
Nodes (12): app_releases, departments, media_files, removed_emails, sync_state, topic_id_counters, topic_locks, topics (+4 more)

### Community 50 - "sync.ts"
Cohesion: 0.19
Nodes (13): getGlobalVersion(), subsectionToClient(), allocateSupportSectionId(), Client, getSupportSectionById(), isKnownSupportParty(), isMissingTable(), listSupportSections() (+5 more)

### Community 51 - "auth-store.ts"
Cohesion: 0.12
Nodes (53): accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), coerceAccountsData(), defaultAccounts(), defaultSettings(), deleteUser() (+45 more)

### Community 54 - "fix-media-paths.js"
Cohesion: 0.33
Nodes (6): apply, args, main(), positional, printLine(), serverUrl

### Community 56 - "WorkDepartmentId"
Cohesion: 0.50
Nodes (5): PublicUser, StoredUser, WhitelistEntry, UserRole, WorkDepartmentId

### Community 61 - "Исправление путей к фото на сервере"
Cohesion: 0.20
Nodes (10): Альтернатива — прямо на сервере (SSH), В чём проблема, Если не работает, Исправление путей к фото на сервере, Проверка, Простой способ — с вашего Windows-ПК (как установщик), Шаг 1. Один раз обновить сервер, Шаг 2. Предпросмотр (ничего не меняет) (+2 more)

### Community 64 - "План: автообновление «как Telegram Desktop»"
Cohesion: 0.07
Nodes (30): 1.1 Зависимости и сборка (`app/`), 1.2 Клиент — `app/electron/updates.ts`, 1.3 Клиент — UI, 1.4 Клиент — IPC (`main.ts`, `preload.ts`, `vite-env.d.ts`), 1.5 Сервер — раздача артефактов, 1.6 Публикация — `upload-release.js`, 1.7 Обратная совместимость API, Edge cases (+22 more)

### Community 65 - "subsections-store.ts"
Cohesion: 0.21
Nodes (19): ensureArchiveArchivedSubsectionLocal(), ensureArchiveLostSubsectionLocal(), normalizeSupportPartyId(), rootSubsectionsForTopic(), applySubsectionsFromSync(), getSubsectionsForDepartment(), mergeSubsectionPatch(), mergeSubsectionRecords() (+11 more)

### Community 66 - "imageDisplay.ts"
Cohesion: 0.14
Nodes (18): ImageScaleDialog(), ImageScaleDialogProps, TopicMarkdownImage(), TopicMarkdownImageProps, applyDraftScale(), openImageMenu(), clampImageScale(), getImageScale() (+10 more)

### Community 67 - "usePreserveTextareaFocus"
Cohesion: 0.46
Nodes (7): shouldKeepExternalFocus(), usePreserveTextareaFocus(), clearBlurTimer(), onBlur(), onFocusIn(), restoreFocusIfNeeded(), saveSelection()

### Community 68 - "departments-store.ts"
Cohesion: 0.20
Nodes (17): applyDepartmentsFromSync(), DEFAULT_DEPARTMENTS, departmentById(), departmentFileName(), DEPARTMENTS_CONFIG_FILE, departmentsConfigPath(), ensureGuideFileForDepartment(), getActiveDepartments() (+9 more)

### Community 69 - "data.ts"
Cohesion: 0.10
Nodes (31): handleReorderSiblings(), ParentTopicField(), handleBlur(), handleInputChange(), pick(), resolveBlurSelection(), ParentTopicFieldProps, TopicLinkPicker() (+23 more)

### Community 71 - "support-sections-store.ts"
Cohesion: 0.25
Nodes (13): isPersistableSupportPartyId(), isSupportPartyValue(), applySupportSectionsFromSync(), configPath(), DEFAULT_SUPPORT_SECTIONS, defaultSupportSections(), mergeSupportSectionPatch(), readStoredSupportSections() (+5 more)

### Community 73 - "electron/updates.ts"
Cohesion: 0.12
Nodes (32): appendSessionLog(), checkForUpdates(), checkForUpdatesAuto(), checkForUpdatesLegacy(), clearPartialUpdateCache(), compareVersions(), configureAutoUpdaterFeed(), downloadLatestRelease() (+24 more)

### Community 74 - "lib/fix-media-paths.ts"
Cohesion: 0.29
Nodes (9): main(), printLine(), DbRow, DiscoveredFile, fixMediaPaths(), FixMediaPathsLine, FixMediaPathsResult, indexByBasename() (+1 more)

### Community 75 - "App.tsx"
Cohesion: 0.13
Nodes (21): defaultSync, SettingsErrorBoundary, newDraftId(), TopicEditorModal(), handlePartyChange(), handleSubmit(), TopicEditorModalProps, handlePartyChange() (+13 more)

### Community 80 - "SyncConflictModal.tsx"
Cohesion: 0.32
Nodes (4): SyncConflictModal(), SyncConflictModalProps, ConflictResolution, SyncConflictInfo

### Community 81 - "session-log.ts"
Cohesion: 0.22
Nodes (8): clearSessionLogs(), entries, getSessionLogs(), listeners, notify(), onSessionLog(), SessionLogEntry, SessionLogLevel

### Community 83 - "yandex-sync.ts"
Cohesion: 0.05
Nodes (81): AccountsData, setPendingChanges(), defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer() (+73 more)

### Community 84 - "subsections.ts"
Cohesion: 0.21
Nodes (16): allocateSubsectionId(), Client, departmentHasSubsections(), filterSubsectionsForTopicScope(), getSubsectionById(), isMissingColumn(), isMissingSubsectionsTable(), listSubsections() (+8 more)

### Community 85 - "departments.ts"
Cohesion: 0.13
Nodes (20): DepartmentListKey, DepartmentRecord, isDepartmentIdSlug(), isEditableInSettings(), isLostDepartmentId(), isMissingDepartmentsColumnError(), isTemplatesDepartmentId(), isWorkDepartmentRecord() (+12 more)

### Community 87 - "pullFromServer"
Cohesion: 0.27
Nodes (14): getDepartments(), discardLocalChanges(), emit(), finishPullStatus(), getSyncStatus(), hasUnsyncedLocalWork(), peekAndPullRemoteChanges(), pullFromServer() (+6 more)

### Community 89 - "getUserDataRoot"
Cohesion: 0.35
Nodes (10): downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc(), resolveExistingMediaAbsolutePath(), getUserDataRoot(), downloadMediaFile(), downloadMissingMedia() (+2 more)

### Community 90 - "pending-operations.ts"
Cohesion: 0.25
Nodes (13): PENDING_OPERATIONS_FILE, clearPendingOperations(), hasPendingOperations(), OperationType, opsPath(), PendingOperation, PendingOperationsData, queueOperation() (+5 more)

### Community 91 - "TopicList.tsx"
Cohesion: 0.22
Nodes (13): guideX(), highlightTitle(), ReorderDragGhost, ReorderDragSession, ReorderPending, rowMarginLeft(), TopicListProps, TreeNode() (+5 more)

### Community 92 - "Viewer.tsx"
Cohesion: 0.14
Nodes (22): handleAnswerCopy(), ImgMenuState, nodeText(), ScaleEditorState, copyImageLink(), copyTopicLink(), handleAnswerCopy(), renderTopicLink() (+14 more)

### Community 93 - "textInsert.ts"
Cohesion: 0.13
Nodes (27): highlightNbspEntities(), TextareaWithNbspButton(), handleTextareaScroll(), insertNbsp(), syncScrollFromTextarea(), TextareaWithNbspButtonProps, handleAnswerPaste(), imageOwnerPayload() (+19 more)

### Community 94 - "query"
Cohesion: 0.18
Nodes (17): query(), CLIENT_VERSION_HEADER, compareVersions(), getLatestAppReleaseVersion(), normalizeVersionLabel(), parseClientVersionHeader(), DEFAULT_SUPPORT_PHONES, formatSupportPhoneDisplay() (+9 more)

### Community 95 - "readSettings"
Cohesion: 0.31
Nodes (11): parseWindowBounds(), readSettings(), saveWindowBounds(), setAuthToken(), setLastSyncAt(), setServerUrl(), settingsPath(), setYandexToken() (+3 more)

## Knowledge Gaps
- **466 isolated node(s):** `SettingsData`, `SessionData`, `ROLE_RANK`, `DEPARTMENTS_CONFIG_FILE`, `StoredDepartment` (+461 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 573 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalizeSupportPhones()` connect `SettingsPage.tsx` to `SettingsPage`, `main.ts`, `readSettings`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `registerIpc()` connect `main.ts` to `SettingsPage.tsx`, `subsections-store.ts`, `departments-store.ts`, `paths.ts`, `support-sections-store.ts`, `server-sync.ts`, `electron/updates.ts`, `session-log.ts`, `departmentById`, `auth-store.ts`, `pullFromServer`, `getUserDataRoot`, `pending-operations.ts`, `readSettings`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `SettingsPage()` connect `SettingsPage` to `SettingsPage.tsx`, `App.tsx`, `types.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsData`, `SessionData`, `ROLE_RANK` to the rest of the system?**
  _466 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TopicList` be split into smaller, more focused modules?**
  _Cohesion score 0.10695187165775401 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11724137931034483 - nodes in this community are weakly interconnected._