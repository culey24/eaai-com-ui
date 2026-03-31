/**
 * RBAC: 2 vai trò chính
 * - LEARNER: Người học (đăng ký)
 * - ASSISTANT: Người quản lý lớp (cấp tài khoản riêng, không đăng ký)
 * - ADMIN: Quản trị hệ thống (cấp riêng)
 */
export const ROLES = {
  LEARNER: 'LEARNER',
  ASSISTANT: 'ASSISTANT',
  ADMIN: 'ADMIN',
}

export const ROLE_LABELS = {
  [ROLES.LEARNER]: 'Người học',
  [ROLES.ASSISTANT]: 'Supporter',
  [ROLES.ADMIN]: 'Quản trị viên',
}

/** Mã lớp hợp lệ khi đăng ký */
export const VALID_CLASS_CODES = ['IS-1', 'IS-2', 'IS-3']

/** Mapping mã lớp → kênh chat (labelKey dùng cho i18n) */
export const CLASS_TO_CHANNEL = {
  'IS-1': { id: 'ai-chat', code: 'IS-1', labelKey: 'chat.agent', icon: 'Bot' },
  /* IS-2: chat với supporter (internal-chat). IS-3: chat với Gemini/OpenRouter (human-chat). */
  'IS-2': { id: 'internal-chat', code: 'IS-2', labelKey: 'chat.agent', icon: 'Shield' },
  'IS-3': { id: 'human-chat', code: 'IS-3', labelKey: 'chat.agent', icon: 'UserCircle' },
}


/**
 * Kênh chat cho LEARNER: chỉ kênh của lớp họ đăng ký
 */
export function getChannelsForLearner(classCode) {
  const code = classCode?.trim().toUpperCase()
  if (!code || !CLASS_TO_CHANNEL[code]) return []
  return [CLASS_TO_CHANNEL[code]]
}

/**
 * Kênh chat cho ASSISTANT: tất cả lớp họ quản lý
 */
export function getChannelsForAssistant(managedClasses = []) {
  if (!managedClasses.length) return Object.values(CLASS_TO_CHANNEL)
  return managedClasses
    .map((c) => CLASS_TO_CHANNEL[c?.trim?.()?.toUpperCase?.()])
    .filter(Boolean)
}

/**
 * Kênh chat cho ADMIN: không có (admin dùng Admin Chat Channels)
 */
export function getChannelsForAdmin() {
  return []
}

/**
 * Lấy danh sách kênh theo role và user
 */
export function getChannelsByUser(user) {
  if (!user) return []
  switch (user.role) {
    case ROLES.LEARNER:
      return getChannelsForLearner(user.classCode)
    case ROLES.ASSISTANT:
      return getChannelsForAssistant(user.managedClasses)
    case ROLES.ADMIN:
      return getChannelsForAdmin()
    default:
      return []
  }
}
