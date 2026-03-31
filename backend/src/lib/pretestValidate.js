/** Theo docs/Pretest.pdf — 8 chủ đề Section B */

export const PRETEST_TOPIC_IDS = [
  'association_rules_mining',
  'recommender_system',
  'fuzzy_logic',
  'linear_regression',
  'logistic_regression',
  'latent_dirichlet_allocation',
  'deep_neural_networks',
  'word_embedding',
]

const TOPIC_SET = new Set(PRETEST_TOPIC_IDS)

const SECTION_A_KEYS = [
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

function scale15(v) {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 && n <= 5
}

/**
 * @returns {string | null} mã lỗi hoặc null nếu hợp lệ
 */
export function validatePretestBody(body) {
  if (!body || typeof body !== 'object') return 'INVALID_BODY'

  const a = body.sectionA
  const b = body.sectionB
  const c = body.sectionC

  if (!a || typeof a !== 'object') return 'SECTION_A_REQUIRED'
  for (const k of SECTION_A_KEYS) {
    if (!(k in a)) return `SECTION_A_MISSING_${k}`
    const v = a[k]
    if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) {
      return `SECTION_A_EMPTY_${k}`
    }
  }

  if (!TOPIC_SET.has(String(a.topicFirst)) || !TOPIC_SET.has(String(a.topicSecond))) {
    return 'SECTION_A_TOPIC_INVALID'
  }
  if (String(a.topicFirst) === String(a.topicSecond)) {
    return 'SECTION_A_TOPIC_DUPLICATE'
  }

  if (!scale15(a.selfLearningScale) || !scale15(a.familiarityTopic1Scale) || !scale15(a.familiarityTopic2Scale)) {
    return 'SECTION_A_SCALE_INVALID'
  }

  if (!b || typeof b !== 'object') return 'SECTION_B_REQUIRED'
  const tf = String(a.topicFirst)
  const ts = String(a.topicSecond)
  const keysB = Object.keys(b).sort()
  const expect = [tf, ts].sort().join(',')
  const got = keysB.sort().join(',')
  if (keysB.length !== 2 || expect !== got) {
    return 'SECTION_B_TOPIC_KEYS_MISMATCH'
  }

  for (const topicKey of [tf, ts]) {
    const block = b[topicKey]
    if (!block || typeof block !== 'object') return 'SECTION_B_BLOCK_INVALID'
    for (let i = 1; i <= 10; i++) {
      const qk = `q${i}`
      if (!(qk in block)) return `SECTION_B_MISSING_${topicKey}_${qk}`
      const ans = block[qk]
      if (ans === null || ans === undefined) return `SECTION_B_EMPTY_${topicKey}_${qk}`
      if (typeof ans !== 'string') return `SECTION_B_TYPE_${topicKey}_${qk}`
      if (ans.trim() === '') return `SECTION_B_EMPTY_${topicKey}_${qk}`
    }
  }

  if (!c || typeof c !== 'object') return 'SECTION_C_REQUIRED'
  for (let i = 1; i <= 15; i++) {
    const k = `c${i}`
    const v = c[k]
    if (!scale15(v)) return `SECTION_C_SCALE_${k}`
  }

  return null
}
