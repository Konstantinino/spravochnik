# Deploy keys (REST INFO)

Каталог для **публичной** части deploy-ключа сервера `rest-info`.

## Что здесь

| Файл | Коммитить? | Описание |
|---|---|---|
| `rest-info-deploy.pub` | ✅ да (публичный) | Ed25519 public key для GitHub Deploy key (read-only) |
| `rest-info-deploy-key` | ❌ **никогда** | Приватный ключ — только на сервере в `~/.ssh/` |

Публичный ключ генерируется на сервере скриптом `scripts/server/setup-deploy-key.sh` и копируется сюда для учёта в репозитории.

## GitHub

1. Repo → **Settings** → **Deploy keys** → **Add deploy key**
2. Title: `rest-info-<hostname>`
3. Key: содержимое `rest-info-deploy.pub`
4. **Allow write access — выключено** (только `git pull`)

Даже при компрометации сервера злоумышленник не сможет `git push` в GitHub.

## Дополнительная защита на сервере

После клонирования ставится `pre-push` hook (`scripts/server/install-git-hooks.sh`), блокирующий push локально.
