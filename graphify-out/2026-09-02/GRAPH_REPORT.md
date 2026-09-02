# Graph Report - spravochnik-repo  (2026-09-02)

## Corpus Check
- 52 files · ~33,841 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 538 nodes · 1227 edges · 16 communities (14 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e99c08d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- yandex-sync.ts
- updates.ts
- compilerOptions
- App
- Viewer.tsx
- paths.ts
- package.json
- compilerOptions
- build
- AGENTS.md
- guide-merge.ts
- dist-ascii.js
- upload-update-manifest.js
- REST INFO

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 41 edges
2. `getUserDataRoot()` - 34 edges
3. `Viewer()` - 26 edges
4. `App()` - 24 edges
5. `readSettings()` - 21 edges
6. `pushToYandex()` - 21 edges
7. `compilerOptions` - 18 edges
8. `readAccounts()` - 17 edges
9. `pullFromYandex()` - 16 edges
10. `pushResolvedLocalToYandex()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `registerIpc()` --calls--> `downloadMediaImage()`  [EXTRACTED]
  app/electron/main.ts → app/electron/media-download.ts
- `registerIpc()` --calls--> `cleanupTopicImageOrphans()`  [EXTRACTED]
  app/electron/main.ts → app/electron/topic-media.ts
- `registerIpc()` --calls--> `migrateDraftImagesToTopic()`  [EXTRACTED]
  app/electron/main.ts → app/electron/topic-media.ts
- `registerIpc()` --calls--> `saveImageFileForOwner()`  [EXTRACTED]
  app/electron/main.ts → app/electron/topic-media.ts
- `registerIpc()` --calls--> `saveNativeImageForOwner()`  [EXTRACTED]
  app/electron/main.ts → app/electron/topic-media.ts

## Import Cycles
- None detected.

## Communities (16 total, 1 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.05
Nodes (62): defaultSync, AuthScreenProps, Header(), HeaderProps, ParentTopicField(), ParentTopicFieldProps, Search(), SearchProps (+54 more)

### Community 1 - "yandex-sync.ts"
Cohesion: 0.06
Nodes (110): AccountsData, accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), defaultAccounts(), defaultSettings(), deleteUser() (+102 more)

### Community 2 - "updates.ts"
Cohesion: 0.17
Nodes (15): APP_UPDATE_FILE, YANDEX_FOLDER, compareVersions(), downloadFromYandex(), emit(), fetchYandexManifest(), folderPath(), infoFromManifest() (+7 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+12 more)

### Community 4 - "App"
Cohesion: 0.07
Nodes (30): App(), handleAuthenticated(), handleDepartmentChange(), handleInlineSave(), handleListFilterChange(), handlePush(), handleSave(), runPush() (+22 more)

### Community 5 - "Viewer.tsx"
Cohesion: 0.07
Nodes (35): ImageScaleDialog(), ImageScaleDialogProps, TopicEditorModal(), handleAnswerPaste(), handlePartyChange(), imageOwnerPayload(), insertPhoto(), ImgMenuState (+27 more)

### Community 6 - "paths.ts"
Cohesion: 0.10
Nodes (39): downloadMediaImage(), IMAGE_EXTENSIONS, localPathFromSpravochnikUrl(), suggestedNameFromSrc(), ACCOUNTS_FILE, Department, DepartmentId, DEPARTMENTS (+31 more)

### Community 7 - "package.json"
Cohesion: 0.04
Nodes (46): author, dependencies, react, react-dom, react-markdown, remark-gfm, description, devDependencies (+38 more)

### Community 8 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+15 more)

### Community 9 - "build"
Cohesion: 0.09
Nodes (23): build, appId, directories, executableName, extraResources, files, nsis, productName (+15 more)

### Community 11 - "guide-merge.ts"
Cohesion: 0.25
Nodes (13): applyConflictResolutions(), asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic, mergeGuideFile(), MergeGuideResult (+5 more)

### Community 12 - "dist-ascii.js"
Cohesion: 0.17
Nodes (9): { execSync }, fs, nmDst, nmSrc, path, projectRoot, releaseDst, releaseSrc (+1 more)

### Community 13 - "upload-update-manifest.js"
Cohesion: 0.41
Nodes (11): deleteOldSetups(), deleteRemoteFile(), ensureDir(), folderPath(), fs, listRemoteFiles(), main(), path (+3 more)

### Community 14 - "REST INFO"
Cohesion: 0.12
Nodes (14): См. корневой [README.md](../README.md), REST INFO, Интерфейс, Как вносить изменения в код/данные, Как выпустить новую версию, Обновления приложения, Первый вход, Правки в уже установленном приложении (+6 more)

## Knowledge Gaps
- **142 isolated node(s):** `Установка на ПК`, `Роли`, `Интерфейс`, `Как выпустить новую версию`, `Синхронизация (Яндекс.Диск)` (+137 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 191 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `paths.ts` to `yandex-sync.ts`, `updates.ts`, `compilerOptions`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `include` connect `compilerOptions` to `paths.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Установка на ПК`, `Роли`, `Интерфейс` to the rest of the system?**
  _142 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05329153605015674 - nodes in this community are weakly interconnected._
- **Should `yandex-sync.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05823554976097349 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._