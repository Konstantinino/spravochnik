# REST INFO — веб-клиент

Браузерный SPA в `main` (общий UI с десктопом через alias `@app`). Production: **https://info.r-est.ru**.

## Решения

- Сессия: **httpOnly cookie** (`POST /auth/login-web`, `/auth/register-web`, `/auth/logout-web`)
- Same-origin: URL сервера по умолчанию = `window.location.origin` (можно переопределить на экране входа)
- Функции: паритет с десктопом (locks тем и **порядка** с `clientId`, медиа по HTTP `/media/media/…`)
- Данные: только с сервера, без офлайн-очереди
- Favicon: белая **R** на красном (`public/favicon.*`)

## Dev (Windows)

1. API с CORS для веб-dev:

```powershell
cd server
$env:CORS_ORIGIN = "http://127.0.0.1:5174"
$env:COOKIE_SECURE = "false"
npm run dev:local
```

2. Веб:

```powershell
cd web
npm install
npm run dev
```

3. Браузер: http://127.0.0.1:5174 — URL сервера `http://127.0.0.1:3000`

Vite проксирует `/auth`, `/media`, … на API.

## Production

SPA **собирается в образ API** (`server/Dockerfile`, context = корень репо, `COPY web/dist /data/web`).  
**Не** монтировать пустой `./web/dist` поверх `/data/web` — это скрывает файлы из образа.

```bash
git pull
COMPOSE_FILE=docker-compose.yml docker compose up -d --build
curl -s https://info.r-est.ru/health
# web.index=true, web.assets>=1, build=…
```

Env: `CORS_ORIGIN=https://info.r-est.ru`, `COOKIE_SECURE=true`, host nginx → `127.0.0.1:3000`.

## Сборка

```powershell
cd web
npm install
npm run build
# dist/ уходит в git и в Docker build context
```

`npm run build` = только Vite (UI из `../app/src`, без `app/node_modules` на сервере).  
Типы: `npm run typecheck` (удобнее с установленным `app/`).
