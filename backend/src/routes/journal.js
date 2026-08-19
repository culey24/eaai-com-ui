import { Router } from 'express'
import multer from 'multer'
import { prisma } from '../lib/prisma.js'
import {
  removeAllJournalObjectsInPeriod,
  listJournalStorageKeysInPeriod,
  saveJournalUpload,
  readJournalUploadWithFallback,
} from '../lib/journalFileStorage.js'
import { authMiddleware } from '../middleware/auth.js'
import { extractDocumentText } from '../lib/extractDocumentText.js'
import { jsonSafe } from '../lib/json.js'
import { journalUploadLimiter } from '../lib/rateLimits.js'
import { isSupporterUserRole } from '../lib/roles.js'
import {
  downloadKey,
  verifyFileDownload,
} from '../lib/signedDownloadUrl.js'

const router = Router()

/**
 * GET /api/journal/periods
 * Mọi user đã đăng nhập: danh sách đợt nộp (đồng bộ UI với journal_periods).
 */
router.get('/periods', authMiddleware, async (req, res) => {
  try {
    const rows = await prisma.journalPeriod.findMany({
      orderBy: { endsAt: 'asc' },
    })
    return res.status(200).json(
      jsonSafe({
        periods: rows.map((p) => ({
          periodId: p.periodId,
          title: p.title,
          description: p.description,
          startsAt: p.startsAt.toISOString(),
          endsAt: p.endsAt.toISOString(),
          requirePosttest: !!p.requirePosttest,
          requirePosttest2: !!p.requirePosttest2,
          isEndOfCourse: !!p.isEndOfCourse,
          isPosttest: !!p.isPosttest,
          isPosttest2: !!p.isPosttest2,
          createdAt: p.createdAt.toISOString(),
        })),
      })
    )
  } catch (err) {
    console.error('[journal GET /periods]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

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
      SELECT t.upload_id, t.period_id, t.original_file_name, t.submitted_at, t.status
      FROM (
        SELECT DISTINCT ON (ju.period_id)
          ju.upload_id, ju.period_id, ju.original_file_name, ju.submitted_at, ju.status
        FROM journal_uploads ju
        WHERE ju.user_id = ${userId}
        ORDER BY ju.period_id, ju.submitted_at DESC, ju.upload_id DESC
      ) AS t
      ORDER BY t.submitted_at DESC
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
 * Admin / supporter: mọi học viên (supporter không lọc theo lớp hay gán).
 */
router.get('/by-user/:learnerId', authMiddleware, async (req, res) => {
  try {
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

    if (req.auth.userRole === 'admin' || isSupporterUserRole(req.auth.userRole)) {
      /* admin / supporter: toàn bộ học viên (không lọc theo lớp hay gán) */
    } else {
      return res.status(403).json({ error: 'Không có quyền' })
    }

    const rows = await prisma.$queryRaw`
      SELECT t.upload_id, t.period_id, t.original_file_name, t.submitted_at, t.status
      FROM (
        SELECT DISTINCT ON (ju.period_id)
          ju.upload_id, ju.period_id, ju.original_file_name, ju.submitted_at, ju.status
        FROM journal_uploads ju
        WHERE ju.user_id = ${learnerId}
        ORDER BY ju.period_id, ju.submitted_at DESC, ju.upload_id DESC
      ) AS t
      ORDER BY t.submitted_at DESC
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

/**
 * GET /api/journal/storage-check?periodId=...&learnerId=...
 * So sánh object trên bucket/đĩa với bảng journal_uploads cho (learner, đợt).
 * - Học viên: chỉ kiểm tra chính mình (bỏ qua learnerId).
 * - Admin / supporter: bắt buộc query learnerId (mọi học viên; cùng assertCanDownloadJournalFile với by-user / tải file).
 */
router.get('/storage-check', authMiddleware, async (req, res) => {
  try {
    let learnerId
    if (req.auth.userRole === 'student') {
      learnerId = req.auth.userId
    } else {
      learnerId = String(req.query.learnerId || '').trim()
      if (!learnerId) {
        return res.status(400).json({ error: 'Thiếu learnerId (query)' })
      }
    }

    await assertCanDownloadJournalFile(req.auth, learnerId)

    const periodId = String(req.query.periodId ?? 'default').trim().slice(0, 64) || 'default'
    const bucketKeys = await listJournalStorageKeysInPeriod(learnerId, periodId)

    const dbRows = await prisma.$queryRaw`
      SELECT ju.upload_id, ju.period_id, ju.storage_key, ju.original_file_name, ju.submitted_at, ju.status
      FROM journal_uploads ju
      WHERE ju.user_id = ${learnerId} AND ju.period_id = ${periodId}
      ORDER BY ju.submitted_at DESC, ju.upload_id DESC
    `
    const rows = Array.isArray(dbRows) ? dbRows : []
    const latestKey = rows[0]?.storage_key != null ? String(rows[0].storage_key) : null

    const bucketFilesWithoutDbRow = rows.length === 0 && bucketKeys.length > 0
    const extraBucketKeysVersusLatestDb =
      latestKey != null && bucketKeys.length > 0
        ? bucketKeys.filter((k) => k !== latestKey)
        : latestKey == null && bucketKeys.length > 0
          ? bucketKeys
          : []

    return res.status(200).json(
      jsonSafe({
        learnerId,
        periodId,
        bucketKeys,
        bucketFileCount: bucketKeys.length,
        dbRows: rows,
        dbRowCount: rows.length,
        latestDbStorageKey: latestKey,
        /** true = có file trên storage nhưng không có dòng journal_uploads cho (user, period) */
        bucketFilesWithoutDbRow,
        /** object trên bucket không trùng storage_key của bản DB mới nhất (có DB nhưng thừa file, hoặc có file mà không có dòng thì liệt kê hết) */
        extraBucketKeysVersusLatestDb,
      })
    )
  } catch (err) {
    const status = err?.status
    if (status === 403) {
      return res.status(403).json({ error: 'Không có quyền' })
    }
    if (status === 404) {
      return res.status(404).json({ error: 'Không tìm thấy' })
    }
    console.error('[journal GET storage-check]', err)
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
  if (reqAuth.userRole === 'admin' || isSupporterUserRole(reqAuth.userRole)) {
    const learner = await prisma.user.findUnique({
      where: { userId: learnerId },
      select: { userRole: true },
    })
    if (!learner || learner.userRole !== 'student') {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }
    return
  }
  throw Object.assign(new Error('Forbidden'), { status: 403 })
}

/**
 * Đọc + stream file journal đã lưu (dùng chung cho route cần JWT và route shared).
 * Trả về response đã send; ném lỗi có .status nếu cần (403/404/500).
 */
async function readJournalFileAndSend(res, learnerIdRaw, uploadIdRaw) {
  const learnerId = String(learnerIdRaw || '').trim()
  const uploadIdStr = String(uploadIdRaw || '').trim()
  if (!learnerId || !uploadIdStr || !/^\d+$/.test(uploadIdStr)) {
    return res.status(400).json({ error: 'Thiếu learnerId hoặc uploadId không hợp lệ' })
  }
  let uploadIdBig
  try {
    uploadIdBig = BigInt(uploadIdStr)
  } catch {
    return res.status(400).json({ error: 'uploadId không hợp lệ' })
  }

  const rows = await prisma.$queryRaw`
    SELECT ju.storage_key, ju.original_file_name, ju.period_id
    FROM journal_uploads ju
    WHERE ju.user_id = ${learnerId} AND ju.upload_id = ${uploadIdBig}
    LIMIT 1
  `
  const row = Array.isArray(rows) && rows[0]
  if (!row?.storage_key) {
    return res.status(404).json({ error: 'Không tìm thấy file journal' })
  }

  let buffer
  let contentType
  try {
    ;({ buffer, contentType } = await readJournalUploadWithFallback(String(row.storage_key), {
      userId: learnerId,
      periodId: row.period_id != null ? String(row.period_id) : '',
    }))
  } catch (readErr) {
    if (readErr?.code === 'ENOENT') {
      return res.status(404).json({
        error:
          'File journal không còn trên máy chủ (mất volume / đổi instance / chưa mount uploads). ' +
          'Cấu hình volume bền cho thư mục upload hoặc GCS_BUCKET_NAME.',
      })
    }
    throw readErr
  }
  const name = (row.original_file_name && String(row.original_file_name).slice(0, 512)) || 'journal'

  res.setHeader('Content-Type', contentType || 'application/octet-stream')
  res.setHeader('Content-Disposition', contentDispositionAttachment(name))
  res.setHeader('Content-Length', String(buffer.length))
  res.setHeader('Cache-Control', 'private, no-store')
  return res.status(200).send(buffer)
}

/**
 * GET /api/journal/learner/:learnerId/file/:uploadId
 * Learner (chính mình), admin, hoặc supporter — tải binary đã lưu (supporter: mọi học viên).
 */
router.get('/learner/:learnerId/file/:uploadId', authMiddleware, async (req, res) => {
  try {
    const learnerId = String(req.params.learnerId || '').trim()
    const uploadIdRaw = String(req.params.uploadId || '').trim()
    if (!learnerId || !uploadIdRaw || !/^\d+$/.test(uploadIdRaw)) {
      return res.status(400).json({ error: 'Thiếu learnerId hoặc uploadId không hợp lệ' })
    }

    await assertCanDownloadJournalFile(req.auth, learnerId)
    return await readJournalFileAndSend(res, learnerId, uploadIdRaw)
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

/**
 * GET /api/journal/shared/:learnerId/:uploadId?sig=&exp=
 * Tải file KHÔNG cần đăng nhập — link được ký HMAC (signedDownloadUrl).
 * Link bị thu hồi (journal_download_revocations) → 403.
 */
router.get('/shared/:learnerId/:uploadId', async (req, res) => {
  try {
    const learnerId = String(req.params.learnerId || '').trim()
    const uploadId = String(req.params.uploadId || '').trim()
    const sig = req.query.sig
    const exp = req.query.exp

    if (!learnerId || !uploadId || !/^\d+$/.test(uploadId)) {
      return res.status(400).json({ error: 'Thiếu learnerId hoặc uploadId không hợp lệ' })
    }
    if (!verifyFileDownload({ learnerId, uploadId, sig, exp })) {
      return res.status(403).json({ error: 'Link tải không hợp lệ hoặc đã hết hạn' })
    }

    const revoked = await prisma.journalDownloadRevocation.findUnique({
      where: { downloadKey: downloadKey(learnerId, uploadId) },
      select: { id: true },
    })
    if (revoked) {
      return res.status(403).json({ error: 'Link tải đã bị thu hồi' })
    }

    return await readJournalFileAndSend(res, learnerId, uploadId)
  } catch (err) {
    const status = err?.status
    if (status === 403) {
      return res.status(403).json({ error: 'Link tải không hợp lệ hoặc đã bị thu hồi' })
    }
    if (status === 404) {
      return res.status(404).json({ error: 'Không tìm thấy' })
    }
    console.error('[journal GET shared file]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

const maxBytes = Math.min(Number(process.env.JOURNAL_MAX_FILE_BYTES) || 100 * 1024 * 1024, 200 * 1024 * 1024)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes, files: 1 },
})

function safeBaseName(name) {
  return String(name || 'file').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 200)
}

/** PostgreSQL UTF-8 không chấp nhận byte NUL (0x00) trong TEXT/VARCHAR — gây 22021. */
function stripNulBytes(s) {
  if (s == null) return s
  const t = String(s)
  return t.includes('\0') ? t.replace(/\0/g, '') : t
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
    const periodIdRaw = req.body?.periodId
    const resolvedPeriodId = await resolvePeriodIdForUpload(periodIdRaw, req.body)
    if (!resolvedPeriodId) {
      return res.status(400).json({
        error:
          'Không tìm thấy đợt journal (journal_periods). Gửi periodId trùng submission.id; bật JOURNAL_AUTO_ENSURE_PERIOD hoặc tạo đợt trong DB.',
      })
    }

    // Posttest gating logic
    const period = await prisma.journalPeriod.findUnique({
      where: { periodId: resolvedPeriodId },
      select: { 
        requirePosttest: true, 
        requirePosttest2: true,
        isPosttest: true,
        isPosttest2: true,
      },
    })

    if (period?.isPosttest || period?.isPosttest2) {
      return res.status(400).json({
        code: 'SURVEY_ONLY_PERIOD',
        error: 'Đợt này chỉ dành cho khảo sát, không chấp nhận nộp bài tập.',
      })
    }

    if (period?.requirePosttest) {
      const posttest = await prisma.surveyResponse.findFirst({
        where: { userId, surveyKind: 'POSTTEST' },
        select: { userId: true },
      })
      if (!posttest) {
        return res.status(403).json({
          code: 'POSTTEST_REQUIRED',
          error: 'Bạn phải hoàn thành Post-test trước khi nộp bài cho đợt này.',
        })
      }
    }

    if (period?.requirePosttest2) {
      const posttest2 = await prisma.surveyResponse.findFirst({
        where: { userId, surveyKind: 'POSTTEST2' },
        select: { userId: true },
      })
      if (!posttest2) {
        return res.status(403).json({
          code: 'POSTTEST2_REQUIRED',
          error: 'Bạn phải hoàn thành Post-test 2 trước khi nộp bài cho đợt này.',
        })
      }
    }

    const periodId = resolvedPeriodId

    const original = stripNulBytes(req.file.originalname || 'upload.bin')
    const { text: extractedText, note: extractNote } = await extractDocumentText(
      req.file.buffer,
      original
    )
    const extractedForDb =
      extractedText && extractedText.length > 0 ? stripNulBytes(extractedText) : null

    await removeAllJournalObjectsInPeriod(userId, periodId)

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
      VALUES (${userId}, ${periodId}, ${storageKey}, ${original.slice(0, 512)}, 'submitted', ${extractedForDb})
      RETURNING upload_id, submitted_at
    `

    const row = Array.isArray(inserted) ? inserted[0] : null
    return res.status(201).json(
      jsonSafe({
        ok: true,
        uploadId: row?.upload_id != null ? String(row.upload_id) : undefined,
        periodId,
        storageKey,
        extractNote: extractNote || (extractedForDb ? undefined : 'Không trích được văn bản.'),
        charsExtracted: extractedForDb ? extractedForDb.length : 0,
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
 * Xóa bản ghi trong DB và toàn bộ file journal trên storage cho đợt đó (gom sau lỗi nhiều file).
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
    await removeAllJournalObjectsInPeriod(userId, periodId)
    await prisma.$executeRaw`
      DELETE FROM journal_uploads WHERE user_id = ${userId} AND period_id = ${periodId}
    `
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
