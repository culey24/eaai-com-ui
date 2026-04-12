import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import {
  listJournalStorageKeysInPeriod,
  readJournalUploadWithFallback,
  deleteJournalUploadsExcept,
} from '../lib/journalFileStorage.js'
import { extractDocumentText } from '../lib/extractDocumentText.js'
import { jsonSafe } from '../lib/json.js'

const router = Router()

function stripNulBytes(s) {
  if (s == null) return s
  const t = String(s)
  return t.includes('\0') ? t.replace(/\0/g, '') : t
}

function originalNameFromStorageKey(storageKey) {
  const base = String(storageKey || '')
    .replace(/^gcs:/, '')
    .split('/')
    .pop()
  const stripped = base.replace(/^\d+_/, '').trim()
  const name = stripped || base || 'journal.bin'
  return stripNulBytes(name).slice(0, 512)
}

/**
 * POST /api/admin/journal-reconcile
 * Admin: chọn file mới nhất trên storage cho (learnerId, periodId), xóa object thừa, ghi lại một dòng journal_uploads + trích text.
 */
router.post('/journal-reconcile', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }

    const learnerId = String(req.body?.learnerId || '').trim()
    const periodId = String(req.body?.periodId ?? 'default').trim().slice(0, 64) || 'default'
    if (!learnerId) {
      return res.status(400).json({ error: 'Thiếu learnerId' })
    }

    const learner = await prisma.user.findUnique({
      where: { userId: learnerId },
      select: { userId: true, userRole: true },
    })
    if (!learner || learner.userRole !== 'student') {
      return res.status(400).json({ error: 'learnerId không phải học viên' })
    }

    const period = await prisma.journalPeriod.findUnique({
      where: { periodId },
      select: { periodId: true },
    })
    if (!period) {
      return res.status(400).json({ error: 'Không tìm thấy journal_periods cho periodId này' })
    }

    const keys = await listJournalStorageKeysInPeriod(learnerId, periodId)
    if (keys.length === 0) {
      return res.status(400).json({ error: 'Không có file journal trên storage cho đợt này' })
    }

    const chosenKey = keys[0]
    const original = originalNameFromStorageKey(chosenKey)

    let buffer
    try {
      ;({ buffer } = await readJournalUploadWithFallback(chosenKey, {
        userId: learnerId,
        periodId,
      }))
    } catch (e) {
      console.error('[admin journal-reconcile read]', e)
      return res.status(400).json({
        error: 'Không đọc được file mới nhất trên storage',
        message: e instanceof Error ? e.message : String(e),
      })
    }

    const { text: extractedText } = await extractDocumentText(buffer, original)
    const extractedForDb =
      extractedText && extractedText.length > 0 ? stripNulBytes(extractedText) : null

    const { deleted } = await deleteJournalUploadsExcept(learnerId, periodId, chosenKey)

    await prisma.$executeRaw`
      DELETE FROM journal_uploads WHERE user_id = ${learnerId} AND period_id = ${periodId}
    `

    const inserted = await prisma.$queryRaw`
      INSERT INTO journal_uploads (user_id, period_id, storage_key, original_file_name, status, extracted_text)
      VALUES (${learnerId}, ${periodId}, ${chosenKey}, ${original}, 'submitted', ${extractedForDb})
      RETURNING upload_id, submitted_at
    `

    const row = Array.isArray(inserted) ? inserted[0] : null
    return res.status(200).json(
      jsonSafe({
        ok: true,
        learnerId,
        periodId,
        chosenStorageKey: chosenKey,
        originalFileName: original,
        orphanObjectsDeleted: deleted,
        uploadId: row?.upload_id != null ? String(row.upload_id) : undefined,
        charsExtracted: extractedForDb ? extractedForDb.length : 0,
      })
    )
  } catch (err) {
    console.error('[admin journal-reconcile]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
