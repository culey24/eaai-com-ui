import { Router } from 'express'
import { MessageSender } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { isSupporterUserRole } from '../lib/roles.js'

const router = Router()
router.use(authMiddleware)

function parseThreadKey(storageKey, fallbackLearnerId) {
  if (!storageKey || typeof storageKey !== 'string') return null
  if (!storageKey.includes('::')) {
    return { channelId: storageKey.trim(), learnerId: fallbackLearnerId }
  }
  const idx = storageKey.indexOf('::')
  const channelId = storageKey.slice(0, idx).trim()
  const rest = storageKey.slice(idx + 2).trim()
  const learnerId = rest === 'legacy' ? fallbackLearnerId : rest
  return { channelId, learnerId }
}

function mapRole(role) {
  if (role === 'assistant') return MessageSender.assistant
  if (role === 'system') return MessageSender.system
  return MessageSender.user
}

async function assertCanSyncForLearner(auth, learnerId) {
  if (auth.userRole === 'admin') return true
  if (auth.userId === learnerId) return true
  if (isSupporterUserRole(auth.userRole)) {
    const assign = await prisma.learnerSupporterAssignment.findUnique({
      where: { learnerId },
      select: { supporterId: true },
    })
    if (assign?.supporterId === auth.userId) return true
    const learner = await prisma.user.findUnique({
      where: { userId: learnerId },
      select: { userClass: true },
    })
    if (!learner?.userClass) return false
    const row = await prisma.assistantManagedClass.findFirst({
      where: { supporterId: auth.userId, userClass: learner.userClass },
    })
    return !!row
  }
  return false
}

/**
 * POST /api/sync/local-storage
 * Body: { eeai_chatbot_messages?: Record<string, array>, messages?: same }
 * Mỗi key: "channelId::userId" hoặc "channelId::legacy" (legacy → learner = user đăng nhập).
 */
router.post('/local-storage', async (req, res) => {
  try {
    const raw = req.body?.eeai_chatbot_messages ?? req.body?.messages
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return res.status(400).json({
        error: 'Thiếu object eeai_chatbot_messages (hoặc messages) giống localStorage',
      })
    }

    let threadsProcessed = 0
    let messagesInserted = 0
    let messagesSkipped = 0

    for (const [storageKey, list] of Object.entries(raw)) {
      if (!Array.isArray(list) || list.length === 0) continue

      const parsed = parseThreadKey(storageKey, req.auth.userId)
      if (!parsed?.channelId || !parsed.learnerId) {
        messagesSkipped += list.length
        continue
      }

      const allowed = await assertCanSyncForLearner(req.auth, parsed.learnerId)
      if (!allowed) {
        return res.status(403).json({
          error: `Không được đồng bộ thread cho learner ${parsed.learnerId}`,
        })
      }

      const channel = await prisma.chatChannel.findUnique({
        where: { channelId: parsed.channelId },
      })
      if (!channel) {
        messagesSkipped += list.length
        continue
      }

      const learner = await prisma.user.findUnique({
        where: { userId: parsed.learnerId },
      })
      if (!learner) {
        messagesSkipped += list.length
        continue
      }

      await prisma.$transaction(async (tx) => {
        const conv = await tx.conversation.upsert({
          where: {
            channelId_learnerId: {
              channelId: parsed.channelId,
              learnerId: parsed.learnerId,
            },
          },
          create: {
            channelId: parsed.channelId,
            learnerId: parsed.learnerId,
          },
          update: {},
        })

        threadsProcessed += 1

        for (const item of list) {
          if (!item || typeof item !== 'object') continue
          const clientId = item.id != null ? String(item.id) : null
          const content = typeof item.content === 'string' ? item.content : ''
          const role = mapRole(item.role)
          const fileName =
            item.fileName != null ? String(item.fileName).slice(0, 512) : null
          const ts = Number(item.timestamp)
          const createdAt = Number.isFinite(ts) ? new Date(ts) : new Date()

          if (clientId) {
            const dup = await tx.message.findFirst({
              where: {
                conversationId: conv.id,
                metadata: { equals: { clientId } },
              },
            })
            if (dup) {
              messagesSkipped += 1
              continue
            }
          }

          await tx.message.create({
            data: {
              conversationId: conv.id,
              senderRole: role,
              senderUserId: role === MessageSender.user ? parsed.learnerId : null,
              content,
              fileName,
              metadata: clientId ? { clientId } : {},
              createdAt,
              updatedAt: createdAt,
            },
          })
          messagesInserted += 1
        }

        await tx.conversation.update({
          where: { id: conv.id },
          data: { updatedAt: new Date() },
        })
      })
    }

    return res.status(200).json(
      jsonSafe({
        ok: true,
        threadsProcessed,
        messagesInserted,
        messagesSkipped,
      })
    )
  } catch (err) {
    console.error('[sync/local-storage]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
