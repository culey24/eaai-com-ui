import { API_BASE } from '../config/api'

function csvEscape(s) {
  return `"${String(s ?? '').replace(/"/g, '""')}"`
}

/**
 * Gọi API matrix + tải CSV (link mở downloadPathPrefix với token hiện tại).
 * @param {{ apiToken: string, t: (key: string, opts?: object) => string, downloadPathPrefix?: string }} opts
 */
export async function exportJournalSubmissionsMatrixCsv({
  apiToken,
  t,
  downloadPathPrefix = '/journal-file-download',
}) {
  const r = await fetch(`${API_BASE}/api/admin/journal-submissions-matrix`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`)
  const periods = Array.isArray(data.periods) ? data.periods : []
  const rows = Array.isArray(data.rows) ? data.rows : []
  const origin = window.location.origin
  const fixedHeaders = [
    t('admin.submissions.csvColMssv'),
    t('admin.submissions.csvColFullName'),
    t('admin.submissions.csvColUsername'),
    t('admin.submissions.csvColClass'),
  ]
  const periodHeaders = periods.map((p) => {
    const id = p?.periodId != null ? String(p.periodId) : ''
    const title = p?.title != null ? String(p.title) : ''
    return title && id ? `${title} (${id})` : id || title || '—'
  })
  const headerLine = [...fixedHeaders, ...periodHeaders].map(csvEscape).join(',')
  const out = [headerLine]
  for (const row of rows) {
    const by = row?.uploadsByPeriod && typeof row.uploadsByPeriod === 'object' ? row.uploadsByPeriod : {}
    const uid = row?.userId != null ? String(row.userId) : ''
    const cells = [
      csvEscape(row?.studentSchoolId ?? ''),
      csvEscape(row?.fullName ?? ''),
      csvEscape(row?.username ?? ''),
      csvEscape(row?.classCode ?? ''),
    ]
    for (const p of periods) {
      const pid = p?.periodId != null ? String(p.periodId) : ''
      const info = pid ? by[pid] : null
      const uploadId = info?.uploadId != null ? String(info.uploadId) : ''
      if (uid && uploadId) {
        const q = new URLSearchParams({ learnerId: uid, uploadId })
        const path = `${downloadPathPrefix}?${q.toString()}`
        cells.push(csvEscape(`${origin}${path}`))
      } else {
        cells.push(csvEscape(''))
      }
    }
    out.push(cells.join(','))
  }
  const bom = '\uFEFF'
  const blob = new Blob([bom + out.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `journal-submissions-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
