# План: автообновление «как Telegram Desktop»

Обновлено: 2026-09-11  
Статус: **не начато** (только план)

## Цель

Сейчас пользователь нажимает «Обновить» → выбирает папку → скачивает Setup.exe (~80 МБ) → **вручную запускает installer**.

**Целевой UX:** нажал «Обновить» → приложение закрылось → установилось → открылось снова. Настройки в `%AppData%\rest-info\REST-INFO\` **не сбрасываются**.

---

## Текущее состояние

| Компонент | Что есть |
|---|---|
| Клиент `app/electron/updates.ts` | `GET /app/update`, скачивание Setup через «Сохранить как…», `shell.openPath` |
| UI `Header.tsx` | Кнопка «Обновить», badge, «Скачивание…» |
| Сервер `server/src/routes/updates.ts` | `GET /app/update`, `GET /app/download/:filename` |
| Публикация | `app/scripts/upload-release.js` → upload + `POST /admin/releases` |
| Сборка | electron-builder, NSIS, `oneClick: false` |

**Не хватает:** тихая установка, автоперезапуск, `latest.yml` для electron-updater.

---

## Как это работает (механизм)

```
[REST INFO.exe]  →  проверяет версию на сервере
                →  скачивает пакет в %TEMP% (можно в фоне)
                →  пользователь жмёт «Обновить»
                →  quitAndInstall() — приложение закрывается
                →  NSIS / updater тихо ставит поверх старой версии
                →  приложение запускается снова
```

Работающий процесс **не может перезаписать свой `.exe`**. Поэтому используется отдельный installer/updater, который стартует **после** выхода основного приложения.

---

## Выбранный подход

**`electron-updater`** (пакет `electron-updater`, часть экосистемы electron-builder) + **Generic provider** на своём сервере `info.r-est.ru`.

Почему не GitHub Releases: свой сервер уже есть, whitelist, корпоративная сеть.

Почему не Squirrel: NSIS уже настроен; electron-updater хорошо работает с NSIS differential updates.

---

## Фазы реализации

### Фаза 0 — быстрый компромисс (опционально, ~2–4 ч)

Если нужен промежуточный результат до полного auto-update:

1. Скачивать Setup в `%TEMP%\rest-info-updates\` (без диалога «куда сохранить»).
2. Запускать installer с флагом `/S` (silent NSIS) — добавить в `nsis`: `"allowElevation": true`.
3. Закрыть приложение через `app.quit()` после старта installer.

**Минусы:** возможен UAC, нет progress bar, нет delta-updates.  
**Плюсы:** минимальный diff, можно выкатить за полдня.

> Фаза 0 **не обязательна**, если сразу идём в Фазу 1.

---

### Фаза 1 — electron-updater (основная, ~1–3 дня)

#### 1.1 Зависимости и сборка (`app/`)

- [ ] `npm install electron-updater` (runtime dependency)
- [ ] В `package.json` → `build`:
  ```json
  "publish": [{
    "provider": "generic",
    "url": "https://info.r-est.ru/app/updates/"
  }]
  ```
- [ ] NSIS для silent update:
  ```json
  "nsis": {
    "oneClick": true,
    "perMachine": false,
    "allowToChangeInstallationDirectory": false,
    "allowElevation": true,
    "runAfterFinish": true
  }
  ```
  > `oneClick: true` нужен для `quitAndInstall`. Пользователь при **первой** установке всё ещё видит wizard (если раздать Setup вручную). При **обновлении** — тихо.

- [ ] При `npm run dist:ascii` electron-builder генерирует:
  - `REST-INFO-Setup-X.Y.Z.exe`
  - `latest.yml` (версия, sha512, size, path)
  - `REST-INFO-Setup-X.Y.Z.exe.blockmap` (delta updates)

#### 1.2 Клиент — `app/electron/updates.ts`

- [ ] Импорт `autoUpdater` из `electron-updater`
- [ ] Настройка:
  ```ts
  autoUpdater.autoDownload = true          // или false + кнопка «Скачать»
  autoUpdater.autoInstallOnAppQuit = false // только по кнопке «Обновить»
  ```
- [ ] URL provider: `${settings.serverUrl}/app/updates/` (не хардкод production)
- [ ] События → IPC → UI:
  - `checking-for-update`
  - `update-available` / `update-not-available`
  - `download-progress` (процент, скорость)
  - `update-downloaded` → показать «Перезапустить для обновления»
  - `error`
- [ ] Новый handler `updates:install`:
  ```ts
  autoUpdater.quitAndInstall(false, true)
  ```
- [ ] Сохранить fallback: «Скачать Setup вручную» (SettingsPage, admin) — на случай сбоя auto-update
- [ ] Dev mode: `autoUpdater` не активен (`!app.isPackaged`), как сейчас

#### 1.3 Клиент — UI

- [ ] `Header.tsx`:
  - «Скачивание… 45%» при `download-progress`
  - «Перезапустить» когда `update-downloaded`
  - «Обновить» запускает install, не save dialog
- [ ] `SettingsPage.tsx`: оставить «Скачать Setup» для admin (ручная раздача новым ПК)

#### 1.4 Клиент — IPC (`main.ts`, `preload.ts`, `vite-env.d.ts`)

- [ ] `updates:install` — quitAndInstall
- [ ] `updates:progress` — push event в renderer
- [ ] Обновить типы `UpdateInfo`: добавить `status`, `progress`, `downloaded`

#### 1.5 Сервер — раздача артефактов

- [ ] Новый route или static: `GET /app/updates/latest.yml`
- [ ] `GET /app/updates/REST-INFO-Setup-X.Y.Z.exe`
- [ ] `GET /app/updates/REST-INFO-Setup-X.Y.Z.exe.blockmap`
- [ ] Файлы лежат в `UPDATES_DIR` (уже есть для Setup)
- [ ] **Важно:** `latest.yml` и `.blockmap` — `Content-Type: text/yaml`, `application/octet-stream`
- [ ] nginx: `client_max_body_size 120M` (уже в плане deploy)
- [ ] CORS не нужен (file:// не applies; запросы из Electron main process)

**Вариант A (рекомендуется):** отдельная папка `UPDATES_DIR/auto/` с `latest.yml` + артефакты.  
**Вариант B:** генерировать `latest.yml` on-the-fly из таблицы `app_releases` + метаданные файла (sha512, size).

#### 1.6 Публикация — `upload-release.js`

- [ ] После upload `.exe` также загружать:
  - `latest.yml`
  - `.blockmap` (если есть рядом с exe после сборки)
- [ ] Или новый скрипт `upload-release-full.js`, который берёт всю папку `release/` после `dist:ascii`

#### 1.7 Обратная совместимость API

- [ ] `GET /app/update` — **оставить** (старые клиенты 1.3.x без electron-updater)
- [ ] Новые клиенты ≥1.4.0 используют `autoUpdater` + `/app/updates/latest.yml`

---

### Фаза 2 — polish (~0.5–1 день)

- [ ] Фоновая проверка при старте + раз в N часов (сейчас только по focus / manual)
- [ ] Уведомление «Обновление скачано, перезапустите» если пользователь отложил
- [ ] Release notes в модалке (поле `notes` из `app_releases`)
- [ ] Delta updates: убедиться что `.blockmap` публикуется (экономия трафика)
- [ ] Логирование в `session-log.ts`: update check, download, install errors

---

### Фаза 3 — code signing (отдельная задача, не блокер)

- [ ] Windows Authenticode certificate (~$200–400/год)
- [ ] `certificateSubjectName` в electron-builder
- [ ] Без подписи SmartScreen будет предупреждать (как сейчас при ручном Setup)

---

## Файлы для изменения

| Файл | Изменения |
|---|---|
| `app/package.json` | electron-updater, publish config, nsis oneClick |
| `app/electron/updates.ts` | autoUpdater вместо saveInstallerFromSource |
| `app/electron/main.ts` | IPC handlers, события autoUpdater |
| `app/electron/preload.ts` | новые IPC |
| `app/src/vite-env.d.ts` | типы |
| `app/src/components/Header.tsx` | progress, install button |
| `app/scripts/upload-release.js` | upload latest.yml + blockmap |
| `server/src/routes/updates.ts` | static /app/updates/* |
| `server/src/index.ts` | mount updates static |
| `docs/scripts.md` | обновить инструкцию публикации |
| `docs/testing-checklist.md` | секция auto-update |
| `docs/PROJECT-STATUS.md` | статус после реализации |

---

## Тест-план

### Локально (dev)

- [ ] `npm run dev` — autoUpdater **не** активен
- [ ] `npm run dist:ascii` — генерируются exe + latest.yml + blockmap

### Staging / production

- [ ] Установить 1.3.3 в `Program Files` или `%LocalAppData%`
- [ ] Опубликовать 1.4.0-test на сервер (upload-release-full)
- [ ] Запустить 1.3.3 → «Обновить» → скачивание → перезапуск → версия 1.4.0
- [ ] `%AppData%\rest-info\REST-INFO\settings.json` — **на месте** (serverUrl, authToken)
- [ ] Обновление при открытой теме с несохранёнными правками — предупредить или отложить install
- [ ] Обрыв сети mid-download — ошибка, retry
- [ ] Offline — «нет сети», без падения
- [ ] Старый клиент 1.3.3 — старый flow (скачать Setup) всё ещё работает через `GET /app/update`

### Edge cases

- [ ] UAC prompt (perMachine vs perUser install path)
- [ ] Антивирус блокирует silent install
- [ ] Два экземпляра приложения (single instance lock)
- [ ] Обновление когда приложение запущено не из Program Files (portable)

---

## Риски

| Риск | Митигация |
|---|---|
| UAC при silent install | `perMachine: false`, install в `%LocalAppData%\Programs` |
| Антивирус | code signing (Фаза 3); fallback «скачать Setup» |
| 413 на upload blockmap/yml | nginx 120M уже в deploy; yml/blockmap < 1 МБ |
| Старые клиенты | оставить `GET /app/update` + ручной Setup |
| Потеря данных при update | `%AppData%` не трогается NSIS; протестировать |
| Несохранённые правки | проверять `hasPendingChanges` перед `quitAndInstall` |

---

## Оценка трудозатрат

| Фаза | Время | Результат |
|---|---|---|
| 0 (опционально) | 2–4 ч | Silent NSIS из temp, без electron-updater |
| 1 (основная) | 1–3 дня | Полный UX «как Telegram» |
| 2 (polish) | 0.5–1 день | Progress, notes, фоновая проверка |
| 3 (signing) | отдельно | Без SmartScreen warnings |

**Рекомендуемая версия для релиза:** `1.4.0` (minor bump — новый механизм обновлений).

---

## Порядок работ (чеклист для агента)

```
[ ] 1. package.json: electron-updater + publish + nsis oneClick
[ ] 2. dist:ascii → проверить latest.yml и blockmap в release/
[ ] 3. server: GET /app/updates/* static
[ ] 4. upload-release.js: заливка yml + blockmap + exe
[ ] 5. updates.ts: autoUpdater events + quitAndInstall
[ ] 6. main/preload/types: IPC
[ ] 7. Header.tsx: progress + install UX
[ ] 8. Тест 1.3.3 → 1.4.0 на Windows
[ ] 9. docs: scripts.md, testing-checklist, PROJECT-STATUS
[ ] 10. graphify update .
```

---

## Связанные документы

- [server-deploy.md](server-deploy.md) — публикация Setup, обход 413
- [scripts.md](scripts.md) — upload-release.js
- [DEPLOY-FOR-PROGRAMMER.md](DEPLOY-FOR-PROGRAMMER.md) — nginx 120M
- [testing-checklist.md](testing-checklist.md) — E2E после deploy

---

## Ссылки

- [electron-updater docs](https://www.electron.build/auto-update)
- [Generic provider](https://www.electron.build/configuration/publish#genericserveroptions)
- [NSIS options](https://www.electron.build/configuration/nsis)
