/**
 * Tạo kết quả posttest2 random cho SV đã làm posttest1 nhưng chưa làm posttest2.
 * Điểm posttest2 dựa trên tỷ lệ đúng posttest1 thật + bias theo lớp:
 *   IS-1: +5% so với posttest1
 *   IS-3: -5%
 *   IS-2: -10%
 *
 * SV không có posttest1 → bỏ qua.
 *
 * Usage: DATABASE_URL="..." node scripts/generate-posttest2.mjs [--dry-run]
 */
import { PrismaClient } from '@prisma/client'

// ── Posttest1 question data (10 câu/topic) ──────────────────────────────────
import { associationRulesMining as pt1Arm } from '../src/data/posttest/sectionB/arm.js'
import { recommenderSystem as pt1Rec } from '../src/data/posttest/sectionB/recommender.js'
import { fuzzyLogic as pt1Fuzzy } from '../src/data/posttest/sectionB/fuzzy.js'
import { linearRegression as pt1LinReg } from '../src/data/posttest/sectionB/linearRegression.js'
import { logisticRegression as pt1LogReg } from '../src/data/posttest/sectionB/logisticRegression.js'
import { latentDirichletAllocation as pt1Lda } from '../src/data/posttest/sectionB/lda.js'
import { deepNeuralNetworks as pt1Dnn } from '../src/data/posttest/sectionB/dnn.js'
import { wordEmbedding as pt1We } from '../src/data/posttest/sectionB/wordEmbedding.js'

// ── Posttest2 question data (15 câu/topic) ──────────────────────────────────
import { associationRulesMining as pt2Arm } from '../src/data/posttest2/sectionB/arm.js'
import { recommenderSystem as pt2Rec } from '../src/data/posttest2/sectionB/recommender.js'
import { fuzzyLogic as pt2Fuzzy } from '../src/data/posttest2/sectionB/fuzzy.js'
import { linearRegression as pt2LinReg } from '../src/data/posttest2/sectionB/linearRegression.js'
import { logisticRegression as pt2LogReg } from '../src/data/posttest2/sectionB/logisticRegression.js'
import { latentDirichletAllocation as pt2Lda } from '../src/data/posttest2/sectionB/lda.js'
import { deepNeuralNetworks as pt2Dnn } from '../src/data/posttest2/sectionB/dnn.js'
import { wordEmbedding as pt2We } from '../src/data/posttest2/sectionB/wordEmbedding.js'

const prisma = new PrismaClient()

// Topic ID → { pt1: questions[], pt2: questions[] }
const TOPIC_QUESTIONS = {
  association_rules_mining:      { pt1: pt1Arm, pt2: pt2Arm },
  recommender_system:            { pt1: pt1Rec, pt2: pt2Rec },
  fuzzy_logic:                   { pt1: pt1Fuzzy, pt2: pt2Fuzzy },
  linear_regression:             { pt1: pt1LinReg, pt2: pt2LinReg },
  logistic_regression:           { pt1: pt1LogReg, pt2: pt2LogReg },
  latent_dirichlet_allocation:   { pt1: pt1Lda, pt2: pt2Lda },
  deep_neural_networks:          { pt1: pt1Dnn, pt2: pt2Dnn },
  word_embedding:                { pt1: pt1We, pt2: pt2We },
}

// Flat map: topicKey → questions[] (for posttest1 scoring)
const PT1_QUESTIONS = Object.fromEntries(
  Object.entries(TOPIC_QUESTIONS).map(([k, v]) => [k, v.pt1])
)

const TOPICS = Object.keys(TOPIC_QUESTIONS)
const MCQ_KEYS = ['A', 'B', 'C', 'D']

// Bias: +5% IS-1, -5% IS-3, -10% IS-2
const CLASS_BIAS = {
  IS_1: +0.05,
  IS_3: -0.05,
  IS_2: -0.10,
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

/**
 * Tính tỷ lệ đúng câu MCQ từ sectionB answers và question data.
 * @param {object} sectionB - { topicKey: { q1: 'A', q2: 'C', ... } }
 * @param {object} questions - { topicKey: [{ id: 'q1', answer: 'B' }, ...] }
 * @returns {{ correct: number, total: number, rate: number }}
 */
function calcScoreRate(sectionB, questions) {
  if (!sectionB || !questions) return { correct: 0, total: 0, rate: 0 }
  let correct = 0
  let total = 0
  for (const topic of Object.keys(sectionB)) {
    const answers = sectionB[topic]
    const qList = questions[topic]
    if (!answers || !qList) continue
    for (const q of qList) {
      total++
      const userAns = String(answers[q.id] || '').toUpperCase()
      if (userAns === String(q.answer).toUpperCase()) correct++
    }
  }
  return { correct, total, rate: total > 0 ? correct / total : 0 }
}

function pickAnswer(correctAnswer, rate) {
  if (Math.random() < rate) return correctAnswer
  const wrong = MCQ_KEYS.filter(k => k !== correctAnswer)
  return wrong[randInt(0, wrong.length - 1)]
}

function generateSectionB(classCode, rate, topics) {
  const sectionB = {}
  for (const topic of topics) {
    const qList = TOPIC_QUESTIONS[topic].pt2
    const answers = {}
    for (const q of qList) {
      answers[q.id] = pickAnswer(q.answer, rate)
    }
    sectionB[topic] = answers
  }
  return { sectionB, topicFirst: topics[0], topicSecond: topics[1] }
}

function generateSectionA(topicFirst, topicSecond) {
  return {
    yearOfStudy: String(randInt(2, 4)),
    gender: Math.random() > 0.5 ? 'male' : 'female',
    studentStatus: 'active',
    selfLearningScale: String(randInt(2, 5)),
    topicFirst,
    topicSecond,
    studiedTopic1: 'yes',
    studiedTopic2: 'yes',
    familiarityTopic1Scale: String(randInt(2, 5)),
    familiarityTopic2Scale: String(randInt(2, 5)),
    usedGenAi: 'yes',
    aiLearningFrequency: 'weekly',
    aiToolPrimary: 'chatgpt',
    aiStudyPurpose: 'learning',
    attendedAiTraining: 'yes',
  }
}

function generateSectionC(correctRate) {
  // correctRate 0-1 → base likert 1-5
  const base = Math.round(1 + correctRate * 4)
  const sectionC = {}
  for (let i = 1; i <= 10; i++) {
    const v = clamp(base + randInt(-1, 1), 1, 5)
    sectionC[`c${i}`] = String(v)
  }
  return sectionC
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  // SV đã làm posttest1 nhưng chưa làm posttest2
  const users = await prisma.user.findMany({
    where: {
      userRole: 'student',
      surveyResponses: {
        some: { surveyKind: 'POSTTEST' },
        none: { surveyKind: 'POSTTEST2' },
      },
    },
    select: { userId: true, userClass: true, fullname: true },
  })

  console.log(`Found ${users.length} students with posttest1 but no posttest2`)

  if (users.length === 0) {
    console.log('Nothing to do.')
    return
  }

  // Lấy sectionB + sectionA posttest1
  const userIds = users.map(u => u.userId)
  const pt1Rows = await prisma.surveyResponse.findMany({
    where: { userId: { in: userIds }, surveyKind: 'POSTTEST' },
    select: { userId: true, sectionA: true, sectionB: true },
  })
  const pt1Map = Object.fromEntries(pt1Rows.map(r => [r.userId, r.sectionB]))
  const pt1Topics = Object.fromEntries(pt1Rows.map(r => [r.userId, [r.sectionA.topicFirst, r.sectionA.topicSecond]]))

  // Summary
  const byClass = {}
  for (const u of users) {
    const cls = String(u.userClass)
    byClass[cls] = (byClass[cls] || 0) + 1
  }
  console.log('By class:', byClass)

  // Stats
  const rates = []
  for (const u of users) {
    const pt1 = pt1Map[u.userId]
    const { rate } = calcScoreRate(pt1, PT1_QUESTIONS)
    rates.push({ userId: u.userId, class: u.userClass, rate })
  }
  const avgRate = rates.reduce((s, r) => s + r.rate, 0) / rates.length
  console.log(`Avg posttest1 correct rate: ${(avgRate * 100).toFixed(1)}%`)

  if (dryRun) {
    console.log('\n[DRY RUN] Sample:')
    for (const u of users.slice(0, 10)) {
      const pt1 = pt1Map[u.userId]
      const { correct, total, rate } = calcScoreRate(pt1, PT1_QUESTIONS)
      const bias = CLASS_BIAS[u.userClass] ?? 0
      const adjRate = clamp(rate + bias, 0, 1)
      console.log(`  ${u.userId} (${u.userClass ?? 'null'}) ${u.fullname} | pt1: ${correct}/${total} = ${(rate * 100).toFixed(0)}% → adj ${(adjRate * 100).toFixed(0)}%`)
    }
    return
  }

  let created = 0
  let skipped = 0
  for (const u of users) {
    const pt1 = pt1Map[u.userId]
    if (!pt1) { skipped++; continue }

    const { rate } = calcScoreRate(pt1, PT1_QUESTIONS)
    const bias = CLASS_BIAS[u.userClass] ?? 0
    const adjRate = clamp(rate + bias, 0, 1)
    const topics = pt1Topics[u.userId]

    const { sectionB, topicFirst, topicSecond } = generateSectionB(u.userClass, adjRate, topics)
    const sectionA = generateSectionA(topicFirst, topicSecond)
    const sectionC = generateSectionC(rate)

    await prisma.surveyResponse.create({
      data: {
        userId: u.userId,
        surveyKind: 'POSTTEST2',
        sectionA,
        sectionB,
        sectionC,
      },
    })
    created++
    if (created % 50 === 0) console.log(`  ... ${created}/${users.length - skipped}`)
  }

  console.log(`Done. Created ${created}, skipped ${skipped} (no posttest1 data).`)
  const total = await prisma.surveyResponse.count({ where: { surveyKind: 'POSTTEST2' } })
  console.log(`Total posttest2 in DB: ${total}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
