import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'

const router = Router()

/**
 * PUT /api/admin/journal-periods
 * body: { periodId, title, description?, startsAt, endsAt } — epoch ms
 */
router.put('/journal-periods', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }
    const periodId = String(req.body?.periodId ?? '')
      .trim()
      .slice(0, 64)
    const title = String(req.body?.title ?? '')
      .trim()
      .slice(0, 255)
    const description = String(req.body?.description ?? '')
    const startsAt = Number(req.body?.startsAt)
    const endsAt = Number(req.body?.endsAt)
    if (!periodId || !title) {
      return res.status(400).json({ error: 'Thiếu periodId hoặc title' })
    }
    if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || startsAt >= endsAt) {
      return res.status(400).json({ error: 'startsAt/endsAt không hợp lệ' })
    }

    const row = await prisma.journalPeriod.upsert({
      where: { periodId },
      create: {
        periodId,
        title,
        description,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        createdBy: null,
      },
      update: {
        title,
        description,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
      },
    })

    return res.status(200).json(
      jsonSafe({
        period: {
          periodId: row.periodId,
          title: row.title,
          description: row.description,
          startsAt: row.startsAt.toISOString(),
          endsAt: row.endsAt.toISOString(),
          createdAt: row.createdAt.toISOString(),
        },
      })
    )
  } catch (err) {
    console.error('[admin PUT journal-periods]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * DELETE /api/admin/journal-periods/:periodId
 * Chỉ xóa khi chưa có bản nộp (tránh CASCADE xóa file).
 */
router.delete('/journal-periods/:periodId', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }
    const periodId = String(req.params.periodId ?? '')
      .trim()
      .slice(0, 64)
    if (!periodId) {
      return res.status(400).json({ error: 'Thiếu periodId' })
    }

    const n = await prisma.journalUpload.count({ where: { periodId } })
    if (n > 0) {
      return res.status(409).json({
        error: 'Không xóa được: đã có học viên nộp journal cho đợt này',
        uploadCount: n,
      })
    }

    try {
      await prisma.journalPeriod.delete({ where: { periodId } })
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
        return res.status(404).json({ error: 'Không tìm thấy đợt' })
      }
      throw e
    }

    return res.status(200).json({ ok: true, periodId })
  } catch (err) {
    console.error('[admin DELETE journal-periods]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
