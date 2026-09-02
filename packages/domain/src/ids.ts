export const TREE_ID_PREFIX = 'GIRTH'
export const TREE_ID_PATTERN = /^GIRTH-(\d{6,})$/

/** Human-readable, never-recycled tree identity: GIRTH-000001. */
export function formatTreeId(seq: number): string {
  if (!Number.isInteger(seq) || seq < 1) {
    throw new Error(`Tree sequence must be a positive integer, got ${seq}`)
  }
  return `${TREE_ID_PREFIX}-${String(seq).padStart(6, '0')}`
}

export function parseTreeId(publicId: string): number | null {
  const match = TREE_ID_PATTERN.exec(publicId.trim().toUpperCase())
  if (!match) return null
  return Number(match[1])
}

export function isTreeId(value: string): boolean {
  return parseTreeId(value) !== null
}
