import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { reportPostLimiter } from '../lib/rateLimits.js'
import { isSupporterUserRole } from '../lib/roles.js'

const router = Router()
router.use(authMiddleware)

function userClassToLabel(uc) {
  if (uc == null) return ''
  const m = { IS_1: 'IS-1', IS_2: 'IS-2', IS_3: 'IS-3' }
  return m[uc] || String(uc)
}

/**
 * GET /api/reports
 * - student: báo cáo do chính mình gửi
 * - support/assistant: báo cáo trên kênh thuộc lớp phạm vi hoặc lớp của learner được gán
 * - admin: tất cả
 */
router.get('/', async (req, res) => {
  try {
    const { userId, userRole } = req.auth

    let where = {}
    if (userRole === 'student') {
      where = { reporterId: userId }
    } else if (isSupporterUserRole(userRole)) {
      const classSet = new Set()
      const scopes = await prisma.assistantManagedClass.findMany({
        where: { supporterId: userId },
        select: { userClass: true },
      })
      for (const s of scopes) {
        if (s.userClass != null) classSet.add(s.userClass)
      }
      const assigns = await prisma.learnerSupporterAssignment.findMany({
        where: { supporterId: userId },
        select: { learnerId: true },
      })
      for (const a of assigns) {
        const learner = await prisma.user.findUnique({
          where: { userId: a.learnerId },
          select: { userClass: true },
        })
        if (learner?.userClass != null) classSet.add(learner.userClass)
      }
      const classes = [...classSet]
      if (classes.length === 0) {
        return res.status(200).json({ reports: [] })
      }
      where = {
        channel: {
          userClass: { in: classes },
        },
      }
    } else if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền' })
    }

    const rows = await prisma.contentReport.findMany({
      where,
      include: {
        reporter: { select: { username: true, fullname: true } },
        channel: { select: { channelId: true, userClass: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const reports = rows.map((r) => ({
      id: String(r.id),
      channelId: r.channelId,
      reportType: r.reportType,
      type: r.reportType,
      detail: r.detail,
      status: r.status,
      createdAt: r.createdAt,
      timestamp: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
      reporterUsername: r.reporter?.username ?? '',
      reporterFullName: (r.reporter?.fullname || '').trim(),
      channelLabel: r.channel
        ? `${userClassToLabel(r.channel.userClass)} (${r.channel.channelId})`
        : r.channelId || '',
    }))

    return res.status(200).json(jsonSafe({ reports }))
  } catch (err) {
    console.error('[reports GET]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * POST /api/reports
 * Body (khớp eeai_chatbot_reports / ReportModal): channelId, type | reportType, detail?, channelLabel?, typeLabel?, messageId?
 */
router.post('/', reportPostLimiter, async (req, res) => {
  try {
    const body = req.body || {}
    const channelId =
      typeof body.channelId === 'string' ? body.channelId.trim() : ''
    const reportTypeRaw =
      body.reportType ?? body.type ?? body.typeLabel ?? ''
    const reportType =
      typeof reportTypeRaw === 'string' ? reportTypeRaw.trim().slice(0, 64) : ''
    const detail =
      body.detail != null && body.detail !== ''
        ? String(body.detail).slice(0, 10000)
        : null

    if (!channelId) {
      return res.status(400).json({ error: 'Thiếu channelId' })
    }
    if (!reportType) {
      return res.status(400).json({ error: 'Thiếu type hoặc reportType' })
    }

    let messageId = null
    if (body.messageId != null && body.messageId !== '') {
      try {
        messageId = BigInt(String(body.messageId))
      } catch {
        return res.status(400).json({ error: 'messageId không hợp lệ' })
      }
    }

    if (messageId != null) {
      const msg = await prisma.message.findUnique({ where: { id: messageId } })
      if (!msg) {
        return res.status(400).json({ error: 'messageId không tồn tại' })
      }
    }

    const channel = await prisma.chatChannel.findUnique({
      where: { channelId },
    })
    if (!channel) {
      return res.status(400).json({ error: 'Kênh không tồn tại' })
    }

    const report = await prisma.contentReport.create({
      data: {
        reporterId: req.auth.userId,
        channelId,
        ...(messageId != null ? { messageId } : {}),
        reportType,
        detail,
      },
    })

    return res.status(201).json(jsonSafe({ report }))
  } catch (err) {
    console.error('[reports POST]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
