import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { mkdir, writeFile, unlink } from 'fs/promises'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { extractDocumentText } from '../lib/extractDocumentText.js'
import { jsonSafe } from '../lib/json.js'
import { journalUploadLimiter } from '../lib/rateLimits.js'

const router = Router()

/**
 * GET /api/journal/me
 * Learner: danh sách bản nộp của chính mình.
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'student') {
      return res.status(403).json({ error: 'Chỉ learner xem được journal của mình' })
    }
    const userId = req.auth.userId
    const rows = await prisma.$queryRaw`
      SELECT ju.upload_id, ju.period_id, ju.original_file_name, ju.submitted_at, ju.status
      FROM journal_uploads ju
      WHERE ju.user_id = ${userId}
      ORDER BY ju.submitted_at DESC
    `
    return res.status(200).json(jsonSafe({ uploads: rows || [] }))
  } catch (err) {
    console.error('[journal GET /me]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * GET /api/journal/by-user/:learnerId
 * Teacher: xem journal của learner thuộc lớp mình quản lý.
 */
router.get('/by-user/:learnerId', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'teacher') {
      return res.status(403).json({ error: 'Chỉ assistant' })
    }
    const learnerId = String(req.params.learnerId || '').trim()
    if (!learnerId) {
      return res.status(400).json({ error: 'Thiếu learnerId' })
    }

    const learner = await prisma.user.findUnique({
      where: { userId: learnerId },
      select: { userId: true, userRole: true, userClass: true },
    })
    if (!learner || learner.userRole !== 'student') {
      return res.status(404).json({ error: 'Không tìm thấy learner' })
    }

    const scopes = await prisma.assistantManagedClass.findMany({
      where: { teacherId: req.auth.userId },
      select: { userClass: true },
    })
    const allowed = new Set(scopes.map((s) => s.userClass))
    if (learner.userClass == null || !allowed.has(learner.userClass)) {
      return res.status(403).json({ error: 'Không có quyền xem journal của learner này' })
    }

    const rows = await prisma.$queryRaw`
      SELECT ju.upload_id, ju.period_id, ju.original_file_name, ju.submitted_at, ju.status
      FROM journal_uploads ju
      WHERE ju.user_id = ${learnerId}
      ORDER BY ju.submitted_at DESC
    `
    return res.status(200).json(jsonSafe({ uploads: rows || [] }))
  } catch (err) {
    console.error('[journal GET by-user]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

const maxBytes = Math.min(Number(process.env.JOURNAL_MAX_FILE_BYTES) || 20 * 1024 * 1024, 50 * 1024 * 1024)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes, files: 1 },
})

function safeBaseName(name) {
  return String(name || 'file').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 200)
}

function uploadRootDir() {
  const rel = (process.env.JOURNAL_UPLOAD_DIR || 'uploads/journals').replace(/^\/+/, '')
  return path.resolve(process.cwd(), rel)
}

async function resolvePeriodId(raw) {
  const first = String(raw || 'default').trim().slice(0, 64)
  const candidates = [first, 'default']
  const seen = new Set()
  for (const id of candidates) {
    if (!id || seen.has(id)) continue
    seen.add(id)
    const rows = await prisma.$queryRaw`
      SELECT period_id FROM journal_periods WHERE period_id = ${id} LIMIT 1
    `
    if (Array.isArray(rows) && rows.length > 0) return id
  }
  return null
}

/**
 * POST /api/journal/upload
 * multipart: file, periodId (optional, mặc định default / fallback)
 */
router.post('/upload', authMiddleware, journalUploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (req.auth.userRole !== 'student') {
      return res.status(403).json({ error: 'Chỉ tài khoản learner được nộp journal lên server' })
    }
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'Thiếu file (field name: file)' })
    }

    const userId = req.auth.userId
    const periodId = await resolvePeriodId(req.body?.periodId)
    if (!periodId) {
      return res.status(400).json({ error: 'Không tìm thấy đợt journal (journal_periods). Dùng periodId=hợp lệ hoặc tạo đợt trong DB.' })
    }

    const original = req.file.originalname || 'upload.bin'
    const { text: extractedText, note: extractNote } = await extractDocumentText(
      req.file.buffer,
      original
    )

    const root = uploadRootDir()
    const userDir = path.join(root, userId)
    await mkdir(userDir, { recursive: true })
    const storedName = `${Date.now()}_${safeBaseName(original)}`
    const fullPath = path.join(userDir, storedName)
    await writeFile(fullPath, req.file.buffer)
    const storageKey = path.relative(process.cwd(), fullPath).split(path.sep).join('/')

    await prisma.$executeRaw`
      DELETE FROM journal_uploads WHERE user_id = ${userId} AND period_id = ${periodId}
    `

    const inserted = await prisma.$queryRaw`
      INSERT INTO journal_uploads (user_id, period_id, storage_key, original_file_name, status, extracted_text)
      VALUES (${userId}, ${periodId}, ${storageKey}, ${original.slice(0, 512)}, 'submitted', ${extractedText || null})
      RETURNING upload_id, submitted_at
    `

    const row = Array.isArray(inserted) ? inserted[0] : null
    return res.status(201).json(
      jsonSafe({
        ok: true,
        uploadId: row?.upload_id != null ? String(row.upload_id) : undefined,
        periodId,
        storageKey,
        extractNote: extractNote || (extractedText ? undefined : 'Không trích được văn bản.'),
        charsExtracted: extractedText ? extractedText.length : 0,
      })
    )
  } catch (err) {
    if (err?.code === 'LIMIT_FILE_SIZE' || err?.name === 'MulterError') {
      return res.status(413).json({ error: 'File vượt quá giới hạn kích thước' })
    }
    console.error('[journal upload]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * DELETE /api/journal/upload?periodId=default
 * Xóa bản nộp trên server (và file lưu đĩa nếu có).
 */
router.delete('/upload', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'student') {
      return res.status(403).json({ error: 'Chỉ learner được xóa journal trên server' })
    }
    const userId = req.auth.userId
    const periodId = await resolvePeriodId(req.query?.periodId)
    if (!periodId) {
      return res.status(400).json({ error: 'periodId không hợp lệ' })
    }
    const prev = await prisma.$queryRaw`
      SELECT storage_key FROM journal_uploads
      WHERE user_id = ${userId} AND period_id = ${periodId}
      LIMIT 1
    `
    await prisma.$executeRaw`
      DELETE FROM journal_uploads WHERE user_id = ${userId} AND period_id = ${periodId}
    `
    const key = Array.isArray(prev) && prev[0]?.storage_key
    if (key && typeof key === 'string' && !key.includes('..')) {
      const abs = path.resolve(process.cwd(), key)
      const root = uploadRootDir()
      if (abs.startsWith(root)) {
        try {
          await unlink(abs)
        } catch {
          /* ignore */
        }
      }
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[journal delete]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
