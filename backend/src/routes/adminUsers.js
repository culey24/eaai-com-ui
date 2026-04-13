import { Router } from 'express'
import { UserRole } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { prismaRoleToApi } from '../lib/roles.js'
import { parseUserClass } from '../lib/classCode.js'

/** Map UI role → enum Prisma (ghi đúng user_role trên DB). */
function apiRoleStringToUserRole(roleRaw) {
  const r = typeof roleRaw === 'string' ? roleRaw.trim() : ''
  switch (r) {
    case 'LEARNER':
      return UserRole.student
    case 'ASSISTANT':
      return UserRole.support
    case 'ADMIN':
      return UserRole.admin
    default:
      return null
  }
}

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
    const prismaRole = apiRoleStringToUserRole(roleRaw)
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

/**
 * PATCH /api/admin/users/:userId/class
 * body: { classCode: 'IS-1' | 'IS-2' | 'IS-3' } — learner (student) accounts only.
 */
router.patch('/users/:userId/class', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin', code: 'FORBIDDEN' })
    }
    const userId =
      typeof req.params.userId === 'string' ? req.params.userId.trim().slice(0, 10) : ''
    const raw = req.body?.classCode
    const prismaClass = typeof raw === 'string' ? parseUserClass(raw) : null
    if (!userId || !prismaClass) {
      return res.status(400).json({
        code: 'INVALID_CLASS',
        error: 'classCode phải là IS-1, IS-2 hoặc IS-3',
      })
    }

    const exists = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true, userRole: true },
    })
    if (!exists) {
      return res.status(404).json({ code: 'USER_NOT_FOUND', error: 'Không tìm thấy user' })
    }
    if (exists.userRole !== UserRole.student) {
      return res.status(400).json({
        code: 'CLASS_LEARNER_ONLY',
        error: 'Chỉ có thể đổi mã lớp cho tài khoản học viên',
      })
    }

    const updated = await prisma.user.update({
      where: { userId },
      data: { userClass: prismaClass },
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
    console.error('[admin users PATCH class]', err)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
