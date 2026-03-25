import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'

const router = Router()
router.use(authMiddleware)

/**
 * GET /api/admin/users
 * Chỉ admin — danh sách user cho UI quản trị (không trả pwd).
 */
router.get('/users', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }
    const users = await prisma.user.findMany({
      select: {
        userId: true,
        username: true,
        fullname: true,
        userRole: true,
        userClass: true,
      },
      orderBy: { username: 'asc' },
      take: 500,
    })
    return res.status(200).json(jsonSafe({ users }))
  } catch (err) {
    console.error('[admin users]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
