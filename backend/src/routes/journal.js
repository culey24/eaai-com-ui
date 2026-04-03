import { Router } from 'express'
import multer from 'multer'
import { prisma } from '../lib/prisma.js'
import { removeJournalUpload, saveJournalUpload, readJournalUpload } from '../lib/journalFileStorage.js'
import { authMiddleware } from '../middleware/auth.js'
import { extractDocumentText } from '../lib/extractDocumentText.js'
import { jsonSafe } from '../lib/json.js'
import { journalUploadLimiter } from '../lib/rateLimits.js'
import { isSupporterUserRole } from '../lib/roles.js'

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
 * Supporter (support/assistant): xem journal của learner được gán hoặc thuộc lớp quản lý.
 */
router.get('/by-user/:learnerId', authMiddleware, async (req, res) => {
  try {
    if (!isSupporterUserRole(req.auth.userRole)) {
      return res.status(403).json({ error: 'Chỉ supporter (role support)' })
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

    const assign = await prisma.learnerSupporterAssignment.findUnique({
      where: { learnerId },
      select: { supporterId: true },
    })
    const scopes = await prisma.assistantManagedClass.findMany({
      where: { supporterId: req.auth.userId },
      select: { userClass: true },
    })
    const allowed = new Set(scopes.map((s) => s.userClass))
    const okByAssign = assign?.supporterId === req.auth.userId
    const okByClass =
      learner.userClass != null && allowed.has(learner.userClass)
    if (!okByAssign && !okByClass) {
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

function contentDispositionAttachment(name) {
  const raw = String(name || 'journal').trim().slice(0, 200) || 'journal'
  const safe = raw.replace(/["\\]/g, '_')
  const ascii = safe.replace(/[^\x20-\x7E]/g, '_').slice(0, 180) || 'file'
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`
}

async function assertCanDownloadJournalFile(reqAuth, learnerId) {
  if (reqAuth.userRole === 'student') {
    if (reqAuth.userId !== learnerId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }
    return
  }
  if (reqAuth.userRole === 'admin') {
    const learner = await prisma.user.findUnique({
      where: { userId: learnerId },
      select: { userRole: true },
    })
    if (!learner || learner.userRole !== 'student') {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }
    return
  }
  if (!isSupporterUserRole(reqAuth.userRole)) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  const learner = await prisma.user.findUnique({
    where: { userId: learnerId },
    select: { userId: true, userRole: true, userClass: true },
  })
  if (!learner || learner.userRole !== 'student') {
    throw Object.assign(new Error('Not found'), { status: 404 })
  }
  const assign = await prisma.learnerSupporterAssignment.findUnique({
    where: { learnerId },
    select: { supporterId: true },
  })
  const scopes = await prisma.assistantManagedClass.findMany({
    where: { supporterId: reqAuth.userId },
    select: { userClass: true },
  })
  const allowed = new Set(scopes.map((s) => s.userClass))
  const okByAssign = assign?.supporterId === reqAuth.userId
  const okByClass = learner.userClass != null && allowed.has(learner.userClass)
  if (!okByAssign && !okByClass) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
}

/**
 * GET /api/journal/learner/:learnerId/file/:uploadId
 * Learner (chính mình), admin, hoặc supporter được phép — tải binary đã lưu.
 */
router.get('/learner/:learnerId/file/:uploadId', authMiddleware, async (req, res) => {
  try {
    const learnerId = String(req.params.learnerId || '').trim()
    const uploadIdRaw = String(req.params.uploadId || '').trim()
    if (!learnerId || !uploadIdRaw || !/^\d+$/.test(uploadIdRaw)) {
      return res.status(400).json({ error: 'Thiếu learnerId hoặc uploadId không hợp lệ' })
    }
    let uploadIdBig
    try {
      uploadIdBig = BigInt(uploadIdRaw)
    } catch {
      return res.status(400).json({ error: 'uploadId không hợp lệ' })
    }

    await assertCanDownloadJournalFile(req.auth, learnerId)

    const rows = await prisma.$queryRaw`
      SELECT ju.storage_key, ju.original_file_name
      FROM journal_uploads ju
      WHERE ju.user_id = ${learnerId} AND ju.upload_id = ${uploadIdBig}
      LIMIT 1
    `
    const row = Array.isArray(rows) && rows[0]
    if (!row?.storage_key) {
      return res.status(404).json({ error: 'Không tìm thấy file journal' })
    }

    const { buffer, contentType } = await readJournalUpload(String(row.storage_key))
    const name =
      (row.original_file_name && String(row.original_file_name).slice(0, 512)) || 'journal'

    res.setHeader('Content-Type', contentType || 'application/octet-stream')
    res.setHeader('Content-Disposition', contentDispositionAttachment(name))
    res.setHeader('Content-Length', String(buffer.length))
    res.setHeader('Cache-Control', 'private, no-store')
    return res.status(200).send(buffer)
  } catch (err) {
    const status = err?.status
    if (status === 403) {
      return res.status(403).json({ error: 'Không có quyền tải file này' })
    }
    if (status === 404) {
      return res.status(404).json({ error: 'Không tìm thấy' })
    }
    console.error('[journal GET file]', err)
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

function journalAutoEnsurePeriod() {
  const v = String(process.env.JOURNAL_AUTO_ENSURE_PERIOD ?? '1').toLowerCase()
  return v !== '0' && v !== 'false' && v !== 'off'
}

/** epoch ms từ body multipart (số hoặc ISO). */
function parseOptionalEpochMs(v) {
  if (v == null || v === '') return null
  const s = String(v).trim()
  if (!s) return null
  const n = Number(s)
  if (Number.isFinite(n) && n > 0) return n
  const parsed = Date.parse(s)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Tạo journal_periods nếu chưa có (learner tạo đợt mới trên UI).
 * ON CONFLICT DO NOTHING — đợt đã tồn tại thì giữ nguyên metadata cũ.
 */
async function ensureJournalPeriod(periodId, body) {
  const titleRaw = body?.periodTitle ?? body?.submissionTitle
  const title =
    String(titleRaw != null && titleRaw !== '' ? titleRaw : periodId)
      .trim()
      .slice(0, 255) || periodId
  const startMs = parseOptionalEpochMs(body?.periodStartsAt)
  const endMs = parseOptionalEpochMs(body?.periodEndsAt)
  let startsAt
  let endsAt
  if (startMs != null && endMs != null) {
    const lo = Math.min(startMs, endMs)
    const hi = Math.max(startMs, endMs)
    startsAt = new Date(lo)
    endsAt = new Date(hi === lo ? hi + 60_000 : hi)
  } else if (startMs != null) {
    startsAt = new Date(startMs)
    endsAt = new Date(startMs + 365 * 24 * 60 * 60 * 1000)
  } else if (endMs != null) {
    endsAt = new Date(endMs)
    startsAt = new Date(endMs - 365 * 24 * 60 * 60 * 1000)
  } else {
    startsAt = new Date(Date.now() - 24 * 60 * 60 * 1000)
    endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
  await prisma.$executeRaw`
    INSERT INTO journal_periods (period_id, title, description, starts_at, ends_at, class_id, created_by)
    VALUES (${periodId}, ${title}, '', ${startsAt}, ${endsAt}, NULL, NULL)
    ON CONFLICT (period_id) DO NOTHING
  `
}

async function periodRowExists(periodId) {
  const rows = await prisma.$queryRaw`
    SELECT period_id FROM journal_periods WHERE period_id = ${periodId} LIMIT 1
  `
  return Array.isArray(rows) && rows.length > 0
}

/** GET/DELETE: chỉ dùng period đã có; fallback default nếu client gửi id lạ. */
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

/** POST upload: bảo đảm period tồn tại (auto-insert từ metadata UI) nếu bật JOURNAL_AUTO_ENSURE_PERIOD. */
async function resolvePeriodIdForUpload(raw, body) {
  const id = String(raw || 'default').trim().slice(0, 64)
  if (!id) return null

  if (await periodRowExists(id)) return id

  if (journalAutoEnsurePeriod() && id !== 'default') {
    await ensureJournalPeriod(id, body)
    if (await periodRowExists(id)) return id
    return null
  }

  if (id === 'default') {
    return (await periodRowExists('default')) ? 'default' : null
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
    const periodId = await resolvePeriodIdForUpload(req.body?.periodId, req.body)
    if (!periodId) {
      return res.status(400).json({
        error:
          'Không tìm thấy đợt journal (journal_periods). Gửi periodId trùng submission.id; bật JOURNAL_AUTO_ENSURE_PERIOD hoặc tạo đợt trong DB.',
      })
    }

    const original = req.file.originalname || 'upload.bin'
    const { text: extractedText, note: extractNote } = await extractDocumentText(
      req.file.buffer,
      original
    )

    const prevRows = await prisma.$queryRaw`
      SELECT storage_key FROM journal_uploads
      WHERE user_id = ${userId} AND period_id = ${periodId}
      LIMIT 1
    `
    const prevKey = Array.isArray(prevRows) && prevRows[0]?.storage_key
    if (prevKey) await removeJournalUpload(prevKey)

    const storedName = `${Date.now()}_${safeBaseName(original)}`
    const { storageKey } = await saveJournalUpload({
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      userId,
      periodId,
      storedName,
    })

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
    await removeJournalUpload(key)
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
