# REST INFO v1 — Яндекс.Диск (legacy)

Документация для **отката** на версию с синхронизацией через Яндекс.Диск, если потребуется вернуться к старой схеме.

## Когда использовать

- Сервер недоступен длительное время и нужен экстренный откат
- Тестирование старой схемы синхронизации
- Восстановление из бэкапа на Диске

## Архитектура v1

```
Electron PC  ←→  JSON файлы локально (%AppData%\rest-info\REST-INFO\)
                      ↕
              Яндекс.Диск REST API
              папка: REST INFO/
```

**Нет SQL, нет Docker, нет backend-сервера.**

## Структура на Яндекс.Диске

```
REST INFO/
├── guide.json
├── guide_lawyers.json
├── guide_managers.json
├── guide_spp.json
├── templates.json
├── accounts.json
├── sync.lock.json          ← блокировка синхронизации (90 сек)
├── app-update.json         ← манифест обновлений
├── media/
│   └── {topicId}/images/…
└── updates/
    └── REST-INFO-Setup-*.exe
```

## Локальные файлы клиента

```
%AppData%\rest-info\REST-INFO\
├── guide*.json, templates.json, accounts.json
├── settings.json           ← yandexToken, hasPendingChanges
├── session.json
├── pending-media.json      ← очередь медиа на upload
├── pending-operations.json ← (только v2)
└── .sync-base/             ← снимки для трёхстороннего merge
```

## OAuth-токен Яндекс.Диска

1. Создайте приложение в [Яндекс OAuth](https://oauth.yandex.ru/)
2. Получите токен с правами на Яндекс.Диск
3. В приложении REST INFO: экран входа → шестерёнка → вставьте токен `y0_...`

Токен хранится в `settings.json` → поле `yandexToken`.

## Синхронизация v1

- **Pull** — автоматически при старте (через 800 мс)
- **Push** — кнопка «Синхронизировать» (редактор/админ)
- **Merge** — по `id` темы; конфликт → модалка выбора
- **Lock** — `sync.lock.json` на Диске (90 сек TTL)
- **Media** — только изменённые файлы из `pending-media.json`

Ключевые модули (в git):

- `app/electron/yandex-sync.ts`
- `app/electron/guide-merge.ts`
- `app/electron/sync-base.ts`
- `app/electron/pending-media.ts`
- `app/electron/updates.ts` (режим Yandex)
- `app/scripts/upload-update-manifest.js`

## Обновления приложения v1

1. Поднять `version` в `app/package.json`
2. Обновить `app/resources/data/app-update.json`
3. `npm run dist:ascii`
4. `node scripts/upload-update-manifest.js release/REST-INFO-Setup-x.y.z.exe`

## Откат с v2 (SQL) на v1 (Диск)

### Вариант A — env-переключатель (без git checkout)

```bash
# Запуск dev с Yandex backend
set STORAGE_BACKEND=yandex
npm run electron:dev
```

Для production-сборки задайте `STORAGE_BACKEND=yandex` в окружении Electron main process.

### Вариант B — git checkout

```bash
git tag v1.yandex-disk   # тег до миграции (если создан)
git checkout v1.yandex-disk
cd app && npm install && npm run dist:ascii
```

### После отката

1. В `settings.json` укажите `yandexToken` (уберите `serverUrl` / `authToken` или оставьте — при `STORAGE_BACKEND=yandex` используется Диск)
2. Убедитесь, что папка `REST INFO` на Диске актуальна
3. Переустановите Setup.exe старой ветки

## Восстановление данных на Диск из SQL-сервера

Если нужно вернуть данные **с сервера на Диск**:

1. Экспортируйте JSON через API (`GET /departments/:dept/topics`) или pg_dump + скрипт
2. Залейте JSON в папку `REST INFO` на Диске
3. Скопируйте `media/` volume на Диск в `REST INFO/media/`

## Git-тег

Рекомендуется создать тег **до** миграции:

```bash
git tag -a v1.yandex-disk -m "Last version with Yandex Disk sync"
git push origin v1.yandex-disk
```

## Роли и аккаунты

Логика та же: `accounts.json` на Диске, whitelist, scrypt-пароли, owner = admin.

---

*Этот документ сохранён для справки. Основная версия — SQL + Docker (см. README.md).*
