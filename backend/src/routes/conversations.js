import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { isSupporterUserRole } from '../lib/roles.js'

const router = Router()
router.use(authMiddleware)

/** Tránh CDN/browser dùng 304 + ETag chung cho JSON theo user → chat “trống” trên production. */
router.use((_req, res, next) => {
  res.set('Cache-Control', 'private, no-store, must-revalidate')
  res.set('Vary', 'Origin, Authorization')
  next()
})

/**
 * GET /api/conversations
 * Student: hội thoại của chính mình.
 * Supporter (support/assistant): hội thoại theo phân công learner_supporter_assignments hoặc phạm vi assistant_managed_classes.
 * Admin: tất cả.
 */
router.get('/', async (req, res) => {
  try {
    const { userId, userRole } = req.auth

    let where = {}
    if (userRole === 'student') {
      where = { learnerId: userId }
    } else if (isSupporterUserRole(userRole)) {
      const assignedRows = await prisma.learnerSupporterAssignment.findMany({
        where: { supporterId: userId },
        select: { learnerId: true },
      })
      const assignedIds = assignedRows.map((r) => r.learnerId)
      const scopes = await prisma.assistantManagedClass.findMany({
        where: { supporterId: userId },
        select: { userClass: true },
      })
      const classes = scopes.map((s) => s.userClass)
      const orBlock = []
      if (assignedIds.length > 0) {
        orBlock.push({ learnerId: { in: assignedIds } })
      }
      if (classes.length > 0) {
        orBlock.push({ learner: { userClass: { in: classes } } })
      }
      if (orBlock.length === 0) {
        return res.status(200).json({ conversations: [] })
      }
      where = orBlock.length === 1 ? orBlock[0] : { OR: orBlock }
    } else if (userRole === 'admin') {
      where = {}
    }

    const list = await prisma.conversation.findMany({
      where,
      include: {
        channel: true,
        learner: {
          select: { userId: true, username: true, fullname: true, userClass: true },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return res.status(200).json(jsonSafe({ conversations: list }))
  } catch (err) {
    console.error('[conversations GET]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
