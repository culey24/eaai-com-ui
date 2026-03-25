/** Map Prisma UserRole → role JWT / frontend */
export function prismaRoleToApi(role) {
  switch (role) {
    case 'student':
      return 'LEARNER'
    case 'teacher':
      return 'ASSISTANT'
    case 'admin':
      return 'ADMIN'
    default:
      return role
  }
}

export function apiRoleToPrisma(role) {
  switch (role) {
    case 'LEARNER':
      return 'student'
    case 'ASSISTANT':
      return 'teacher'
    case 'ADMIN':
      return 'admin'
    default:
      return null
  }
}
