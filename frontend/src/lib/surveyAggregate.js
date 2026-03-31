/** Khớp backend pretestValidate SECTION_A_KEYS + cấu trúc sectionB/C */
export const SURVEY_SECTION_A_KEYS = [
  'yearOfStudy',
  'gender',
  'studentStatus',
  'selfLearningScale',
  'topicFirst',
  'topicSecond',
  'studiedTopic1',
  'studiedTopic2',
  'familiarityTopic1Scale',
  'familiarityTopic2Scale',
  'usedGenAi',
  'aiLearningFrequency',
  'aiToolPrimary',
  'aiStudyPurpose',
  'attendedAiTraining',
]

/**
 * @param {Array<{ sectionA?: object, sectionB?: object, sectionC?: object }>} rows
 */
export function aggregateSurveySubmissions(rows) {
  const n = rows.length
  const sectionA = Object.fromEntries(SURVEY_SECTION_A_KEYS.map((k) => [k, {}]))

  const sectionC = Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => {
      const k = `c${i + 1}`
      return [k, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }]
    })
  )

  /** @type {Record<string, Record<string, Record<string, number>>>} */
  const sectionB = {}
  const purposeSamples = []

  for (const row of rows) {
    const a = row.sectionA
    if (a && typeof a === 'object') {
      for (const k of SURVEY_SECTION_A_KEYS) {
        const raw = a[k]
        const label = raw === null || raw === undefined ? '' : String(raw).trim()
        const bucket = label || '—'
        sectionA[k][bucket] = (sectionA[k][bucket] || 0) + 1
      }
      const p = a.aiStudyPurpose
      if (p != null && String(p).trim()) purposeSamples.push(String(p).trim())
    }

    const c = row.sectionC
    if (c && typeof c === 'object') {
      for (let i = 1; i <= 15; i++) {
        const ck = `c${i}`
        const v = Number(c[ck])
        if (Number.isInteger(v) && v >= 1 && v <= 5) sectionC[ck][v]++
      }
    }

    const b = row.sectionB
    if (b && typeof b === 'object') {
      for (const topicId of Object.keys(b)) {
        if (!sectionB[topicId]) sectionB[topicId] = {}
        const block = b[topicId]
        for (let i = 1; i <= 10; i++) {
          const qk = `q${i}`
          const ans = String(block?.[qk] ?? '').trim()
          const bucket = ans || '—'
          if (!sectionB[topicId][qk]) sectionB[topicId][qk] = {}
          sectionB[topicId][qk][bucket] = (sectionB[topicId][qk][bucket] || 0) + 1
        }
      }
    }
  }

  return { n, sectionA, sectionB, sectionC, purposeSamples }
}
