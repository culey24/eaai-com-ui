const STORAGE_KEY = 'eaai_admin_journal_storage_audit_v1'
const MAX_ENTRIES = 40

/**
 * @typedef {{ learnerId: string, username?: string, fullName?: string, error?: string | null, mismatch?: boolean, bucketFileCount?: number, dbRowCount?: number }} JournalAuditSlimRow
 * @typedef {{ id: string, createdAt: number, periodId: string, periodTitle: string, stats: { mismatch: number, errors: number, ok: number }, rows: JournalAuditSlimRow[] }} JournalAuditHistoryEntry
 */

function safeParse(json) {
  try {
    const v = JSON.parse(json)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/** @returns {JournalAuditHistoryEntry[]} */
export function loadJournalAuditHistory() {
  if (typeof localStorage === 'undefined') return []
  return safeParse(localStorage.getItem(STORAGE_KEY))
}

/** @param {JournalAuditHistoryEntry[]} list */
function persist(list) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)))
}

/**
 * @param {Omit<JournalAuditHistoryEntry, 'id'> & { id?: string }} entry
 * @returns {JournalAuditHistoryEntry}
 */
export function saveJournalAuditHistoryEntry(entry) {
  const id = entry.id || `${entry.createdAt}-${Math.random().toString(36).slice(2, 10)}`
  const full = { ...entry, id }
  const list = loadJournalAuditHistory()
  list.unshift(full)
  persist(list)
  return full
}

/** @param {string} id */
export function deleteJournalAuditHistoryEntry(id) {
  const list = loadJournalAuditHistory().filter((e) => e.id !== id)
  persist(list)
}
