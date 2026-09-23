# REST INFO — веб-клиент

Браузерная версия на ветке `feature/web`. Десктоп (`app/`) не изменяется.

## Решения (зафиксировано)

- Сессия: **httpOnly cookie** (`POST /auth/login-web`, `/auth/register-web`, `/auth/logout-web`)
- URL сервера: **ввод на экране входа** (localStorage)
- Функции: **паритет с десктопом** (UI общий — `app/src` через alias `@app`)
- Данные: только с сервера, без офлайн-очереди

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

3. В браузере: http://127.0.0.1:5174 — URL сервера `http://127.0.0.1:3000`

Vite проксирует `/auth`, `/media`, … на API, cookie работает с одного origin (5174).

## Production

- Один домен: nginx отдаёт SPA и проксирует API **или** статика + API на том же host (cookie `SameSite=Lax`).
- `CORS_ORIGIN=https://ваш-домен`, `COOKIE_SECURE=true` (HTTPS).

## Сборка

```powershell
cd web
npm run build
# dist/ → nginx root
```
