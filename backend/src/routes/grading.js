import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { isSupporterUserRole } from '../lib/roles.js'

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
    for (const s of surveys) {
      if (s.surveyKind === 'PRETEST') {
        pretest = { id: String(s.id), sectionA: s.sectionA, sectionB: s.sectionB, sectionC: s.sectionC, createdAt: s.createdAt.toISOString() }
      } else if (s.surveyKind === 'POSTTEST') {
        posttest = { id: String(s.id), sectionA: s.sectionA, sectionB: s.sectionB, sectionC: s.sectionC, createdAt: s.createdAt.toISOString() }
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
