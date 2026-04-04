import { Prisma } from '@prisma/client'
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import {
  ADMIN_SURVEY_KINDS,
  normalizeSurveyKind,
  SURVEY_KIND_PRETEST,
} from '../lib/surveyConfig.js'
import { getStatsExcludedUsernamesNormalized } from '../lib/statsExcludedUsernames.js'

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

    const excluded = await getStatsExcludedUsernamesNormalized(prisma)
    const excludeSql =
      excluded.length === 0
        ? Prisma.empty
        : Prisma.sql`AND LOWER(u.username) NOT IN (${Prisma.join(excluded)})`

    let rows
    if (excluded.length === 0) {
      rows = await prisma.surveyResponse.findMany({
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
    } else {
      const idRows = await prisma.$queryRaw`
        SELECT pr.pretest_id AS id
        FROM pretest_responses pr
        INNER JOIN users u ON u.user_id = pr.user_id
        WHERE pr.survey_kind = ${kind}
        ${excludeSql}
        ORDER BY pr.created_at DESC
        LIMIT 2000
      `
      const ids = (Array.isArray(idRows) ? idRows : [])
        .map((r) => r.id)
        .filter((id) => id != null)
      if (ids.length === 0) {
        rows = []
      } else {
        rows = await prisma.surveyResponse.findMany({
          where: { id: { in: ids } },
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
        })
        const order = new Map(ids.map((id, i) => [String(id), i]))
        rows.sort((a, b) => (order.get(String(a.id)) ?? 0) - (order.get(String(b.id)) ?? 0))
      }
    }

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
