# Graph Report - spravochnik-repo  (2026-09-28)

## Corpus Check
- 136 files · ~95,024 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1601 nodes · 3787 edges · 100 communities (79 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `04b6274e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
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
- admin.ts
- devDependencies
- data.ts
- prefs.ts
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
- departments.ts
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
- media-download.ts
- deploy.sh
- install-git-hooks.sh
- setup-deploy-key.sh
- setup-rest-info-user.sh
- Исправление путей к фото на сервере
- План: автообновление «как Telegram Desktop»
- subsections-store.ts
- Viewer.tsx
- usePreserveTextareaFocus
- departments-store.ts
- SupportPhonesBar.tsx
- registerIpc
- electron/updates.ts
- media.ts
- paths.ts
- getUserDataRoot
- session-log.ts
- departmentById
- yandex-sync.ts
- subsections.ts
- TopicEditorModal.tsx
- markdown.ts
- guide-merge.ts
- export-for-server.ts
- textInsert.ts
- getCurrentUser
- electron/media-layout.ts
- pending-media.ts
- resolveImageStorageRef
- cleanupTopicFileOrphans
- SyncConflictModal.tsx
- cacheServerUser
- ensureUpdateDownloaded

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 113 edges
2. `getUserDataRoot()` - 58 edges
3. `readSettings()` - 48 edges
4. `App()` - 47 edges
5. `Viewer()` - 46 edges
6. `SettingsPage()` - 39 edges
7. `readAccounts()` - 29 edges
8. `pullFromServer()` - 28 edges
9. `serverFetch()` - 25 edges
10. `TopicList()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `openEditUser()` --calls--> `normalizeWorkDepartmentId()`  [EXTRACTED]
  app/src/components/SettingsPage.tsx → app/src/types.ts
- `handleParentIdChange()` --calls--> `getItemParty()`  [EXTRACTED]
  app/src/components/Viewer.tsx → app/src/lib/data.ts
- `SearchHit` --references--> `GuideItem`  [EXTRACTED]
  app/src/lib/search.ts → app/src/types.ts
- `accountsPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts
- `settingsPath()` --calls--> `getUserDataRoot()`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts

## Import Cycles
- None detected.

## Communities (100 total, 6 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.13
Nodes (21): handleAuthenticated(), handleDepartmentChange(), defaultSync, resolveListFilter(), resolveUserDepartment(), SettingsErrorBoundary, Header(), Search() (+13 more)

### Community 1 - "TopicList.tsx"
Cohesion: 0.08
Nodes (43): autoScrollContainer(), deptLevelSubsections(), findScrollParent(), groupRootsByPartySections(), groupRootsBySubsections(), guideX(), highlightTitle(), isRowVisibleInScroll() (+35 more)

### Community 2 - "index.ts"
Cohesion: 0.12
Nodes (28): getPool(), query(), withTransaction(), dataDir, __dirname, main(), mediaDir, root (+20 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App"
Cohesion: 0.08
Nodes (32): App(), collectSortIndexChanges(), executeLocalReset(), flashReorderLockBanner(), handleEnterReorderMode(), handleInlineSave(), handleListFilterChange(), handlePush() (+24 more)

### Community 5 - "Viewer"
Cohesion: 0.09
Nodes (18): fileExtLabel(), nodeText(), Viewer(), cancelEditing(), closeFind(), closeScaleEditor(), downloadImage(), handleParentIdChange() (+10 more)

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
Cohesion: 0.18
Nodes (11): build, appId, directories, executableName, extraResources, files, productName, publish (+3 more)

### Community 10 - "REST INFO — инструкция для AI-агента"
Cohesion: 0.11
Nodes (18): graphify, Linux / production, REST INFO — инструкция для AI-агента, UI (`app/src/components/` + `lib/`), Windows (машина пользователя), Архитектура v2 (текущая), Версии, Владелец / bootstrap (+10 more)

### Community 11 - "routes/topics.ts"
Cohesion: 0.16
Nodes (21): getGlobalVersion(), getDepartmentById(), isValidDepartmentId(), subsectionToClient(), acquireTopicLock(), acquireTopicOrderLock(), isSupportParty(), normalizeSupportParty() (+13 more)

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
Cohesion: 0.12
Nodes (32): canEditContent(), canEditDepartment(), CONTENT_EDITOR_ROLES, hashPassword(), isOwnerEmail(), isOwnerRole(), isStaffRole(), isUserRole() (+24 more)

### Community 17 - "devDependencies"
Cohesion: 0.05
Nodes (42): cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cors, express (+34 more)

### Community 18 - "data.ts"
Cohesion: 0.12
Nodes (26): ParentTopicField(), handleBlur(), handleInputChange(), pick(), resolveBlurSelection(), ParentTopicFieldProps, TopicLinkPicker(), TopicLinkPickerProps (+18 more)

### Community 19 - "prefs.ts"
Cohesion: 0.17
Nodes (15): AuthScreen(), forgetSavedLogin(), handleSubmit(), ServerUrlForm(), findRememberedLogin(), isDepartmentId(), loadRememberedLogin(), loadRememberedLogins() (+7 more)

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
Cohesion: 0.08
Nodes (44): AuthScreenProps, HeaderProps, assignableRoles(), formatBytes(), SettingsPageProps, SUPPORT_PHONES_PLACEMENT, SupportPhonesPlacement, AdminDepartment (+36 more)

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
Nodes (38): PublicUser, StoredUser, WhitelistEntry, applyClientTopicLink(), attachWindowBoundsPersistence(), attachWindowsInputFixes(), createWindow(), isWindowBoundsVisible() (+30 more)

### Community 39 - "lib/media-layout.ts"
Cohesion: 0.12
Nodes (32): bumpGlobalVersion(), main(), printLine(), DbRow, DiscoveredFile, discoverMediaFilesOnDisk(), consider(), walk() (+24 more)

### Community 40 - "departments.ts"
Cohesion: 0.13
Nodes (20): DepartmentListKey, DepartmentRecord, isDepartmentIdSlug(), isEditableInSettings(), isLostDepartmentId(), isMissingDepartmentsColumnError(), isTemplatesDepartmentId(), isWorkDepartmentRecord() (+12 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.10
Nodes (42): AccountsData, setPendingChanges(), applyDepartmentsFromSync(), ensureGuideFileForDepartment(), getDepartments(), PENDING_OPERATIONS_FILE, clearPendingOperations(), hasPendingOperations() (+34 more)

### Community 42 - "Deploy keys (REST INFO)"
Cohesion: 0.40
Nodes (4): Deploy keys (REST INFO), GitHub, Дополнительная защита на сервере, Что здесь

### Community 43 - "SettingsPage"
Cohesion: 0.10
Nodes (26): coerceUsers(), coerceWhitelist(), formatLogLine(), formatLogTime(), formatTopicSectionsApiError(), levelLabel(), SettingsPage(), addEmail() (+18 more)

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

### Community 50 - "support-phones.ts"
Cohesion: 0.26
Nodes (9): DEFAULT_SUPPORT_PHONES, formatSupportPhoneDisplay(), normalizeSupportPhones(), normalizeTelDigits(), readSupportPhonesFromDb(), SUPPORT_PHONES_SYNC_KEY, SupportPhoneLine, writeSupportPhonesToDb() (+1 more)

### Community 51 - "auth-store.ts"
Cohesion: 0.14
Nodes (45): accountsPath(), addWhitelistEmail(), coerceAccountsData(), defaultAccounts(), defaultSettings(), deleteUser(), ensureAuthFiles(), ensureLocalOwner() (+37 more)

### Community 54 - "fix-media-paths.js"
Cohesion: 0.33
Nodes (6): apply, args, main(), positional, printLine(), serverUrl

### Community 56 - "media-download.ts"
Cohesion: 0.43
Nodes (5): downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc(), electron

### Community 61 - "Исправление путей к фото на сервере"
Cohesion: 0.20
Nodes (10): Альтернатива — прямо на сервере (SSH), В чём проблема, Если не работает, Исправление путей к фото на сервере, Проверка, Простой способ — с вашего Windows-ПК (как установщик), Шаг 1. Один раз обновить сервер, Шаг 2. Предпросмотр (ничего не меняет) (+2 more)

### Community 64 - "План: автообновление «как Telegram Desktop»"
Cohesion: 0.07
Nodes (30): 1.1 Зависимости и сборка (`app/`), 1.2 Клиент — `app/electron/updates.ts`, 1.3 Клиент — UI, 1.4 Клиент — IPC (`main.ts`, `preload.ts`, `vite-env.d.ts`), 1.5 Сервер — раздача артефактов, 1.6 Публикация — `upload-release.js`, 1.7 Обратная совместимость API, Edge cases (+22 more)

### Community 65 - "subsections-store.ts"
Cohesion: 0.21
Nodes (16): rootSubsectionsForTopic(), applySubsectionsFromSync(), getSubsectionsForDepartment(), isStoredSupportParty(), mergeSubsectionPatch(), mergeSubsectionsLists(), normalizeStoredSubsection(), readStoredSubsections() (+8 more)

### Community 66 - "Viewer.tsx"
Cohesion: 0.13
Nodes (23): ImageScaleDialog(), ImageScaleDialogProps, TopicEditorModalProps, TopicMarkdownImage(), TopicMarkdownImageProps, ImgMenuState, ScaleEditorState, applyDraftScale() (+15 more)

### Community 67 - "usePreserveTextareaFocus"
Cohesion: 0.46
Nodes (7): shouldKeepExternalFocus(), usePreserveTextareaFocus(), clearBlurTimer(), onBlur(), onFocusIn(), restoreFocusIfNeeded(), saveSelection()

### Community 68 - "departments-store.ts"
Cohesion: 0.20
Nodes (15): DEFAULT_DEPARTMENTS, departmentById(), departmentFileName(), DEPARTMENTS_CONFIG_FILE, departmentsConfigPath(), getActiveDepartments(), LOST_DEPARTMENT_ID, mergeDepartmentPatch() (+7 more)

### Community 69 - "SupportPhonesBar.tsx"
Cohesion: 0.32
Nodes (10): saveSupportPhones(), copyText(), SupportPhonesBar(), handleCopy(), SupportPhonesBarProps, DEFAULT_SUPPORT_PHONES, formatSupportPhoneDisplay(), normalizeSupportPhones() (+2 more)

### Community 71 - "registerIpc"
Cohesion: 0.10
Nodes (37): normalizeServerUrl(), asSupportParty(), inferSubsectionsFromLocalGuides(), readGuideFile(), refreshDeptTopicOrderFromServer(), registerIpc(), cacheSupportPhones(), putUser() (+29 more)

### Community 73 - "electron/updates.ts"
Cohesion: 0.13
Nodes (27): ensureDataReady(), APP_UPDATE_FILE, checkForUpdates(), checkForUpdatesAuto(), checkForUpdatesLegacy(), clearPartialUpdateCache(), compareVersions(), configureAutoUpdaterFeed() (+19 more)

### Community 74 - "media.ts"
Cohesion: 0.22
Nodes (12): CLIENT_VERSION_HEADER, compareVersions(), getLatestAppReleaseVersion(), normalizeVersionLabel(), parseClientVersionHeader(), requireRole(), blockWritesIfClientOutdated(), requireCurrentClientVersion() (+4 more)

### Community 75 - "paths.ts"
Cohesion: 0.11
Nodes (18): BOOTSTRAP_ADMIN_EMAIL, canEditContent(), CONTENT_EDITOR_ROLES, Department, DepartmentId, DEPARTMENTS, getSeedDataDir(), isUserRole() (+10 more)

### Community 80 - "getUserDataRoot"
Cohesion: 0.25
Nodes (14): resolveExistingMediaAbsolutePath(), getUserDataRoot(), baseUrl(), downloadMediaFile(), isServerReachable(), ServerApiError, uploadMediaFile(), downloadMissingMedia() (+6 more)

### Community 81 - "session-log.ts"
Cohesion: 0.22
Nodes (8): clearSessionLogs(), entries, getSessionLogs(), listeners, notify(), onSessionLog(), SessionLogEntry, SessionLogLevel

### Community 82 - "departmentById"
Cohesion: 0.22
Nodes (16): reconcileHasChildren(), departmentById(), applyTopicToLocal(), ensureRequestedClientLinkPersisted(), ensureRequestedPartyPersisted(), isAdditionalParty(), isSupportPartyValue(), mergeTopicAfterPush() (+8 more)

### Community 83 - "yandex-sync.ts"
Cohesion: 0.09
Nodes (57): parseWindowBounds(), readSettings(), applyConflictResolutions(), DATA_FILES, baseDir(), basePathFor(), readBaseGuide(), writeAllGuideBasesFromLocal() (+49 more)

### Community 84 - "subsections.ts"
Cohesion: 0.20
Nodes (17): allocateSubsectionId(), Client, departmentHasSubsections(), filterSubsectionsForTopicScope(), getSubsectionById(), isMissingPartyColumn(), isMissingSubsectionsTable(), listSubsections() (+9 more)

### Community 85 - "TopicEditorModal.tsx"
Cohesion: 0.18
Nodes (19): newDraftId(), TopicEditorModal(), handleAnswerPaste(), handleParentIdChange(), imageOwnerPayload(), insertFile(), insertPhoto(), handleAnswerPaste() (+11 more)

### Community 86 - "markdown.ts"
Cohesion: 0.17
Nodes (17): handleAnswerCopy(), copyImageLink(), copyTopicLink(), handleAnswerCopy(), getImageScaleForTopicImage(), canonicalImageStoragePath(), escapeMdLinkLabel(), formatSharedImageMarkdown() (+9 more)

### Community 87 - "guide-merge.ts"
Cohesion: 0.27
Nodes (12): asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic, mergeGuideFile(), MergeGuideResult, sortValue() (+4 more)

### Community 88 - "export-for-server.ts"
Cohesion: 0.24
Nodes (10): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+2 more)

### Community 89 - "textInsert.ts"
Cohesion: 0.19
Nodes (15): highlightNbspEntities(), TextareaWithNbspButton(), handleTextareaScroll(), insertNbsp(), syncScrollFromTextarea(), TextareaWithNbspButtonProps, TopicLinkPickerState, useTopicLinkPicker() (+7 more)

### Community 90 - "getCurrentUser"
Cohesion: 0.29
Nodes (8): clearEphemeralSessionOnStartup(), clearSession(), getCurrentUser(), requireRole(), sessionPath(), requireEditDepartment(), canEditDepartment(), isStaffRole()

### Community 91 - "electron/media-layout.ts"
Cohesion: 0.26
Nodes (14): resolveImageOwner(), absFromRoot(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT, departmentIdFromMediaPath(), isMediaDepartmentId(), MEDIA_DEPARTMENT_IDS, MediaDepartmentId (+6 more)

### Community 92 - "pending-media.ts"
Cohesion: 0.39
Nodes (11): clearPendingMedia(), hasPendingMedia(), normalizeRel(), PendingMedia, pendingPath(), queueMediaRemoteDelete(), queueMediaUpload(), readPendingMedia() (+3 more)

### Community 93 - "resolveImageStorageRef"
Cohesion: 0.35
Nodes (11): topicImageRelativePath(), cleanupTopicImageOrphans(), collectAllReferencedImageStoragePaths(), collectReferencedImageBasenames(), extractImageRefsFromMarkdown(), imagesBasename(), isReferencedImageOnDisk(), mediaImagePathsFromTopic() (+3 more)

### Community 94 - "cleanupTopicFileOrphans"
Cohesion: 0.39
Nodes (8): topicFileRelativePath(), cleanupTopicFileOrphans(), collectAllReferencedFileStoragePaths(), collectReferencedFileBasenames(), extractFileRefsFromMarkdown(), filesBasename(), isReferencedFileOnDisk(), mediaFilePathsFromTopic()

### Community 95 - "SyncConflictModal.tsx"
Cohesion: 0.32
Nodes (4): SyncConflictModal(), SyncConflictModalProps, ConflictResolution, SyncConflictInfo

### Community 96 - "cacheServerUser"
Cohesion: 0.40
Nodes (6): cacheServerUser(), fetchAdminUsersFromServer(), publicUsersFromServer(), roleFromServerUser(), isWorkDepartmentId(), parseUserRole()

### Community 97 - "ensureUpdateDownloaded"
Cohesion: 0.33
Nodes (6): downloadUpdate(), ensureUpdateDownloaded(), getUpdateStatus(), installUpdate(), onUpdateStatus(), waitForUpdateDownloaded()

## Knowledge Gaps
- **455 isolated node(s):** `SettingsData`, `SessionData`, `ROLE_RANK`, `DEPARTMENTS_CONFIG_FILE`, `StoredDepartment` (+450 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 562 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalizeSupportPhones()` connect `SupportPhonesBar.tsx` to `SettingsPage`, `types.ts`, `main.ts`, `registerIpc`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `registerIpc()` connect `registerIpc` to `topic-media.ts`, `main.ts`, `server-sync.ts`, `auth-store.ts`, `media-download.ts`, `subsections-store.ts`, `departments-store.ts`, `SupportPhonesBar.tsx`, `electron/updates.ts`, `getUserDataRoot`, `session-log.ts`, `departmentById`, `yandex-sync.ts`, `getCurrentUser`, `electron/media-layout.ts`, `pending-media.ts`, `resolveImageStorageRef`, `cleanupTopicFileOrphans`, `cacheServerUser`, `ensureUpdateDownloaded`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `getUserDataRoot()` connect `getUserDataRoot` to `cacheServerUser`, `subsections-store.ts`, `media-download.ts`, `departments-store.ts`, `main.ts`, `topic-media.ts`, `registerIpc`, `server-sync.ts`, `electron/updates.ts`, `paths.ts`, `departmentById`, `auth-store.ts`, `yandex-sync.ts`, `export-for-server.ts`, `getCurrentUser`, `electron/media-layout.ts`, `pending-media.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsData`, `SessionData`, `ROLE_RANK` to the rest of the system?**
  _455 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1282051282051282 - nodes in this community are weakly interconnected._
- **Should `TopicList.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07653061224489796 - nodes in this community are weakly interconnected._