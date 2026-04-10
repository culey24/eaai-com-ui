import jwt from 'jsonwebtoken'
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
    const rawRole = decoded.userRole
    const userRole = rawRole === 'teacher' ? 'assistant' : rawRole
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
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token đã hết hạn',
        message: 'Đăng nhập lại để tiếp tục (JWT hết hạn).',
        code: 'TOKEN_EXPIRED',
      })
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Token không hợp lệ',
        message: err.message,
        code: 'INVALID_TOKEN',
      })
    }
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('JWT_SECRET is not set')) {
      console.error('[auth] JWT_SECRET chưa cấu hình trên máy chủ')
      return res.status(500).json({
        error: 'Lỗi cấu hình máy chủ',
        message: 'JWT_SECRET chưa được thiết lập.',
        code: 'SERVER_MISCONFIG',
      })
    }
    return res.status(401).json({
      error: 'Không xác thực được',
      message: msg,
      code: 'AUTH_FAILED',
    })
  }
}
