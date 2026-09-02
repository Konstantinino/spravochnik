# REST INFO — сервер API

Версия: **1.0.0** · Deploy: [../docs/DEPLOY-FOR-PROGRAMMER.md](../docs/DEPLOY-FOR-PROGRAMMER.md)

## Запуск

### Docker (production / Linux)

```bash
cd ..
cp .env.example .env
docker compose up -d --build
curl http://localhost:3000/health
```

### Windows dev (без Docker)

```powershell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm install
npm run dev:local
```

Embedded PostgreSQL на порту **5433**, API на **3000**.

### Обычный dev (нужен PostgreSQL)

```bash
export DATABASE_URL=postgres://...
npm run dev
```

## Импорт данных

```bash
npm run build
node dist/import-from-json.js /path/to/REST-INFO-export
```

Docker:

```bash
docker compose exec api node dist/import-from-json.js /import/REST-INFO-export
```

## Сброс пароля (recovery)

```bash
DATABASE_URL=postgres://... npx tsx src/reset-password.ts email@example.com newpassword
```

## API endpoints

| Method | Path | Auth |
|---|---|---|
| GET | `/health` | — |
| POST | `/auth/login`, `/auth/register` | — |
| GET | `/sync/changes` | JWT |
| GET/POST/PUT/DELETE | `/departments/:dept/topics` | JWT |
| POST | `/media/upload` | JWT |
| GET | `/admin/users` | admin |
| PUT | `/admin/users/:id` | admin (имя/пароль) |
| PUT | `/admin/users/:id/role` | admin |
| GET/POST/DELETE | `/admin/whitelist` | admin |
| POST | `/admin/releases` | admin |
| GET | `/app/update` | — |
| GET | `/app/download/:file` | — |

## Структура

```
src/
  index.ts           Express entry
  routes/            auth, admin, topics, sync, media, updates
  migrations/        SQL
  import-from-json.ts
  dev-local.ts       embedded Postgres starter
  reset-password.ts
```
