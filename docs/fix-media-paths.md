# Исправление путей к фото на сервере

## В чём проблема

В базе у части фото **старый путь** (`media/images/uuid.jpg`), а файл на диске лежит **правильно** (`media/support/91/images/uuid.jpg`). Sync запрашивает путь из базы → 404 → ошибки в журнале.

**Исправление нужно один раз** (после импорта с legacy-путями). Повторно запускать не требуется.

---

## Простой способ — с вашего Windows-ПК (как установщик)

Так же, как вы публикуете `Setup.exe` через `upload-release.js`: URL сервера + токен владельца, без SSH.

### Шаг 1. Один раз обновить сервер

Программист (или вы на сервере) — обычный деплой API:

```bash
git pull
docker compose build api
docker compose up -d api
```

Без этого шага команда с ПК вернёт 404 — endpoint ещё не на сервере.

### Шаг 2. Предпросмотр (ничего не меняет)

PowerShell на **вашем ПК**:

```powershell
cd app

$env:RESTINFO_SERVER_URL = "https://info.r-est.ru"
$env:RESTINFO_ADMIN_TOKEN = "ВАШ-JWT-ТОКЕН"

node scripts/fix-media-paths.js
```

Токен — тот же, что для загрузки Setup (владелец; можно взять из DevTools / настроек, если сохранён).

Должно показать ~107 строк `FIX legacy` и `Would update path: 107`.

### Шаг 3. Применить

```powershell
node scripts/fix-media-paths.js --apply
```

В конце: `Done. Нажмите «Синхронизировать»…`

### Шаг 4. В REST INFO

**Синхронизировать** — ошибки `media/images/…` должны исчезнуть.

---

## Альтернатива — прямо на сервере (SSH)

Если удобнее терминал на сервере:

```bash
docker compose exec api node dist/fix-media-paths.js          # preview
docker compose exec api node dist/fix-media-paths.js --apply
```

---

## Проверка

```bash
curl -I "https://info.r-est.ru/media/media/support/91/images/39d865a4-b19b-4d97-91bf-14ed59c19532.jpg"
```

Ожидается **HTTP/1.1 200 OK**.

---

## Если не работает

| Проблема | Решение |
|---|---|
| `HTTP 404` на `/admin/fix-media-paths` | Сервер не обновлён — шаг 1 |
| `403` | Нужен токен **владельца** (owner), не редактора |
| `Missing on disk` много | Файлов нет на сервере — переимпорт `REST-INFO-export` с `media/` |
