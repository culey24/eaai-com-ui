import { API_BASE } from '../config/api'

function csvEscape(s) {
  if (s === null || s === undefined) return '""'
  return `"${String(s).replace(/"/g, '""')}"`
}

/** Link tải shared (đã ký) của 1 submission, ghép API_BASE để mở trực tiếp. */
function submissionLink(row, key) {
  const u = row?.submissionLinks && row.submissionLinks[key]
  return u && u.downloadUrl ? `${API_BASE}${u.downloadUrl}` : ''
}

export async function exportGradingResultsCsv({ apiToken }) {
  const r = await fetch(`${API_BASE}/api/grading/export-data`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    throw new Error(data.error || data.message || `HTTP ${r.status}`)
  }
  
  const results = Array.isArray(data.results) ? data.results : []
  
  const headers = [
    'MSSV',
    'Họ và tên',
    'Tài khoản',
    'Lớp',
    'Người chấm',
    'Điểm Sub 1',
    'Điểm Sub 2',
    'Điểm Sub 3',
    'Điểm Sub 4',
    'Điểm Final',
    'Link Sub 1',
    'Link Sub 2',
    'Link Sub 3',
    'Link Sub 4',
    'Link Final',
    'Điểm Pretest',
    'Điểm Posttest',
    'Điểm Posttest 2',
    'Điểm tổng kết',
    'Thời gian chấm'
  ]
  
  const headerLine = headers.map(csvEscape).join(',')
  const out = [headerLine]
  
  for (const row of results) {
    const sc = row.scores || {}
    
    const cells = [
      csvEscape(row.studentSchoolId ?? ''),
      csvEscape(row.fullname ?? ''),
      csvEscape(row.username ?? ''),
      csvEscape(row.userClass ?? ''),
      csvEscape(row.supporterName ?? ''),
      // Sub 1
      csvEscape(sc.sub1 != null ? sc.sub1 : ''),
      // Sub 2
      csvEscape(sc.sub2 != null ? sc.sub2 : ''),
      // Sub 3
      csvEscape(sc.sub3 != null ? sc.sub3 : ''),
      // Sub 4
      csvEscape(sc.sub4 != null ? sc.sub4 : ''),
      // Final
      csvEscape(sc.final != null ? sc.final : ''),
      // Link tải file submission (journal upload tương ứng)
      csvEscape(submissionLink(row, 'sub1')),
      csvEscape(submissionLink(row, 'sub2')),
      csvEscape(submissionLink(row, 'sub3')),
      csvEscape(submissionLink(row, 'sub4')),
      csvEscape(submissionLink(row, 'final')),
      // Pretest
      csvEscape(sc.pretest != null ? sc.pretest : ''),
      // Posttest
      csvEscape(sc.posttest != null ? sc.posttest : ''),
      // Posttest 2
      csvEscape(sc.posttest2 != null ? sc.posttest2 : ''),
      // Total
      csvEscape(row.totalScore != null ? row.totalScore : ''),
      csvEscape(row.gradedAt ? new Date(row.gradedAt).toLocaleString('vi-VN') : '')
    ]
    out.push(cells.join(','))
  }
  
  const bom = '\uFEFF'
  const blob = new Blob([bom + out.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `grading-results-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
