import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'

const router = Router()
router.use(authMiddleware)

/**
 * GET /api/conversations
 * Student: hội thoại của chính mình.
 * Teacher: hội thoại của learner thuộc lớp (user_class) trong phạm vi supporter.
 * Admin: tất cả.
 */
router.get('/', async (req, res) => {
  try {
    const { userId, userRole } = req.auth

    let where = {}
    if (userRole === 'student') {
      where = { learnerId: userId }
    } else if (userRole === 'teacher') {
      const scopes = await prisma.assistantManagedClass.findMany({
        where: { teacherId: userId },
        select: { userClass: true },
      })
      const classes = scopes.map((s) => s.userClass)
      if (classes.length === 0) {
        return res.status(200).json({ conversations: [] })
      }
      where = {
        learner: {
          userClass: { in: classes },
        },
      }
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
