# Скрипты REST INFO

Краткое описание всех служебных скриптов в репозитории.

---

## Обновления приложения (актуальные)

### `app/scripts/upload-release.js`

**Зачем:** опубликовать новый `Setup.exe` на **SQL-сервере** (не на Яндекс.Диск).

**Когда:** после сборки установщика администратор или CI выкладывает релиз на production.

```powershell
cd app
npm run dist:ascii

$env:RESTINFO_SERVER_URL = "https://restinfo.example.com"
$env:RESTINFO_ADMIN_TOKEN = "<JWT админа>"
node scripts/upload-release.js release/REST-INFO-Setup-1.2.0.exe
```

**Что делает:**
1. Загружает `.exe` на сервер (`POST /media/upload`)
2. Регистрирует версию (`POST /admin/releases`)
3. Клиенты с `serverUrl` при **наличии сети** проверяют `GET /app/update` и скачивают установщик с сервера

---

### `app/scripts/dist-ascii.js`

**Зачем:** собрать `Setup.exe`, если путь проекта содержит кириллицу (Windows).

```powershell
cd app
npm run dist:ascii
```

Вызывается через `npm run dist:ascii` — копирует проект во временную ASCII-папку и запускает electron-builder.

---

## Миграция с Яндекс.Диска (разовые)

### `scripts/pull-yandex-export.mjs`

**Зачем:** скачать папку `REST INFO` с Яндекс.Диска в `REST-INFO-export/` (JSON + media).

**Когда:** однократно при переходе на SQL или для бэкапа.

```powershell
$env:YANDEX_TOKEN = "<OAuth-токен>"
node scripts/pull-yandex-export.mjs
```

**Результат:** `REST-INFO-export/guide*.json`, `accounts.json`, `media/`, `export-manifest.json`.

---

### `scripts/push-yandex-restore.mjs`

**Зачем:** залить локальный бэкап **обратно на Яндекс.Диск** (восстановление после сбоя).

```powershell
$env:YANDEX_TOKEN = "<токен>"

# Проверка без загрузки:
node scripts/push-yandex-restore.mjs --dry-run

# Только JSON (темы, пользователи):
node scripts/push-yandex-restore.mjs --json-only

# Только картинки:
node scripts/push-yandex-restore.mjs --media-only

# Всё:
node scripts/push-yandex-restore.mjs [путь-к-папке-бэкапа]
```

По умолчанию источник — `REST-INFO-export/` в корне репозитория.

---

## Импорт на SQL-сервер

### `server/src/import-from-json.ts` → `npm run import-json`

**Зачем:** загрузить `REST-INFO-export` в PostgreSQL.

```bash
cd server
npm run build
node dist/import-from-json.js ../REST-INFO-export
```

В Docker:

```bash
docker compose exec api node dist/import-from-json.js /import/REST-INFO-export
```

---

### `server/src/reset-password.ts`

**Зачем:** сбросить пароль пользователя в БД (recovery).

```bash
DATABASE_URL=postgres://... npx tsx src/reset-password.ts email@example.com newpassword
```

---

## Устаревшие (legacy)

### `app/scripts/upload-update-manifest.js`

**Было:** публикация `app-update.json` и Setup на **Яндекс.Диск**.

**Сейчас:** не используется в v2. Вместо него — `upload-release.js` на SQL-сервер.

Оставлен только для отката на старую схему (`STORAGE_BACKEND=yandex`).

---

## Сводка

| Скрипт | Куда | Актуален в v2 |
|---|---|---|
| `upload-release.js` | SQL-сервер | ✅ да |
| `dist-ascii.js` | локальная сборка | ✅ да |
| `pull-yandex-export.mjs` | Диск → локально | разово |
| `push-yandex-restore.mjs` | локально → Диск | разово / аварийно |
| `import-from-json.js` | JSON → PostgreSQL | ✅ да |
| `reset-password.ts` | PostgreSQL | ✅ да |
| `upload-update-manifest.js` | Яндекс.Диск | ❌ legacy |
