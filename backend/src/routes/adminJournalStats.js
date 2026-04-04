import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'

const router = Router()

/**
 * GET /api/admin/journal-upload-stats?periodId=...
 * Admin: số học viên (role student) đã có bản nộp journal trên server cho period_id.
 */
router.get('/journal-upload-stats', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }
    const periodId = String(req.query.periodId ?? '')
      .trim()
      .slice(0, 64)
    if (!periodId) {
      return res.status(400).json({ error: 'Thiếu periodId' })
    }

    const countRows = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT user_id)::int AS c
      FROM journal_uploads
      WHERE period_id = ${periodId}
    `
    const submitted =
      Array.isArray(countRows) && countRows[0]?.c != null ? Number(countRows[0].c) : 0

    const total = await prisma.user.count({
      where: { userRole: 'student' },
    })

    const totalByClassRows = await prisma.$queryRaw`
      SELECT user_class::text AS "classCode", COUNT(*)::int AS total
      FROM users
      WHERE user_role = 'student' AND user_class IS NOT NULL
      GROUP BY user_class
    `
    const submittedByClassRows = await prisma.$queryRaw`
      SELECT u.user_class::text AS "classCode", COUNT(DISTINCT ju.user_id)::int AS submitted
      FROM journal_uploads ju
      INNER JOIN users u ON u.user_id = ju.user_id AND u.user_role = 'student'
      WHERE ju.period_id = ${periodId} AND u.user_class IS NOT NULL
      GROUP BY u.user_class
    `

    const totalByClass = Object.fromEntries(
      (Array.isArray(totalByClassRows) ? totalByClassRows : []).map((r) => [
        String(r.classCode || ''),
        Number(r.total) || 0,
      ])
    )
    const submittedByClass = Object.fromEntries(
      (Array.isArray(submittedByClassRows) ? submittedByClassRows : []).map((r) => [
        String(r.classCode || ''),
        Number(r.submitted) || 0,
      ])
    )
    const classCodes = new Set([
      ...Object.keys(totalByClass),
      ...Object.keys(submittedByClass),
    ])
    const byClass = [...classCodes]
      .filter(Boolean)
      .sort()
      .map((classCode) => ({
        classCode,
        total: totalByClass[classCode] || 0,
        submitted: submittedByClass[classCode] || 0,
        notSubmitted: (totalByClass[classCode] || 0) - (submittedByClass[classCode] || 0),
      }))

    return res.status(200).json(jsonSafe({ periodId, submitted, total, byClass }))
  } catch (err) {
    console.error('[admin journal-upload-stats]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
