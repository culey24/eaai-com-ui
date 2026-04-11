import { timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { hashPassword } from '../lib/password.js'

const router = Router()
router.use(authMiddleware)

function expectedPasskey() {
  const fromEnv =
    process.env.ADMIN_USER_PASSWORD_PASSKEY ?? process.env.ADMIN_PASSWORD_VIEW_PASSKEY
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') return fromEnv.trim()
  return 'papereaai123'
}

function passkeyMatches(provided) {
  const a = Buffer.from(String(provided ?? ''), 'utf8')
  const b = Buffer.from(expectedPasskey(), 'utf8')
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

const MIN_PASSWORD_LEN = 4

/**
 * POST /api/admin/users/:userId/set-password
 * body: { passkey: string, newPassword: string }
 * Passkey: ADMIN_USER_PASSWORD_PASSKEY, hoặc ADMIN_PASSWORD_VIEW_PASSKEY (tương thích), mặc định papereaai123.
 */
router.post('/users/:userId/set-password', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin', code: 'FORBIDDEN' })
    }
    if (!passkeyMatches(req.body?.passkey)) {
      return res.status(403).json({ error: 'Sai passkey', code: 'BAD_PASSKEY' })
    }

    const userId =
      typeof req.params.userId === 'string' ? req.params.userId.trim().slice(0, 10) : ''
    if (!userId) {
      return res.status(400).json({ error: 'Thiếu userId', code: 'INVALID_USER' })
    }

    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''
    if (newPassword.length < MIN_PASSWORD_LEN) {
      return res.status(400).json({
        code: 'PASSWORD_TOO_SHORT',
        error: `Mật khẩu tối thiểu ${MIN_PASSWORD_LEN} ký tự`,
      })
    }

    const exists = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true, username: true, fullname: true },
    })
    if (!exists) {
      return res.status(404).json({ error: 'Không tìm thấy user', code: 'USER_NOT_FOUND' })
    }

    const pwdHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { userId },
      data: { pwd: pwdHash },
    })

    return res.status(200).json(
      jsonSafe({
        ok: true,
        userId: exists.userId,
        username: exists.username,
        fullname: exists.fullname,
      })
    )
  } catch (err) {
    console.error('[admin set-password]', err)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
