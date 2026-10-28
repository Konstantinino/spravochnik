import type pg from 'pg'

type Client = pg.PoolClient

function deptSectionIdFromSubsectionRow(row: {
  id: string
  party: string | null
}): string {
  const parent = typeof row.party === 'string' ? row.party.trim() : ''
  return parent || row.id
}

export async function resolveRootTopicPartyForWrite(
  departmentId: string,
  parentId: number | null,
  partyFromItem: unknown,
  subsectionId: string | null,
  client: Client,
): Promise<string | null> {
  if (parentId != null) {
    const parentRes = await client.query<{ party: string | null }>(
      `SELECT party FROM topics
        WHERE department_id = $1 AND id = $2 AND deleted_at IS NULL`,
      [departmentId, parentId],
    )
    const inherited = parentRes.rows[0]?.party
    if (typeof inherited === 'string' && inherited.trim()) return inherited.trim()
  }

  const rawParty = typeof partyFromItem === 'string' ? partyFromItem.trim() : ''
  if (rawParty) return rawParty

  if (!subsectionId) return null

  const subRes = await client.query<{ id: string; party: string | null }>(
    `SELECT id, party FROM department_subsections
      WHERE id = $1 AND department_id = $2`,
    [subsectionId, departmentId],
  )
  const row = subRes.rows[0]
  if (!row) return subsectionId
  return deptSectionIdFromSubsectionRow(row)
}
