# Migration 016 — unified party + department archive

Run **after DB backup**:

```bash
psql "$DATABASE_URL" -f server/migrations/016_unified_party_and_dept_archive.sql
```

Then deploy app/server build and restart the API. Desktop clients will backfill `party` in local JSON on `load-guide`; run sync so topics match PostgreSQL.

What it does:

- Drops restrictive `topics_party_check` (section ids stored in `topics.party`).
- Backfills `party` for non-support departments.
- Creates `{departmentId}__archive__archived` and `{departmentId}__archive__lost` subsections.
- Points archived non-support topics to the archived bucket subsection.
