import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'

const router = Router()
router.use(authMiddleware)

function normalizeUsernameInput(s) {
  return String(s ?? '')
    .trim()
    .slice(0, 50)
}

/**
 * GET /api/admin/stats-exclusions
 * Danh sách username đang loại khỏi thống kê (DB).
 */
router.get('/stats-exclusions', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin', code: 'FORBIDDEN' })
    }
    const rows = await prisma.$queryRaw`
      SELECT
        e.exclusion_id AS "id",
        e.username_normalized AS "usernameNormalized",
        e.created_at AS "createdAt",
        u.user_id AS "userId",
        u.username AS "username",
        u.fullname AS "fullname"
      FROM stats_analytics_exclusions e
      LEFT JOIN users u ON LOWER(u.username) = e.username_normalized
      ORDER BY e.created_at DESC
    `
    const list = (Array.isArray(rows) ? rows : []).map((r) => ({
      id: String(r.id),
      usernameNormalized: String(r.usernameNormalized || ''),
      createdAt:
        r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt ?? ''),
      userId: r.userId != null ? String(r.userId) : null,
      username: r.username != null ? String(r.username) : null,
      fullname: r.fullname != null ? String(r.fullname) : null,
    }))
    return res.status(200).json(jsonSafe({ exclusions: list }))
  } catch (err) {
    console.error('[admin stats-exclusions GET]', err)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * POST /api/admin/stats-exclusions
 * body: { username: string } — khớp user trong DB (không phân biệt hoa thường).
 */
router.post('/stats-exclusions', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin', code: 'FORBIDDEN' })
    }
    const raw = normalizeUsernameInput(req.body?.username)
    if (!raw) {
      return res.status(400).json({ code: 'INVALID_USERNAME', error: 'Thiếu username' })
    }

    const match = await prisma.$queryRaw`
      SELECT user_id AS "userId", username, fullname
      FROM users
      WHERE LOWER(username) = LOWER(${raw})
      LIMIT 1
    `
    const user = Array.isArray(match) && match[0] ? match[0] : null
    if (!user?.userId) {
      return res.status(404).json({ code: 'USER_NOT_FOUND', error: 'Không tìm thấy tài khoản' })
    }

    const usernameNormalized = String(user.username).trim().toLowerCase()
    const existingRow = await prisma.statsAnalyticsExclusion.findUnique({
      where: { usernameNormalized },
      select: { id: true, usernameNormalized: true, createdAt: true },
    })
    if (existingRow) {
      return res.status(200).json(
        jsonSafe({
          exclusion: {
            id: String(existingRow.id),
            usernameNormalized: existingRow.usernameNormalized,
            createdAt: existingRow.createdAt.toISOString(),
            userId: user.userId,
            username: user.username,
            fullname: user.fullname,
          },
          alreadyListed: true,
        })
      )
    }

    const created = await prisma.statsAnalyticsExclusion.create({
      data: {
        usernameNormalized,
        createdByUserId: req.auth.userId ?? null,
      },
      select: {
        id: true,
        usernameNormalized: true,
        createdAt: true,
      },
    })

    return res.status(201).json(
      jsonSafe({
        exclusion: {
          id: String(created.id),
          usernameNormalized: created.usernameNormalized,
          createdAt: created.createdAt.toISOString(),
          userId: user.userId,
          username: user.username,
          fullname: user.fullname,
        },
        alreadyListed: false,
      })
    )
  } catch (err) {
    console.error('[admin stats-exclusions POST]', err)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * DELETE /api/admin/stats-exclusions/:usernameNormalized
 * usernameNormalized: chữ thường (URL-encoded).
 */
router.delete('/stats-exclusions/:usernameNormalized', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin', code: 'FORBIDDEN' })
    }
    const key = normalizeUsernameInput(decodeURIComponent(String(req.params.usernameNormalized ?? '')))
      .toLowerCase()
    if (!key) {
      return res.status(400).json({ code: 'INVALID_USERNAME', error: 'Thiếu username' })
    }

    try {
      await prisma.statsAnalyticsExclusion.delete({
        where: { usernameNormalized: key },
      })
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
        return res.status(404).json({ code: 'NOT_FOUND', error: 'Không có trong blacklist DB' })
      }
      throw e
    }

    return res.status(204).send()
  } catch (err) {
    console.error('[admin stats-exclusions DELETE]', err)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
