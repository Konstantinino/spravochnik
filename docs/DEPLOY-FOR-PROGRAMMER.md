# REST INFO — инструкция для серверного программиста

Развёртывание через GitHub: https://github.com/Konstantinino/spravochnik

> Статус проекта: [PROJECT-STATUS.md](PROJECT-STATUS.md) · AI handoff: [../AGENTS.md](../AGENTS.md)

---

## Что вы получите от администратора

1. **Доступ к репозиторию** (код сервера + клиента + Docker)
2. **Папку `REST-INFO-export`** — архивом (ZIP), **не в Git** (там пароли пользователей)

В архиве:
- `guide.json`, `guide_lawyers.json`, `guide_managers.json`, `guide_spp.json`, `templates.json`
- `accounts.json` (пользователи + whitelist)
- `media/` (изображения)
- `export-manifest.json` (сводка)

---

## Требования к серверу

- Linux (Ubuntu 22.04+ / Debian 12+)
- Docker 24+ и Docker Compose v2
- Домен с HTTPS (Let's Encrypt + nginx или свой reverse proxy)
- Открытый порт **443** (или 80 → редирект на 443)

---

## Шаг 1. Клонировать репозиторий

```bash
git clone https://github.com/Konstantinino/spravochnik.git
cd spravochnik
```

---

## Шаг 2. Настроить окружение

```bash
cp .env.example .env
nano .env
```

Обязательно задать:

| Переменная | Пример | Описание |
|---|---|---|
| `DB_PASSWORD` | длинная случайная строка | Пароль PostgreSQL |
| `JWT_SECRET` | длинная случайная строка | Секрет для JWT-токенов |
| `BOOTSTRAP_ADMIN_EMAIL` | kostya.alone18@yandex.ru | Email первого владельца (роль `owner` + whitelist) |
| `CORS_ORIGIN` | `*` или `https://...` | CORS для клиента |

---

## Шаг 3. Положить данные для импорта

```bash
# Распакуйте архив от администратора:
unzip REST-INFO-export.zip -d import/
# Должно быть: import/REST-INFO-export/guide.json, accounts.json, media/ ...
```

В `docker-compose.yml` уже смонтирован volume `./import:/import:ro`.

---

## Шаг 4. Запустить сервер

```bash
docker compose up -d --build
```

Проверка:

```bash
curl http://localhost:3000/health
# {"ok":true,"time":"..."}
```

---

## Шаг 5. Импорт данных (один раз)

```bash
docker compose exec api node dist/import-from-json.js /import/REST-INFO-export
```

Ожидаемый вывод: количество тем по отделам, пользователей, «Media copied», «Import complete».

Проверка:

```bash
curl http://localhost:3000/departments/support/topics
# JSON с questions (≈85 тем)
```

---

## Шаг 6. Production с nginx + HTTPS

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

- Настройте SSL в `nginx/ssl/` или подключите свой reverse proxy к порту **3000** контейнера `api`
- Клиенты должны ходить на **`https://ваш-домен.ru`**, не на IP:3000

---

## Шаг 7. Сборка и публикация клиента (Windows)

На машине с Windows / CI:

```bash
cd app
npm install
npm run dist:ascii
```

Появится `app/release/REST-INFO-Setup-1.2.1.exe` (~80+ МБ).

Перед `upload-release.js` на production nginx нужен `client_max_body_size` ≥ 120M (см. `nginx/nginx.conf`). Иначе будет **413**. Обход: скопировать Setup в `/data/updates/` на сервере и вызвать `POST /admin/releases` (см. `docs/server-deploy.md`).

Загрузка на сервер (от имени admin, с JWT-токеном):

```bash
cd app
RESTINFO_SERVER_URL=https://ваш-домен.ru \
RESTINFO_ADMIN_TOKEN=<jwt> \
  node scripts/upload-release.js release/REST-INFO-Setup-1.2.1.exe
```

---

## Шаг 8. Что передать администратору

Сообщите администратору:

1. **URL сервера:** `https://ваш-домен.ru`
2. **Что импорт выполнен** (темы и пользователи на месте)
3. **Ссылку на установщик** или что он доступен через «Обновить» в приложении

Администратор укажет URL на экране входа (шестерёнка) и раздаст установщик сотрудникам.

---

## API (кратко)

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/health` | Healthcheck |
| POST | `/auth/login` | Вход |
| POST | `/auth/register` | Регистрация (whitelist) |
| GET | `/sync/changes?full=true` | Полная синхронизация |
| GET | `/departments/:dept/topics` | Темы отдела |
| POST | `/media/upload` | Загрузка медиа |
| GET | `/app/update` | Проверка версии клиента |

---

## Обновление сервера после изменений в Git

```bash
git pull
docker compose up -d --build
```

Миграции БД применяются автоматически при старте `api`.

---

## Бэкап

```bash
# База
docker compose exec postgres pg_dump -U restinfo restinfo > backup-$(date +%F).sql

# Медиа
docker run --rm -v spravochnik_media_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/media-backup.tar.gz -C /data .
```

---

## Troubleshooting

| Проблема | Решение |
|---|---|
| `api` не стартует | `docker compose logs api` |
| Пустые темы после импорта | Проверьте путь `/import/REST-INFO-export` |
| Клиент «Нет связи» | HTTPS, firewall, CORS |
| Ошибка кодировки emoji | Docker/Linux — UTF-8 по умолчанию OK |
| Импорт users: 0 | В `accounts.json` должны быть `passwordHash` и `salt` |

---

## Контакты / файлы документации в репо

- [docs/server-deploy.md](server-deploy.md) — краткий deploy
- [docs/migration-from-yandex.md](migration-from-yandex.md) — миграция с Диска
