# Graph Report - spravochnik-repo  (2026-10-26)

## Corpus Check
- 145 files · ~102,572 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1707 nodes · 4099 edges · 93 communities (69 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f0785da9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- media.ts
- TopicList.tsx
- routes/auth.ts
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
- auth-utils.ts
- devDependencies
- support-phones.ts
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
- App.tsx
- server-sync.ts
- Deploy keys (REST INFO)
- SettingsPage
- app/package.json
- nsis
- dependencies
- scripts
- 001_initial.sql
- sync-backend.ts
- auth-store.ts
- clone-or-update.sh
- fix-media-paths.js
- deploy.sh
- install-git-hooks.sh
- setup-deploy-key.sh
- setup-rest-info-user.sh
- Исправление путей к фото на сервере
- markdown.ts
- search.ts
- План: автообновление «как Telegram Desktop»
- imageDisplay.ts
- usePreserveTextareaFocus
- departments-store.ts
- data.ts
- electron/updates.ts
- TopicEditorModal
- Viewer.tsx
- SupportPhonesBar.tsx
- appendSessionLog
- 012_support_sections_archive_lost.sql
- yandex-sync.ts
- subsections.ts
- archive-lost.ts
- query-subsections.mjs
- SyncConflictModal.tsx
- textInsert.ts
- admin.ts
- registerIpc

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 131 edges
2. `getUserDataRoot()` - 61 edges
3. `Viewer()` - 56 edges
4. `App()` - 49 edges
5. `readSettings()` - 48 edges
6. `SettingsPage()` - 47 edges
7. `pullFromServer()` - 31 edges
8. `readAccounts()` - 29 edges
9. `TopicList()` - 28 edges
10. `serverFetch()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `putUser()` --calls--> `serverFetch()`  [EXTRACTED]
  app/electron/main.ts → app/electron/server-api.ts
- `pushAccountsFile()` --calls--> `isServerReachable()`  [EXTRACTED]
  app/electron/server-sync.ts → app/electron/server-api.ts
- `handleSubmit()` --calls--> `rootSubsectionIdForSave()`  [EXTRACTED]
  app/src/components/TopicEditorModal.tsx → app/src/lib/topicSectionPickers.ts
- `handleSave()` --calls--> `rootSubsectionIdForSave()`  [EXTRACTED]
  app/src/components/Viewer.tsx → app/src/lib/topicSectionPickers.ts
- `closeBranchAction()` --calls--> `restoreAppFocus()`  [EXTRACTED]
  app/src/components/Viewer.tsx → app/src/lib/restoreAppFocus.ts

## Import Cycles
- None detected.

## Communities (93 total, 8 thin omitted)

### Community 0 - "media.ts"
Cohesion: 0.22
Nodes (13): CLIENT_VERSION_HEADER, compareVersions(), getLatestAppReleaseVersion(), normalizeVersionLabel(), parseClientVersionHeader(), requireRole(), blockWritesIfClientOutdated(), requireCurrentClientVersion() (+5 more)

### Community 1 - "TopicList.tsx"
Cohesion: 0.06
Nodes (58): applySubsectionsFromSync(), mergeSubsectionRecords(), mergeSubsectionsLists(), normalizePartyField(), normalizeStoredSubsection(), replaceSubsectionsFromSync(), StoredSubsection, SUBSECTIONS_CONFIG_FILE (+50 more)

### Community 2 - "routes/auth.ts"
Cohesion: 0.11
Nodes (34): getPool(), query(), withTransaction(), dataDir, __dirname, main(), mediaDir, root (+26 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App"
Cohesion: 0.09
Nodes (32): App(), collectSortIndexChanges(), executeLocalReset(), flashReorderLockBanner(), handleEnterReorderMode(), handleInlineSave(), handleListFilterChange(), handlePush() (+24 more)

### Community 5 - "Viewer"
Cohesion: 0.08
Nodes (28): handleParentIdChange(), fileExtLabel(), nodeText(), Viewer(), applyDraftScale(), cancelEditing(), closeBranchAction(), closeFind() (+20 more)

### Community 6 - "paths.ts"
Cohesion: 0.05
Nodes (96): resolveImageOwner(), downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc(), absFromRoot(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT (+88 more)

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
Cohesion: 0.10
Nodes (36): getGlobalVersion(), ensureArchiveArchivedSubsection(), DepartmentListKey, DepartmentRecord, getDepartmentById(), isDepartmentIdSlug(), isEditableInSettings(), isLostDepartmentId() (+28 more)

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
Cohesion: 0.14
Nodes (21): canEditContent(), canEditDepartment(), CONTENT_EDITOR_ROLES, isOwnerEmail(), isStaffRole(), isUserRole(), isWorkDepartmentId(), JwtUser (+13 more)

### Community 17 - "devDependencies"
Cohesion: 0.05
Nodes (42): cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cors, express (+34 more)

### Community 18 - "support-phones.ts"
Cohesion: 0.26
Nodes (9): DEFAULT_SUPPORT_PHONES, formatSupportPhoneDisplay(), normalizeSupportPhones(), normalizeTelDigits(), readSupportPhonesFromDb(), SUPPORT_PHONES_SYNC_KEY, SupportPhoneLine, writeSupportPhonesToDb() (+1 more)

### Community 19 - "prefs.ts"
Cohesion: 0.16
Nodes (16): AuthScreen(), forgetSavedLogin(), handleSubmit(), ServerUrlForm(), findRememberedLogin(), isDepartmentId(), loadRememberedLogin(), loadRememberedLogins() (+8 more)

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
Cohesion: 0.10
Nodes (40): AuthScreenProps, HeaderProps, assignableRoles(), formatBytes(), levelLabel(), SettingsPageProps, AdminDepartment, canManageTopicSectionsForDepartment() (+32 more)

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
Nodes (59): normalizeServerUrl(), SavedWindowBounds, applyClientTopicLink(), attachWindowBoundsPersistence(), attachWindowsInputFixes(), compareTopicRows(), createWindow(), isWindowBoundsVisible() (+51 more)

### Community 39 - "lib/media-layout.ts"
Cohesion: 0.12
Nodes (32): bumpGlobalVersion(), main(), printLine(), DbRow, DiscoveredFile, discoverMediaFilesOnDisk(), consider(), walk() (+24 more)

### Community 40 - "App.tsx"
Cohesion: 0.09
Nodes (26): handleAuthenticated(), handleDepartmentChange(), defaultSync, resolveListFilter(), resolveUserDepartment(), SettingsErrorBoundary, Header(), Search() (+18 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.06
Nodes (70): AccountsData, reconcileHasChildren(), getDepartments(), PENDING_OPERATIONS_FILE, clearPendingOperations(), hasPendingOperations(), OperationType, opsPath() (+62 more)

### Community 42 - "Deploy keys (REST INFO)"
Cohesion: 0.40
Nodes (4): Deploy keys (REST INFO), GitHub, Дополнительная защита на сервере, Что здесь

### Community 43 - "SettingsPage"
Cohesion: 0.09
Nodes (33): coerceUsers(), coerceWhitelist(), formatLogLine(), formatLogTime(), formatTopicSectionsApiError(), SettingsPage(), addEmail(), beginAddSubsection() (+25 more)

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

### Community 50 - "sync-backend.ts"
Cohesion: 0.14
Nodes (18): pushPromotedTopicRows(), discardLocalChanges(), ensureMediaFilesDownloaded, ensureTopicMediaDownloaded, getSyncStatus, loadYandex(), markOfflinePending, onSyncStatus (+10 more)

### Community 51 - "auth-store.ts"
Cohesion: 0.11
Nodes (57): accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), coerceAccountsData(), defaultAccounts(), defaultSettings(), deleteUser() (+49 more)

### Community 54 - "fix-media-paths.js"
Cohesion: 0.33
Nodes (6): apply, args, main(), positional, printLine(), serverUrl

### Community 61 - "Исправление путей к фото на сервере"
Cohesion: 0.20
Nodes (10): Альтернатива — прямо на сервере (SSH), В чём проблема, Если не работает, Исправление путей к фото на сервере, Проверка, Простой способ — с вашего Windows-ПК (как установщик), Шаг 1. Один раз обновить сервер, Шаг 2. Предпросмотр (ничего не меняет) (+2 more)

### Community 62 - "markdown.ts"
Cohesion: 0.17
Nodes (16): handleAnswerCopy(), copyImageLink(), copyTopicLink(), handleAnswerCopy(), escapeMdLinkLabel(), formatFileMarkdownLink(), formatSharedImageMarkdown(), formatTopicMarkdownLink() (+8 more)

### Community 63 - "search.ts"
Cohesion: 0.36
Nodes (7): getItemPath(), buildTopicSearchFilter(), searchItems(), splitSearchTokens(), textHasAllTokens(), TopicSearchFilter, TopicSearchMatch

### Community 64 - "План: автообновление «как Telegram Desktop»"
Cohesion: 0.07
Nodes (30): 1.1 Зависимости и сборка (`app/`), 1.2 Клиент — `app/electron/updates.ts`, 1.3 Клиент — UI, 1.4 Клиент — IPC (`main.ts`, `preload.ts`, `vite-env.d.ts`), 1.5 Сервер — раздача артефактов, 1.6 Публикация — `upload-release.js`, 1.7 Обратная совместимость API, Edge cases (+22 more)

### Community 66 - "imageDisplay.ts"
Cohesion: 0.16
Nodes (16): ImageScaleDialog(), ImageScaleDialogProps, TopicMarkdownImage(), TopicMarkdownImageProps, clampImageScale(), getImageScale(), getImageScaleForTopicImage(), IMAGE_SCALE_DEFAULT (+8 more)

### Community 67 - "usePreserveTextareaFocus"
Cohesion: 0.46
Nodes (7): shouldKeepExternalFocus(), usePreserveTextareaFocus(), clearBlurTimer(), onBlur(), onFocusIn(), restoreFocusIfNeeded(), saveSelection()

### Community 68 - "departments-store.ts"
Cohesion: 0.20
Nodes (17): applyDepartmentsFromSync(), DEFAULT_DEPARTMENTS, departmentById(), departmentFileName(), DEPARTMENTS_CONFIG_FILE, departmentsConfigPath(), ensureGuideFileForDepartment(), getActiveDepartments() (+9 more)

### Community 69 - "data.ts"
Cohesion: 0.11
Nodes (29): ParentTopicField(), handleBlur(), handleInputChange(), pick(), resolveBlurSelection(), ParentTopicFieldProps, TopicLinkPicker(), TopicLinkPickerProps (+21 more)

### Community 73 - "electron/updates.ts"
Cohesion: 0.13
Nodes (28): getSeedDataDir(), checkForUpdates(), checkForUpdatesAuto(), checkForUpdatesLegacy(), clearPartialUpdateCache(), configureAutoUpdaterFeed(), downloadUpdate(), electronUpdaterCacheDir() (+20 more)

### Community 74 - "TopicEditorModal"
Cohesion: 0.20
Nodes (14): newDraftId(), TopicEditorModal(), handleAnswerPaste(), handleSubmit(), imageOwnerPayload(), insertFile(), insertPhoto(), handleAnswerPaste() (+6 more)

### Community 75 - "Viewer.tsx"
Cohesion: 0.21
Nodes (19): TopicEditorModalProps, TopicListProps, ImgMenuState, ScaleEditorState, ViewerProps, filterTopicsForClientLinkPicker(), filterTopicsForLinkPicker(), filterTopicsForParentPicker() (+11 more)

### Community 80 - "SupportPhonesBar.tsx"
Cohesion: 0.32
Nodes (10): saveSupportPhones(), copyText(), SupportPhonesBar(), handleCopy(), SupportPhonesBarProps, DEFAULT_SUPPORT_PHONES, formatSupportPhoneDisplay(), normalizeSupportPhones() (+2 more)

### Community 81 - "appendSessionLog"
Cohesion: 0.16
Nodes (13): downloadMediaFile(), downloadMissingMedia(), ensureMediaFilesDownloaded(), ensureRequestedPartyPersisted(), appendSessionLog(), clearSessionLogs(), entries, getSessionLogs() (+5 more)

### Community 83 - "yandex-sync.ts"
Cohesion: 0.06
Nodes (83): setPendingChanges(), defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest (+75 more)

### Community 84 - "subsections.ts"
Cohesion: 0.19
Nodes (18): allocateSubsectionId(), Client, departmentHasSubsections(), filterSubsectionsForTopicScope(), getSubsectionById(), isMissingColumn(), isMissingSubsectionsTable(), listSubsections() (+10 more)

### Community 85 - "archive-lost.ts"
Cohesion: 0.32
Nodes (7): ARCHIVE_ARCHIVED_SUBSECTION_ID, ARCHIVE_LOST_SUBSECTION_ID, Client, ensureArchiveLostSubsection(), moveTopicsToArchiveLostByParty(), moveTopicsToArchiveLostBySubsection(), resolveSupportArchiveSubsectionId()

### Community 91 - "SyncConflictModal.tsx"
Cohesion: 0.33
Nodes (3): SyncConflictModal(), SyncConflictModalProps, SyncConflictInfo

### Community 93 - "textInsert.ts"
Cohesion: 0.21
Nodes (14): highlightNbspEntities(), TextareaWithNbspButton(), handleTextareaScroll(), insertNbsp(), syncScrollFromTextarea(), TextareaWithNbspButtonProps, useTopicLinkPicker(), clampPickerPosition() (+6 more)

### Community 94 - "admin.ts"
Cohesion: 0.10
Nodes (23): canManageTopicSectionsForDepartment(), isOwnerRole(), LOST_DEPARTMENT_ID, Client, moveDepartmentTopicsToLost(), TopicMoveRow, allocateSupportSectionId(), Client (+15 more)

### Community 95 - "registerIpc"
Cohesion: 0.12
Nodes (34): parseWindowBounds(), readSettings(), saveWindowBounds(), setAuthToken(), setLastSyncAt(), setServerUrl(), settingsPath(), setYandexToken() (+26 more)

## Knowledge Gaps
- **468 isolated node(s):** `SettingsData`, `SessionData`, `ROLE_RANK`, `DEPARTMENTS_CONFIG_FILE`, `StoredDepartment` (+463 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 577 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalizeSubsectionLabelInput()` connect `TopicList.tsx` to `main.ts`, `Viewer.tsx`, `SettingsPage`, `types.ts`, `registerIpc`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `editorSubsectionsForDepartment()` connect `Viewer.tsx` to `TopicList.tsx`, `TopicEditorModal`, `Viewer`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `registerIpc()` connect `registerIpc` to `TopicList.tsx`, `departments-store.ts`, `main.ts`, `paths.ts`, `server-sync.ts`, `electron/updates.ts`, `SupportPhonesBar.tsx`, `appendSessionLog`, `sync-backend.ts`, `auth-store.ts`, `yandex-sync.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsData`, `SessionData`, `ROLE_RANK` to the rest of the system?**
  _468 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TopicList.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `routes/auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1073170731707317 - nodes in this community are weakly interconnected._