/**
 * Role-based access constants
 * CHATBOT_ONLY: Chỉ chat với AI
 * HUMAN_CHAT: Chat với AI + Tư vấn viên
 * ADMIN_FULL: Đầy đủ quyền (AI, Tư vấn, Nội bộ)
 */
export const ROLES = {
  CHATBOT_ONLY: 'CHATBOT_ONLY',
  HUMAN_CHAT: 'HUMAN_CHAT',
  ADMIN_FULL: 'ADMIN_FULL',
}

export const ROLE_LABELS = {
  [ROLES.CHATBOT_ONLY]: 'Chat với AI',
  [ROLES.HUMAN_CHAT]: 'Chat với Tư vấn',
  [ROLES.ADMIN_FULL]: 'Quản trị viên',
}

/**
 * Các kênh chat tương ứng với từng role
 */
export const CHANNELS_BY_ROLE = {
  [ROLES.CHATBOT_ONLY]: [
    { id: 'ai-chat', label: 'Chat với AI', icon: 'Bot' },
  ],
  [ROLES.HUMAN_CHAT]: [
    { id: 'ai-chat', label: 'Chat với AI', icon: 'Bot' },
    { id: 'human-chat', label: 'Chat với Tư vấn viên', icon: 'UserCircle' },
  ],
  [ROLES.ADMIN_FULL]: [
    { id: 'ai-chat', label: 'Chat với AI', icon: 'Bot' },
    { id: 'human-chat', label: 'Chat với Tư vấn viên', icon: 'UserCircle' },
    { id: 'internal-chat', label: 'Chat nội bộ', icon: 'Shield' },
  ],
}
