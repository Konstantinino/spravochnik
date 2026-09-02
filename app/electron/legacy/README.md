# Legacy Yandex Disk sync

Код legacy-синхронизации через Яндекс.Диск находится в:

- [`app/electron/yandex-sync.ts`](../app/electron/yandex-sync.ts)
- [`app/scripts/upload-update-manifest.js`](../app/scripts/upload-update-manifest.js)

Переключение на Yandex backend: `STORAGE_BACKEND=yandex` (см. [`app/electron/sync-backend.ts`](../app/electron/sync-backend.ts)).

Полная инструкция отката: [legacy-yandex-disk.md](legacy-yandex-disk.md)
