import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set')
    }
    pool = new Pool({ connectionString })
  }
  return pool
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params)
}

export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function bumpGlobalVersion(client?: pg.PoolClient): Promise<number> {
  const q = client ? client.query.bind(client) : query
  const res = await q<{ value: string }>(
    `UPDATE sync_state SET value = (value::bigint + 1)::text WHERE key = 'global_version' RETURNING value`,
  )
  return parseInt(res.rows[0]?.value ?? '0', 10)
}

export async function getGlobalVersion(): Promise<number> {
  const res = await query<{ value: string }>(
    `SELECT value FROM sync_state WHERE key = 'global_version'`,
  )
  return parseInt(res.rows[0]?.value ?? '0', 10)
}
