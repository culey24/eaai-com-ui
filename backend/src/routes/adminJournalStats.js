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

    return res.status(200).json(jsonSafe({ periodId, submitted, total }))
  } catch (err) {
    console.error('[admin journal-upload-stats]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
