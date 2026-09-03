# REST INFO — развёртывание сервера (Docker)

Инструкция для программиста, который поднимает backend на своём сервере.

## Требования

- Linux-сервер с Docker 24+ и Docker Compose v2
- Домен с HTTPS (рекомендуется nginx + Let's Encrypt)
- Открытые порты: 443 (prod) или 3000 (dev/test)

## Быстрый старт

```bash
git clone https://github.com/Konstantinino/spravochnik.git
cd spravochnik
cp .env.example .env
# Отредактируйте .env: DB_PASSWORD, JWT_SECRET, BOOTSTRAP_ADMIN_EMAIL
docker compose up -d --build
```

Проверка:

```bash
curl http://localhost:3000/health
# {"ok":true,"time":"..."}
```

## Production (nginx)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Настройте SSL-сертификаты в `nginx/ssl/` или замените `nginx/nginx.conf` на свой reverse proxy.

## Переменные окружения (.env)

| Переменная | Описание |
|---|---|
| `DB_PASSWORD` | Пароль PostgreSQL |
| `JWT_SECRET` | Секрет для JWT (длинная случайная строка) |
| `BOOTSTRAP_ADMIN_EMAIL` | Email владельца (авто-admin + whitelist) |
| `CORS_ORIGIN` | `*` или origin клиента |

## Первичный импорт данных

**Перед запуском клиентов** импортируйте актуальный экспорт от администратора (см. [migration-from-yandex.md](migration-from-yandex.md)).

1. Администратор создаёт `REST-INFO-export` в приложении (**Настройки → Экспортировать для сервера**)
2. Скопируйте папку на сервер в `import/`:

```bash
cp -r REST-INFO-export ./import/
```

3. Импорт после старта контейнеров:

```bash
docker compose up -d --build
docker compose exec api node dist/import-from-json.js /import/REST-INFO-export
```

Альтернативные источники: папка `REST INFO` с Яндекс.Диска или `%AppData%\rest-info\REST-INFO\` с рабочего ПК.

Скрипт импортирует `guide*.json`, `templates.json`, `accounts.json` и копирует `media/`. Проверьте `export-manifest.json` в архиве.

## Публикация обновления приложения

1. Соберите Setup.exe на Windows: `cd app && npm run dist:ascii`
2. На сервере nginx должен допускать тело запроса ≥ размера Setup (`client_max_body_size 120M` в `nginx/nginx.conf`). После правки: `docker compose … up -d` / reload nginx.
3. Загрузите на сервер:

```bash
cd app
RESTINFO_SERVER_URL=https://your-server RESTINFO_ADMIN_TOKEN=<jwt> \
  node scripts/upload-release.js release/REST-INFO-Setup-1.2.1.exe
```

**Обход 413 без правки nginx:** скопируйте `.exe` в volume `/data/updates/` на сервере и зарегистрируйте релиз:

```bash
# пример: файл уже на хосте рядом с compose
docker compose cp ./REST-INFO-Setup-1.2.1.exe api:/data/updates/
```

```powershell
# затем с ПК (JWT admin):
$body = '{"version":"1.2.1","setupFilename":"REST-INFO-Setup-1.2.1.exe","notes":""}'
Invoke-RestMethod -Uri "https://info.r-est.ru/admin/releases" -Method POST `
  -Headers @{ Authorization = "Bearer $env:RESTINFO_ADMIN_TOKEN" } `
  -ContentType "application/json" -Body $body
```

Или вручную: положите `.exe` в volume `/data/updates/` и вызовите `POST /admin/releases`.

## Бэкап

```bash
# PostgreSQL
docker compose exec postgres pg_dump -U restinfo restinfo > backup.sql

# Медиа
docker run --rm -v spravochnik_media_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/media-backup.tar.gz -C /data .
```

## Обновление

```bash
git pull
docker compose up -d --build
```

Миграции применяются автоматически при старте контейнера `api`.

## API endpoints (кратко)

- `GET /health` — healthcheck
- `POST /auth/login`, `POST /auth/register`
- `GET /sync/changes?since=` — инкрементальная синхронизация
- `GET/POST/PUT/DELETE /departments/:dept/topics`
- `POST /media/upload`, `GET /media/*`
- `GET /app/update` — проверка версии клиента

Полная схема — в [migration-from-yandex.md](migration-from-yandex.md).

## Troubleshooting

| Проблема | Решение |
|---|---|
| `api` не стартует | `docker compose logs api` — проверьте DATABASE_URL |
| Клиент «Нет связи» | HTTPS, firewall, CORS |
| Пустые темы после импорта | Проверьте путь к JSON, `docker compose logs api` |
