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

/**
 * Xuất CSV một lần (PRETEST schema: section A/B/C như pretestValidate).
 * @param {{ rows: Array<object>, filenamePrefix?: string }} opts
 */
export function downloadPretestSurveyCsv({ rows, filenamePrefix = 'pretest-submissions' }) {
  const baseHeaders = ['mssv', 'fullname', 'username', 'class_id']
  const aHeaders = SURVEY_SECTION_A_KEYS.map((k) => `sectionA_${k}`)
  const bHeaders = TOPIC_IDS.flatMap((tid) =>
    Array.from({ length: 10 }, (_, j) => `sectionB_${tid}_q${j + 1}`)
  )
  const cHeaders = Array.from({ length: 15 }, (_, j) => `sectionC_c${j + 1}`)
  const headers = [...baseHeaders, ...aHeaders, ...bHeaders, ...cHeaders]
  const lines = [headers.map(csvEscape).join(',')]

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
    const b = row?.sectionB
    for (const tid of TOPIC_IDS) {
      for (let qi = 1; qi <= 10; qi++) {
        cells.push(csvEscape(cellB(b, tid, `q${qi}`)))
      }
    }
    const c = row?.sectionC
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
