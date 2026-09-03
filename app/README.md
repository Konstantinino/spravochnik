# REST INFO — клиент (Electron)

Версия: **1.2.1** · Корневой README: [../README.md](../README.md) · AI handoff: [../AGENTS.md](../AGENTS.md)

## Запуск dev

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm install
npm run dev
```

Vite: `http://127.0.0.1:5173` · Electron main: `electron/main.ts`

## Сборка установщика

```powershell
npm run dist:ascii
# → release/REST-INFO-Setup-1.2.1.exe
```

## Ключевые файлы

| Путь | Назначение |
|---|---|
| `electron/main.ts` | IPC handlers |
| `electron/server-api.ts` | HTTP к REST API |
| `electron/server-sync.ts` | sync pull/push |
| `electron/sync-backend.ts` | server / yandex switch |
| `electron/auth-store.ts` | accounts, settings, session |
| `electron/preload.ts` | contextBridge API |
| `src/App.tsx` | React root |
| `src/components/AuthScreen.tsx` | вход + URL сервера |
| `src/components/SettingsPage.tsx` | admin settings |
| `src/components/Viewer.tsx` | просмотр/редактирование тем |

## Локальные данные

`%AppData%\rest-info\REST-INFO\` — guide JSON, accounts, media cache.

## Публикация Setup на сервер

```bash
RESTINFO_SERVER_URL=https://... RESTINFO_ADMIN_TOKEN=<jwt> \
  node scripts/upload-release.js release/REST-INFO-Setup-1.2.1.exe
```
