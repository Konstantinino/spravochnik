# Миграция с Яндекс.Диска на SQL-сервер

> **Статус (2026-09-02):** экспорт выполнен → папка `REST-INFO-export/` готова. Ожидается import на production. См. [PROJECT-STATUS.md](PROJECT-STATUS.md).

## Обзор

REST INFO v2 использует self-hosted сервер (PostgreSQL + REST API + Docker) вместо синхронизации через Яндекс.Диск.

**Важно:** на production-сервере должны оказаться **актуальные** данные с рабочего ПК или с Яндекс.Диска — не пустая база и не dev-копия с `127.0.0.1`.

---

## Шаг 1. Экспорт данных (администратор, на рабочем ПК)

### Способ A — папка `REST-INFO-export` (готова)

В корне проекта (или архив от администратора) — полный снимок с Яндекс.Диска.
Передать программисту **ZIP-архивом**, не через Git.

### Способ B — вручную с Яндекс.Диска

Скачайте папку **`REST INFO`** с Диска целиком.

### Способ C — повторный экспорт (скрипт)

```bash
YANDEX_TOKEN=... node scripts/pull-yandex-export.mjs
```

---

## Шаг 2. Передать архив программисту

Отправьте папку `REST-INFO-export` (или `REST INFO` с Диска) архивом на сервер — USB, облако, `scp`.

---

## Шаг 3. Импорт на сервере (программист)

Следуйте [server-deploy.md](server-deploy.md):

```bash
git clone https://github.com/Konstantinino/spravochnik.git
cd spravochnik
cp .env.example .env
# Отредактируйте .env: DB_PASSWORD, JWT_SECRET, BOOTSTRAP_ADMIN_EMAIL

# Положите экспорт в import/
cp -r /path/to/REST-INFO-export ./import/

docker compose up -d --build
docker compose exec api node dist/import-from-json.js /import/REST-INFO-export
```

Проверка:

```bash
curl http://localhost:3000/health
curl -H "Authorization: Bearer <token>" http://localhost:3000/departments/support/topics
```

---

## Шаг 4. Обновление клиентов

1. Установите `REST-INFO-Setup-*.exe` (v1.2+)
2. Укажите **URL production-сервера** (не `127.0.0.1`)
3. Войдите — приложение выполнит full sync

---

## Шаг 5. Отключение Яндекс.Диска

После успешной миграции всех ПК можно перестать использовать OAuth-токен Диска.

---

## Поведение нового клиента

| Действие | Поведение |
|---|---|
| Чтение тем | Локальный кэш — работает оффлайн |
| Редактирование онлайн | Сразу на сервер + локально |
| Редактирование оффлайн | Локально + очередь + «Синхронизировать» |
| Старт приложения | Инкрементальный pull (`GET /sync/changes?since=`) |
| Конфликт версий | Модалка с выбором + сравнение рядом |
| Редактирование темы | Блокировка на сервере (5 мин) |

---

## Частые проблемы

| Проблема | Решение |
|---|---|
| На сервере мало тем | Экспорт с ПК **до** перехода на server URL; проверьте `export-manifest.json` |
| Нет пользователей | В экспорте нужен `accounts.json` **с passwordHash** — скачайте с Диска или экспортируйте до первого входа на пустой сервер |
| Нет картинок | В экспорт должна попасть папка `media/` — с Диска `REST INFO/media` |
| `127.0.0.1` — тест | Production URL задаёт программист (HTTPS) |

---

## Откат на Яндекс.Диск

См. [legacy-yandex-disk.md](legacy-yandex-disk.md).
