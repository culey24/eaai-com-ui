import { Router } from 'express'
import { MessageSender, UserClass } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { canAccessConversation } from '../lib/access.js'
import { jsonSafe } from '../lib/json.js'
import { isMinimalChatBody } from '../lib/lobby.js'
import { getMinimalMessages, postMinimalMessage } from './minimalMessagesHandlers.js'
import { generateIs2AgentReply } from '../lib/is2AgentReply.js'
import { generateIs1AgenticReply } from '../lib/is1AgenticChatReply.js'
import { isSupporterUserRole } from '../lib/roles.js'
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
      const {
        channelId,
        content,
        fileName,
        role,
        conversationId: bodyConvId,
        learnerId: bodyLearnerId,
      } = req.body || {}
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

      let learnerUserClass = null
      if (userRole === 'student') {
        const lu = await prisma.user.findUnique({
          where: { userId },
          select: { userClass: true },
        })
        learnerUserClass = lu?.userClass ?? null
      }

      if (
        userRole === 'student' &&
        learnerUserClass === UserClass.IS_2 &&
        ch === 'internal-chat' &&
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
      } else if (userRole === 'student') {
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
      } else {
        const targetLearnerId =
          typeof bodyLearnerId === 'string' ? bodyLearnerId.trim().slice(0, 10) : ''
        if (!targetLearnerId) {
          return res.status(400).json({
            error:
              'Supporter/Admin: gửi conversationId (nếu đã có) hoặc learnerId để mở/tiếp tục hội thoại',
          })
        }
        const learner = await prisma.user.findUnique({
          where: { userId: targetLearnerId },
          select: { userId: true, userRole: true, userClass: true },
        })
        if (!learner || learner.userRole !== 'student') {
          return res.status(400).json({ error: 'learnerId không hợp lệ' })
        }
        if (
          learner.userClass != null &&
          learner.userClass !== channel.userClass
        ) {
          return res.status(400).json({
            error: 'Kênh không khớp lớp của học viên',
          })
        }
        if (userRole === 'admin') {
          /* ok */
        } else if (isSupporterUserRole(userRole)) {
          const assign = await prisma.learnerSupporterAssignment.findUnique({
            where: { learnerId: targetLearnerId },
            select: { supporterId: true },
          })
          const okAssign = assign?.supporterId === userId
          const scopes = await prisma.assistantManagedClass.findMany({
            where: { supporterId: userId },
            select: { userClass: true },
          })
          const classes = new Set(scopes.map((s) => s.userClass))
          const okScope = learner.userClass != null && classes.has(learner.userClass)
          if (!okAssign && !okScope) {
            return res.status(403).json({ error: 'Không có quyền nhắn học viên này' })
          }
        } else {
          return res.status(403).json({ error: 'Forbidden' })
        }
        const conv = await prisma.conversation.upsert({
          where: {
            channelId_learnerId: { channelId: ch, learnerId: targetLearnerId },
          },
          create: {
            channelId: ch,
            learnerId: targetLearnerId,
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

      // IS-2: không auto-reply (supporter). IS-3: chỉ Gemini trên human-chat — không echo. IS-1: echo.
      if (userRole === 'student' && senderRole === MessageSender.user) {
        if (learnerUserClass === UserClass.IS_2) {
          /* chỉ lưu tin người học */
        } else if (learnerUserClass === UserClass.IS_3 && ch === 'human-chat') {
          let assistantContent
          if (process.env.OPENROUTER_API_KEY?.trim()) {
            try {
              assistantContent = await generateIs2AgentReply(conversationId)
            } catch (agentErr) {
              console.error('[messages POST] human-chat agent', agentErr)
              assistantContent = `Trợ lý (human-chat / IS-3) tạm thời lỗi: ${agentErr instanceof Error ? agentErr.message : String(agentErr)}`
            }
          } else {
            assistantContent =
              'Trợ lý human-chat chưa được bật trên server (thiếu OPENROUTER_API_KEY). Liên hệ quản trị hoặc dùng kênh khác.'
          }
          await prisma.message.create({
            data: {
              conversationId,
              senderRole: MessageSender.assistant,
              senderUserId: null,
              content: assistantContent,
              metadata: { source: 'openrouter_gemini' },
            },
          })
        } else if (learnerUserClass === UserClass.IS_3) {
          /* IS-3 ngoài human-chat: không phản hồi giả — chỉ tin người học */
        } else if (learnerUserClass === UserClass.IS_1 && ch === 'ai-chat') {
          let assistantContent
          let metaSource = 'agentic_chatbot'
          try {
            const fromAgent = await generateIs1AgenticReply(userId, text)
            if (fromAgent != null) {
              assistantContent = fromAgent
            } else {
              metaSource = 'echo'
              assistantContent = `Đã nhận tin nhắn của bạn. (Phản hồi từ ${ch} — chưa cấu hình AGENTIC_CHATBOT_BASE_URL)`
            }
          } catch (agentErr) {
            console.error('[messages POST] ai-chat IS-1 agent', agentErr)
            metaSource = 'agentic_chatbot_error'
            assistantContent = `Trợ lý (ai-chat / IS-1) tạm thời lỗi: ${agentErr instanceof Error ? agentErr.message : String(agentErr)}`
          }
          await prisma.message.create({
            data: {
              conversationId,
              senderRole: MessageSender.assistant,
              senderUserId: null,
              content: assistantContent,
              metadata: { source: metaSource },
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
