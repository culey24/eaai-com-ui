/** JWT / req.auth.userRole: supporter hợp lệ (gán bởi admin: support; legacy: assistant). */
export function isSupporterUserRole(role) {
  if (role == null) return false
  const r = String(role)
  return r === 'support' || r === 'assistant'
}

/** Map Prisma UserRole → role JWT / frontend */
export function prismaRoleToApi(role) {
  switch (role) {
    case 'student':
      return 'LEARNER'
    case 'assistant':
    case 'support':
      return 'ASSISTANT'
    case 'admin':
      return 'ADMIN'
    default:
      if (role === 'teacher') return 'ASSISTANT'
      return role
  }
}

/** Map role API (UI) → Prisma — ASSISTANT lưu DB là support (supporter do admin gán). */
export function apiRoleToPrisma(role) {
  switch (role) {
    case 'LEARNER':
      return 'student'
    case 'ASSISTANT':
      return 'support'
    case 'ADMIN':
      return 'admin'
    default:
      return null
  }
}
