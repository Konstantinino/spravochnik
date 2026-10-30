# Graph Report - spravochnik-repo  (2026-10-30)

## Corpus Check
- 180 files · ~129,978 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2135 nodes · 5298 edges · 109 communities (79 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4da27efb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- SupportEmailsBar.tsx
- TopicList
- lib/media-layout.ts
- compilerOptions
- App.tsx
- paths.ts
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
- prefs.ts
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
- AGENTS.md
- REST INFO — изолированный пользователь на сервере
- Чеклист тестирования REST INFO v2
- REST INFO — клиент (Electron)
- upload-release.js
- data.ts
- legacy/README.md
- index.ts
- admin.ts
- server-sync.ts
- Deploy keys (REST INFO)
- SettingsPage
- app/package.json
- nsis
- dependencies
- scripts
- 001_initial.sql
- SupportPhonesBar.tsx
- auth-store.ts
- clone-or-update.sh
- fix-media-paths.js
- Viewer
- deploy.sh
- install-git-hooks.sh
- setup-deploy-key.sh
- setup-rest-info-user.sh
- Исправление путей к фото на сервере
- REST INFO — план веб-версии
- compilerOptions
- План: автообновление «как Telegram Desktop»
- SettingsPage.tsx
- main.ts
- subsections-store.ts
- archive-lost.ts
- Viewer.tsx
- archiveLost.ts
- electron/updates.ts
- getUserDataRoot
- TopicEditorModal.tsx
- markdown.ts
- guide-merge.ts
- 012_support_sections_archive_lost.sql
- yandex-sync.ts
- subsections.ts
- departments-store.ts
- query-subsections.mjs
- TopicEditorModal
- media.ts
- usePreserveTextareaFocus
- support-sections-store.ts
- readSettings
- export-for-server.ts
- pending-operations.ts
- support-sections.ts
- TopicSectionDraggableLi
- normalizeWorkDepartmentId
- REST INFO — веб-клиент
- web/vite.config.ts
- registerIpc

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 148 edges
2. `Viewer()` - 66 edges
3. `getUserDataRoot()` - 61 edges
4. `SettingsPage()` - 61 edges
5. `App()` - 55 edges
6. `readSettings()` - 50 edges
7. `TopicEditorModal()` - 37 edges
8. `pullFromServer()` - 34 edges
9. `query()` - 34 edges
10. `readAccounts()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `resolveMediaHttpUrl()` --calls--> `canonicalImageStoragePath()`  [EXTRACTED]
  web/src/platform/browser-spravochnik.ts → app/src/lib/markdown.ts
- `SearchProps` --references--> `TopicViewFilter`  [EXTRACTED]
  app/src/components/Search.tsx → app/src/types.ts
- `SupportContactBarsProps` --references--> `DepartmentId`  [EXTRACTED]
  app/src/components/SupportContactBars.tsx → app/src/types.ts
- `openImageMenu()` --calls--> `normalizeImageDisplayKey()`  [EXTRACTED]
  app/src/components/Viewer.tsx → app/src/lib/imageDisplay.ts
- `copyImageLink()` --calls--> `formatSharedImageMarkdown()`  [EXTRACTED]
  app/src/components/Viewer.tsx → app/src/lib/markdown.ts

## Import Cycles
- None detected.

## Communities (109 total, 11 thin omitted)

### Community 0 - "SupportEmailsBar.tsx"
Cohesion: 0.16
Nodes (21): saveSupportEmails(), copyText(), SupportEmailsBar(), applyStore(), handleCopy(), renderItem(), SupportEmailsBarProps, DEFAULT_SUPPORT_EMAILS (+13 more)

### Community 1 - "TopicList"
Cohesion: 0.12
Nodes (28): autoScrollContainer(), findScrollParent(), groupRootsBySubsections(), isDeptSectionFilter(), isRowVisibleInScroll(), renderTreeNode(), scrollRowToListCenter(), sortSubsections() (+20 more)

### Community 2 - "lib/media-layout.ts"
Cohesion: 0.10
Nodes (50): main(), printLine(), DbRow, DiscoveredFile, discoverMediaFilesOnDisk(), consider(), walk(), fixMediaPaths() (+42 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App.tsx"
Cohesion: 0.07
Nodes (42): App(), alignListFilterForTopic(), collectSortIndexChanges(), executeLocalReset(), flashReorderLockBanner(), handleEnterReorderMode(), handleInlineSave(), handleListFilterChange() (+34 more)

### Community 5 - "paths.ts"
Cohesion: 0.07
Nodes (35): PublicUser, StoredUser, WhitelistEntry, ensureDataReady(), APP_UPDATE_FILE, BOOTSTRAP_ADMIN_EMAIL, canEditContent(), canEditDepartment() (+27 more)

### Community 6 - "topic-media.ts"
Cohesion: 0.07
Nodes (65): downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc(), absFromRoot(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT, departmentIdFromMediaPath() (+57 more)

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
Cohesion: 0.08
Nodes (24): graphify — навигация по коду (не часть runtime), Linux / production, REST INFO — инструкция для AI-агента, UI (`app/src/components/` + `lib/`), Windows (машина пользователя), Архитектура v2 (текущая), Версии, Владелец / bootstrap (+16 more)

### Community 11 - "routes/topics.ts"
Cohesion: 0.08
Nodes (43): getGlobalVersion(), DepartmentListKey, DepartmentRecord, getDepartmentById(), isDepartmentIdSlug(), isEditableInSettings(), isLostDepartmentId(), isMissingDepartmentsColumnError() (+35 more)

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
Nodes (37): canEditContent(), canEditDepartment(), CONTENT_EDITOR_ROLES, generateSalt(), hashPassword(), isOwnerEmail(), isOwnerRole(), isStaffRole() (+29 more)

### Community 17 - "devDependencies"
Cohesion: 0.04
Nodes (46): cookie-parser, cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cookie-parser (+38 more)

### Community 18 - "browser-spravochnik.ts"
Cohesion: 0.06
Nodes (63): SupportParty, ApiError, apiFetch(), hasConfiguredServer(), INVALID_SERVER_URL_MESSAGE, uploadMediaFile(), validateServerUrl(), WEB_CLIENT_VERSION (+55 more)

### Community 19 - "web/package.json"
Cohesion: 0.07
Nodes (29): dependencies, react, react-dom, react-markdown, remark-gfm, description, devDependencies, @types/react (+21 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "prefs.ts"
Cohesion: 0.13
Nodes (21): handleAuthenticated(), resolveListFilter(), resolveUserDepartment(), AuthScreen(), forgetSavedLogin(), handleSubmit(), ServerUrlForm(), findRememberedLogin() (+13 more)

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
Cohesion: 0.07
Nodes (47): handleDepartmentChange(), AuthScreenProps, Header(), HeaderProps, SupportContactBars(), SupportContactBarsProps, SyncConflictModal(), SyncConflictModalProps (+39 more)

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

### Community 37 - "data.ts"
Cohesion: 0.06
Nodes (54): handleReorderSiblings(), ParentTopicField(), handleBlur(), handleInputChange(), pick(), resolveBlurSelection(), ParentTopicFieldProps, TopicLinkPicker() (+46 more)

### Community 39 - "index.ts"
Cohesion: 0.11
Nodes (28): bumpGlobalVersion(), getPool(), withTransaction(), dataDir, __dirname, main(), mediaDir, root (+20 more)

### Community 40 - "admin.ts"
Cohesion: 0.09
Nodes (36): query(), canManageTopicSectionsForDepartment(), isWorkDepartmentId(), acquireSettingsOrderLock(), foreignSettingsOrderBlock(), KIND_LABEL, LockRow, normalizeOrderClientId() (+28 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.11
Nodes (40): setPendingChanges(), getDepartments(), setAfterServerRequest(), clearLocalSyncPendingState(), ConflictResolution, currentStatus, discardLocalChanges(), emit() (+32 more)

### Community 42 - "Deploy keys (REST INFO)"
Cohesion: 0.40
Nodes (4): Deploy keys (REST INFO), GitHub, Дополнительная защита на сервере, Что здесь

### Community 43 - "SettingsPage"
Cohesion: 0.09
Nodes (43): coerceUsers(), coerceWhitelist(), formatTopicSectionsApiError(), SettingsPage(), acquireOrderLock(), addEmail(), addSupportEmailRow(), addSupportPhoneRow() (+35 more)

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
Cohesion: 0.15
Nodes (13): app_releases, departments, media_files, removed_emails, sync_state, topic_id_counters, topic_locks, topics (+5 more)

### Community 50 - "SupportPhonesBar.tsx"
Cohesion: 0.15
Nodes (20): saveSupportPhones(), SupportContactSettingsList(), commitReorder(), handleDrop(), SupportContactSettingsListProps, copyText(), SupportPhonesBar(), applyStore() (+12 more)

### Community 51 - "auth-store.ts"
Cohesion: 0.13
Nodes (48): accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), coerceAccountsData(), defaultAccounts(), defaultSettings(), deleteUser() (+40 more)

### Community 54 - "fix-media-paths.js"
Cohesion: 0.33
Nodes (6): apply, args, main(), positional, printLine(), serverUrl

### Community 56 - "Viewer"
Cohesion: 0.10
Nodes (18): fileExtLabel(), Viewer(), applyDraftScale(), cancelEditing(), closeFind(), closeScaleEditor(), copyImageLink(), downloadImage() (+10 more)

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

### Community 65 - "SettingsPage.tsx"
Cohesion: 0.10
Nodes (24): Search(), SearchProps, assignableRoles(), DeptSectionListPreview(), formatBytes(), formatLogLine(), formatLogTime(), levelLabel() (+16 more)

### Community 66 - "main.ts"
Cohesion: 0.09
Nodes (40): SavedWindowBounds, applyClientTopicLink(), attachWindowBoundsPersistence(), attachWindowsInputFixes(), compareTopicRows(), createWindow(), fetchAdminUsersFromServer(), isWindowBoundsVisible() (+32 more)

### Community 67 - "subsections-store.ts"
Cohesion: 0.19
Nodes (22): ensureArchiveArchivedSubsectionLocal(), ensureArchiveLostSubsectionLocal(), ensureDeptArchiveSubsectionsLocal(), inferSubsectionsFromLocalGuides(), normalizeSupportPartyId(), rootSubsectionsForTopic(), applySubsectionsFromSync(), applySubsectionSortOrder() (+14 more)

### Community 68 - "archive-lost.ts"
Cohesion: 0.15
Nodes (17): ARCHIVE_ARCHIVED_SUBSECTION_ID, ARCHIVE_LOST_SUBSECTION_ID, Client, isSupportArchiveSubsectionId(), moveTopicsToArchiveLostByParty(), archiveArchivedSubsectionId(), archiveLostSubsectionId(), Client (+9 more)

### Community 69 - "Viewer.tsx"
Cohesion: 0.13
Nodes (26): ImageScaleDialog(), ImageScaleDialogProps, SettingsPageProps, TopicEditorModalProps, TopicListProps, TopicMarkdownImage(), TopicMarkdownImageProps, ImgMenuState (+18 more)

### Community 71 - "archiveLost.ts"
Cohesion: 0.17
Nodes (23): archiveDeptTopicsByPartyLocally(), archiveSupportTopicsLocally(), clearDeptSubsectionLocally(), clearSupportSubsectionLocally(), readGuideFile(), reassignDeptSubsectionTopicsLocally(), refreshDeptTopicOrderFromServer(), writeGuideFile() (+15 more)

### Community 73 - "electron/updates.ts"
Cohesion: 0.11
Nodes (33): appendSessionLog(), clearSessionLogs(), entries, listeners, notify(), SessionLogEntry, SessionLogLevel, checkForUpdates() (+25 more)

### Community 74 - "getUserDataRoot"
Cohesion: 0.17
Nodes (25): reconcileHasChildren(), resolveExistingMediaAbsolutePath(), departmentById(), getUserDataRoot(), downloadMediaFile(), isServerReachable(), applyTopicToLocal(), downloadMissingMedia() (+17 more)

### Community 75 - "TopicEditorModal.tsx"
Cohesion: 0.11
Nodes (49): newDraftId(), handleParentIdChange(), handleSubmit(), handleParentIdChange(), handleSave(), isSupportArchiveSubsectionId(), backfillTopicPartyInList(), filterTopicsForClientLinkPicker() (+41 more)

### Community 80 - "markdown.ts"
Cohesion: 0.13
Nodes (23): nodeText(), handleAnswerCopy(), renderTopicLink(), canonicalImageStoragePath(), IMAGE_STORAGE_PATH_RE, isAllowedMarkdownImageSrc(), markdownForDisplay(), markdownFromEdit() (+15 more)

### Community 81 - "guide-merge.ts"
Cohesion: 0.25
Nodes (13): applyConflictResolutions(), asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic, mergeGuideFile(), MergeGuideResult (+5 more)

### Community 83 - "yandex-sync.ts"
Cohesion: 0.09
Nodes (56): AccountsData, DATA_FILES, clearPendingMedia(), baseDir(), basePathFor(), readBaseGuide(), writeAllGuideBasesFromLocal(), writeBaseFromLocalFile() (+48 more)

### Community 84 - "subsections.ts"
Cohesion: 0.16
Nodes (23): allocateSubsectionId(), Client, departmentHasNestedSubsectionRecords(), departmentHasSubsections(), deptTopLevelSectionRecords(), filterSubsectionsForTopicScope(), getSubsectionById(), isMissingColumn() (+15 more)

### Community 85 - "departments-store.ts"
Cohesion: 0.20
Nodes (17): applyDepartmentsFromSync(), DEFAULT_DEPARTMENTS, departmentById(), departmentFileName(), DEPARTMENTS_CONFIG_FILE, departmentsConfigPath(), ensureGuideFileForDepartment(), getActiveDepartments() (+9 more)

### Community 89 - "TopicEditorModal"
Cohesion: 0.13
Nodes (27): TopicEditorModal(), handleAnswerCopy(), handleAnswerPaste(), imageOwnerPayload(), insertFile(), insertPhoto(), resolvedTextareaSelection(), copyTopicLink() (+19 more)

### Community 90 - "media.ts"
Cohesion: 0.09
Nodes (27): CLIENT_VERSION_HEADER, compareVersions(), getLatestAppReleaseVersion(), normalizeVersionLabel(), parseClientVersionHeader(), requiredClientVersion(), DEFAULT_SUPPORT_EMAILS, isPlausibleSupportEmail() (+19 more)

### Community 91 - "usePreserveTextareaFocus"
Cohesion: 0.24
Nodes (11): shouldKeepExternalFocus(), usePreserveTextareaFocus(), clearBlurTimer(), onBlur(), onFocusIn(), restoreFocusIfNeeded(), saveSelection(), focusTextControl() (+3 more)

### Community 92 - "support-sections-store.ts"
Cohesion: 0.31
Nodes (12): applySupportSectionsFromSync(), applySupportSectionSortOrder(), configPath(), DEFAULT_SUPPORT_SECTIONS, defaultSupportSections(), mergeSupportSectionPatch(), readStoredSupportSections(), removeSupportSectionLocal() (+4 more)

### Community 93 - "readSettings"
Cohesion: 0.29
Nodes (12): readSettings(), saveWindowBounds(), setAuthToken(), setLastSyncAt(), settingsPath(), setYandexToken(), writeSettings(), cacheSupportEmails() (+4 more)

### Community 94 - "export-for-server.ts"
Cohesion: 0.24
Nodes (10): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+2 more)

### Community 95 - "pending-operations.ts"
Cohesion: 0.29
Nodes (11): PENDING_OPERATIONS_FILE, clearPendingOperations(), hasPendingOperations(), OperationType, opsPath(), PendingOperation, PendingOperationsData, queueOperation() (+3 more)

### Community 96 - "support-sections.ts"
Cohesion: 0.25
Nodes (10): allocateSupportSectionId(), Client, getSupportSectionById(), isKnownSupportParty(), isMissingTable(), listSupportSections(), nextSupportSectionSortOrder(), slugifyLabel() (+2 more)

### Community 101 - "normalizeWorkDepartmentId"
Cohesion: 0.33
Nodes (6): openEditUser(), isUserRole(), isWorkDepartmentId(), normalizeWorkDepartmentId(), parseUserRole(), publicUserFromRow()

### Community 105 - "REST INFO — веб-клиент"
Cohesion: 0.40
Nodes (5): Dev (Windows), Production, REST INFO — веб-клиент, Решения, Сборка

### Community 109 - "registerIpc"
Cohesion: 0.07
Nodes (58): normalizeServerUrl(), setServerUrl(), registerIpc(), putUser(), resolveImageOwner(), normalizeMediaDepartmentId(), AdminDepartmentDto, AdminSubsectionDto (+50 more)

## Knowledge Gaps
- **564 isolated node(s):** `SettingsData`, `SessionData`, `ROLE_RANK`, `DEPARTMENTS_CONFIG_FILE`, `StoredDepartment` (+559 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 702 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GuideItem` connect `data.ts` to `main.ts`, `App.tsx`, `Viewer.tsx`, `TopicEditorModal.tsx`, `markdown.ts`, `browser-spravochnik.ts`, `TopicEditorModal`, `types.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Viewer()` connect `Viewer` to `App.tsx`, `Viewer.tsx`, `data.ts`, `TopicEditorModal.tsx`, `markdown.ts`, `TopicEditorModal`, `usePreserveTextareaFocus`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `registerIpc()` connect `registerIpc` to `SupportEmailsBar.tsx`, `SettingsPage.tsx`, `main.ts`, `subsections-store.ts`, `paths.ts`, `topic-media.ts`, `archiveLost.ts`, `server-sync.ts`, `getUserDataRoot`, `electron/updates.ts`, `TopicEditorModal.tsx`, `SupportPhonesBar.tsx`, `auth-store.ts`, `departments-store.ts`, `support-sections-store.ts`, `readSettings`, `pending-operations.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsData`, `SessionData`, `ROLE_RANK` to the rest of the system?**
  _564 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TopicList` be split into smaller, more focused modules?**
  _Cohesion score 0.12043010752688173 - nodes in this community are weakly interconnected._
- **Should `lib/media-layout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09696969696969697 - nodes in this community are weakly interconnected._