import pg from 'pg'

const c = new pg.Client({
  connectionString: 'postgres://restinfo:restinfo_dev@127.0.0.1:5433/postgres',
})
await c.connect()
const r = await c.query(
  `SELECT id, label, party, is_archive_lost, sort_order
     FROM department_subsections
    WHERE department_id = 'support'
    ORDER BY sort_order, id`,
)
console.log(JSON.stringify(r.rows, null, 2))
await c.end()
