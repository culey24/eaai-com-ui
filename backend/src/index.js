import 'dotenv/config'
import { createApp } from './app.js'
import { prisma } from './lib/prisma.js'

const app = createApp()
const PORT = Number(process.env.PORT) || 3000

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true, db: 'connected' })
  } catch (err) {
    res.status(503).json({
      ok: false,
      db: 'error',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

async function main() {
  await prisma.$connect()
  console.log('[prisma] connected to database')

  const server = app.listen(PORT, () => {
    console.log(`[express] http://localhost:${PORT}`)
  })

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
