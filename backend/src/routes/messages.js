import { Router } from 'express'
import { MessageSender } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { canAccessConversation } from '../lib/access.js'
import { jsonSafe } from '../lib/json.js'
import { isMinimalChatBody } from '../lib/lobby.js'
import { getMinimalMessages, postMinimalMessage } from './minimalMessagesHandlers.js'

const router = Router()

/**
 * GET /api/messages — 50 tin mới nhất (chat tối giản), thời gian tăng dần, không cần auth.
 */
router.get('/', getMinimalMessages)

function parseMessageRole(role) {
  if (role === 'assistant') return MessageSender.assistant
  if (role === 'system') return MessageSender.system
  return MessageSender.user
}

/**
 * GET /api/messages/:conversationId — theo hội thoại + JWT
 */
router.get('/:conversationId', authMiddleware, async (req, res) => {
  try {
    const rawId = req.params.conversationId
    let conversationId
    try {
      conversationId = BigInt(rawId)
    } catch {
      return res.status(400).json({ error: 'conversationId không hợp lệ' })
    }

    const access = await canAccessConversation(req.auth, conversationId)
    if (!access.ok) {
      return res.status(access.status).json({ error: access.message || 'Lỗi' })
    }

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 50, 1),
      200
    )
    let beforeId = null
    if (req.query.beforeId != null && req.query.beforeId !== '') {
      try {
        beforeId = BigInt(String(req.query.beforeId))
      } catch {
        return res.status(400).json({ error: 'beforeId không hợp lệ' })
      }
    }

    const where = { conversationId }
    if (beforeId != null) {
      where.id = { lt: beforeId }
    }

    const batch = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const chronological = [...batch].reverse()
    const oldestInBatch = batch[batch.length - 1]

    return res.status(200).json(
      jsonSafe({
        messages: chronological,
        nextCursor:
          batch.length === limit && oldestInBatch
            ? String(oldestInBatch.id)
            : null,
      })
    )
  } catch (err) {
    console.error('[messages GET]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * POST /api/messages
 * - Body { senderName, content } (không channelId): chat tối giản, không auth.
 * - Body { channelId, ... }: flow đầy đủ + JWT.
 */
router.post(
  '/',
  async (req, res, next) => {
    try {
      if (isMinimalChatBody(req.body)) {
        return await postMinimalMessage(req, res)
      }
    } catch (err) {
      return next(err)
    }
    next()
  },
  authMiddleware,
  async (req, res) => {
    try {
      const { channelId, content, fileName, role, conversationId: bodyConvId } = req.body || {}
      const ch = typeof channelId === 'string' ? channelId.trim() : ''
      const text = typeof content === 'string' ? content : ''
      const file = fileName != null ? String(fileName).slice(0, 512) : null
      const senderRole = parseMessageRole(role)

      if (!ch) {
        return res.status(400).json({ error: 'Thiếu channelId' })
      }

      const channel = await prisma.chatChannel.findUnique({ where: { channelId: ch } })
      if (!channel) {
        return res.status(400).json({ error: 'Kênh không tồn tại' })
      }

      let conversationId
      const { userId, userRole } = req.auth

      if (bodyConvId != null && bodyConvId !== '') {
        try {
          conversationId = BigInt(String(bodyConvId))
        } catch {
          return res.status(400).json({ error: 'conversationId không hợp lệ' })
        }
        const access = await canAccessConversation(req.auth, conversationId)
        if (!access.ok) {
          return res.status(access.status).json({ error: access.message || 'Lỗi' })
        }
        if (access.conv.channelId !== ch) {
          return res.status(400).json({ error: 'channelId không khớp hội thoại' })
        }
      } else {
        if (userRole !== 'student') {
          return res.status(400).json({
            error: 'Teacher/Admin cần gửi conversationId khi đăng tin nhắn',
          })
        }
        const conv = await prisma.conversation.upsert({
          where: {
            channelId_learnerId: { channelId: ch, learnerId: userId },
          },
          create: {
            channelId: ch,
            learnerId: userId,
          },
          update: {},
        })
        conversationId = conv.id
      }

      const senderUserId =
        senderRole === MessageSender.user ? userId : null

      const msg = await prisma.message.create({
        data: {
          conversationId,
          senderRole,
          senderUserId,
          content: text,
          fileName: file,
          metadata: {},
        },
      })

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      })

      return res.status(201).json(jsonSafe({ message: msg }))
    } catch (err) {
      console.error('[messages POST]', err)
      return res.status(500).json({
        error: 'Lỗi máy chủ',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }
)

export default router
