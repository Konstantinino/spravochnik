# Graph Report - spravochnik-repo  (2026-09-28)

## Corpus Check
- 135 files · ~93,907 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1587 nodes · 3732 edges · 103 communities (82 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `393e7936`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ParentTopicField
- data.ts
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
- getCurrentUser
- prefs.ts
- push-yandex-restore.mjs
- focusCursor
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
- readAccounts
- clone-or-update.sh
- fix-media-paths.js
- TopicList.tsx
- deploy.sh
- install-git-hooks.sh
- setup-deploy-key.sh
- setup-rest-info-user.sh
- Исправление путей к фото на сервере
- SupportPhonesBar.tsx
- pushResolvedLocalToYandex
- План: автообновление «как Telegram Desktop»
- getUserDataRoot
- imageDisplay.ts
- Viewer.tsx
- departments-store.ts
- paths.ts
- registerIpc
- electron/updates.ts
- min-client-version.ts
- win
- auth-store.ts
- session-log.ts
- textInsert.ts
- yandex-sync.ts
- subsections.ts
- guide-merge.ts
- export-for-server.ts
- markdown.ts
- SyncConflictModal.tsx
- media.ts
- usePreserveTextareaFocus
- SettingsPage.tsx
- search.ts
- TopicEditorModal.tsx
- pushToYandex
- useTopicLinkPicker.ts
- sync-base.ts
- setPendingChanges
- waitForScrollEnd
- SettingsErrorBoundary

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 110 edges
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
- `ParentTopicFieldProps` --references--> `GuideItem`  [EXTRACTED]
  app/src/components/ParentTopicField.tsx → app/src/types.ts
- `ParentTopicField()` --indirect_call--> `compareTopicsForList()`  [INFERRED]
  app/src/components/ParentTopicField.tsx → app/src/lib/data.ts
- `TopicLinkPickerProps` --references--> `GuideItem`  [EXTRACTED]
  app/src/components/TopicLinkPicker.tsx → app/src/types.ts
- `TopicLinkPicker()` --indirect_call--> `compareTopicsForList()`  [INFERRED]
  app/src/components/TopicLinkPicker.tsx → app/src/lib/data.ts

## Import Cycles
- None detected.

## Communities (103 total, 7 thin omitted)

### Community 0 - "ParentTopicField"
Cohesion: 0.19
Nodes (12): ParentTopicField(), handleBlur(), handleInputChange(), pick(), resolveBlurSelection(), ParentTopicFieldProps, TopicLinkPicker(), TopicLinkPickerProps (+4 more)

### Community 1 - "data.ts"
Cohesion: 0.17
Nodes (18): handleReorderSiblings(), mergeSortIndexChanges(), navigateBack(), navigateToTopic(), openTopicForEditFromSidebar(), buildTree(), compareTopicsByTitle(), compareTopicsForList() (+10 more)

### Community 2 - "index.ts"
Cohesion: 0.13
Nodes (24): bumpGlobalVersion(), getPool(), query(), withTransaction(), dataDir, __dirname, main(), mediaDir (+16 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App"
Cohesion: 0.10
Nodes (23): App(), collectSortIndexChanges(), executeLocalReset(), flashReorderLockBanner(), handleEnterReorderMode(), handleInlineSave(), handleListFilterChange(), handlePush() (+15 more)

### Community 5 - "Viewer"
Cohesion: 0.10
Nodes (16): fileExtLabel(), nodeText(), Viewer(), cancelEditing(), closeFind(), closeScaleEditor(), downloadImage(), handleParentIdChange() (+8 more)

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
Cohesion: 0.18
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

### Community 16 - "admin.ts"
Cohesion: 0.13
Nodes (31): CONTENT_EDITOR_ROLES, generateSalt(), hashPassword(), isOwnerEmail(), isOwnerRole(), isUserRole(), isWorkDepartmentId(), JwtUser (+23 more)

### Community 17 - "devDependencies"
Cohesion: 0.05
Nodes (42): cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cors, express (+34 more)

### Community 18 - "getCurrentUser"
Cohesion: 0.29
Nodes (8): clearEphemeralSessionOnStartup(), clearSession(), getCurrentUser(), requireRole(), sessionPath(), requireEditDepartment(), canEditDepartment(), isStaffRole()

### Community 19 - "prefs.ts"
Cohesion: 0.16
Nodes (16): AuthScreen(), forgetSavedLogin(), handleSubmit(), ServerUrlForm(), findRememberedLogin(), isDepartmentId(), loadRememberedLogin(), loadRememberedLogins() (+8 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "focusCursor"
Cohesion: 0.32
Nodes (12): handleAnswerPaste(), imageOwnerPayload(), insertFile(), insertPhoto(), handleAnswerPaste(), insertFile(), insertPhoto(), escapeMdLinkLabel() (+4 more)

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
Nodes (39): handleAuthenticated(), handleDepartmentChange(), defaultSync, resolveListFilter(), resolveUserDepartment(), Header(), Search(), SearchProps (+31 more)

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
Cohesion: 0.12
Nodes (29): applyClientTopicLink(), attachWindowBoundsPersistence(), attachWindowsInputFixes(), createWindow(), isWindowBoundsVisible(), loadSavedWindowBounds(), normalizeClientTopicId(), persistWindowBounds() (+21 more)

### Community 39 - "lib/media-layout.ts"
Cohesion: 0.13
Nodes (32): main(), printLine(), DbRow, DiscoveredFile, discoverMediaFilesOnDisk(), consider(), walk(), fixMediaPaths() (+24 more)

### Community 40 - "departments.ts"
Cohesion: 0.13
Nodes (20): DepartmentListKey, DepartmentRecord, isDepartmentIdSlug(), isEditableInSettings(), isLostDepartmentId(), isMissingDepartmentsColumnError(), isTemplatesDepartmentId(), isWorkDepartmentRecord() (+12 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.08
Nodes (57): AccountsData, reconcileHasChildren(), departmentById(), DepartmentId, getDepartments(), PENDING_OPERATIONS_FILE, clearPendingOperations(), hasPendingOperations() (+49 more)

### Community 42 - "Deploy keys (REST INFO)"
Cohesion: 0.40
Nodes (4): Deploy keys (REST INFO), GitHub, Дополнительная защита на сервере, Что здесь

### Community 43 - "SettingsPage"
Cohesion: 0.09
Nodes (31): assignableRoles(), coerceUsers(), coerceWhitelist(), formatBytes(), formatDepartmentApiError(), formatLogLine(), formatLogTime(), levelLabel() (+23 more)

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

### Community 51 - "readAccounts"
Cohesion: 0.16
Nodes (36): addWhitelistEmail(), coerceAccountsData(), deleteUser(), ensureLocalOwner(), findOwner(), getOwnerEmail(), getRegistrationDepartment(), getWhitelist() (+28 more)

### Community 54 - "fix-media-paths.js"
Cohesion: 0.33
Nodes (6): apply, args, main(), positional, printLine(), serverUrl

### Community 56 - "TopicList.tsx"
Cohesion: 0.11
Nodes (27): autoScrollContainer(), findScrollParent(), groupRootsByPartySections(), groupRootsBySubsections(), guideX(), highlightTitle(), isRowVisibleInScroll(), renderTreeNode() (+19 more)

### Community 61 - "Исправление путей к фото на сервере"
Cohesion: 0.20
Nodes (10): Альтернатива — прямо на сервере (SSH), В чём проблема, Если не работает, Исправление путей к фото на сервере, Проверка, Простой способ — с вашего Windows-ПК (как установщик), Шаг 1. Один раз обновить сервер, Шаг 2. Предпросмотр (ничего не меняет) (+2 more)

### Community 62 - "SupportPhonesBar.tsx"
Cohesion: 0.32
Nodes (10): saveSupportPhones(), copyText(), SupportPhonesBar(), handleCopy(), SupportPhonesBarProps, DEFAULT_SUPPORT_PHONES, formatSupportPhoneDisplay(), normalizeSupportPhones() (+2 more)

### Community 63 - "pushResolvedLocalToYandex"
Cohesion: 0.24
Nodes (18): deleteRemoteFile(), discardLocalChanges(), downloadRemoteFile(), emit(), ensureRemoteDir(), ensureRemoteFolder(), ensureRemoteMediaFolder(), folderPath() (+10 more)

### Community 64 - "План: автообновление «как Telegram Desktop»"
Cohesion: 0.07
Nodes (30): 1.1 Зависимости и сборка (`app/`), 1.2 Клиент — `app/electron/updates.ts`, 1.3 Клиент — UI, 1.4 Клиент — IPC (`main.ts`, `preload.ts`, `vite-env.d.ts`), 1.5 Сервер — раздача артефактов, 1.6 Публикация — `upload-release.js`, 1.7 Обратная совместимость API, Edge cases (+22 more)

### Community 65 - "getUserDataRoot"
Cohesion: 0.14
Nodes (23): ensureDataReady(), getSeedDataDir(), getUserDataRoot(), require, downloadMediaFile(), downloadMissingMedia(), ensureMediaFilesDownloaded(), ensureTopicMediaDownloaded() (+15 more)

### Community 66 - "imageDisplay.ts"
Cohesion: 0.14
Nodes (18): ImageScaleDialog(), ImageScaleDialogProps, TopicMarkdownImage(), TopicMarkdownImageProps, applyDraftScale(), openImageMenu(), clampImageScale(), getImageScale() (+10 more)

### Community 67 - "Viewer.tsx"
Cohesion: 0.18
Nodes (12): newDraftId(), TopicEditorModal(), handleParentIdChange(), ImgMenuState, ScaleEditorState, filterTopicsForClientLinkPicker(), filterTopicsForLinkPicker(), filterTopicsForParentPicker() (+4 more)

### Community 68 - "departments-store.ts"
Cohesion: 0.20
Nodes (17): applyDepartmentsFromSync(), DEFAULT_DEPARTMENTS, departmentById(), departmentFileName(), DEPARTMENTS_CONFIG_FILE, departmentsConfigPath(), ensureGuideFileForDepartment(), getActiveDepartments() (+9 more)

### Community 69 - "paths.ts"
Cohesion: 0.12
Nodes (15): APP_UPDATE_FILE, BOOTSTRAP_ADMIN_EMAIL, canEditContent(), CONTENT_EDITOR_ROLES, Department, DEPARTMENTS, isUserRole(), LOST_DEPARTMENT_ID (+7 more)

### Community 71 - "registerIpc"
Cohesion: 0.10
Nodes (38): asSupportParty(), fetchAdminUsersFromServer(), readGuideFile(), refreshDeptTopicOrderFromServer(), registerIpc(), putUser(), writeGuideFile(), AdminDepartmentDto (+30 more)

### Community 73 - "electron/updates.ts"
Cohesion: 0.14
Nodes (28): checkForUpdates(), checkForUpdatesAuto(), checkForUpdatesLegacy(), clearPartialUpdateCache(), configureAutoUpdaterFeed(), downloadLatestRelease(), downloadUpdate(), electronUpdaterCacheDir() (+20 more)

### Community 74 - "min-client-version.ts"
Cohesion: 0.44
Nodes (8): CLIENT_VERSION_HEADER, compareVersions(), getLatestAppReleaseVersion(), normalizeVersionLabel(), parseClientVersionHeader(), blockWritesIfClientOutdated(), requireCurrentClientVersion(), requiredClientVersion()

### Community 75 - "win"
Cohesion: 0.50
Nodes (4): win, artifactName, icon, target

### Community 80 - "auth-store.ts"
Cohesion: 0.15
Nodes (27): accountsPath(), defaultAccounts(), defaultSettings(), ensureAuthFiles(), normalizeServerUrl(), parseWindowBounds(), PublicUser, readSettings() (+19 more)

### Community 81 - "session-log.ts"
Cohesion: 0.22
Nodes (8): clearSessionLogs(), entries, getSessionLogs(), listeners, notify(), onSessionLog(), SessionLogEntry, SessionLogLevel

### Community 82 - "textInsert.ts"
Cohesion: 0.20
Nodes (14): highlightNbspEntities(), TextareaWithNbspButton(), handleTextareaScroll(), insertNbsp(), syncScrollFromTextarea(), TextareaWithNbspButtonProps, copyTopicLink(), formatTopicMarkdownLink() (+6 more)

### Community 83 - "yandex-sync.ts"
Cohesion: 0.12
Nodes (18): acquireSyncLock(), ConflictResolution, currentStatus, getSyncStatus(), listeners, lockExpired(), pendingConflicts, pendingMergedByFile (+10 more)

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
Cohesion: 0.26
Nodes (10): handleAnswerCopy(), copyImageLink(), handleAnswerCopy(), formatSharedImageMarkdown(), IMAGE_STORAGE_PATH_RE, isAllowedMarkdownImageSrc(), markdownForDisplay(), parseImageRefFromClipboard() (+2 more)

### Community 88 - "SyncConflictModal.tsx"
Cohesion: 0.32
Nodes (4): SyncConflictModal(), SyncConflictModalProps, ConflictResolution, SyncConflictInfo

### Community 89 - "media.ts"
Cohesion: 0.21
Nodes (9): canEditContent(), canEditDepartment(), isStaffRole(), requireRole(), ensureMediaDir(), ensureUpdatesDir(), mediaRouter, upload (+1 more)

### Community 90 - "usePreserveTextareaFocus"
Cohesion: 0.46
Nodes (7): shouldKeepExternalFocus(), usePreserveTextareaFocus(), clearBlurTimer(), onBlur(), onFocusIn(), restoreFocusIfNeeded(), saveSelection()

### Community 91 - "SettingsPage.tsx"
Cohesion: 0.19
Nodes (20): AuthScreenProps, HeaderProps, SettingsPageProps, SUPPORT_PHONES_PLACEMENT, SupportPhonesPlacement, AdminDepartment, Department, GuideFile (+12 more)

### Community 92 - "search.ts"
Cohesion: 0.27
Nodes (9): getItemPath(), topicLabelWithPath(), buildTopicSearchFilter(), SearchHit, searchItems(), splitSearchTokens(), textHasAllTokens(), TopicSearchFilter (+1 more)

### Community 93 - "TopicEditorModal.tsx"
Cohesion: 0.36
Nodes (9): TopicEditorModalProps, TopicListProps, ViewerProps, DepartmentId, DepartmentSubsection, GuideItem, SUPPORT_PARTIES, SUPPORT_PARTY_LABELS (+1 more)

### Community 94 - "pushToYandex"
Cohesion: 0.33
Nodes (9): listKeyForFile(), mergeGuidesWithRemote(), patchBaseForResolutions(), previewText(), pushToYandex(), readLocalJson(), resolveSyncConflicts(), toConflictInfo() (+1 more)

### Community 95 - "useTopicLinkPicker.ts"
Cohesion: 0.46
Nodes (6): TopicLinkPickerState, useTopicLinkPicker(), clampPickerPosition(), getTextareaCaretRect(), getActivePlusQuery(), replaceRangeWithTopicLink()

### Community 99 - "sync-base.ts"
Cohesion: 0.57
Nodes (6): baseDir(), basePathFor(), readBaseGuide(), writeAllGuideBasesFromLocal(), writeBaseFromLocalFile(), writeBaseGuide()

### Community 100 - "setPendingChanges"
Cohesion: 0.40
Nodes (5): setPendingChanges(), discardLocalChanges(), markLocalChange(), markOfflinePending(), markLocalChange()

### Community 101 - "waitForScrollEnd"
Cohesion: 0.83
Nodes (4): waitForScrollEnd(), finish(), onScroll(), onScrollEnd()

## Knowledge Gaps
- **455 isolated node(s):** `SettingsData`, `SessionData`, `ROLE_RANK`, `DEPARTMENTS_CONFIG_FILE`, `StoredDepartment` (+450 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 562 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalizeSupportPhones()` connect `SupportPhonesBar.tsx` to `main.ts`, `registerIpc`, `SettingsPage`, `auth-store.ts`, `SettingsPage.tsx`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `getUserDataRoot()` connect `getUserDataRoot` to `sync-base.ts`, `departments-store.ts`, `main.ts`, `topic-media.ts`, `registerIpc`, `paths.ts`, `server-sync.ts`, `electron/updates.ts`, `auth-store.ts`, `getCurrentUser`, `readAccounts`, `yandex-sync.ts`, `export-for-server.ts`, `pushToYandex`, `pushResolvedLocalToYandex`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `registerIpc()` connect `registerIpc` to `getUserDataRoot`, `departments-store.ts`, `main.ts`, `topic-media.ts`, `server-sync.ts`, `electron/updates.ts`, `auth-store.ts`, `session-log.ts`, `getCurrentUser`, `readAccounts`, `SupportPhonesBar.tsx`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsData`, `SessionData`, `ROLE_RANK` to the rest of the system?**
  _455 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13054187192118227 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._