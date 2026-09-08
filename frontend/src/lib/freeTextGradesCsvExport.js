import { API_BASE } from '../config/api'
import { getSectionBQuestions } from '../data/pretest/sectionB'
import { classifyQuestionScore } from './pretestSurveyCsvExport'

function csvEscape(s) {
  if (s === null || s === undefined) return '""'
  return `"${String(s).replace(/"/g, '""')}"`
}

async function fetchJson(url, apiToken) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${apiToken}` } })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`)
  return data
}

/**
 * Xuất CSV dài (1 dòng = 1 câu tự luận Phần B của 1 học viên) kèm điểm
 * supporter đã chấm trong DB production.
 * Nguồn: /api/grading/pretest-submissions (bài nộp, supporter/admin)
 *      + /api/grading/export-data (scores.pretest_q, người chấm, thời gian chấm).
 */
export async function exportFreeTextGradesCsv({ apiToken }) {
  const [surveyData, gradingData] = await Promise.all([
    fetchJson(`${API_BASE}/api/grading/pretest-submissions`, apiToken),
    fetchJson(`${API_BASE}/api/grading/export-data`, apiToken),
  ])

  const submissions = Array.isArray(surveyData.submissions) ? surveyData.submissions : []
  const results = Array.isArray(gradingData.results) ? gradingData.results : []

  const scoreByUser = new Map()
  for (const row of results) {
    if (row?.username) {
      scoreByUser.set(String(row.username).toLowerCase(), {
        qScores: (row.scores || {}).pretest_q || {},
        supporterName: row.supporterName ?? '',
        gradedAt: row.gradedAt ?? '',
      })
    }
  }

  const headers = [
    'username',
    'fullname',
    'mssv',
    'class',
    'topic',
    'question_id',
    'question_text',
    'reference_answer',
    'student_answer',
    'supporter_score',
    'is_correct',
    'graded_by',
    'graded_at',
    'status',
  ]
  const out = [headers.map(csvEscape).join(',')]

  // submissions đã sắp xếp createdAt desc → giữ bản nộp mới nhất của mỗi học viên
  const seenUsers = new Set()
  for (const sub of submissions) {
    if (seenUsers.has(sub.userId)) continue
    seenUsers.add(sub.userId)

    const userKey = String(sub.username || '').toLowerCase()
    const entry = scoreByUser.get(userKey) || { qScores: {}, supporterName: '', gradedAt: '' }
    const qScores = entry.qScores

    const topics = [sub.sectionA?.topicFirst, sub.sectionA?.topicSecond]
    topics.forEach((tid, tIdx) => {
      if (!tid) return
      const questions = getSectionBQuestions(String(tid))
      const block = (sub.sectionB && sub.sectionB[tid]) || {}
      questions.forEach((q, qIdx) => {
        if (q.type !== 'text') return
        const qNum = qIdx + 1
        const scoreKey = `B${tIdx + 1}-${qNum}`
        const score = qScores[scoreKey]
        const graded = score !== undefined && score !== null && score !== ''
        out.push(
          [
            csvEscape(sub.username),
            csvEscape(sub.fullname),
            csvEscape(sub.mssv),
            csvEscape(sub.classCode || ''),
            csvEscape(tid),
            csvEscape(`sectionB_${tid}_q${qNum}`),
            csvEscape((q.prompt && (q.prompt.en || q.prompt.vi)) || ''),
            csvEscape((q.hint && (q.hint.en || q.hint.vi)) || ''),
            csvEscape(block[`q${qNum}`] ?? ''),
            csvEscape(graded ? score : ''),
            csvEscape(graded ? classifyQuestionScore(score) : ''),
            csvEscape(entry.supporterName),
            csvEscape(entry.gradedAt ? new Date(entry.gradedAt).toLocaleString('vi-VN') : ''),
            csvEscape(graded ? 'graded' : 'ungraded'),
          ].join(',')
        )
      })
    })
  }

  const bom = '\uFEFF'
  const blob = new Blob([bom + out.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `free-text-grades-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
