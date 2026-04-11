import 'dotenv/config'
import { createApp } from './app.js'
import { prisma } from './lib/prisma.js'
import { applyLightweightSchemaPatches } from './lib/ensureDbPatches.js'
import { ensureBootstrapAdmin } from './lib/ensureBootstrapAdmin.js'
import { dispatchAgentReminders } from './lib/dispatchAgentReminders.js'

console.log('[eaai] boot — NODE_ENV=%s PORT=%s', process.env.NODE_ENV || '', process.env.PORT || '(default 3000)')

const app = createApp()
const PORT = Number(process.env.PORT) || 3000

const DB_CHECK_MS = Math.min(Math.max(Number(process.env.HEALTH_DB_TIMEOUT_MS) || 4000, 500), 15000)

/** Liveness — không gọi DB (Railway/proxy không bị treo chờ DB). */
app.get('/live', (_req, res) => {
  res.status(200).json({ ok: true, service: 'eaai-com-backend' })
})

app.get('/health', async (req, res) => {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Database check timed out after ${DB_CHECK_MS}ms`)), DB_CHECK_MS)
      }),
    ])
    res.json({ ok: true, db: 'connected' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const timedOut = msg.includes('timed out')
    res.status(503).json({
      ok: false,
      db: timedOut ? 'timeout' : 'error',
      message: msg,
    })
  }
})

async function main() {
  /* Bind sớm trên mọi interface — Docker/Railway cần 0.0.0.0, không chỉ localhost. */
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[express] listening on 0.0.0.0:${PORT}`)
  })

  try {
    await prisma.$connect()
    console.log('[prisma] connected to database')
    await applyLightweightSchemaPatches(prisma)
    await ensureBootstrapAdmin()
  } catch (err) {
    /* Không exit — tránh crash loop → Railway 502. / và /health vẫn phản hồi để debug. */
    console.error('[prisma] connect failed — kiểm tra DATABASE_URL / Postgres plugin trên Railway', err)
  }

  const cronOff = ['0', 'false', 'off'].includes(
    String(process.env.AGENT_REMINDER_CRON_ENABLED ?? '1').trim().toLowerCase()
  )
  if (!cronOff) {
    const tickMs = Math.min(
      Math.max(Number(process.env.AGENT_REMINDER_CRON_MS) || 60_000, 15_000),
      3_600_000
    )
    setInterval(() => {
      dispatchAgentReminders().catch((e) => console.error('[agent-reminder-cron]', e))
    }, tickMs)
    console.log(
      '[agent-reminder-cron] enabled interval_ms=%s (set AGENT_REMINDER_CRON_ENABLED=0 to disable)',
      tickMs
    )
  }

  const shutdown = async () => {
    server.close()
    await prisma.$disconnect()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
