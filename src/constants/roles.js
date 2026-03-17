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

/** Mã lớp hợp lệ khi đăng ký */
export const VALID_CLASS_CODES = ['IS-1', 'IS-2', 'IS-3']

/**
 * Các kênh chat tương ứng với từng role
 * Mỗi Agent dùng cho 1 lớp: IS-1, IS-2, IS-3
 */
export const CHANNELS_BY_ROLE = {
  [ROLES.CHATBOT_ONLY]: [
    { id: 'ai-chat', label: 'Chat với Agent (IS-1)', icon: 'Bot' },
  ],
  [ROLES.HUMAN_CHAT]: [
    { id: 'ai-chat', label: 'Chat với Agent (IS-1)', icon: 'Bot' },
    { id: 'human-chat', label: 'Chat với Agent (IS-2)', icon: 'UserCircle' },
  ],
  [ROLES.ADMIN_FULL]: [
    { id: 'ai-chat', label: 'Chat với Agent (IS-1)', icon: 'Bot' },
    { id: 'human-chat', label: 'Chat với Agent (IS-2)', icon: 'UserCircle' },
    { id: 'internal-chat', label: 'Chat với Agent (IS-3)', icon: 'Shield' },
  ],
}
