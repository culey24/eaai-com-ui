import { MessageSender } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { jsonSafe } from '../lib/json.js'
import { getOrCreateLobbyConversationId, isMinimalChatBody } from '../lib/lobby.js'

const MAX_SENDER = 100
const MAX_CONTENT = 4000

export async function getMinimalMessages(req, res) {
  try {
    const conversationId = await getOrCreateLobbyConversationId()
    const batch = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const chronological = [...batch].reverse()
    const messages = chronological.map((m) => {
      const meta = m.metadata && typeof m.metadata === 'object' ? m.metadata : {}
      const senderName =
        typeof meta.senderName === 'string' && meta.senderName.trim()
          ? meta.senderName.trim().slice(0, MAX_SENDER)
          : 'Ẩn danh'
      return {
        id: m.id.toString(),
        senderName,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      }
    })
    return res.status(200).json(jsonSafe({ messages }))
  } catch (err) {
    console.error('[messages GET minimal]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
}

export async function postMinimalMessage(req, res) {
  try {
    if (!isMinimalChatBody(req.body)) {
      return res.status(400).json({
        error: 'Thiếu senderName hoặc content (hoặc đang gửi kèm channelId)',
      })
    }
    let { senderName, content } = req.body
    senderName = senderName.trim().slice(0, MAX_SENDER)
    content = String(content).trim().slice(0, MAX_CONTENT)
    if (!senderName) {
      return res.status(400).json({ error: 'senderName không được rỗng' })
    }
    if (!content) {
      return res.status(400).json({ error: 'content không được rỗng' })
    }

    const conversationId = await getOrCreateLobbyConversationId()
    const msg = await prisma.message.create({
      data: {
        conversationId,
        senderRole: MessageSender.user,
        senderUserId: null,
        content,
        metadata: { senderName, minimalChat: true },
      },
    })
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })
    return res.status(201).json(
      jsonSafe({
        message: {
          id: msg.id.toString(),
          senderName,
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
        },
      })
    )
  } catch (err) {
    console.error('[messages POST minimal]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
}
