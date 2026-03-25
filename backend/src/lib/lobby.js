import { Gender, UserRole, UserClass } from '@prisma/client'
import { prisma } from './prisma.js'

/** Một user + conversation cố định để gom tin nhắn chat tối giản (không Socket.io). */
const LOBBY_USER_ID = 'ZLOBBY0001'
const LOBBY_USERNAME = 'lobby_min'
const LOBBY_CHANNEL = 'ai-chat'
/** Hash bcrypt cố định (password test) — tài khoản lobby không đăng nhập */
const LOBBY_PWD_PLACEHOLDER =
  '$2b$10$EixZaYV1idWrIgfZXwp18OOdMq8gqHycvzFH4axDhaaFvsFFy/q6u'

export async function getOrCreateLobbyConversationId() {
  const existing = await prisma.conversation.findUnique({
    where: {
      channelId_learnerId: {
        channelId: LOBBY_CHANNEL,
        learnerId: LOBBY_USER_ID,
      },
    },
  })
  if (existing) return existing.id

  await prisma.user.upsert({
    where: { userId: LOBBY_USER_ID },
    create: {
      userId: LOBBY_USER_ID,
      username: LOBBY_USERNAME,
      pwd: LOBBY_PWD_PLACEHOLDER,
      fullname: 'Lobby chat tối giản',
      userRole: UserRole.student,
      dateOfBirth: new Date('2000-01-01'),
      gender: Gender.Other,
      majorCode: '0000000',
      trainingProgramType: 'Chính quy',
      userClass: UserClass.IS_1,
    },
    update: {},
  })

  const conv = await prisma.conversation.create({
    data: {
      channelId: LOBBY_CHANNEL,
      learnerId: LOBBY_USER_ID,
    },
  })
  return conv.id
}

function hasNonEmptyChannelId(channelId) {
  return channelId != null && String(channelId).trim() !== ''
}

export function isMinimalChatBody(body) {
  if (!body || typeof body !== 'object') return false
  const { senderName, content, channelId } = body
  if (typeof senderName !== 'string' || typeof content !== 'string') return false
  if (hasNonEmptyChannelId(channelId)) return false
  return true
}
