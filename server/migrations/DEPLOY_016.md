# Migration 016 — unified party + department archive

Run **after DB backup**:

```bash
psql "$DATABASE_URL" -f server/migrations/016_unified_party_and_dept_archive.sql
```

Then on the server (from repo root):

```bash
git pull
docker compose -f docker-compose.prod.yml build --no-cache api && docker compose -f docker-compose.prod.yml up -d api
```

Static web (`web/dist`) is mounted into nginx — after `git pull` the browser client updates without rebuilding the nginx image.

Desktop: install `app/release/REST-INFO-Setup-1.5.0.exe` (or upload via `node app/scripts/upload-release.js …`). Clients backfill `party` in local JSON on `load-guide`; run sync so topics match PostgreSQL.

What it does:

- Drops restrictive `topics_party_check` (section ids stored in `topics.party`).
- Backfills `party` for non-support departments.
- Creates `{departmentId}__archive__archived` and `{departmentId}__archive__lost` subsections.
- Points archived non-support topics to the archived bucket subsection.
