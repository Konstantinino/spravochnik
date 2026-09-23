# Graph Report - spravochnik-repo  (2026-09-21)

## Corpus Check
- 119 files · ~81,708 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1396 nodes · 3179 edges · 87 communities (69 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8230e10f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- pushResolvedLocalToYandex
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
- isSupportParty
- prefs.ts
- push-yandex-restore.mjs
- Viewer.tsx
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
- TopicEditorModal
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
- imageDisplay.ts
- media.ts
- markdown.ts
- guide-merge.ts
- saveWindowBounds
- electron/updates.ts
- export-for-server.ts
- search.ts
- sync-base.ts
- getUserDataRoot
- useTopicLinkPicker.ts
- usePreserveTextareaFocus
- renderTopicImage
- win

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 88 edges
2. `getUserDataRoot()` - 49 edges
3. `readSettings()` - 45 edges
4. `App()` - 44 edges
5. `Viewer()` - 40 edges
6. `readAccounts()` - 29 edges
7. `SettingsPage()` - 28 edges
8. `pullFromServer()` - 25 edges
9. `serverFetch()` - 24 edges
10. `TopicList()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `pushAccountsFile()` --calls--> `isServerReachable()`  [EXTRACTED]
  app/electron/server-sync.ts → app/electron/server-api.ts
- `AuthScreenProps` --references--> `PublicUser`  [EXTRACTED]
  app/src/components/AuthScreen.tsx → app/src/types.ts
- `openEditUser()` --calls--> `normalizeWorkDepartmentId()`  [EXTRACTED]
  app/src/components/SettingsPage.tsx → app/src/types.ts
- `handleParentIdChange()` --calls--> `getItemParty()`  [EXTRACTED]
  app/src/components/TopicEditorModal.tsx → app/src/lib/data.ts
- `handleParentIdChange()` --calls--> `getItemParty()`  [EXTRACTED]
  app/src/components/Viewer.tsx → app/src/lib/data.ts

## Import Cycles
- None detected.

## Communities (87 total, 6 thin omitted)

### Community 0 - "pushResolvedLocalToYandex"
Cohesion: 0.19
Nodes (22): acquireSyncLock(), deleteRemoteFile(), downloadRemoteFile(), ensureRemoteDir(), ensureRemoteFolder(), ensureRemoteMediaFolder(), folderPath(), listRemoteMedia() (+14 more)

### Community 1 - "yandex-sync.ts"
Cohesion: 0.12
Nodes (26): setPendingChanges(), ConflictResolution, currentStatus, discardLocalChanges(), emit(), getSyncStatus(), listeners, listKeyForFile() (+18 more)

### Community 2 - "index.ts"
Cohesion: 0.11
Nodes (26): getPool(), query(), withTransaction(), dataDir, __dirname, main(), mediaDir, root (+18 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App"
Cohesion: 0.08
Nodes (30): App(), collectSortIndexChanges(), executeLocalReset(), flashReorderLockBanner(), handleAuthenticated(), handleDepartmentChange(), handleEnterReorderMode(), handleInlineSave() (+22 more)

### Community 5 - "Viewer"
Cohesion: 0.11
Nodes (17): fileExtLabel(), nodeText(), Viewer(), cancelEditing(), closeFind(), closeScaleEditor(), copyTopicLink(), downloadImage() (+9 more)

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
Cohesion: 0.18
Nodes (11): build, appId, directories, executableName, extraResources, files, productName, publish (+3 more)

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
Cohesion: 0.14
Nodes (29): CONTENT_EDITOR_ROLES, generateSalt(), hashPassword(), isOwnerEmail(), isOwnerRole(), isUserRole(), isWorkDepartmentId(), JwtUser (+21 more)

### Community 17 - "devDependencies"
Cohesion: 0.05
Nodes (42): cors, embedded-postgres, express, jsonwebtoken, multer, dependencies, cors, express (+34 more)

### Community 18 - "isSupportParty"
Cohesion: 0.27
Nodes (10): handleReorderSiblings(), mergeSortIndexChanges(), navigateBack(), navigateToTopic(), openTopicForEditFromSidebar(), filterTopicsForLinkPicker(), isArchived(), reconcileHasChildren() (+2 more)

### Community 19 - "prefs.ts"
Cohesion: 0.14
Nodes (19): AuthScreen(), forgetSavedLogin(), handleSubmit(), AuthScreenProps, ServerUrlForm(), findRememberedLogin(), isDepartmentId(), loadRememberedLogin() (+11 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "Viewer.tsx"
Cohesion: 0.11
Nodes (34): ParentTopicField(), handleBlur(), handleInputChange(), pick(), resolveBlurSelection(), ParentTopicFieldProps, TopicEditorModalProps, TopicLinkPicker() (+26 more)

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
Cohesion: 0.11
Nodes (37): Header(), HeaderProps, SettingsPageProps, userIsOwner(), canSwitchDepartment(), CONTENT_EDITOR_ROLES, Department, DepartmentId (+29 more)

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
Cohesion: 0.08
Nodes (60): normalizeServerUrl(), requireRole(), SavedWindowBounds, setServerUrl(), asSupportParty(), fetchAdminUsersFromServer(), readGuideFile(), refreshDeptTopicOrderFromServer() (+52 more)

### Community 39 - "lib/media-layout.ts"
Cohesion: 0.20
Nodes (23): discoverMediaFilesOnDisk(), consider(), walk(), absoluteMediaCandidates(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT, deleteTopicMediaFiles(), isMediaDepartmentId() (+15 more)

### Community 40 - "App.tsx"
Cohesion: 0.14
Nodes (12): defaultSync, SettingsErrorBoundary, Search(), SearchProps, SyncConflictModal(), SyncConflictModalProps, ConflictResolution, DEPT_VIEW_FILTERS (+4 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.07
Nodes (63): AccountsData, parseWindowBounds(), readSettings(), reconcileHasChildren(), departmentById(), PENDING_OPERATIONS_FILE, clearPendingOperations(), hasPendingOperations() (+55 more)

### Community 42 - "Deploy keys (REST INFO)"
Cohesion: 0.40
Nodes (4): Deploy keys (REST INFO), GitHub, Дополнительная защита на сервере, Что здесь

### Community 43 - "SettingsPage"
Cohesion: 0.13
Nodes (20): assignableRoles(), coerceUsers(), coerceWhitelist(), formatBytes(), formatLogLine(), formatLogTime(), levelLabel(), SettingsPage() (+12 more)

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

### Community 50 - "TopicEditorModal"
Cohesion: 0.19
Nodes (12): newDraftId(), TopicEditorModal(), handleAnswerPaste(), handleParentIdChange(), imageOwnerPayload(), insertFile(), insertPhoto(), handleAnswerPaste() (+4 more)

### Community 51 - "auth-store.ts"
Cohesion: 0.14
Nodes (46): accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), coerceAccountsData(), defaultAccounts(), defaultSettings(), deleteUser() (+38 more)

### Community 54 - "fix-media-paths.js"
Cohesion: 0.33
Nodes (6): apply, args, main(), positional, printLine(), serverUrl

### Community 56 - "TopicList.tsx"
Cohesion: 0.10
Nodes (30): autoScrollContainer(), findScrollParent(), groupRootsByPartySections(), guideX(), highlightTitle(), isRowVisibleInScroll(), renderTreeNode(), ReorderDragGhost (+22 more)

### Community 61 - "Исправление путей к фото на сервере"
Cohesion: 0.20
Nodes (10): Альтернатива — прямо на сервере (SSH), В чём проблема, Если не работает, Исправление путей к фото на сервере, Проверка, Простой способ — с вашего Windows-ПК (как установщик), Шаг 1. Один раз обновить сервер, Шаг 2. Предпросмотр (ничего не меняет) (+2 more)

### Community 62 - "paths.ts"
Cohesion: 0.09
Nodes (26): PublicUser, StoredUser, WhitelistEntry, cacheServerUser(), publicUsersFromServer(), roleFromServerUser(), BOOTSTRAP_ADMIN_EMAIL, canEditContent() (+18 more)

### Community 63 - "electron/media-layout.ts"
Cohesion: 0.14
Nodes (28): resolveImageOwner(), downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc(), absFromRoot(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT (+20 more)

### Community 64 - "План: автообновление «как Telegram Desktop»"
Cohesion: 0.07
Nodes (30): 1.1 Зависимости и сборка (`app/`), 1.2 Клиент — `app/electron/updates.ts`, 1.3 Клиент — UI, 1.4 Клиент — IPC (`main.ts`, `preload.ts`, `vite-env.d.ts`), 1.5 Сервер — раздача артефактов, 1.6 Публикация — `upload-release.js`, 1.7 Обратная совместимость API, Edge cases (+22 more)

### Community 65 - "lib/fix-media-paths.ts"
Cohesion: 0.27
Nodes (10): bumpGlobalVersion(), main(), printLine(), DbRow, DiscoveredFile, fixMediaPaths(), FixMediaPathsLine, FixMediaPathsResult (+2 more)

### Community 66 - "imageDisplay.ts"
Cohesion: 0.22
Nodes (9): ImageScaleDialog(), ImageScaleDialogProps, applyDraftScale(), clampImageScale(), getImageScale(), IMAGE_SCALE_DEFAULT, IMAGE_SCALE_MAX, IMAGE_SCALE_MIN (+1 more)

### Community 67 - "media.ts"
Cohesion: 0.24
Nodes (8): canEditContent(), canEditDepartment(), isStaffRole(), requireRole(), ensureMediaDir(), ensureUpdatesDir(), upload, rejectForeignDepartmentEdit()

### Community 68 - "markdown.ts"
Cohesion: 0.36
Nodes (7): escapeMdLinkLabel(), formatFileMarkdownLink(), formatTopicMarkdownLink(), isAllowedMarkdownImageSrc(), parseCopiedTopicLink(), parseTopicLinkHref(), wrapSelectionWithTopicLink()

### Community 69 - "guide-merge.ts"
Cohesion: 0.25
Nodes (13): applyConflictResolutions(), asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic, mergeGuideFile(), MergeGuideResult (+5 more)

### Community 71 - "saveWindowBounds"
Cohesion: 0.25
Nodes (8): saveWindowBounds(), attachWindowBoundsPersistence(), attachWindowsInputFixes(), createWindow(), isWindowBoundsVisible(), loadSavedWindowBounds(), persistWindowBounds(), rectsOverlap()

### Community 73 - "electron/updates.ts"
Cohesion: 0.13
Nodes (25): APP_UPDATE_FILE, checkForUpdates(), checkForUpdatesAuto(), checkForUpdatesLegacy(), clearPartialUpdateCache(), compareVersions(), configureAutoUpdaterFeed(), downloadLatestRelease() (+17 more)

### Community 75 - "export-for-server.ts"
Cohesion: 0.24
Nodes (10): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+2 more)

### Community 80 - "search.ts"
Cohesion: 0.31
Nodes (8): getItemPath(), topicLabelWithPath(), buildTopicSearchFilter(), SearchHit, searchItems(), splitSearchTokens(), textHasAllTokens(), TopicSearchMatch

### Community 81 - "sync-base.ts"
Cohesion: 0.46
Nodes (7): DATA_FILES, baseDir(), basePathFor(), readBaseGuide(), writeAllGuideBasesFromLocal(), writeBaseFromLocalFile(), writeBaseGuide()

### Community 82 - "getUserDataRoot"
Cohesion: 0.48
Nodes (6): ensureDataReady(), getSeedDataDir(), getUserDataRoot(), require, ensureLocalUpdateManifest(), electron

### Community 83 - "useTopicLinkPicker.ts"
Cohesion: 0.46
Nodes (6): TopicLinkPickerState, useTopicLinkPicker(), clampPickerPosition(), getTextareaCaretRect(), getActivePlusQuery(), replaceRangeWithTopicLink()

### Community 84 - "usePreserveTextareaFocus"
Cohesion: 0.46
Nodes (7): shouldKeepExternalFocus(), usePreserveTextareaFocus(), clearBlurTimer(), onBlur(), onFocusIn(), restoreFocusIfNeeded(), saveSelection()

### Community 85 - "renderTopicImage"
Cohesion: 0.50
Nodes (5): openImageMenu(), openLightbox(), renderTopicImage(), normalizeImageDisplayKey(), mediaSrcFromMarkdownUrl()

### Community 86 - "win"
Cohesion: 0.50
Nodes (4): win, artifactName, icon, target

## Knowledge Gaps
- **430 isolated node(s):** `SettingsData`, `SessionData`, `ROLE_RANK`, `defaultSource`, `manifest` (+425 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 523 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `App()` connect `App` to `App.tsx`, `search.ts`, `isSupportParty`, `Viewer.tsx`, `types.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `Viewer()` connect `Viewer` to `imageDisplay.ts`, `markdown.ts`, `App.tsx`, `TopicEditorModal`, `useTopicLinkPicker.ts`, `usePreserveTextareaFocus`, `renderTopicImage`, `Viewer.tsx`, `isSupportParty`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `getUserDataRoot()` connect `getUserDataRoot` to `pushResolvedLocalToYandex`, `yandex-sync.ts`, `main.ts`, `topic-media.ts`, `server-sync.ts`, `electron/updates.ts`, `export-for-server.ts`, `sync-base.ts`, `auth-store.ts`, `paths.ts`, `electron/media-layout.ts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsData`, `SessionData`, `ROLE_RANK` to the rest of the system?**
  _430 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `yandex-sync.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1206896551724138 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1051693404634581 - nodes in this community are weakly interconnected._