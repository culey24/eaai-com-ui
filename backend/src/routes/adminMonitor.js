import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { UserRole, UserClass } from '@prisma/client'

const router = Router()
router.use(authMiddleware)

/**
 * GET /api/admin/monitor/is2
 * Monitor IS-2 learners, their last message time, and assigned supporter.
 */
router.get('/monitor/is2', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }

    const learners = await prisma.user.findMany({
      where: {
        userRole: UserRole.student,
        userClass: UserClass.IS_2,
      },
      select: {
        userId: true,
        username: true,
        fullname: true,
        assignmentAsLearner: {
          select: {
            supporter: {
              select: {
                fullname: true,
              },
            },
          },
        },
        conversationsAsLearner: {
          select: {
            updatedAt: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                createdAt: true,
                senderRole: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { username: 'asc' },
    })

    const monitorData = learners.map((l) => {
      const lastConv = l.conversationsAsLearner[0]
      const lastMsg = lastConv?.messages[0]
      return {
        userId: l.userId,
        username: l.username,
        fullname: l.fullname,
        supporterName: l.assignmentAsLearner?.supporter?.fullname || 'Chưa gán',
        lastMessageAt: lastMsg?.createdAt || lastConv?.updatedAt || null,
        lastSenderRole: lastMsg?.senderRole || null,
      }
    })

    return res.status(200).json(jsonSafe({ learners: monitorData }))
  } catch (err) {
    console.error('[admin monitor is2]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ' })
  }
})

/**
 * GET /api/admin/stats/interactions
 * Total interactions (messages) grouped by class code.
 */
router.get('/stats/interactions', async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }

    // This is slightly complex in Prisma because messages are linked via conversations.
    // We want to count messages where the conversation's learner belongs to a class.
    
    const stats = await prisma.message.groupBy({
      by: ['senderRole'], // We can't directly group by user's class from Message
      _count: { id: true },
    })
    
    // Better: Count messages per class using a query on User
    // Map results to the format expected by the frontend (with hyphens)
    const results = {
      'IS-1': await prisma.message.count({
        where: { conversation: { learner: { userClass: UserClass.IS_1 } } },
      }),
      'IS-2': await prisma.message.count({
        where: { conversation: { learner: { userClass: UserClass.IS_2 } } },
      }),
      'IS-3': await prisma.message.count({
        where: { conversation: { learner: { userClass: UserClass.IS_3 } } },
      }),
    }

    return res.status(200).json(jsonSafe({ stats: results }))
  } catch (err) {
    console.error('[admin stats interactions]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ' })
  }
})

export default router
