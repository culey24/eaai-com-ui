import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'

const router = Router()
router.use(authMiddleware)

function userClassToLabel(uc) {
  if (uc == null) return null
  const m = { IS_1: 'IS-1', IS_2: 'IS-2', IS_3: 'IS-3' }
  return m[uc] || String(uc)
}

/**
 * GET /api/supporter/learners
 * Teacher (assistant): learners thuộc lớp trong phạm vi assistant_managed_classes.
 */
router.get('/learners', async (req, res) => {
  try {
    if (req.auth.userRole !== 'teacher') {
      return res.status(403).json({ error: 'Chỉ tài khoản assistant' })
    }
    const scopes = await prisma.assistantManagedClass.findMany({
      where: { teacherId: req.auth.userId },
      select: { userClass: true },
    })
    const classes = scopes.map((s) => s.userClass)
    if (classes.length === 0) {
      return res.status(200).json({ learners: [] })
    }

    const learners = await prisma.user.findMany({
      where: {
        userRole: 'student',
        userClass: { in: classes },
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
