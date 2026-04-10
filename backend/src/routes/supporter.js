import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { isSupporterUserRole } from '../lib/roles.js'

const router = Router()
router.use(authMiddleware)

function userClassToLabel(uc) {
  if (uc == null) return null
  const m = { IS_1: 'IS-1', IS_2: 'IS-2', IS_3: 'IS-3' }
  return m[uc] || String(uc)
}

/**
 * GET /api/supporter/learners
 * Role support (hoặc assistant legacy): học viên IS-2 (internal-chat) đã được admin gán cho supporter này.
 */
router.get('/learners', async (req, res) => {
  try {
    if (!isSupporterUserRole(req.auth.userRole)) {
      return res.status(403).json({ error: 'Chỉ tài khoản supporter (role support)' })
    }

    const assignedRows = await prisma.learnerSupporterAssignment.findMany({
      where: { supporterId: req.auth.userId },
      select: { learnerId: true },
    })
    const assignedIds = assignedRows.map((r) => r.learnerId)
    if (assignedIds.length === 0) {
      return res.status(200).json({ learners: [] })
    }

    /** Không lọc theo lớp: gán từ admin đã ràng buộc IS-2; tránh học viên hợp lệ bị ẩn nếu dữ liệu lớp lệch. */
    const learners = await prisma.user.findMany({
      where: {
        userRole: 'student',
        userId: { in: assignedIds },
      },
      select: {
        userId: true,
        username: true,
        fullname: true,
        userClass: true,
      },
      orderBy: { username: 'asc' },
      take: 500,
    })

    const list = learners.map((l) => ({
      userId: l.userId,
      username: l.username,
      fullname: l.fullname,
      classCode: userClassToLabel(l.userClass),
    }))

    return res.status(200).json(jsonSafe({ learners: list }))
  } catch (err) {
    console.error('[supporter learners]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
