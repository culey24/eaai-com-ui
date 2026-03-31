import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import {
  ADMIN_SURVEY_KINDS,
  normalizeSurveyKind,
  SURVEY_KIND_PRETEST,
} from '../lib/surveyConfig.js'

const router = Router()
router.use(authMiddleware)

/** @param {unknown} uc */
function userClassToLabel(uc) {
  if (uc == null) return null
  const m = { IS_1: 'IS-1', IS_2: 'IS-2', IS_3: 'IS-3' }
  return m[uc] || String(uc)
}

/**
 * GET /api/admin/survey-submissions?kind=PRETEST|POSTTEST
 * Admin: danh sách bài nộp khảo sát (tóm tắt + payload đầy đủ).
 */
router.get('/survey-submissions', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin', code: 'FORBIDDEN' })
    }
    const kind = normalizeSurveyKind(req.query?.kind) || SURVEY_KIND_PRETEST
    if (!ADMIN_SURVEY_KINDS.includes(kind)) {
      return res.status(400).json({ code: 'INVALID_KIND', error: 'kind không hợp lệ' })
    }

    const rows = await prisma.surveyResponse.findMany({
      where: { surveyKind: kind },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            fullname: true,
            userClass: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 2000,
    })

    const submissions = rows.map((r) => ({
      id: String(r.id),
      userId: r.userId,
      surveyKind: r.surveyKind,
      username: r.user.username,
      fullname: r.user.fullname,
      classCode: userClassToLabel(r.user.userClass),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      sectionA: r.sectionA,
      sectionB: r.sectionB,
      sectionC: r.sectionC,
    }))

    return res.status(200).json(
      jsonSafe({
        kind,
        submissions,
        total: submissions.length,
      })
    )
  } catch (err) {
    console.error('[admin survey-submissions GET]', err)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
