import { API_BASE } from '../config/api'

/** uploadId từ API hoặc id dạng srv-{bigserial} */
export function parseJournalServerUploadId(entry) {
  if (entry?.uploadId != null && /^\d+$/.test(String(entry.uploadId))) {
    return String(entry.uploadId)
  }
  const id = entry?.id != null ? String(entry.id) : ''
  const m = id.match(/^srv-(\d+)$/)
  return m ? m[1] : null
}

export async function fetchJournalFileBlob(apiToken, learnerUserId, uploadId) {
  const res = await fetch(
    `${API_BASE}/api/journal/learner/${encodeURIComponent(learnerUserId)}/file/${encodeURIComponent(uploadId)}`,
    { headers: { Authorization: `Bearer ${apiToken}` } }
  )
  if (!res.ok) {
    const err = new Error(typeof res.status === 'number' ? `HTTP ${res.status}` : 'fetch failed')
    err.status = res.status
    throw err
  }
  return res.blob()
}

export function journalFileCanOpenInBrowser(fileName) {
  const ext = (fileName || '').split('.').pop()?.toLowerCase()
  return ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt', 'svg'].includes(ext || '')
}
