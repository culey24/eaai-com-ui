import { Router } from 'express'
import { dispatchAgentReminders } from '../lib/dispatchAgentReminders.js'

const router = Router()

/**
 * POST /api/internal/cron/agent-reminders
 * Header: x-internal-cron-secret = INTERNAL_CRON_SECRET
 * Dùng Cloud Scheduler / cron ngoài; có thể tắt cron nội bộ (AGENT_REMINDER_CRON_ENABLED=0) và chỉ gọi endpoint này.
 */
router.post('/cron/agent-reminders', async (req, res) => {
  const want = (process.env.INTERNAL_CRON_SECRET || '').trim()
  if (!want) {
    return res.status(503).json({ error: 'INTERNAL_CRON_SECRET chưa cấu hình' })
  }
  const got = String(req.headers['x-internal-cron-secret'] || '').trim()
  if (got !== want) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const out = await dispatchAgentReminders()
    return res.json({ ok: true, ...out })
  } catch (err) {
    console.error('[internalCron agent-reminders]', err)
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
