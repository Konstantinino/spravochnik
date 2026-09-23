# Graph Report - spravochnik-repo  (2026-09-23)

## Corpus Check
- 132 files · ~87,100 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1539 nodes · 3424 edges · 92 communities (73 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fa429a2a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- browser-spravochnik.ts
- yandex-sync.ts
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
- web/package.json
- prefs.ts
- push-yandex-restore.mjs
- ParentTopicField
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
- server-api.ts
- auth-store.ts
- clone-or-update.sh
- fix-media-paths.js
- TopicList.tsx
- deploy.sh
- install-git-hooks.sh
- setup-deploy-key.sh
- setup-rest-info-user.sh
- Исправление путей к фото на сервере
- paths.ts
- electron/media-layout.ts
- План: автообновление «как Telegram Desktop»
- lib/fix-media-paths.ts
- Viewer.tsx
- middleware/auth.ts
- useTopicLinkPicker.ts
- REST INFO — план веб-версии (отдельная ветка)
- compilerOptions
- data.ts
- electron/updates.ts
- session-log.ts
- TopicEditorModal.tsx
- search.ts
- guide-merge.ts
- TopicEditorModal
- SyncConflictModal.tsx
- usePreserveTextareaFocus
- REST INFO — веб-клиент
- export-for-server.ts
- pending-operations.ts
- readSettings

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 88 edges
2. `getUserDataRoot()` - 49 edges
3. `readSettings()` - 45 edges
4. `App()` - 45 edges
5. `Viewer()` - 40 edges
6. `readAccounts()` - 29 edges
7. `SettingsPage()` - 28 edges
8. `pullFromServer()` - 25 edges
9. `serverFetch()` - 24 edges
10. `TopicList()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `publicUserFromRow()` --calls--> `parseUserRole()`  [EXTRACTED]
  web/src/platform/browser-spravochnik.ts → app/src/types.ts
- `AuthScreenProps` --references--> `PublicUser`  [EXTRACTED]
  app/src/components/AuthScreen.tsx → app/src/types.ts
- `ParentTopicFieldProps` --references--> `GuideItem`  [EXTRACTED]
  app/src/components/ParentTopicField.tsx → app/src/types.ts
- `TopicLinkPickerProps` --references--> `GuideItem`  [EXTRACTED]
  app/src/components/TopicLinkPicker.tsx → app/src/types.ts
- `handleParentIdChange()` --calls--> `getItemParty()`  [EXTRACTED]
  app/src/components/Viewer.tsx → app/src/lib/data.ts

## Import Cycles
- None detected.

## Communities (92 total, 6 thin omitted)

### Community 0 - "browser-spravochnik.ts"
Cohesion: 0.10
Nodes (39): DEPARTMENTS, ApiError, apiFetch(), hasConfiguredServer(), INVALID_SERVER_URL_MESSAGE, uploadMediaFile(), validateServerUrl(), api (+31 more)

### Community 1 - "yandex-sync.ts"
Cohesion: 0.10
Nodes (52): AccountsData, applyConflictResolutions(), DATA_FILES, getUserDataRoot(), baseDir(), basePathFor(), readBaseGuide(), writeAllGuideBasesFromLocal() (+44 more)

### Community 2 - "index.ts"
Cohesion: 0.11
Nodes (27): getPool(), query(), withTransaction(), dataDir, __dirname, main(), mediaDir, root (+19 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App"
Cohesion: 0.09
Nodes (25): App(), collectSortIndexChanges(), executeLocalReset(), flashReorderLockBanner(), handleEnterReorderMode(), handleInlineSave(), handleListFilterChange(), handlePush() (+17 more)

### Community 5 - "Viewer"
Cohesion: 0.10
Nodes (20): fileExtLabel(), nodeText(), Viewer(), cancelEditing(), closeFind(), closeScaleEditor(), downloadImage(), handleParentIdChange() (+12 more)

### Community 6 - "topic-media.ts"
Cohesion: 0.13
Nodes (42): draftFileRelativePath(), draftImageRelativePath(), getDraftFilesDir(), getDraftImagesDir(), getMediaDir(), getTopicFilesDir(), getTopicImagesDir(), topicFileRelativePath() (+34 more)

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
Cohesion: 0.15
Nodes (24): getGlobalVersion(), acquireTopicLock(), acquireTopicOrderLock(), DEPARTMENTS, isSupportParty(), isValidDepartment(), isWorkDepartmentId(), normalizeSupportParty() (+16 more)

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
Nodes (29): canEditContent(), canEditDepartment(), CONTENT_EDITOR_ROLES, generateSalt(), hashPassword(), isOwnerEmail(), isOwnerRole(), isStaffRole() (+21 more)

### Community 17 - "devDependencies"
Cohesion: 0.04
Nodes (46): cookie-parser, cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cookie-parser (+38 more)

### Community 18 - "web/package.json"
Cohesion: 0.07
Nodes (28): dependencies, react, react-dom, react-markdown, remark-gfm, description, devDependencies, @types/react (+20 more)

### Community 19 - "prefs.ts"
Cohesion: 0.16
Nodes (16): AuthScreen(), forgetSavedLogin(), handleSubmit(), AuthScreenProps, ServerUrlForm(), findRememberedLogin(), loadRememberedLogin(), loadRememberedLogins() (+8 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "ParentTopicField"
Cohesion: 0.13
Nodes (20): ParentTopicField(), handleBlur(), handleInputChange(), pick(), resolveBlurSelection(), ParentTopicFieldProps, TopicLinkPicker(), TopicLinkPickerProps (+12 more)

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
Cohesion: 0.12
Nodes (35): HeaderProps, SettingsPageProps, TopicEditorModalProps, ViewerProps, CONTENT_EDITOR_ROLES, Department, DepartmentId, DepartmentStorageStats (+27 more)

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
Nodes (50): getRegistrationDepartment(), getWhitelist(), requireRole(), asSupportParty(), attachWindowBoundsPersistence(), attachWindowsInputFixes(), createWindow(), fetchAdminUsersFromServer() (+42 more)

### Community 39 - "lib/media-layout.ts"
Cohesion: 0.22
Nodes (17): absoluteMediaCandidates(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT, deleteTopicMediaFiles(), isMediaDepartmentId(), MEDIA_DEPARTMENT_IDS, MediaDepartmentId, mediaRelativePathCandidates() (+9 more)

### Community 40 - "App.tsx"
Cohesion: 0.11
Nodes (22): handleAuthenticated(), handleDepartmentChange(), defaultSync, resolveListFilter(), resolveUserDepartment(), SettingsErrorBoundary, Header(), Search() (+14 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.10
Nodes (41): reconcileHasChildren(), departmentById(), hasPendingOperations(), isServerReachable(), setAfterServerRequest(), applyTopicToLocal(), ConflictResolution, currentStatus (+33 more)

### Community 42 - "Deploy keys (REST INFO)"
Cohesion: 0.40
Nodes (4): Deploy keys (REST INFO), GitHub, Дополнительная защита на сервере, Что здесь

### Community 43 - "SettingsPage"
Cohesion: 0.11
Nodes (25): assignableRoles(), coerceUsers(), coerceWhitelist(), formatBytes(), formatLogLine(), formatLogTime(), levelLabel(), SettingsPage() (+17 more)

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
Cohesion: 0.21
Nodes (11): app_releases, departments, media_files, removed_emails, sync_state, topic_id_counters, topic_locks, topics (+3 more)

### Community 50 - "server-api.ts"
Cohesion: 0.17
Nodes (22): normalizeServerUrl(), putUser(), authHeaders(), baseUrl(), downloadMediaFile(), fetchDepartmentTopics(), INVALID_SERVER_URL_MESSAGE, lockTopic() (+14 more)

### Community 51 - "auth-store.ts"
Cohesion: 0.13
Nodes (50): accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), coerceAccountsData(), defaultAccounts(), defaultSettings(), deleteUser() (+42 more)

### Community 54 - "fix-media-paths.js"
Cohesion: 0.33
Nodes (6): apply, args, main(), positional, printLine(), serverUrl

### Community 56 - "TopicList.tsx"
Cohesion: 0.10
Nodes (29): autoScrollContainer(), findScrollParent(), groupRootsByPartySections(), guideX(), highlightTitle(), isRowVisibleInScroll(), renderTreeNode(), ReorderDragGhost (+21 more)

### Community 61 - "Исправление путей к фото на сервере"
Cohesion: 0.20
Nodes (10): Альтернатива — прямо на сервере (SSH), В чём проблема, Если не работает, Исправление путей к фото на сервере, Проверка, Простой способ — с вашего Windows-ПК (как установщик), Шаг 1. Один раз обновить сервер, Шаг 2. Предпросмотр (ничего не меняет) (+2 more)

### Community 62 - "paths.ts"
Cohesion: 0.11
Nodes (22): PublicUser, StoredUser, WhitelistEntry, roleFromServerUser(), BOOTSTRAP_ADMIN_EMAIL, canEditContent(), canEditDepartment(), CONTENT_EDITOR_ROLES (+14 more)

### Community 63 - "electron/media-layout.ts"
Cohesion: 0.14
Nodes (28): resolveImageOwner(), downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc(), absFromRoot(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT (+20 more)

### Community 64 - "План: автообновление «как Telegram Desktop»"
Cohesion: 0.07
Nodes (30): 1.1 Зависимости и сборка (`app/`), 1.2 Клиент — `app/electron/updates.ts`, 1.3 Клиент — UI, 1.4 Клиент — IPC (`main.ts`, `preload.ts`, `vite-env.d.ts`), 1.5 Сервер — раздача артефактов, 1.6 Публикация — `upload-release.js`, 1.7 Обратная совместимость API, Edge cases (+22 more)

### Community 65 - "lib/fix-media-paths.ts"
Cohesion: 0.22
Nodes (15): bumpGlobalVersion(), main(), printLine(), DbRow, DiscoveredFile, discoverMediaFilesOnDisk(), consider(), walk() (+7 more)

### Community 66 - "Viewer.tsx"
Cohesion: 0.18
Nodes (13): ImageScaleDialog(), ImageScaleDialogProps, ImgMenuState, ScaleEditorState, applyDraftScale(), applyFindHighlights(), clearFindHighlights(), clampImageScale() (+5 more)

### Community 67 - "middleware/auth.ts"
Cohesion: 0.17
Nodes (15): JwtUser, clearSessionCookie(), SESSION_COOKIE, sessionCookieOptions(), setSessionCookie(), attachUserFromToken(), authMiddleware(), AuthRequest (+7 more)

### Community 68 - "useTopicLinkPicker.ts"
Cohesion: 0.57
Nodes (5): useTopicLinkPicker(), clampPickerPosition(), getTextareaCaretRect(), getActivePlusQuery(), replaceRangeWithTopicLink()

### Community 69 - "REST INFO — план веб-версии (отдельная ветка)"
Cohesion: 0.10
Nodes (21): Git-ветка, MVP → полная версия (фазы), REST INFO — план веб-версии (отдельная ветка), Архитектура, Безопасность (главный минус веба), Влияние на работающую систему, Зафиксированные решения (23.09.2026), Критерий готовности merge в `main` (+13 more)

### Community 71 - "compilerOptions"
Cohesion: 0.11
Nodes (18): ../app/src/*, compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 72 - "data.ts"
Cohesion: 0.24
Nodes (14): navigateBack(), navigateToTopic(), openTopicForEditFromSidebar(), handleParentIdChange(), filterItemsByParty(), filterItemsByView(), filterTopicsForLinkPicker(), filterTopicsForParentPicker() (+6 more)

### Community 73 - "electron/updates.ts"
Cohesion: 0.12
Nodes (26): ensureDataReady(), APP_UPDATE_FILE, getSeedDataDir(), require, checkForUpdates(), checkForUpdatesAuto(), checkForUpdatesLegacy(), clearPartialUpdateCache() (+18 more)

### Community 74 - "session-log.ts"
Cohesion: 0.29
Nodes (6): clearSessionLogs(), entries, listeners, notify(), SessionLogEntry, SessionLogLevel

### Community 75 - "TopicEditorModal.tsx"
Cohesion: 0.17
Nodes (16): TextareaWithNbspButton(), insertNbsp(), TextareaWithNbspButtonProps, newDraftId(), copyTopicLink(), escapeMdLinkLabel(), formatFileMarkdownLink(), formatTopicMarkdownLink() (+8 more)

### Community 80 - "search.ts"
Cohesion: 0.31
Nodes (8): getItemPath(), topicLabelWithPath(), buildTopicSearchFilter(), SearchHit, searchItems(), splitSearchTokens(), textHasAllTokens(), TopicSearchMatch

### Community 81 - "guide-merge.ts"
Cohesion: 0.27
Nodes (12): asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic, mergeGuideFile(), MergeGuideResult, sortValue() (+4 more)

### Community 82 - "TopicEditorModal"
Cohesion: 0.23
Nodes (10): TopicEditorModal(), handleAnswerPaste(), imageOwnerPayload(), insertFile(), insertPhoto(), handleAnswerPaste(), insertFile(), insertPhoto() (+2 more)

### Community 83 - "SyncConflictModal.tsx"
Cohesion: 0.32
Nodes (4): SyncConflictModal(), SyncConflictModalProps, ConflictResolution, SyncConflictInfo

### Community 84 - "usePreserveTextareaFocus"
Cohesion: 0.46
Nodes (7): shouldKeepExternalFocus(), usePreserveTextareaFocus(), clearBlurTimer(), onBlur(), onFocusIn(), restoreFocusIfNeeded(), saveSelection()

### Community 85 - "REST INFO — веб-клиент"
Cohesion: 0.33
Nodes (5): Dev (Windows), Production, REST INFO — веб-клиент, Решения (зафиксировано), Сборка

### Community 89 - "export-for-server.ts"
Cohesion: 0.24
Nodes (10): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+2 more)

### Community 90 - "pending-operations.ts"
Cohesion: 0.27
Nodes (11): PENDING_OPERATIONS_FILE, clearPendingOperations(), OperationType, opsPath(), PendingOperation, PendingOperationsData, readPendingOperations(), removeOperation() (+3 more)

### Community 91 - "readSettings"
Cohesion: 0.31
Nodes (10): readSettings(), setPendingChanges(), markLocalChange(), markOfflinePending(), discardLocalChanges(), emit(), getSyncStatus(), markLocalChange() (+2 more)

## Knowledge Gaps
- **491 isolated node(s):** `SettingsData`, `SessionData`, `ROLE_RANK`, `defaultSource`, `manifest` (+486 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 588 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getUserDataRoot()` connect `yandex-sync.ts` to `main.ts`, `topic-media.ts`, `electron/updates.ts`, `server-sync.ts`, `server-api.ts`, `auth-store.ts`, `export-for-server.ts`, `pending-operations.ts`, `paths.ts`, `electron/media-layout.ts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `Viewer()` connect `Viewer` to `Viewer.tsx`, `useTopicLinkPicker.ts`, `App.tsx`, `data.ts`, `TopicEditorModal.tsx`, `TopicEditorModal`, `usePreserveTextareaFocus`, `ParentTopicField`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `REST INFO — инструкция для AI-агента` connect `REST INFO — инструкция для AI-агента` to `AGENTS.md`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsData`, `SessionData`, `ROLE_RANK` to the rest of the system?**
  _491 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `browser-spravochnik.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09620721554116558 - nodes in this community are weakly interconnected._
- **Should `yandex-sync.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0987012987012987 - nodes in this community are weakly interconnected._