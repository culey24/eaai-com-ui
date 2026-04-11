import { MessageSender, UserClass } from '@prisma/client'
import { prisma } from './prisma.js'

/**
 * Kênh chat mặc định theo lớp học viên (cùng quy ước adminJournalStats / messages).
 * @param {import('@prisma/client').UserClass | null | undefined} userClass
 */
export function channelIdForLearnerClass(userClass) {
  if (userClass === UserClass.IS_1) return 'ai-chat'
  if (userClass === UserClass.IS_2) return 'internal-chat'
  if (userClass === UserClass.IS_3) return 'human-chat'
  if (userClass === UserClass.ADMIN_TEST) return 'test-agent'
  return 'ai-chat'
}

/**
 * Tìm nhắc việc đã đến hạn (reminder_at <= now), chưa gửi (notified_at null),
 * tạo tin assistant trong hội thoại kênh tương ứng, gắn notified_at.
 *
 * @returns {Promise<{ processed: number, errors: number }>}
 */
export async function dispatchAgentReminders() {
  const batch = Math.min(Math.max(Number(process.env.AGENT_REMINDER_BATCH) || 40, 1), 200)
  const now = new Date()

  const due = await prisma.agentUserReminder.findMany({
    where: {
      notifiedAt: null,
      reminderAt: { lte: now },
    },
    orderBy: { reminderAt: 'asc' },
    take: batch,
    select: {
      id: true,
      userId: true,
      reminderAt: true,
      message: true,
    },
  })

  let processed = 0
  let errors = 0

  for (const row of due) {
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { userId: row.userId },
          select: { userId: true, userClass: true },
        })
        if (!user) {
          await tx.agentUserReminder.update({
            where: { id: row.id },
            data: { notifiedAt: now },
          })
          return
        }

        const channelId = channelIdForLearnerClass(user.userClass)
        const conv = await tx.conversation.upsert({
          where: {
            channelId_learnerId: { channelId, learnerId: user.userId },
          },
          create: { channelId, learnerId: user.userId },
          update: {},
          select: { id: true },
        })

        const body = [
          '**Nhắc việc** (đã đến giờ bạn đặt qua trợ lý)',
          `Thời điểm nhắc: ${row.reminderAt.toISOString()}`,
          '',
          row.message.trim() || '(Không có nội dung)',
        ].join('\n')

        await tx.message.create({
          data: {
            conversationId: conv.id,
            senderRole: MessageSender.assistant,
            senderUserId: null,
            content: body,
            metadata: {
              source: 'agent_reminder',
              reminderId: String(row.id),
            },
          },
        })

        await tx.conversation.update({
          where: { id: conv.id },
          data: { updatedAt: new Date() },
        })

        await tx.agentUserReminder.update({
          where: { id: row.id },
          data: { notifiedAt: now },
        })
      })
      processed += 1
    } catch (e) {
      errors += 1
      console.error('[dispatchAgentReminders] reminder_id=%s user=%s', row.id, row.userId, e)
    }
  }

  if (processed > 0 || errors > 0) {
    console.log('[dispatchAgentReminders] processed=%s errors=%s', processed, errors)
  }
  return { processed, errors }
}
