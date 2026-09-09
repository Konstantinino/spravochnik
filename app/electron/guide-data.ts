/** Recompute has_children from actual non-archived children in the list. */
export function reconcileHasChildren<
  T extends { id: number; parent_id?: number | null; has_children?: boolean; archived?: boolean },
>(items: T[]): T[] {
  const childCounts = new Map<number, number>()
  for (const item of items) {
    if (item.parent_id == null || item.archived) continue
    childCounts.set(item.parent_id, (childCounts.get(item.parent_id) ?? 0) + 1)
  }
  return items.map((item) => ({
    ...item,
    has_children: (childCounts.get(item.id) ?? 0) > 0,
  }))
}
