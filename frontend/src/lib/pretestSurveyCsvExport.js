import { SURVEY_SECTION_A_KEYS } from './surveyAggregate'
import { PRETEST_TOPICS } from '../data/pretest/pretestTopics'

function csvEscape(s) {
  return `"${String(s ?? '').replace(/"/g, '""')}"`
}

function cellA(sectionA, key) {
  if (!sectionA || typeof sectionA !== 'object') return ''
  const v = sectionA[key]
  if (v == null) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v).replace(/\r?\n/g, ' ').trim()
}

function cellB(sectionB, topicId, qk) {
  if (!sectionB || typeof sectionB !== 'object') return ''
  const block = sectionB[topicId]
  if (!block || typeof block !== 'object') return ''
  const v = block[qk]
  if (v == null) return ''
  return String(v).replace(/\r?\n/g, ' ').trim()
}

function cellC(sectionC, i) {
  const k = `c${i}`
  if (!sectionC || typeof sectionC !== 'object') return ''
  const v = sectionC[k]
  return v == null ? '' : String(v)
}

const TOPIC_IDS = PRETEST_TOPICS.map((t) => t.id)

/** score map key per survey kind (field inside studentGrading.scores) */
const SCORE_KEY_BY_KIND = {
  PRETEST: 'pretest_q',
  POSTTEST: 'posttest_q',
  POSTTEST2: 'posttest2_q',
}

/**
 * Chuyển điểm câu hỏi (0 / 0.25 / 0.5) thành nhãn đúng/sai.
 * @param {number|string|undefined} score
 * @returns {'incorrect'|'partially_correct'|'correct'|''}
 */
export function classifyQuestionScore(score) {
  if (score === undefined || score === null || score === '') return ''
  const s = Number(score)
  if (Number.isNaN(s)) return ''
  if (s <= 0) return 'incorrect'
  if (s >= 0.5) return 'correct'
  return 'partially_correct'
}

/**
 * Xuất CSV một lần (PRETEST/POSTTEST schema: section A/B/C như pretestValidate).
 * Mỗi cột sectionB_<topic>_q<N> được kèm cột is_correct_<topic>_q<N> (dựa trên điểm
 * mentor đã chấm theo username, nguồn: /api/grading/export-data → scores.pretest_q/posttest_q/posttest2_q).
 * @param {{ rows: Array<object>, filenamePrefix?: string, activeKind?: string, scoreMap?: object }} opts
 */
export function downloadPretestSurveyCsv({ rows, filenamePrefix = 'pretest-submissions', activeKind, scoreMap }) {
  const baseHeaders = ['mssv', 'fullname', 'username', 'class_id']
  const aHeaders = SURVEY_SECTION_A_KEYS.map((k) => `sectionA_${k}`)
  const qCount = activeKind === 'POSTTEST2' ? 15 : 10
  const bHeaders = TOPIC_IDS.flatMap((tid) => {
    const cols = []
    for (let j = 1; j <= qCount; j++) {
      cols.push(`sectionB_${tid}_q${j}`)
      cols.push(`is_correct_${tid}_q${j}`)
    }
    return cols
  })
  const cHeaders = Array.from({ length: 15 }, (_, j) => `sectionC_c${j + 1}`)
  const headers = [...baseHeaders, ...aHeaders, ...bHeaders, ...cHeaders]
  const lines = [headers.map(csvEscape).join(',')]

  const scoreKey = SCORE_KEY_BY_KIND[activeKind] || 'pretest_q'

  for (const row of rows) {
    const cells = [
      csvEscape(row?.mssv ?? ''),
      csvEscape(row?.fullname ?? ''),
      csvEscape(row?.username ?? ''),
      csvEscape(row?.classCode ?? ''),
    ]
    const a = row?.sectionA
    for (const k of SURVEY_SECTION_A_KEYS) {
      cells.push(csvEscape(cellA(a, k)))
    }

    // Điểm câu hỏi theo username (mentor chấm): B1-<n> cho topicFirst, B2-<n> cho topicSecond
    const userScores = (scoreMap && row?.username ? scoreMap[String(row.username).toLowerCase()] : null) || {}
    const qScores = userScores[scoreKey] || {}
    const topicFirst = a?.topicFirst ?? ''
    const topicSecond = a?.topicSecond ?? ''

    const b = row?.sectionB
    for (const tid of TOPIC_IDS) {
      for (let qi = 1; qi <= qCount; qi++) {
        cells.push(csvEscape(cellB(b, tid, `q${qi}`)))
        let score = ''
        if (tid === topicFirst) score = qScores[`B1-${qi}`]
        else if (tid === topicSecond) score = qScores[`B2-${qi}`]
        cells.push(csvEscape(classifyQuestionScore(score)))
      }
    }
    const c = row?.sectionC
    // Export all 15 columns; empty if survey has only 10
    for (let ci = 1; ci <= 15; ci++) {
      cells.push(csvEscape(cellC(c, ci)))
    }
    lines.push(cells.join(','))
  }

  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
