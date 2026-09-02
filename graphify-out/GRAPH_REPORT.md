# Graph Report - spravochnik-repo  (2026-09-02)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 491 nodes · 1144 edges · 16 communities (14 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d088dd5b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- yandex-sync.ts
- main.ts
- compilerOptions
- App
- Viewer
- topic-media.ts
- package.json
- compilerOptions
- build
- updates.ts
- guide-merge.ts
- dist-ascii.js
- upload-update-manifest.js
- SettingsPage

## God Nodes (most connected - your core abstractions)
1. `registerIpc()` - 39 edges
2. `getUserDataRoot()` - 32 edges
3. `Viewer()` - 23 edges
4. `readSettings()` - 21 edges
5. `pushToYandex()` - 21 edges
6. `compilerOptions` - 18 edges
7. `readAccounts()` - 17 edges
8. `App()` - 17 edges
9. `pullFromYandex()` - 16 edges
10. `pushResolvedLocalToYandex()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `AuthScreenProps` --references--> `PublicUser`  [EXTRACTED]
  app/src/components/AuthScreen.tsx → app/src/types.ts
- `ParentTopicFieldProps` --references--> `GuideItem`  [EXTRACTED]
  app/src/components/ParentTopicField.tsx → app/src/types.ts
- `SearchProps` --references--> `SupportParty`  [EXTRACTED]
  app/src/components/Search.tsx → app/src/types.ts
- `SearchHit` --references--> `GuideItem`  [EXTRACTED]
  app/src/lib/search.ts → app/src/types.ts
- `PublicUser` --references--> `UserRole`  [EXTRACTED]
  app/electron/auth-store.ts → app/electron/paths.ts

## Import Cycles
- None detected.

## Communities (16 total, 1 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.06
Nodes (66): defaultSync, Header(), HeaderProps, ParentTopicField(), ParentTopicFieldProps, Search(), SearchProps, ASSIGNABLE_ROLES (+58 more)

### Community 1 - "yandex-sync.ts"
Cohesion: 0.10
Nodes (60): AccountsData, readSettings(), setPendingChanges(), getUserDataRoot(), baseDir(), basePathFor(), readBaseGuide(), writeAllGuideBasesFromLocal() (+52 more)

### Community 2 - "main.ts"
Cohesion: 0.10
Nodes (57): accountsPath(), addWhitelistEmail(), clearEphemeralSessionOnStartup(), clearSession(), defaultAccounts(), defaultSettings(), deleteUser(), ensureAuthFiles() (+49 more)

### Community 3 - "compilerOptions"
Cohesion: 0.05
Nodes (39): devDependencies, electron, electron-builder, @types/react, @types/react-dom, typescript, vite, vite-plugin-electron (+31 more)

### Community 4 - "App"
Cohesion: 0.09
Nodes (22): App(), handleAuthenticated(), handleDepartmentChange(), handlePush(), handleSave(), runPush(), AuthScreen(), handleSubmit() (+14 more)

### Community 5 - "Viewer"
Cohesion: 0.09
Nodes (20): ImageScaleDialog(), ImageScaleDialogProps, Viewer(), applyDraftScale(), closeFind(), closeScaleEditor(), openImageMenu(), persistDisplay() (+12 more)

### Community 6 - "topic-media.ts"
Cohesion: 0.17
Nodes (26): draftImageRelativePath(), getDraftImagesDir(), getTopicImagesDir(), PENDING_MEDIA_FILE, topicImageRelativePath(), clearPendingMedia(), normalizeRel(), PendingMedia (+18 more)

### Community 7 - "package.json"
Cohesion: 0.07
Nodes (27): author, dependencies, react, react-dom, react-markdown, remark-gfm, description, license (+19 more)

### Community 8 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+15 more)

### Community 9 - "build"
Cohesion: 0.09
Nodes (23): build, appId, directories, executableName, extraResources, files, nsis, productName (+15 more)

### Community 10 - "updates.ts"
Cohesion: 0.17
Nodes (16): APP_UPDATE_FILE, YANDEX_FOLDER, compareVersions(), downloadFromYandex(), emit(), fetchYandexManifest(), folderPath(), infoFromManifest() (+8 more)

### Community 11 - "guide-merge.ts"
Cohesion: 0.25
Nodes (13): applyConflictResolutions(), asTopicMap(), deepEqual(), detectListKey(), GuideListKey, GuideTopic, mergeGuideFile(), MergeGuideResult (+5 more)

### Community 12 - "dist-ascii.js"
Cohesion: 0.17
Nodes (9): { execSync }, fs, nmDst, nmSrc, path, projectRoot, releaseDst, releaseSrc (+1 more)

### Community 13 - "upload-update-manifest.js"
Cohesion: 0.41
Nodes (11): deleteOldSetups(), deleteRemoteFile(), ensureDir(), folderPath(), fs, listRemoteFiles(), main(), path (+3 more)

## Knowledge Gaps
- **128 isolated node(s):** `SettingsPageProps`, `ImgMenuState`, `ScaleEditorState`, `TopicSearchMatch`, `Department` (+123 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 171 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `electron` connect `compilerOptions` to `main.ts`, `updates.ts`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `compilerOptions` to `package.json`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Viewer()` (e.g. with `close()` and `onKey()`) actually correct?**
  _`Viewer()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SettingsPageProps`, `ImgMenuState`, `ScaleEditorState` to the rest of the system?**
  _128 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05917602996254682 - nodes in this community are weakly interconnected._
- **Should `yandex-sync.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0967741935483871 - nodes in this community are weakly interconnected._
- **Should `main.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09518773135906927 - nodes in this community are weakly interconnected._