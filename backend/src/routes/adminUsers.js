import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { apiRoleToPrisma, prismaRoleToApi } from '../lib/roles.js'

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

/**
 * PATCH /api/admin/users/:userId/role
 * body: { role: 'LEARNER' | 'ASSISTANT' | 'ADMIN' } — đồng bộ DB (UI account management).
 */
router.patch('/users/:userId/role', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin', code: 'FORBIDDEN' })
    }
    const userId =
      typeof req.params.userId === 'string' ? req.params.userId.trim().slice(0, 10) : ''
    const roleRaw = req.body?.role
    const prismaRole = apiRoleToPrisma(typeof roleRaw === 'string' ? roleRaw.trim() : '')
    if (!userId || !prismaRole) {
      return res.status(400).json({
        code: 'INVALID_ROLE',
        error: 'role phải là LEARNER, ASSISTANT hoặc ADMIN',
      })
    }

    const exists = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true, userRole: true },
    })
    if (!exists) {
      return res.status(404).json({ code: 'USER_NOT_FOUND', error: 'Không tìm thấy user' })
    }

    const updated = await prisma.user.update({
      where: { userId },
      data: { userRole: prismaRole },
      select: { userId: true, username: true, fullname: true, userRole: true, userClass: true },
    })

    return res.status(200).json(
      jsonSafe({
        user: {
          userId: updated.userId,
          username: updated.username,
          fullname: updated.fullname,
          role: prismaRoleToApi(updated.userRole),
          userClass: updated.userClass,
        },
      })
    )
  } catch (err) {
    console.error('[admin users PATCH role]', err)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
