import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import conversationsRoutes from './routes/conversations.js'
import messagesRoutes from './routes/messages.js'
import syncRoutes from './routes/sync.js'
import reportsRoutes from './routes/reports.js'
import { authMiddleware } from './middleware/auth.js'

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '5mb' }))

  app.get('/', (req, res) => {
    res.json({
      service: 'eaai-com-backend',
      health: '/health',
      auth: '/api/auth',
    })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/conversations', conversationsRoutes)
  app.use('/api/messages', messagesRoutes)
  app.use('/api/sync', syncRoutes)
  app.use('/api/reports', reportsRoutes)

  /** Ví dụ route cần đăng nhập tùy chỉnh */
  app.get('/api/me', authMiddleware, (req, res) => {
    res.status(200).json({ user: req.auth })
  })

  return app
}
