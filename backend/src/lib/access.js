import { prisma } from './prisma.js'

/**
 * @param {{ userId: string, userRole: 'student' | 'teacher' | 'admin' }} auth
 * @param {bigint} conversationId
 */
export async function canAccessConversation(auth, conversationId) {
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { learner: true, channel: true },
  })
  if (!conv) {
    return { ok: false, status: 404, message: 'Không tìm thấy hội thoại', conv: null }
  }
  if (auth.userRole === 'admin') {
    return { ok: true, conv }
  }
  if (auth.userRole === 'student' && conv.learnerId === auth.userId) {
    return { ok: true, conv }
  }
  if (auth.userRole === 'teacher') {
    const scopes = await prisma.assistantManagedClass.findMany({
      where: { teacherId: auth.userId },
      select: { userClass: true },
    })
    const allowed = new Set(scopes.map((s) => s.userClass))
    if (conv.learner.userClass != null && allowed.has(conv.learner.userClass)) {
      return { ok: true, conv }
    }
    return { ok: false, status: 403, message: 'Không có quyền xem hội thoại này', conv: null }
  }
  return { ok: false, status: 403, message: 'Không có quyền', conv: null }
}
