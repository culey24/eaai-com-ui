import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { evaluateJournalContent } from '../lib/is1AgenticChatReply.js'
import { MessageSender } from '@prisma/client'

const router = Router()

// In-memory status tracking for the initial version
const batchStatus = {
  isRunning: false,
  total: 0,
  processed: 0,
  evaluated: 0,
  skipped: 0,
  failed: 0,
  lastPeriodId: null,
  errors: [],
}

/**
 * Helper to determine channelId for a class
 */
function classToChannelId(classCode) {
  if (classCode === 'IS-1') return 'ai-chat'
  if (classCode === 'IS-2') return 'internal-chat'
  if (classCode === 'IS-3') return 'human-chat'
  return 'ai-chat'
}

/**
 * POST /api/admin/journal-evaluate/batch-broadcast
 * Admin: Trigger batch evaluation and broadcast for selected classes and period.
 */
router.post('/batch-broadcast', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ dành cho quản trị viên' })
    }

    const { periodId, classCodes } = req.body
    if (!periodId || !Array.isArray(classCodes) || classCodes.length === 0) {
      return res.status(400).json({ error: 'Thiếu periodId hoặc classCodes' })
    }

    if (batchStatus.isRunning) {
      return res.status(409).json({ error: 'Một tiến trình đánh giá đang chạy' })
    }

    // Reset status
    batchStatus.isRunning = true
    batchStatus.total = 0
    batchStatus.processed = 0
    batchStatus.evaluated = 0
    batchStatus.skipped = 0
    batchStatus.failed = 0
    batchStatus.errors = []
    batchStatus.lastPeriodId = periodId

    // Start background process
    runBatchEvaluation(periodId, classCodes).catch(err => {
        console.error('[batch-broadcast background error]', err)
        batchStatus.isRunning = false
    })

    return res.status(202).json({ message: 'Tiến trình đánh giá đã bắt đầu' })
  } catch (err) {
    console.error('[admin-journal-evaluate batch-broadcast]', err)
    return res.status(500).json({ error: 'Lỗi máy chủ' })
  }
})

/**
 * GET /api/admin/journal-evaluate/status
 * Check current batch status
 */
router.get('/status', authMiddleware, (req, res) => {
  if (req.auth.userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  return res.status(200).json(jsonSafe(batchStatus))
})
async function runBatchEvaluation(periodId, classCodes) {
  try {
    // Map strings like "IS-1" to Prisma enum keys like "IS_1"
    const mappedClassCodes = classCodes.map(code => code.replace('-', '_'))

    // 1. Fetch targeted students
    const students = await prisma.user.findMany({
      where: {
        userRole: 'student',
        userClass: { in: mappedClassCodes },
      },
      select: { userId: true, userClass: true, fullname: true },
    })

    batchStatus.total = students.length

    for (const student of students) {
      try {
        // 2. Check for submission
        const submission = await prisma.journalUpload.findFirst({
          where: {
            userId: student.userId,
            periodId: periodId,
          },
          orderBy: { submittedAt: 'desc' },
        })

        if (!submission || !submission.extractedText) {
          batchStatus.skipped++
        } else {
          // 3. Call Agent to evaluate
          const evaluation = await evaluateJournalContent(student.userId, submission.extractedText)

          // 4. Update DB
          await prisma.journalUpload.update({
            where: { id: submission.id },
            data: {
              aiEvaluation: evaluation,
              evaluatedAt: new Date(),
            },
          })

          // 5. Send message to chat
          const channelId = classToChannelId(student.userClass)
          const conv = await prisma.conversation.upsert({
            where: { channelId_learnerId: { channelId, learnerId: student.userId } },
            create: { channelId, learnerId: student.userId },
            update: {},
          })

          await prisma.message.create({
            data: {
              conversationId: conv.id,
              senderRole: MessageSender.assistant,
              content: evaluation,
              metadata: { source: 'admin_batch_evaluation', periodId },
            },
          })

          batchStatus.evaluated++
        }
      } catch (err) {
        console.error(`[batch-eval] error for user ${student.userId}:`, err)
        batchStatus.failed++
        batchStatus.errors.push({ userId: student.userId, error: err.message })
      } finally {
        batchStatus.processed++
      }
    }
  } catch (err) {
    console.error('[runBatchEvaluation global error]', err)
  } finally {
    batchStatus.isRunning = false
  }
}

export default router
