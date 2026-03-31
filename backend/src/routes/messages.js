import { Router } from 'express'
import { MessageSender, UserClass } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { canAccessConversation } from '../lib/access.js'
import { jsonSafe } from '../lib/json.js'
import { isMinimalChatBody } from '../lib/lobby.js'
import { getMinimalMessages, postMinimalMessage } from './minimalMessagesHandlers.js'
import { channelUsesIs2Agent, generateIs2AgentReply } from '../lib/is2AgentReply.js'
import {
  minimalMessagePostLimiter,
  jwtMessagePostLimiter,
  is2GeminiPostLimiter,
} from '../lib/rateLimits.js'

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
  (req, res, next) => {
    if (!isMinimalChatBody(req.body)) return next()
    return minimalMessagePostLimiter(req, res, (err) => {
      if (err) return next(err)
      postMinimalMessage(req, res).catch(next)
    })
  },
  authMiddleware,
  jwtMessagePostLimiter,
  is2GeminiPostLimiter,
  async (req, res) => {
    if (isMinimalChatBody(req.body)) {
      return res.status(400).json({ error: 'Sai định dạng tin nhắn' })
    }
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

      if (
        userRole === 'student' &&
        channel.userClass === UserClass.IS_3 &&
        senderRole === MessageSender.user
      ) {
        const assign = await prisma.learnerSupporterAssignment.findUnique({
          where: { learnerId: userId },
          select: { learnerId: true },
        })
        if (!assign) {
          return res.status(403).json({
            error: 'Chưa được gán supporter. Hệ thống đang bận, hãy thử lại sau.',
          })
        }
      }

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
            error: 'Supporter/Admin cần gửi conversationId khi đăng tin nhắn',
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

      // IS-3 / internal-chat: không tự trả lời — supporter trả lời sau (hiển thị phía client như AGENT).
      // IS-2: OpenRouter agent. IS-1: echo mặc định.
      if (userRole === 'student' && senderRole === MessageSender.user) {
        if (channel.userClass === UserClass.IS_3) {
          /* chỉ lưu tin người học */
        } else if (channelUsesIs2Agent(channel)) {
          let assistantContent
          if (process.env.OPENROUTER_API_KEY?.trim()) {
            try {
              assistantContent = await generateIs2AgentReply(conversationId)
            } catch (agentErr) {
              console.error('[messages POST] IS-2 agent', agentErr)
              assistantContent = `Trợ lý IS-2 tạm thời lỗi: ${agentErr instanceof Error ? agentErr.message : String(agentErr)}`
            }
          } else {
            assistantContent =
              'Trợ lý lớp IS-2 chưa được bật trên server (thiếu OPENROUTER_API_KEY). Liên hệ quản trị hoặc dùng kênh khác.'
          }
          await prisma.message.create({
            data: {
              conversationId,
              senderRole: MessageSender.assistant,
              senderUserId: null,
              content: assistantContent,
              metadata: { source: 'openrouter_is2' },
            },
          })
        } else {
          const assistantContent = `Đã nhận tin nhắn của bạn. (Phản hồi từ ${ch})`
          await prisma.message.create({
            data: {
              conversationId,
              senderRole: MessageSender.assistant,
              senderUserId: null,
              content: assistantContent,
              metadata: { source: 'echo' },
            },
          })
        }
      }

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
