import { verifyToken } from '../lib/jwt.js'
import { prismaRoleToApi } from '../lib/roles.js'

/**
 * Bảo vệ route: header Authorization: Bearer <jwt>
 * Gắn req.auth = { userId, username, userRole, apiRole }
 */
export function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Thiếu hoặc sai định dạng Authorization Bearer' })
    }
    const token = header.slice(7).trim()
    if (!token) {
      return res.status(401).json({ error: 'Token rỗng' })
    }
    const decoded = verifyToken(token)
    const userId = decoded.sub
    const username = decoded.username
    const userRole = decoded.userRole
    if (!userId || !username || !userRole) {
      return res.status(401).json({ error: 'Token không hợp lệ' })
    }
    req.auth = {
      userId,
      username,
      userRole,
      apiRole: prismaRoleToApi(userRole),
    }
    next()
  } catch (err) {
    return res.status(401).json({
      error: 'Không xác thực được',
      message: err instanceof Error ? err.message : String(err),
    })
  }
}
