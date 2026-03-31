import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import conversationsRoutes from './routes/conversations.js'
import messagesRoutes from './routes/messages.js'
import syncRoutes from './routes/sync.js'
import reportsRoutes from './routes/reports.js'
import journalRoutes from './routes/journal.js'
import adminUsersRoutes from './routes/adminUsers.js'
import adminSurveySubmissionsRoutes from './routes/adminSurveySubmissions.js'
import adminSupporterAssignmentsRoutes from './routes/adminSupporterAssignments.js'
import supporterRoutes from './routes/supporter.js'
import meRoutes from './routes/me.js'
import agentIntegrationRoutes from './routes/agentIntegration.js'
import { apiGeneralLimiter } from './lib/rateLimits.js'

function corsOptions() {
  const raw = process.env.CORS_ORIGINS
  if (!raw || !raw.trim()) {
    return undefined
  }
  const origin = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (origin.length === 0) return undefined
  return {
    origin,
    credentials: true,
  }
}

export function createApp() {
  const app = express()
  if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1)
  }
  const corsOpts = corsOptions()
  app.use(corsOpts ? cors(corsOpts) : cors())
  app.use(express.json({ limit: '5mb' }))

  // Tích hợp agentic_assistant: http://host:port/... (không prefix /api)
  app.use(agentIntegrationRoutes)

  app.use('/api', apiGeneralLimiter)

  app.get('/', (req, res) => {
    res.json({
      service: 'eaai-com-backend',
      live: '/live',
      health: '/health',
      auth: '/api/auth',
    })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/conversations', conversationsRoutes)
  app.use('/api/messages', messagesRoutes)
  app.use('/api/sync', syncRoutes)
  app.use('/api/reports', reportsRoutes)
  app.use('/api/journal', journalRoutes)
  app.use('/api/admin', adminUsersRoutes)
  app.use('/api/admin', adminSurveySubmissionsRoutes)
  app.use('/api/admin', adminSupporterAssignmentsRoutes)
  app.use('/api/supporter', supporterRoutes)
  app.use('/api/me', meRoutes)

  return app
}
