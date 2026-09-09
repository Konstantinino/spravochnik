# Graph Report - spravochnik-repo  (2026-09-09)

## Corpus Check
- 107 files · ~68,913 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1197 nodes · 2759 edges · 68 communities (58 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2396c1a3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- data.ts
- yandex-sync.ts
- auth-store.ts
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
- index.ts
- prefs.ts
- push-yandex-restore.mjs
- Viewer.tsx
- REST INFO — инструкция для серверного программиста
- REST INFO v1 — Яндекс.Диск (legacy)
- Скрипты REST INFO
- compilerOptions
- Миграция с Яндекс.Диска на SQL-сервер
- REST INFO — статус проекта (handoff)
- TopicEditorModal
- pull-yandex-export.mjs
- REST INFO — развёртывание сервера (Docker)
- REST INFO — сервер API
- REST INFO — изолированный пользователь на сервере
- Чеклист тестирования REST INFO v2
- REST INFO — клиент (Electron)
- upload-release.js
- isStaffRole
- legacy/README.md
- lib/media-layout.ts
- types.ts
- server-sync.ts
- Deploy keys (REST INFO)
- SettingsPage
- app/package.json
- TopicEditorModal.tsx
- nsis
- dependencies
- scripts
- win
- main.ts
- clone-or-update.sh
- export-for-server.ts
- session-log.ts
- App.tsx
- TopicList.tsx
- deploy.sh
- install-git-hooks.sh
- setup-deploy-key.sh
- setup-rest-info-user.sh
- Исправление путей к фото на сервере
- paths.ts
- useTopicLinkPicker.ts
- readAccounts
- fix-media-paths.ts
- media.ts

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 79 edges
2. `getUserDataRoot()` - 47 edges
3. `readSettings()` - 38 edges
4. `Viewer()` - 38 edges
5. `App()` - 30 edges
6. `readAccounts()` - 29 edges
7. `SettingsPage()` - 28 edges
8. `pullFromServer()` - 22 edges
9. `serverFetch()` - 19 edges
10. `pushToYandex()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `pushAccountsFile()` --calls--> `isServerReachable()`  [EXTRACTED]
  app/electron/server-sync.ts → app/electron/server-api.ts
- `AuthScreenProps` --references--> `PublicUser`  [EXTRACTED]
  app/src/components/AuthScreen.tsx → app/src/types.ts
- `SettingsPageProps` --references--> `PublicUser`  [EXTRACTED]
  app/src/components/SettingsPage.tsx → app/src/types.ts
- `copyTopicLink()` --calls--> `formatTopicMarkdownLink()`  [EXTRACTED]
  app/src/components/Viewer.tsx → app/src/lib/markdown.ts
- `SearchHit` --references--> `GuideItem`  [EXTRACTED]
  app/src/lib/search.ts → app/src/types.ts

## Import Cycles
- None detected.

## Communities (68 total, 6 thin omitted)

### Community 0 - "data.ts"
Cohesion: 0.20
Nodes (14): ParentTopicField(), ParentTopicFieldProps, TopicEditorModalProps, TopicLinkPicker(), TopicLinkPickerProps, compareTopicsByTitle(), getDescendantIds(), getFolders() (+6 more)

### Community 1 - "yandex-sync.ts"
Cohesion: 0.06
Nodes (86): readSettings(), setPendingChanges(), applyConflictResolutions(), asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic (+78 more)

### Community 2 - "auth-store.ts"
Cohesion: 0.14
Nodes (25): accountsPath(), clearEphemeralSessionOnStartup(), clearSession(), defaultAccounts(), defaultSettings(), ensureAuthFiles(), hashPassword(), loginUser() (+17 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App"
Cohesion: 0.18
Nodes (12): App(), handleInlineSave(), handleListFilterChange(), handlePush(), handleSave(), handleSaveImageDisplay(), pinSelectedTopic(), releasePinnedTopic() (+4 more)

### Community 5 - "Viewer"
Cohesion: 0.09
Nodes (22): fileExtLabel(), nodeText(), Viewer(), cancelEditing(), closeFind(), closeScaleEditor(), copyTopicLink(), downloadImage() (+14 more)

### Community 6 - "topic-media.ts"
Cohesion: 0.07
Nodes (67): resolveImageOwner(), downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc(), absFromRoot(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT (+59 more)

### Community 7 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, electron, electron-builder, @types/react, @types/react-dom, typescript, vite, vite-plugin-electron (+11 more)

### Community 8 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+15 more)

### Community 9 - "build"
Cohesion: 0.20
Nodes (10): build, appId, directories, executableName, extraResources, files, productName, output (+2 more)

### Community 10 - "REST INFO — инструкция для AI-агента"
Cohesion: 0.11
Nodes (18): graphify, Linux / production, REST INFO — инструкция для AI-агента, UI (`app/src/components/` + `lib/`), Windows (машина пользователя), Архитектура v2 (текущая), Версии, Владелец / bootstrap (+10 more)

### Community 11 - "routes/topics.ts"
Cohesion: 0.20
Nodes (16): getGlobalVersion(), acquireTopicLock(), DEPARTMENTS, isValidDepartment(), isWorkDepartmentId(), normalizeWorkDepartmentId(), refreshHasChildren(), releaseTopicLock() (+8 more)

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

### Community 18 - "index.ts"
Cohesion: 0.11
Nodes (25): getPool(), query(), withTransaction(), dataDir, __dirname, main(), mediaDir, root (+17 more)

### Community 19 - "prefs.ts"
Cohesion: 0.18
Nodes (14): AuthScreen(), forgetSavedLogin(), handleSubmit(), AuthScreenProps, ServerUrlForm(), findRememberedLogin(), loadRememberedLogin(), loadRememberedLogins() (+6 more)

### Community 20 - "push-yandex-restore.mjs"
Cohesion: 0.18
Nodes (17): args, countTopics(), DEFAULT_SRC, __dirname, diskPath(), dryRun, ensureDir(), JSON_FILES (+9 more)

### Community 21 - "Viewer.tsx"
Cohesion: 0.18
Nodes (14): ImageScaleDialog(), ImageScaleDialogProps, ImgMenuState, ScaleEditorState, applyDraftScale(), ViewerProps, clampImageScale(), getImageScale() (+6 more)

### Community 22 - "REST INFO — инструкция для серверного программиста"
Cohesion: 0.12
Nodes (16): API (кратко), REST INFO — инструкция для серверного программиста, Troubleshooting, Бэкап, Контакты / файлы документации в репо, Обновление сервера после изменений в Git, Требования к серверу, Что вы получите от администратора (+8 more)

### Community 23 - "REST INFO v1 — Яндекс.Диск (legacy)"
Cohesion: 0.13
Nodes (15): Git-тег, OAuth-токен Яндекс.Диска, REST INFO v1 — Яндекс.Диск (legacy), Архитектура v1, Вариант A — env-переключатель (без git checkout), Вариант B — git checkout, Восстановление данных на Диск из SQL-сервера, Когда использовать (+7 more)

### Community 24 - "Скрипты REST INFO"
Cohesion: 0.10
Nodes (20): `app/scripts/dist-ascii.js`, `app/scripts/upload-release.js`, `app/scripts/upload-update-manifest.js`, `scripts/pull-yandex-export.mjs`, `scripts/push-yandex-restore.mjs`, `scripts/server/clone-or-update.sh`, `scripts/server/deploy.sh`, `scripts/server/setup-deploy-key.sh` (+12 more)

### Community 25 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, declaration, esModuleInterop, module, moduleResolution, outDir, resolveJsonModule, rootDir (+5 more)

### Community 26 - "Миграция с Яндекс.Диска на SQL-сервер"
Cohesion: 0.15
Nodes (13): Миграция с Яндекс.Диска на SQL-сервер, Обзор, Откат на Яндекс.Диск, Поведение нового клиента, Способ A — папка `REST-INFO-export` (готова), Способ B — вручную с Яндекс.Диска, Способ C — повторный экспорт (скрипт), Частые проблемы (+5 more)

### Community 27 - "REST INFO — статус проекта (handoff)"
Cohesion: 0.14
Nodes (14): REST INFO — статус проекта (handoff), Данные, Документация, Исправления в ходе dev, Клиент (`app/`), Локальная dev-среда (Windows пользователя), Сервер (`server/`), Скрипты и восстановление (+6 more)

### Community 28 - "TopicEditorModal"
Cohesion: 0.15
Nodes (12): navigateBack(), navigateToTopic(), newDraftId(), TopicEditorModal(), handleParentIdChange(), handlePartyChange(), handleParentIdChange(), filterItemsByParty() (+4 more)

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
Cohesion: 0.29
Nodes (7): Legacy, Клиент — онлайн, Клиент — оффлайн, Конфликты, Обновления, Сервер, Чеклист тестирования REST INFO v2

### Community 35 - "REST INFO — клиент (Electron)"
Cohesion: 0.33
Nodes (6): REST INFO — клиент (Electron), Запуск dev, Ключевые файлы, Локальные данные, Публикация Setup на сервер, Сборка установщика

### Community 36 - "upload-release.js"
Cohesion: 0.40
Nodes (3): fileName, serverUrl, versionMatch

### Community 37 - "isStaffRole"
Cohesion: 0.21
Nodes (12): handleAuthenticated(), handleDepartmentChange(), resolveUserDepartment(), Header(), isDepartmentId(), loadSavedDepartment(), saveDepartment(), canEditContent() (+4 more)

### Community 39 - "lib/media-layout.ts"
Cohesion: 0.23
Nodes (19): absoluteMediaCandidates(), canonicalizeMediaRelativePath(), DEFAULT_MEDIA_DEPARTMENT, deleteTopicMediaFiles(), isMediaDepartmentId(), MEDIA_DEPARTMENT_IDS, MediaDepartmentId, mediaRelativePathCandidates() (+11 more)

### Community 40 - "types.ts"
Cohesion: 0.15
Nodes (26): HeaderProps, CONTENT_EDITOR_ROLES, Department, DepartmentId, DepartmentStorageStats, ExportManifest, GuideDocument, GuideFile (+18 more)

### Community 41 - "server-sync.ts"
Cohesion: 0.06
Nodes (60): AccountsData, normalizeServerUrl(), reconcileHasChildren(), putUser(), departmentById(), PENDING_OPERATIONS_FILE, clearPendingOperations(), hasPendingOperations() (+52 more)

### Community 42 - "Deploy keys (REST INFO)"
Cohesion: 0.40
Nodes (4): Deploy keys (REST INFO), GitHub, Дополнительная защита на сервере, Что здесь

### Community 43 - "SettingsPage"
Cohesion: 0.11
Nodes (28): assignableRoles(), coerceUsers(), coerceWhitelist(), formatBytes(), formatLogLine(), formatLogTime(), levelLabel(), SettingsPage() (+20 more)

### Community 44 - "app/package.json"
Cohesion: 0.18
Nodes (10): author, description, license, main, name, private, repository, type (+2 more)

### Community 45 - "TopicEditorModal.tsx"
Cohesion: 0.21
Nodes (17): handleAnswerPaste(), imageOwnerPayload(), insertFile(), insertPhoto(), handleAnswerPaste(), insertFile(), insertPhoto(), escapeMdLinkLabel() (+9 more)

### Community 46 - "nsis"
Cohesion: 0.22
Nodes (9): nsis, allowToChangeInstallationDirectory, createDesktopShortcut, createStartMenuShortcut, installerLanguages, language, oneClick, shortcutName (+1 more)

### Community 47 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, react, react-dom, react-markdown, remark-gfm, react, react-dom, react-markdown (+1 more)

### Community 48 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, dev, dist, dist:ascii, electron:dev, pack, preview

### Community 49 - "win"
Cohesion: 0.50
Nodes (4): win, artifactName, icon, target

### Community 51 - "main.ts"
Cohesion: 0.13
Nodes (35): getCurrentUser(), getRegistrationDepartment(), getWhitelist(), requireRole(), cacheServerUser(), fetchAdminUsersFromServer(), publicUsersFromServer(), readGuideFile() (+27 more)

### Community 53 - "export-for-server.ts"
Cohesion: 0.22
Nodes (11): defaultSource, manifest, copyFileSafe(), copyMediaTree(), countItems(), exportForServer(), ExportManifest, GUIDE_LIST_KEY (+3 more)

### Community 54 - "session-log.ts"
Cohesion: 0.22
Nodes (9): appendSessionLog(), clearSessionLogs(), entries, getSessionLogs(), listeners, notify(), onSessionLog(), SessionLogEntry (+1 more)

### Community 55 - "App.tsx"
Cohesion: 0.11
Nodes (17): defaultSync, resolveListFilter(), SettingsErrorBoundary, Search(), SearchProps, SyncConflictModal(), SyncConflictModalProps, loadSavedListFilter() (+9 more)

### Community 56 - "TopicList.tsx"
Cohesion: 0.19
Nodes (15): guideX(), highlightTitle(), rowMarginLeft(), TopicList(), TopicListProps, TreeNode(), buildTree(), getChildren() (+7 more)

### Community 61 - "Исправление путей к фото на сервере"
Cohesion: 0.18
Nodes (10): В чём проблема, Если что-то пошло не так, Исправление путей к фото на сервере, Кратко (для программиста), Кто делает, Шаг 0. Обновить код на сервере, Шаг 1. Предпросмотр (ничего не меняет), Шаг 2. Применить исправления (+2 more)

### Community 62 - "paths.ts"
Cohesion: 0.14
Nodes (16): BOOTSTRAP_ADMIN_EMAIL, canEditContent(), canEditDepartment(), CONTENT_EDITOR_ROLES, Department, DepartmentId, DEPARTMENTS, isStaffRole() (+8 more)

### Community 63 - "useTopicLinkPicker.ts"
Cohesion: 0.46
Nodes (6): TopicLinkPickerState, useTopicLinkPicker(), clampPickerPosition(), getTextareaCaretRect(), getActivePlusQuery(), replaceRangeWithTopicLink()

### Community 64 - "readAccounts"
Cohesion: 0.25
Nodes (25): addWhitelistEmail(), coerceAccountsData(), deleteUser(), ensureLocalOwner(), findOwner(), getOwnerEmail(), isOwnerEmail(), listUsersPublic() (+17 more)

### Community 65 - "fix-media-paths.ts"
Cohesion: 0.33
Nodes (10): bumpGlobalVersion(), DbRow, DiscoveredFile, discoverMediaFilesOnDisk(), consider(), walk(), indexByBasename(), isLegacyFlatPath() (+2 more)

### Community 67 - "media.ts"
Cohesion: 0.21
Nodes (9): canEditContent(), canEditDepartment(), isStaffRole(), requireRole(), ensureMediaDir(), ensureUpdatesDir(), mediaRouter, upload (+1 more)

## Knowledge Gaps
- **374 isolated node(s):** `SettingsData`, `SessionData`, `ROLE_RANK`, `defaultSource`, `manifest` (+369 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 450 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `yandex-sync.ts` to `compilerOptions`, `main.ts`, `topic-media.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `getUserDataRoot()` connect `yandex-sync.ts` to `auth-store.ts`, `topic-media.ts`, `server-sync.ts`, `main.ts`, `export-for-server.ts`, `paths.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `include` connect `compilerOptions` to `yandex-sync.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsData`, `SessionData`, `ROLE_RANK` to the rest of the system?**
  _374 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `yandex-sync.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.057971014492753624 - nodes in this community are weakly interconnected._
- **Should `auth-store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14461538461538462 - nodes in this community are weakly interconnected._