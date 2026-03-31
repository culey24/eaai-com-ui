import { UserClass } from '@prisma/client'
import { prisma } from './prisma.js'
import { openRouterChatCompletion } from './openRouter.js'

/**
 * Ngữ cảnh cố định: AGENT tư vấn (chat trực tiếp với model, không nhúng journal/DB vào prompt).
 */
const ADVISOR_AGENT_SYSTEM = `Bạn là AGENT tư vấn học tập cho sinh viên ĐHBK HCMUT (kênh human-chat, lớp đăng ký IS-3).
Vai trò: tư vấn, gợi ý hướng tiếp cận bài tập và ôn tập, giải thích khái niệm một cách ngắn gọn, thân thiện.
Nguyên tắc: ưu tiên tiếng Việt khi người dùng dùng tiếng Việt; không thay thế giảng viên hay quyết định chấm điểm; không bịa thông tin; nếu thiếu dữ liệu hãy nói rõ và đề nghị người dùng bổ sung.
Trả lời trực tiếp theo tin nhắn trong cuộc trò chuyện, không giả định có tài liệu nộp kèm trừ khi người dùng tự dán nội dung.`

function mapDbRoleToOpenAI(senderRole) {
  if (senderRole === 'assistant') return 'assistant'
  if (senderRole === 'system') return 'system'
  return 'user'
}

/**
 * Kênh human-chat gắn user_class IS-3 sau khi hoán vai IS-2/IS-3.
 */
export function channelUsesIs2Agent(channel) {
  return channel?.userClass === UserClass.IS_3
}

export async function buildIs2AgentMessages(conversationId) {
  const batch = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: 40,
  })
  const history = batch.reverse()

  const openAiMessages = []
  openAiMessages.push({
    role: 'system',
    content: ADVISOR_AGENT_SYSTEM,
  })

  for (const m of history) {
    const role = mapDbRoleToOpenAI(m.senderRole)
    const text = (m.content || '').trim()
    if (!text) continue
    openAiMessages.push({ role, content: text })
  }

  return openAiMessages
}

/**
 * @returns {Promise<string>} nội dung assistant
 */
export async function generateIs2AgentReply(conversationId) {
  const messages = await buildIs2AgentMessages(conversationId)
  return openRouterChatCompletion(messages)
}
