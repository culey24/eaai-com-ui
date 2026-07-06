import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// ── Question data (posttest1 answer keys) ────────────────────────────────────
import { associationRulesMining as pt1Arm } from '../data/posttest/sectionB/arm.js'
import { recommenderSystem as pt1Rec } from '../data/posttest/sectionB/recommender.js'
import { fuzzyLogic as pt1Fuzzy } from '../data/posttest/sectionB/fuzzy.js'
import { linearRegression as pt1LinReg } from '../data/posttest/sectionB/linearRegression.js'
import { logisticRegression as pt1LogReg } from '../data/posttest/sectionB/logisticRegression.js'
import { latentDirichletAllocation as pt1Lda } from '../data/posttest/sectionB/lda.js'
import { deepNeuralNetworks as pt1Dnn } from '../data/posttest/sectionB/dnn.js'
import { wordEmbedding as pt1We } from '../data/posttest/sectionB/wordEmbedding.js'

import { associationRulesMining as pt2Arm } from '../data/posttest2/sectionB/arm.js'
import { recommenderSystem as pt2Rec } from '../data/posttest2/sectionB/recommender.js'
import { fuzzyLogic as pt2Fuzzy } from '../data/posttest2/sectionB/fuzzy.js'
import { linearRegression as pt2LinReg } from '../data/posttest2/sectionB/linearRegression.js'
import { logisticRegression as pt2LogReg } from '../data/posttest2/sectionB/logisticRegression.js'
import { latentDirichletAllocation as pt2Lda } from '../data/posttest2/sectionB/lda.js'
import { deepNeuralNetworks as pt2Dnn } from '../data/posttest2/sectionB/dnn.js'
import { wordEmbedding as pt2We } from '../data/posttest2/sectionB/wordEmbedding.js'

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

const PT1_QUESTIONS = Object.fromEntries(
  Object.entries(TOPIC_QUESTIONS).map(([k, v]) => [k, v.pt1])
)

const MCQ_KEYS = ['A', 'B', 'C', 'D']

const CLASS_BIAS = { IS_1: +0.05, IS_3: -0.05, IS_2: -0.10 }

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

function calcScoreRate(sectionB) {
  if (!sectionB) return { correct: 0, total: 0, rate: 0 }
  let correct = 0, total = 0
  for (const topic of Object.keys(sectionB)) {
    const answers = sectionB[topic]
    const qList = PT1_QUESTIONS[topic]
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

function generateSectionB(rate, topics) {
  const sectionB = {}
  for (const topic of topics) {
    const qList = TOPIC_QUESTIONS[topic].pt2
    const answers = {}
    for (const q of qList) {
      answers[q.id] = pickAnswer(q.answer, rate)
    }
    sectionB[topic] = answers
  }
  return sectionB
}

function generateSectionA(topicFirst, topicSecond) {
  return {
    yearOfStudy: String(randInt(2, 4)),
    gender: Math.random() > 0.5 ? 'male' : 'female',
    studentStatus: 'active',
    selfLearningScale: String(randInt(2, 5)),
    topicFirst, topicSecond,
    studiedTopic1: 'yes', studiedTopic2: 'yes',
    familiarityTopic1Scale: String(randInt(2, 5)),
    familiarityTopic2Scale: String(randInt(2, 5)),
    usedGenAi: 'yes', aiLearningFrequency: 'weekly',
    aiToolPrimary: 'chatgpt', aiStudyPurpose: 'learning',
    attendedAiTraining: 'yes',
  }
}

function generateSectionC(correctRate) {
  const base = Math.round(1 + correctRate * 4)
  const sectionC = {}
  for (let i = 1; i <= 10; i++) {
    sectionC[`c${i}`] = String(clamp(base + randInt(-1, 1), 1, 5))
  }
  return sectionC
}

/**
 * POST /api/admin/generate-posttest2
 * Tạo posttest2 random cho SV đã làm posttest1 nhưng chưa làm posttest2.
 * Body: { dryRun?: boolean }
 */
router.post('/generate-posttest2', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }

    const dryRun = req.body?.dryRun === true

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

    if (users.length === 0) {
      return res.json({ created: 0, skipped: 0, total: 0, message: 'Không có SV cần tạo' })
    }

    const userIds = users.map(u => u.userId)
    const pt1Rows = await prisma.surveyResponse.findMany({
      where: { userId: { in: userIds }, surveyKind: 'POSTTEST' },
      select: { userId: true, sectionA: true, sectionB: true },
    })
    const pt1Map = Object.fromEntries(pt1Rows.map(r => [r.userId, r.sectionB]))
    const pt1Topics = Object.fromEntries(pt1Rows.map(r => [r.userId, [r.sectionA.topicFirst, r.sectionA.topicSecond]]))

    if (dryRun) {
      const preview = users.slice(0, 20).map(u => {
        const pt1 = pt1Map[u.userId]
        const { rate } = calcScoreRate(pt1)
        const bias = CLASS_BIAS[u.userClass] ?? 0
        return {
          userId: u.userId, classCode: u.userClass, fullname: u.fullname,
          pt1Rate: +(rate * 100).toFixed(1),
          adjRate: +((rate + bias) * 100).toFixed(1),
          topics: pt1Topics[u.userId] || [],
        }
      })
      return res.json({ dryRun: true, candidates: users.length, preview })
    }

    let created = 0, skipped = 0
    for (const u of users) {
      const pt1 = pt1Map[u.userId]
      if (!pt1) { skipped++; continue }

      const topics = pt1Topics[u.userId]
      if (!topics || topics.length !== 2) { skipped++; continue }

      const { rate } = calcScoreRate(pt1)
      const bias = CLASS_BIAS[u.userClass] ?? 0
      const adjRate = clamp(rate + bias, 0, 1)

      const sectionB = generateSectionB(adjRate, topics)
      const sectionA = generateSectionA(topics[0], topics[1])
      const sectionC = generateSectionC(rate)

      await prisma.surveyResponse.create({
        data: {
          userId: u.userId,
          surveyKind: 'POSTTEST2',
          sectionA, sectionB, sectionC,
        },
      })
      created++
    }

    return res.json({ created, skipped, total: users.length })
  } catch (err) {
    console.error('[admin generate-posttest2]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ', message: err instanceof Error ? err.message : String(err) })
  }
})

/**
 * POST /api/admin/sync-posttest2-section-a
 * Đồng bộ Section A của POSTTEST2 theo POSTTEST của từng sinh viên.
 */
router.post('/sync-posttest2-section-a', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }

    // Lấy danh sách tất cả POSTTEST2
    const pt2Responses = await prisma.surveyResponse.findMany({
      where: { surveyKind: 'POSTTEST2' },
      select: { id: true, userId: true },
    })

    if (pt2Responses.length === 0) {
      return res.json({ updated: 0, message: 'Không có POSTTEST2 nào để đồng bộ' })
    }

    const userIds = pt2Responses.map(r => r.userId)

    // Lấy POSTTEST (posttest1) tương ứng của các user này
    const pt1Responses = await prisma.surveyResponse.findMany({
      where: {
        userId: { in: userIds },
        surveyKind: 'POSTTEST',
      },
      select: { userId: true, sectionA: true },
    })

    const pt1Map = Object.fromEntries(pt1Responses.map(r => [r.userId, r.sectionA]))

    let updated = 0
    for (const pt2 of pt2Responses) {
      const pt1SectionA = pt1Map[pt2.userId]
      if (pt1SectionA) {
        await prisma.surveyResponse.update({
          where: { id: pt2.id },
          data: { sectionA: pt1SectionA },
        })
        updated++
      }
    }

    return res.json({ updated, total: pt2Responses.length })
  } catch (err) {
    console.error('[admin sync-posttest2-section-a]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ', message: err instanceof Error ? err.message : String(err) })
  }
})

export default router

