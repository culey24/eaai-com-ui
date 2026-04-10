import { Prisma } from '@prisma/client'
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { getStatsExcludedUsernamesNormalized } from '../lib/statsExcludedUsernames.js'

const router = Router()

function classToChannelId(classCode) {
  if (classCode === 'IS-1') return 'ai-chat'
  if (classCode === 'IS-2') return 'internal-chat'
  if (classCode === 'IS-3') return 'human-chat'
  return null
}

async function getNearestSubmissionPeriod() {
  const rows = await prisma.$queryRaw`
    SELECT period_id, title, starts_at, ends_at
    FROM journal_periods
    WHERE ends_at >= NOW()
    ORDER BY
      CASE WHEN starts_at <= NOW() THEN 0 ELSE 1 END ASC,
      CASE WHEN starts_at <= NOW() THEN ends_at ELSE starts_at END ASC
    LIMIT 1
  `
  return Array.isArray(rows) && rows[0] ? rows[0] : null
}

async function getPendingLearnersForPeriod(periodId, excludedNorm) {
  const excludeUsernameSql =
    excludedNorm.length === 0
      ? Prisma.empty
      : Prisma.sql`AND LOWER(u.username) NOT IN (${Prisma.join(excludedNorm)})`
  const rows = await prisma.$queryRaw`
    SELECT u.user_id, u.username, u.user_class::text AS user_class
    FROM users u
    WHERE u.user_role = 'student'
    ${excludeUsernameSql}
    AND NOT EXISTS (
      SELECT 1
      FROM journal_uploads ju
      WHERE ju.user_id = u.user_id AND ju.period_id = ${periodId}
    )
    ORDER BY u.user_id ASC
  `
  return Array.isArray(rows) ? rows : []
}

/**
 * GET /api/admin/submission-reminder-summary
 * Admin: kỳ submission gần nhất (đang mở ưu tiên, nếu không có thì lấy kỳ sắp mở)
 * + số user chưa nộp.
 */
router.get('/submission-reminder-summary', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }

    const excluded = await getStatsExcludedUsernamesNormalized(prisma)
    const period = await getNearestSubmissionPeriod()
    if (!period?.period_id) {
      return res.status(200).json(
        jsonSafe({
          period: null,
          totalLearners: 0,
          submitted: 0,
          notSubmitted: 0,
          isActive: false,
          isUpcoming: false,
          now: new Date().toISOString(),
        })
      )
    }

    const totalRows = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS c
      FROM users u
      WHERE u.user_role = 'student'
      ${
        excluded.length === 0
          ? Prisma.empty
          : Prisma.sql`AND LOWER(u.username) NOT IN (${Prisma.join(excluded)})`
      }
    `
    const totalLearners = Array.isArray(totalRows) && totalRows[0]?.c != null ? Number(totalRows[0].c) : 0
    const pending = await getPendingLearnersForPeriod(String(period.period_id), excluded)
    const notSubmitted = pending.length
    const submitted = Math.max(0, totalLearners - notSubmitted)
    const nowMs = Date.now()
    const startsAtMs = new Date(period.starts_at).getTime()
    const endsAtMs = new Date(period.ends_at).getTime()
    const isActive = startsAtMs <= nowMs && nowMs <= endsAtMs
    const isUpcoming = nowMs < startsAtMs

    return res.status(200).json(
      jsonSafe({
        period: {
          periodId: String(period.period_id),
          title: String(period.title || ''),
          startsAt: new Date(period.starts_at).toISOString(),
          endsAt: new Date(period.ends_at).toISOString(),
        },
        totalLearners,
        submitted,
        notSubmitted,
        isActive,
        isUpcoming,
        now: new Date(nowMs).toISOString(),
      })
    )
  } catch (err) {
    console.error('[admin submission-reminder-summary]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * POST /api/admin/submission-reminder-send
 * body: { periodId, content }
 * Admin: gửi tin nhắn AGENT tới tất cả học viên chưa nộp kỳ periodId.
 */
router.post('/submission-reminder-send', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }
    const periodId = String(req.body?.periodId ?? '')
      .trim()
      .slice(0, 64)
    const content = String(req.body?.content ?? '')
      .trim()
      .slice(0, 4000)
    if (!periodId) {
      return res.status(400).json({ error: 'Thiếu periodId' })
    }
    if (!content) {
      return res.status(400).json({ error: 'Thiếu nội dung tin nhắn' })
    }

    const period = await prisma.journalPeriod.findUnique({
      where: { periodId },
      select: { periodId: true },
    })
    if (!period) {
      return res.status(404).json({ error: 'Không tìm thấy kỳ submission' })
    }

    const excluded = await getStatsExcludedUsernamesNormalized(prisma)
    const pendingLearners = await getPendingLearnersForPeriod(periodId, excluded)
    let sent = 0
    let skippedNoChannel = 0
    for (const learner of pendingLearners) {
      const learnerId = learner?.user_id != null ? String(learner.user_id) : ''
      const classCode = learner?.user_class != null ? String(learner.user_class) : ''
      const channelId = classToChannelId(classCode)
      if (!learnerId || !channelId) {
        skippedNoChannel += 1
        continue
      }
      const conv = await prisma.conversation.upsert({
        where: { channelId_learnerId: { channelId, learnerId } },
        create: { channelId, learnerId },
        update: {},
      })
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderRole: 'assistant',
          senderUserId: null,
          content,
          metadata: { source: 'admin_submission_reminder', periodId },
        },
      })
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { updatedAt: new Date() },
      })
      sent += 1
    }

    return res.status(200).json(
      jsonSafe({
        ok: true,
        periodId,
        targeted: pendingLearners.length,
        sent,
        skippedNoChannel,
      })
    )
  } catch (err) {
    console.error('[admin submission-reminder-send]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * GET /api/admin/journal-upload-stats?periodId=...
 * Admin: số học viên (role student) đã có bản nộp journal trên server cho period_id.
 * Không tính username trong blacklist (stats_analytics_exclusions).
 */
router.get('/journal-upload-stats', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }
    const periodId = String(req.query.periodId ?? '')
      .trim()
      .slice(0, 64)
    if (!periodId) {
      return res.status(400).json({ error: 'Thiếu periodId' })
    }

    const excluded = await getStatsExcludedUsernamesNormalized(prisma)
    const excludeUsernameSql =
      excluded.length === 0
        ? Prisma.empty
        : Prisma.sql`AND LOWER(u.username) NOT IN (${Prisma.join(excluded)})`

    const countRows = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT ju.user_id)::int AS c
      FROM journal_uploads ju
      INNER JOIN users u ON u.user_id = ju.user_id AND u.user_role = 'student'
      WHERE ju.period_id = ${periodId}
      ${excludeUsernameSql}
    `
    const submitted =
      Array.isArray(countRows) && countRows[0]?.c != null ? Number(countRows[0].c) : 0

    let total
    if (excluded.length === 0) {
      total = await prisma.user.count({ where: { userRole: 'student' } })
    } else {
      const totalRows = await prisma.$queryRaw`
        SELECT COUNT(*)::int AS c
        FROM users u
        WHERE u.user_role = 'student'
        ${excludeUsernameSql}
      `
      total =
        Array.isArray(totalRows) && totalRows[0]?.c != null
          ? Number(totalRows[0].c)
          : 0
    }

    const totalByClassRows = await prisma.$queryRaw`
      SELECT u.user_class::text AS "classCode", COUNT(*)::int AS total
      FROM users u
      WHERE u.user_role = 'student' AND u.user_class IS NOT NULL
      ${excludeUsernameSql}
      GROUP BY u.user_class
    `
    const submittedByClassRows = await prisma.$queryRaw`
      SELECT u.user_class::text AS "classCode", COUNT(DISTINCT ju.user_id)::int AS submitted
      FROM journal_uploads ju
      INNER JOIN users u ON u.user_id = ju.user_id AND u.user_role = 'student'
      WHERE ju.period_id = ${periodId} AND u.user_class IS NOT NULL
      ${excludeUsernameSql}
      GROUP BY u.user_class
    `

    const totalByClass = Object.fromEntries(
      (Array.isArray(totalByClassRows) ? totalByClassRows : []).map((r) => [
        String(r.classCode || ''),
        Number(r.total) || 0,
      ])
    )
    const submittedByClass = Object.fromEntries(
      (Array.isArray(submittedByClassRows) ? submittedByClassRows : []).map((r) => [
        String(r.classCode || ''),
        Number(r.submitted) || 0,
      ])
    )
    const classCodes = new Set([
      ...Object.keys(totalByClass),
      ...Object.keys(submittedByClass),
    ])
    const byClass = [...classCodes]
      .filter(Boolean)
      .sort()
      .map((classCode) => ({
        classCode,
        total: totalByClass[classCode] || 0,
        submitted: submittedByClass[classCode] || 0,
        notSubmitted: (totalByClass[classCode] || 0) - (submittedByClass[classCode] || 0),
      }))

    return res.status(200).json(jsonSafe({ periodId, submitted, total, byClass }))
  } catch (err) {
    console.error('[admin journal-upload-stats]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
