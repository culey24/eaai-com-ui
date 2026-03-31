import { Router } from 'express'
import { UserClass, UserRole, TeachingMode } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { isSupporterUserRole } from '../lib/roles.js'

const router = Router()
router.use(authMiddleware)

const TEACHING_MODES = new Set(['AGENT', 'LLM', 'MANUAL'])

function parseTeachingMode(raw) {
  const s = typeof raw === 'string' ? raw.trim().toUpperCase() : ''
  if (TEACHING_MODES.has(s)) return TeachingMode[s]
  return null
}

/**
 * GET /api/admin/supporter-assignments
 * Danh sách gán supporter ↔ learner (chỉ admin).
 */
router.get('/supporter-assignments', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin', code: 'FORBIDDEN' })
    }
    const rows = await prisma.learnerSupporterAssignment.findMany({
      select: {
        learnerId: true,
        supporterId: true,
        teachingMode: true,
        assignedAt: true,
      },
      orderBy: { learnerId: 'asc' },
      take: 2000,
    })
    return res.status(200).json(jsonSafe({ assignments: rows }))
  } catch (err) {
    console.error('[admin supporter-assignments GET]', err)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * PUT /api/admin/supporter-assignments
 * body: { learnerId, supporterId, teachingMode }
 */
router.put('/supporter-assignments', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin', code: 'FORBIDDEN' })
    }
    const { learnerId: learnerIdRaw, supporterId: supporterIdRaw, teachingMode: tmRaw } =
      req.body || {}
    const learnerId =
      typeof learnerIdRaw === 'string' ? learnerIdRaw.trim().slice(0, 10) : ''
    const supporterId =
      typeof supporterIdRaw === 'string' ? supporterIdRaw.trim().slice(0, 10) : ''
    if (!learnerId || !supporterId) {
      return res.status(400).json({
        code: 'MISSING_FIELDS',
        error: 'Thiếu learnerId hoặc supporterId',
      })
    }
    const teachingMode = parseTeachingMode(tmRaw)
    if (!teachingMode) {
      return res.status(400).json({
        code: 'INVALID_TEACHING_MODE',
        error: 'teachingMode phải là AGENT, LLM hoặc MANUAL',
      })
    }

    const [learner, supporter] = await Promise.all([
      prisma.user.findUnique({
        where: { userId: learnerId },
        select: { userId: true, userRole: true, userClass: true },
      }),
      prisma.user.findUnique({
        where: { userId: supporterId },
        select: { userId: true, userRole: true },
      }),
    ])

    if (!learner || learner.userRole !== UserRole.student) {
      return res.status(400).json({
        code: 'INVALID_LEARNER',
        error: 'learnerId không phải học viên',
      })
    }
    if (learner.userClass !== UserClass.IS_3) {
      return res.status(400).json({
        code: 'LEARNER_NOT_IS3',
        error: 'Chỉ học viên lớp IS-3 được gán supporter',
      })
    }
    if (!supporter || !isSupporterUserRole(supporter.userRole)) {
      return res.status(400).json({
        code: 'INVALID_SUPPORTER',
        error: 'supporterId phải là tài khoản có role supporter (support), do admin gán',
      })
    }

    if (learnerId === supporterId) {
      return res.status(400).json({
        code: 'INVALID_PAIR',
        error: 'learnerId và supporterId không được trùng',
      })
    }

    const row = await prisma.learnerSupporterAssignment.upsert({
      where: { learnerId },
      create: {
        learnerId,
        supporterId,
        teachingMode,
      },
      update: {
        supporterId,
        teachingMode,
      },
      select: {
        learnerId: true,
        supporterId: true,
        teachingMode: true,
        assignedAt: true,
      },
    })

    return res.status(200).json(jsonSafe({ assignment: row }))
  } catch (err) {
    console.error('[admin supporter-assignments PUT]', err)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * DELETE /api/admin/supporter-assignments/:learnerId
 */
router.delete('/supporter-assignments/:learnerId', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin', code: 'FORBIDDEN' })
    }
    const learnerId = String(req.params.learnerId || '').trim().slice(0, 10)
    if (!learnerId) {
      return res.status(400).json({ code: 'MISSING_LEARNER', error: 'Thiếu learnerId' })
    }

    try {
      await prisma.learnerSupporterAssignment.delete({
        where: { learnerId },
      })
    } catch (e) {
      if (e?.code === 'P2025') {
        return res.status(404).json({
          code: 'NOT_FOUND',
          error: 'Không có bản ghi gán cho học viên này',
        })
      }
      throw e
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[admin supporter-assignments DELETE]', err)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
