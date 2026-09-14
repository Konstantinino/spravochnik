# План: автообновление «как Telegram Desktop»

Обновлено: 2026-09-14  
Статус: **реализовано в клиенте 1.4.0** (нужен deploy сервера + upload latest.yml/blockmap)

## Цель

Сейчас пользователь нажимает «Обновить» → выбирает папку → скачивает Setup.exe (~80 МБ) → **вручную запускает installer**.

**Целевой UX:** обновление **скачивается в фоне**; по кнопке «Обновить» в попапе профиля → приложение закрылось → установилось → открылось снова. Настройки в `%AppData%\rest-info\REST-INFO\` **не сбрасываются**.

---

## UX и поведение (уточнения от 2026-09-14)

### Где что показывается

| Элемент | Где | Поведение |
|---|---|---|
| **Текущая версия** | Шапка слева, рядом с «REST INFO» | Всегда видна; мелкий/тонкий шрифт (напр. `1.3.3`) |
| **Кнопка «Обновить»** | Попап профиля (аватар), **рядом с «Выйти»** | Когда версия на сервере новее **и** пакет скачан (`update-downloaded`) |
| **Версия обновления** | Рядом с «Обновить» в попапе | Тонкий, меньший шрифт (напр. «Обновить» **1.4.0**) |
| **«Скачивание… 45%»** | **Только Настройки** → «Приложение» | Не в шапке, не в попапе |
| **«Обновление скачано»** | **Только Настройки** → «Приложение» | Подсказка: установка — из меню профиля |
| **Badge на аватаре** | Попап профиля | Опционально: пока обновление качается или готово |

### Правила

1. **Скачивание в фоне**, **установка только по «Обновить»** в попапе профиля.
2. **Проверка — раз в 1 минуту** (+ при старте; только online + `serverUrl`).
3. **Обрыв загрузки** → при следующей проверке удалить partial, **скачать заново** целиком.
4. **Админ «Скачать» Setup** в Настройках: кнопка **не пропадает**, ту же версию можно качать **много раз**; отдельно от auto-update cache.

---

## Текущее состояние

| Компонент | Что есть |
|---|---|
| Клиент `app/electron/updates.ts` | `GET /app/update`, скачивание Setup через «Сохранить как…», `shell.openPath` |
| UI `Header.tsx` | Кнопка «Обновить» и «Скачивание…» в попапе профиля (переделать под план) |
| Сервер `server/src/routes/updates.ts` | `GET /app/update`, `GET /app/download/:filename` |
| Публикация | `app/scripts/upload-release.js` → upload + `POST /admin/releases` |
| Сборка | electron-builder, NSIS, `oneClick: false` |

**Не хватает:** тихая установка, автоперезапуск, `latest.yml`, проверка 1 мин, UI по таблице выше.

---

## Как это работает (механизм)

```
[REST INFO.exe]  →  каждые 60 с: проверка версии на сервере (online)
                →  если новее — скачивание в фоне (%TEMP% / updater cache)
                →  прогресс «Скачивание… N%» — только в Настройках
                →  готово → «Обновление скачано» в Настройках + «Обновить» в попапе профиля
                →  пользователь жмёт «Обновить» → quitAndInstall()
                →  NSIS тихо ставит поверх → приложение открывается снова
                →  обрыв загрузки → при следующей проверке: удалить частичный файл, скачать заново
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
  autoUpdater.autoDownload = true           // фоновая загрузка
  autoUpdater.autoInstallOnAppQuit = false  // установка только по кнопке «Обновить»
  ```
- [ ] URL provider: `${settings.serverUrl}/app/updates/` (не хардкод production)
- [ ] Таймер проверки: `setInterval(checkForUpdates, 60_000)` в main (плюс проверка при старте)
- [ ] При `error` / обрыве / перезапуске до `update-downloaded`:
  - вызвать очистку cache updater (`autoUpdater.clearCache()` или удаление `%TEMP%`/pending path)
  - при следующем `update-available` — полная перекачка
- [ ] События → IPC → UI:
  - `checking-for-update` / `update-available` / `update-not-available`
  - `download-progress` → **только** SettingsPage (процент)
  - `update-downloaded` → SettingsPage («Обновление скачано») + показать «Обновить» в попапе профиля
  - `error` → session-log; сброс partial download
- [ ] Handler `updates:install` (кнопка в попапе профиля):
  ```ts
  autoUpdater.quitAndInstall(false, true)
  ```
- [ ] `fetchLatestRelease` / `downloadLatestRelease` — **без** скрытия кнопки после успеха; всегда тянет `GET /app/update?currentVersion=0.0.0`
- [ ] Dev mode: `autoUpdater` не активен (`!app.isPackaged`), как сейчас

#### 1.3 Клиент — UI

- [ ] `Header.tsx` — шапка:
  - рядом с «REST INFO»: текущая версия (`app.getVersion()`), класс `.app-header__version` — мелкий, тонкий, приглушённый цвет
- [ ] `Header.tsx` — попап профиля (`user-menu`):
  - кнопка «Обновить» + `<span class="user-menu__update-version">1.4.0</span>` — версия **тоньше и меньше**
  - видна только при `update-downloaded` (пакет готов к установке)
  - клик → `updates:install`, **не** скачивание
  - **без** текста «Скачивание…» в попапе
  - badge на аватаре — пока `update-available` или идёт загрузка (опционально)
- [ ] `SettingsPage.tsx` — блок «Приложение»:
  - строка: «Версия: **1.3.3**» (текущая)
  - при загрузке: «Скачивание… 45%»
  - когда готово: «Обновление скачано — установите из меню профиля»
  - кнопка «Скачать» Setup с сервера — **всегда** видна (admin), повторное скачивание той же версии OK
- [ ] `styles.css`: `.app-header__version`, `.user-menu__update-version`

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

- [ ] Release notes в Настройках (поле `notes` из `app_releases`)
- [ ] Delta updates: `.blockmap` на сервере (экономия трафика)
- [ ] Логирование в `session-log.ts`: check, download, cache purge, install errors
- [ ] Предупреждение перед `quitAndInstall`, если `hasPendingChanges`

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
| `app/src/components/Header.tsx` | версия в шапке; «Обновить» + версия в попапе профиля |
| `app/src/components/SettingsPage.tsx` | прогресс/«скачано»; всегда видимая «Скачать» |
| `app/src/styles.css` | `.app-header__version`, `.user-menu__update-version` |
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
- [ ] Запустить 1.3.3 → через ≤1 мин фоновое скачивание → в Настройках «Скачивание… N%» → «Обновление скачано»
- [ ] В попапе профиля «Обновить» + мелкая «1.4.0» → перезапуск → версия 1.4.0; в шапке отображается «1.4.0»
- [ ] `%AppData%\rest-info\REST-INFO\settings.json` — **на месте** (serverUrl, authToken)
- [ ] Обрыв mid-download → закрыть app → открыть → partial удалён → полная перекачка
- [ ] Offline — проверка молча пропускается, без падения
- [ ] Настройки: «Скачать» Setup 3 раза подряд — кнопка не пропадает, версия на сервере на месте
- [ ] Старый клиент 1.3.3 — старый flow (скачать Setup) через `GET /app/update`

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
| Битый partial после обрыва | purge cache + full re-download на следующей проверке |

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
[ ] 2. dist:ascii → latest.yml + blockmap
[ ] 3. server: GET /app/updates/* static
[ ] 4. upload-release.js: yml + blockmap + exe
[ ] 5. updates.ts: autoUpdater, interval 60s, purge partial, quitAndInstall
[ ] 6. main/preload/types: IPC (install, progress → settings only)
[ ] 7. Header: версия слева; «Обновить» + версия в попапе профиля
[ ] 8. SettingsPage: прогресс/«скачано»; «Скачать» always-on для admin
[ ] 9. styles.css: мелкие версии
[ ] 10. Тест: фон, обрыв, повторное скачивание Setup
[ ] 11. docs: scripts.md, testing-checklist, PROJECT-STATUS
[ ] 12. graphify update .
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
