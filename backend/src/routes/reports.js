import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { reportPostLimiter } from '../lib/rateLimits.js'

const router = Router()
router.use(authMiddleware)

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
