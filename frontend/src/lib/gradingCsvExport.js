import { API_BASE } from '../config/api'

function csvEscape(s) {
  if (s === null || s === undefined) return '""'
  return `"${String(s).replace(/"/g, '""')}"`
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
    'Nhận xét Sub 1',
    'Điểm Sub 2',
    'Nhận xét Sub 2',
    'Điểm Sub 3',
    'Nhận xét Sub 3',
    'Điểm Sub 4',
    'Nhận xét Sub 4',
    'Điểm Final',
    'Nhận xét Final',
    'Điểm Pretest',
    'Nhận xét Pretest',
    'Điểm Posttest',
    'Nhận xét Posttest',
    'Điểm Posttest 2',
    'Nhận xét Posttest 2',
    'Điểm tổng kết',
    'Thời gian chấm'
  ]
  
  const headerLine = headers.map(csvEscape).join(',')
  const out = [headerLine]
  
  for (const row of results) {
    const sc = row.scores || {}
    const cm = row.comments || {}
    
    const cells = [
      csvEscape(row.studentSchoolId ?? ''),
      csvEscape(row.fullname ?? ''),
      csvEscape(row.username ?? ''),
      csvEscape(row.userClass ?? ''),
      csvEscape(row.supporterName ?? ''),
      // Sub 1
      csvEscape(sc.sub1 != null ? sc.sub1 : ''),
      csvEscape(cm.sub1 ?? ''),
      // Sub 2
      csvEscape(sc.sub2 != null ? sc.sub2 : ''),
      csvEscape(cm.sub2 ?? ''),
      // Sub 3
      csvEscape(sc.sub3 != null ? sc.sub3 : ''),
      csvEscape(cm.sub3 ?? ''),
      // Sub 4
      csvEscape(sc.sub4 != null ? sc.sub4 : ''),
      csvEscape(cm.sub4 ?? ''),
      // Final
      csvEscape(sc.final != null ? sc.final : ''),
      csvEscape(cm.final ?? ''),
      // Pretest
      csvEscape(sc.pretest != null ? sc.pretest : ''),
      csvEscape(cm.pretest ?? ''),
      // Posttest
      csvEscape(sc.posttest != null ? sc.posttest : ''),
      csvEscape(cm.posttest ?? ''),
      // Posttest 2
      csvEscape(sc.posttest2 != null ? sc.posttest2 : ''),
      csvEscape(cm.posttest2 ?? ''),
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
