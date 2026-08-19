import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { isSupporterUserRole } from '../lib/roles.js'
import { buildSharedDownloadPath } from '../lib/signedDownloadUrl.js'
import { SECTION_B_QUESTIONS as POSTTEST_QUESTIONS } from '../data/posttest/sectionB/index.js'
import { SECTION_B_QUESTIONS as POSTTEST2_QUESTIONS } from '../data/posttest2/sectionB/index.js'

const router = Router()
router.use(authMiddleware)

const CONFIG_KEY = 'GRADING_SUBMISSION_CONFIG'
const DEFAULT_CONFIG = {
  sub1_1: '',
  sub1_2: '',
  sub2_1: '',
  sub2_2: '',
  sub3: '',
  sub4: '',
  final_1: '',
  final_2: '',
}

/**
 * Lấy cấu hình đợt nộp từ app_settings.
 */
async function getGradingConfig(prisma) {
  const row = await prisma.appSetting.findUnique({
    where: { settingKey: CONFIG_KEY },
  })
  return row && row.value ? row.value : DEFAULT_CONFIG
}

/** Upload mới nhất theo periodId (một map: periodId → upload). */
function latestUploadByPeriod(uploads) {
  const byPeriod = new Map()
  for (const u of uploads) {
    if (!byPeriod.has(u.periodId)) byPeriod.set(u.periodId, u)
  }
  return byPeriod
}

function pickUpload(byPeriod, periodLate, periodNormal, isSupplementaryRound = false) {
  if (periodLate && byPeriod.has(periodLate)) {
    const u = byPeriod.get(periodLate)
    return {
      ...u,
      id: String(u.id),
      isLate: !isSupplementaryRound,
      isSupplementary: isSupplementaryRound,
    }
  }
  if (periodNormal && byPeriod.has(periodNormal)) {
    const u = byPeriod.get(periodNormal)
    return { ...u, id: String(u.id), isLate: false, isSupplementary: false }
  }
  return null
}

/** Chuyển upload journal → link tải shared (null nếu không có file). */
function toSubmissionLink(upload) {
  if (!upload) return null
  const learnerId = upload.userId != null ? String(upload.userId) : ''
  const uploadId = String(upload.id ?? '')
  if (!learnerId || !uploadId) return null
  return {
    uploadId,
    fileName: upload.originalFileName ? String(upload.originalFileName).slice(0, 512) : '',
    downloadUrl: buildSharedDownloadPath({ learnerId, uploadId }),
  }
}

/** Map submission (sub1..sub4, final) → link tải file đợt tương ứng. */
function buildSubmissionLinks(config, uploadsByPeriod) {
  return {
    sub1: toSubmissionLink(pickUpload(uploadsByPeriod, config.sub1_2, config.sub1_1, true)),
    sub2: toSubmissionLink(pickUpload(uploadsByPeriod, config.sub2_2, config.sub2_1, true)),
    sub3: toSubmissionLink(pickUpload(uploadsByPeriod, null, config.sub3, false)),
    sub4: toSubmissionLink(pickUpload(uploadsByPeriod, null, config.sub4, false)),
    final: toSubmissionLink(pickUpload(uploadsByPeriod, config.final_2, config.final_1, false)),
  }
}

/**
 * Tự động chấm MCQ trong một khảo sát (Section B) theo đáp án chuẩn.
 * Mỗi câu MCQ đúng = 0.5đ, tổng = min(10, sum).
 * @param {object} sectionA - { topicFirst, topicSecond }
 * @param {object} sectionB - { topicKey: { q1: 'A', q2: 'B', ... } }
 * @param {object} questionsByTopic - { topicKey: [{ id:'q1', answer:'B', type:'mcq' }, ...] }
 * @returns {{ qScores: object, total: number }}
 */
function autoGradeSectionB(sectionA, sectionB, questionsByTopic) {
  const qScores = {}
  const topics = [sectionA?.topicFirst, sectionA?.topicSecond]
  let sum = 0
  topics.forEach((topic, tIdx) => {
    const qList = questionsByTopic[topic] || []
    const answers = sectionB?.[topic] || {}
    qList.forEach((q, qIdx) => {
      if (q.type !== 'mcq') return
      const key = `B${tIdx + 1}-${qIdx + 1}`
      const userAns = String(answers[q.id] || '').toUpperCase()
      const isCorrect = userAns !== '' && userAns === String(q.answer || '').toUpperCase()
      const pts = isCorrect ? 0.5 : 0
      qScores[key] = pts
      if (key.startsWith('B')) sum += pts
    })
  })
  return { qScores, total: parseFloat(Math.min(10, sum).toFixed(2)) }
}

/**
 * POST /api/grading/auto-grade-surveys
 * Admin: Tự động chấm toàn bộ Posttest & Posttest 2 của tất cả học viên theo đáp án chuẩn.
 * Không ghi đè Pretest hay các cột Sub/Final đã chấm tay.
 */
router.post('/auto-grade-surveys', async (req, res) => {
  try {
    const isSupporter = isSupporterUserRole(req.auth.userRole)
    const isAdmin = req.auth.userRole === 'admin'
    if (!isSupporter && !isAdmin) {
      return res.status(403).json({ error: 'Không có quyền truy cập' })
    }

    const students = await prisma.user.findMany({
      where: { userRole: 'student' },
      select: { userId: true },
    })

    const userIds = students.map((s) => s.userId)
    if (userIds.length === 0) {
      return res.status(200).json(jsonSafe({ ok: true, updated: 0, message: 'Không có học viên nào' }))
    }

    const surveys = await prisma.surveyResponse.findMany({
      where: { userId: { in: userIds }, surveyKind: { in: ['POSTTEST', 'POSTTEST2'] } },
      select: { userId: true, surveyKind: true, sectionA: true, sectionB: true },
    })

    const byUser = {}
    for (const s of surveys) {
      if (!byUser[s.userId]) byUser[s.userId] = {}
      byUser[s.userId][s.surveyKind] = s
    }

    const gradings = await prisma.studentGrading.findMany({
      where: { learnerId: { in: userIds } },
      select: { learnerId: true, scores: true },
    })
    const gradingMap = new Map()
    for (const g of gradings) gradingMap.set(g.learnerId, g.scores || {})

    let updated = 0
    for (const st of students) {
      const userSurveys = byUser[st.userId] || {}
      const post = userSurveys.POSTTEST
      const post2 = userSurveys.POSTTEST2
      if (!post && !post2) continue

      const scores = { ...(gradingMap.get(st.userId) || {}) }

      if (post) {
        const { qScores, total } = autoGradeSectionB(post.sectionA, post.sectionB, POSTTEST_QUESTIONS)
        scores.posttest = total
        scores.posttest_q = qScores
      }
      if (post2) {
        const { qScores, total } = autoGradeSectionB(post2.sectionA, post2.sectionB, POSTTEST2_QUESTIONS)
        scores.posttest2 = total
        scores.posttest2_q = qScores
      }

      await prisma.studentGrading.upsert({
        where: { learnerId: st.userId },
        create: { learnerId: st.userId, supporterId: req.auth.userId, scores, comments: {} },
        update: { scores },
      })
      updated++
    }

    return res.status(200).json(jsonSafe({ ok: true, updated }))
  } catch (err) {
    console.error('[grading POST /auto-grade-surveys]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ' })
  }
})

/**
 * GET /api/grading/config
 * Lấy cấu hình ánh xạ các đợt nộp bài
 */
router.get('/config', async (req, res) => {
  try {
    const row = await prisma.appSetting.findUnique({
      where: { settingKey: CONFIG_KEY },
    })
    const value = row && row.value ? row.value : DEFAULT_CONFIG
    return res.status(200).json(jsonSafe({ config: value }))
  } catch (err) {
    console.error('[grading GET /config]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ' })
  }
})

/**
 * PUT /api/grading/config
 * Admin cập nhật cấu hình ánh xạ đợt nộp bài
 */
router.put('/config', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }
    const body = req.body || {}
    const config = {
      sub1_1: String(body.sub1_1 || '').trim(),
      sub1_2: String(body.sub1_2 || '').trim(),
      sub2_1: String(body.sub2_1 || '').trim(),
      sub2_2: String(body.sub2_2 || '').trim(),
      sub3: String(body.sub3 || '').trim(),
      sub4: String(body.sub4 || '').trim(),
      final_1: String(body.final_1 || '').trim(),
      final_2: String(body.final_2 || '').trim(),
    }

    const updated = await prisma.appSetting.upsert({
      where: { settingKey: CONFIG_KEY },
      create: { settingKey: CONFIG_KEY, value: config },
      update: { value: config },
    })

    return res.status(200).json(jsonSafe({ config: updated.value }))
  } catch (err) {
    console.error('[grading PUT /config]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ' })
  }
})

/**
 * POST /api/grading/assign-random
 * Admin: Xáo trộn ngẫu nhiên toàn bộ học viên và phân bổ đều cho các Supporter
 */
router.post('/assign-random', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }

    const students = await prisma.user.findMany({
      where: { userRole: 'student' },
      select: { userId: true },
    })

    if (students.length === 0) {
      return res.status(400).json({ error: 'Không tìm thấy học viên nào trong hệ thống.' })
    }

    const supporters = await prisma.user.findMany({
      where: { userRole: { in: ['support', 'assistant'] } },
      select: { userId: true, username: true, fullname: true },
    })

    if (supporters.length === 0) {
      return res.status(400).json({ error: 'Không tìm thấy tài khoản Supporter nào trong hệ thống.' })
    }

    // Xáo trộn học viên
    const shuffled = [...students].sort(() => Math.random() - 0.5)
    const numSupporters = supporters.length

    let count = 0
    for (let i = 0; i < shuffled.length; i++) {
      const student = shuffled[i]
      const assignedSupporter = supporters[i % numSupporters]

      await prisma.studentGrading.upsert({
        where: { learnerId: student.userId },
        create: {
          learnerId: student.userId,
          supporterId: assignedSupporter.userId,
          scores: {},
          comments: {},
        },
        update: {
          supporterId: assignedSupporter.userId,
        },
      })
      count++
    }

    return res.status(200).json(
      jsonSafe({
        ok: true,
        assignedStudentsCount: count,
        supportersCount: numSupporters,
        message: `Đã phân bổ ngẫu nhiên ${count} học viên đều cho ${numSupporters} supporter.`,
      })
    )
  } catch (err) {
    console.error('[grading POST /assign-random]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ' })
  }
})

/**
 * GET /api/grading/supporters
 * Lấy danh sách toàn bộ Supporter/Assistant để phục vụ chuyển đổi gán
 */
router.get('/supporters', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }

    const list = await prisma.user.findMany({
      where: { userRole: { in: ['support', 'assistant'] } },
      select: { userId: true, username: true, fullname: true },
      orderBy: { username: 'asc' },
    })

    return res.status(200).json(jsonSafe({ supporters: list }))
  } catch (err) {
    console.error('[grading GET /supporters]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ' })
  }
})

/**
 * PUT /api/grading/assign-single
 * Admin đổi supporter cho một học viên cụ thể
 */
router.put('/assign-single', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }

    const { learnerId, supporterId } = req.body || {}
    if (!learnerId || !supporterId) {
      return res.status(400).json({ error: 'Thiếu learnerId hoặc supporterId' })
    }

    const supporter = await prisma.user.findUnique({
      where: { userId: supporterId },
      select: { username: true, fullname: true },
    })

    if (!supporter) {
      return res.status(404).json({ error: 'Không tìm thấy Supporter này' })
    }

    await prisma.studentGrading.upsert({
      where: { learnerId },
      create: {
        learnerId,
        supporterId,
        scores: {},
        comments: {},
      },
      update: {
        supporterId,
      },
    })

    return res.status(200).json(
      jsonSafe({
        ok: true,
        supporterId,
        supporterName: `${supporter.fullname} (${supporter.username})`,
      })
    )
  } catch (err) {
    console.error('[grading PUT /assign-single]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ' })
  }
})

/**
 * GET /api/grading/learners
 * Danh sách học viên kèm theo kết quả chấm bài và thông tin người chấm
 */
router.get('/learners', async (req, res) => {
  try {
    const isSupporter = isSupporterUserRole(req.auth.userRole)
    const isAdmin = req.auth.userRole === 'admin'
    if (!isSupporter && !isAdmin) {
      return res.status(403).json({ error: 'Không có quyền truy cập' })
    }

    const students = await prisma.user.findMany({
      where: { userRole: 'student' },
      select: {
        userId: true,
        username: true,
        fullname: true,
        userClass: true,
        studentSchoolId: true,
      },
      orderBy: [{ userClass: 'asc' }, { username: 'asc' }],
    })

    const gradings = await prisma.studentGrading.findMany({
      select: {
        learnerId: true,
        supporterId: true,
        totalScore: true,
        gradedAt: true,
        supporter: {
          select: { username: true, fullname: true },
        },
      },
    })

    const gradingMap = new Map()
    for (const g of gradings) {
      gradingMap.set(g.learnerId, g)
    }

    const list = students.map((st) => {
      const g = gradingMap.get(st.userId)
      const isMyAssigned = g ? g.supporterId === req.auth.userId : false

      return {
        userId: st.userId,
        username: st.username,
        fullname: st.fullname,
        userClass: st.userClass,
        studentSchoolId: st.studentSchoolId || '',
        isMyAssigned,
        isGraded: g && g.totalScore != null,
        totalScore: g ? g.totalScore : null,
        gradedAt: g ? g.gradedAt.toISOString() : null,
        supporterId: g ? g.supporterId : null,
        supporterName: g?.supporter ? `${g.supporter.fullname} (${g.supporter.username})` : 'Chưa phân công',
      }
    })

    return res.status(200).json(jsonSafe({ learners: list }))
  } catch (err) {
    console.error('[grading GET /learners]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ' })
  }
})

/**
 * GET /api/grading/export-data
 * Lấy toàn bộ kết quả chấm điểm của tất cả học viên phục vụ xuất CSV
 */
router.get('/export-data', async (req, res) => {
  try {
    const isSupporter = isSupporterUserRole(req.auth.userRole)
    const isAdmin = req.auth.userRole === 'admin'
    if (!isSupporter && !isAdmin) {
      return res.status(403).json({ error: 'Không có quyền truy cập' })
    }

    const config = await getGradingConfig(prisma)

    const students = await prisma.user.findMany({
      where: { userRole: 'student' },
      select: {
        userId: true,
        username: true,
        fullname: true,
        userClass: true,
        studentSchoolId: true,
      },
      orderBy: [{ userClass: 'asc' }, { username: 'asc' }],
    })

    // Tất cả upload journal (mới nhất trước) → map theo user, rồi theo period.
    const allUploads = await prisma.journalUpload.findMany({
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        userId: true,
        periodId: true,
        originalFileName: true,
      },
    })
    const uploadsByUser = new Map()
    for (const u of allUploads) {
      let m = uploadsByUser.get(u.userId)
      if (!m) {
        m = new Map()
        uploadsByUser.set(u.userId, m)
      }
      if (!m.has(u.periodId)) m.set(u.periodId, u)
    }

    const gradings = await prisma.studentGrading.findMany({
      select: {
        learnerId: true,
        supporterId: true,
        totalScore: true,
        scores: true,
        comments: true,
        gradedAt: true,
        supporter: {
          select: { username: true, fullname: true },
        },
      },
    })

    const gradingMap = new Map()
    for (const g of gradings) {
      gradingMap.set(g.learnerId, g)
    }

    const list = students.map((st) => {
      const g = gradingMap.get(st.userId)
      return {
        userId: st.userId,
        username: st.username,
        fullname: st.fullname,
        userClass: st.userClass,
        studentSchoolId: st.studentSchoolId || '',
        isGraded: g && g.totalScore != null,
        totalScore: g ? g.totalScore : null,
        scores: g ? g.scores : {},
        comments: g ? g.comments : {},
        gradedAt: g ? g.gradedAt.toISOString() : null,
        supporterName: g?.supporter ? `${g.supporter.fullname} (${g.supporter.username})` : 'Chưa phân công',
        submissionLinks: buildSubmissionLinks(config, uploadsByUser.get(st.userId) || new Map()),
      }
    })

    return res.status(200).json(jsonSafe({ results: list }))
  } catch (err) {
    console.error('[grading GET /export-data]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ' })
  }
})


/**
 * GET /api/grading/learner/:learnerId
 * Lấy toàn bộ bundle bài làm (Sub 1..4, Final, Pretest, Posttest) và kết quả chấm hiện tại
 */
router.get('/learner/:learnerId', async (req, res) => {
  try {
    const isSupporter = isSupporterUserRole(req.auth.userRole)
    const isAdmin = req.auth.userRole === 'admin'
    if (!isSupporter && !isAdmin) {
      return res.status(403).json({ error: 'Không có quyền truy cập' })
    }

    const learnerId = String(req.params.learnerId || '').trim()
    if (!learnerId) {
      return res.status(400).json({ error: 'Thiếu learnerId' })
    }

    const learner = await prisma.user.findUnique({
      where: { userId: learnerId },
      select: {
        userId: true,
        username: true,
        fullname: true,
        userClass: true,
        studentSchoolId: true,
      },
    })

    if (!learner) {
      return res.status(404).json({ error: 'Không tìm thấy học viên' })
    }

    // 1. Cấu hình đợt
    const settingRow = await prisma.appSetting.findUnique({
      where: { settingKey: CONFIG_KEY },
    })
    const config = settingRow && settingRow.value ? settingRow.value : DEFAULT_CONFIG

    // 2. Các bản nộp journal
    const uploads = await prisma.journalUpload.findMany({
      where: { userId: learnerId },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        periodId: true,
        originalFileName: true,
        storageKey: true,
        submittedAt: true,
        status: true,
        extractedText: true,
        aiEvaluation: true,
      },
    })

    const uploadsByPeriod = new Map()
    for (const u of uploads) {
      if (!uploadsByPeriod.has(u.periodId)) {
        uploadsByPeriod.set(u.periodId, u)
      }
    }

    const getMatchingUpload = (periodLate, periodNormal, isSupplementaryRound = false) => {
      if (periodLate && uploadsByPeriod.has(periodLate)) {
        const u = uploadsByPeriod.get(periodLate)
        return {
          ...u,
          id: String(u.id),
          isLate: !isSupplementaryRound,
          isSupplementary: isSupplementaryRound,
        }
      }
      if (periodNormal && uploadsByPeriod.has(periodNormal)) {
        const u = uploadsByPeriod.get(periodNormal)
        return { ...u, id: String(u.id), isLate: false, isSupplementary: false }
      }
      return null
    }

    const submissions = {
      sub1: getMatchingUpload(config.sub1_2, config.sub1_1, true),
      sub2: getMatchingUpload(config.sub2_2, config.sub2_1, true),
      sub3: getMatchingUpload(null, config.sub3, false),
      sub4: getMatchingUpload(null, config.sub4, false),
      final: getMatchingUpload(config.final_2, config.final_1, false),
    }

    // 3. Khảo sát (Pretest & Posttest)
    const surveys = await prisma.surveyResponse.findMany({
      where: { userId: learnerId },
    })

    let pretest = null
    let posttest = null
    let posttest2 = null
    for (const s of surveys) {
      if (s.surveyKind === 'PRETEST') {
        pretest = { id: String(s.id), sectionA: s.sectionA, sectionB: s.sectionB, sectionC: s.sectionC, createdAt: s.createdAt.toISOString() }
      } else if (s.surveyKind === 'POSTTEST') {
        posttest = { id: String(s.id), sectionA: s.sectionA, sectionB: s.sectionB, sectionC: s.sectionC, createdAt: s.createdAt.toISOString() }
      } else if (s.surveyKind === 'POSTTEST2') {
        posttest2 = { id: String(s.id), sectionA: s.sectionA, sectionB: s.sectionB, sectionC: s.sectionC, createdAt: s.createdAt.toISOString() }
      }
    }

    // 4. Kết quả chấm hiện tại
    const gradingRow = await prisma.studentGrading.findUnique({
      where: { learnerId },
      include: {
        supporter: { select: { username: true, fullname: true } },
      },
    })

    const grading = gradingRow
      ? {
          id: String(gradingRow.id),
          supporterId: gradingRow.supporterId,
          supporterName: gradingRow.supporter ? `${gradingRow.supporter.fullname} (${gradingRow.supporter.username})` : '',
          scores: gradingRow.scores,
          comments: gradingRow.comments,
          totalScore: gradingRow.totalScore,
          gradedAt: gradingRow.gradedAt.toISOString(),
        }
      : null

    return res.status(200).json(
      jsonSafe({
        learner,
        config,
        submissions,
        pretest,
        posttest,
        posttest2,
        grading,
      })
    )
  } catch (err) {
    console.error('[grading GET /learner/:id]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ' })
  }
})

/**
 * POST /api/grading/learner/:learnerId
 * Supporter lưu điểm & nhận xét
 */
router.post('/learner/:learnerId', async (req, res) => {
  try {
    const isSupporter = isSupporterUserRole(req.auth.userRole)
    const isAdmin = req.auth.userRole === 'admin'
    if (!isSupporter && !isAdmin) {
      return res.status(403).json({ error: 'Không có quyền truy cập' })
    }

    const learnerId = String(req.params.learnerId || '').trim()
    if (!learnerId) {
      return res.status(400).json({ error: 'Thiếu learnerId' })
    }

    const { scores, comments, totalScore } = req.body || {}
    const safeScores = typeof scores === 'object' && scores ? scores : {}
    const safeComments = typeof comments === 'object' && comments ? comments : {}
    const safeTotalScore = typeof totalScore === 'number' ? totalScore : null

    // Nếu đã có record thì giữ supporterId cũ, nếu chưa có thì gán cho người đang chấm
    const existing = await prisma.studentGrading.findUnique({
      where: { learnerId },
    })

    const supporterId = existing ? existing.supporterId : req.auth.userId

    const updated = await prisma.studentGrading.upsert({
      where: { learnerId },
      create: {
        learnerId,
        supporterId,
        scores: safeScores,
        comments: safeComments,
        totalScore: safeTotalScore,
      },
      update: {
        scores: safeScores,
        comments: safeComments,
        totalScore: safeTotalScore,
      },
    })

    return res.status(200).json(
      jsonSafe({
        ok: true,
        grading: {
          id: String(updated.id),
          supporterId: updated.supporterId,
          scores: updated.scores,
          comments: updated.comments,
          totalScore: updated.totalScore,
          gradedAt: updated.gradedAt.toISOString(),
        },
      })
    )
  } catch (err) {
    console.error('[grading POST /learner/:id]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ' })
  }
})

export default router
