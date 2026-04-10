import { Router } from 'express'
import multer from 'multer'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { jsonSafe } from '../lib/json.js'
import { parseFaqCsv } from '../lib/faqCsv.js'
import { clearFaqEmbeddingById } from '../lib/faqEmbeddingDb.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
})

function parseKeywordsField(body, fieldName) {
  const raw = body?.[fieldName]
  if (Array.isArray(raw)) {
    return raw.map((k) => String(k).trim()).filter(Boolean)
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const j = JSON.parse(raw)
      if (Array.isArray(j)) return j.map((k) => String(k).trim()).filter(Boolean)
    } catch {
      return raw
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
  return []
}

function mapFaqRow(r) {
  return {
    id: String(r.id),
    questionVi: r.questionVi,
    answerVi: r.answerVi,
    keywordsVi: Array.isArray(r.keywordsVi) ? r.keywordsVi : [],
    questionEn: r.questionEn,
    answerEn: r.answerEn,
    keywordsEn: Array.isArray(r.keywordsEn) ? r.keywordsEn : [],
    sortOrder: r.sortOrder,
    isActive: r.isActive,
  }
}

async function getNextSortOrderStart() {
  const { _max } = await prisma.faqEntry.aggregate({ _max: { sortOrder: true } })
  return ((_max?.sortOrder ?? 0) | 0) + 1
}

/**
 * POST /api/admin/faq/bulk
 * body: { rows: [{ questionVi, answerVi, questionEn, answerEn, keywordsVi?, keywordsEn?, isActive? }] }
 */
router.post('/faq/bulk', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }
    const rows = req.body?.rows
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Thiếu rows (mảng không rỗng)' })
    }
    const normalized = []
    for (const r of rows) {
      const questionVi = String(r?.questionVi ?? '').trim()
      const answerVi = String(r?.answerVi ?? '').trim()
      const questionEn = String(r?.questionEn ?? '').trim()
      const answerEn = String(r?.answerEn ?? '').trim()
      if (!questionVi || !answerVi || !questionEn || !answerEn) continue
      const keywordsVi = Array.isArray(r?.keywordsVi)
        ? r.keywordsVi.map((k) => String(k).trim()).filter(Boolean)
        : parseKeywordsField(r, 'keywordsVi')
      const keywordsEn = Array.isArray(r?.keywordsEn)
        ? r.keywordsEn.map((k) => String(k).trim()).filter(Boolean)
        : parseKeywordsField(r, 'keywordsEn')
      normalized.push({
        questionVi,
        answerVi,
        keywordsVi,
        questionEn,
        answerEn,
        keywordsEn,
        isActive: r?.isActive !== false,
      })
    }
    if (normalized.length === 0) {
      return res.status(400).json({
        error: 'Không có dòng hợp lệ (cần đủ questionVi, answerVi, questionEn, answerEn)',
      })
    }

    let sortOrder = await getNextSortOrderStart()
    const data = normalized.map((r) => ({
      questionVi: r.questionVi,
      answerVi: r.answerVi,
      keywordsVi: r.keywordsVi,
      questionEn: r.questionEn,
      answerEn: r.answerEn,
      keywordsEn: r.keywordsEn,
      sortOrder: sortOrder++,
      isActive: r.isActive,
    }))

    await prisma.faqEntry.createMany({ data })
    return res.status(201).json(jsonSafe({ imported: data.length }))
  } catch (err) {
    console.error('[admin POST faq/bulk]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * POST /api/admin/faq/import
 * CSV: question_vi, answer_vi, question_en, answer_en [, keywords_vi] [, keywords_en]
 */
router.post('/faq/import', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }
    const buf = req.file?.buffer
    if (!buf?.length) {
      return res.status(400).json({ error: 'Thiếu file CSV (field file)' })
    }
    let parsed
    try {
      parsed = parseFaqCsv(buf.toString('utf8'))
    } catch (e) {
      return res.status(400).json({
        error: 'CSV không hợp lệ',
        message: e instanceof Error ? e.message : String(e),
      })
    }
    if (parsed.length === 0) {
      return res.status(400).json({ error: 'Không có dòng dữ liệu hợp lệ sau header' })
    }

    let sortOrder = await getNextSortOrderStart()
    const data = parsed.map((r) => ({
      questionVi: r.questionVi,
      answerVi: r.answerVi,
      keywordsVi: r.keywordsVi,
      questionEn: r.questionEn,
      answerEn: r.answerEn,
      keywordsEn: r.keywordsEn,
      sortOrder: sortOrder++,
      isActive: true,
    }))

    await prisma.faqEntry.createMany({ data })
    return res.status(201).json(jsonSafe({ imported: data.length }))
  } catch (err) {
    console.error('[admin POST faq/import]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * GET /api/admin/faq
 */
router.get('/faq', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }
    const rows = await prisma.faqEntry.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    })
    return res.status(200).json(
      jsonSafe({
        faq: rows.map((r) => ({
          ...mapFaqRow(r),
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
      })
    )
  } catch (err) {
    console.error('[admin GET faq]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * POST /api/admin/faq
 */
router.post('/faq', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }
    const questionVi = String(req.body?.questionVi ?? '').trim()
    const answerVi = String(req.body?.answerVi ?? '').trim()
    const questionEn = String(req.body?.questionEn ?? '').trim()
    const answerEn = String(req.body?.answerEn ?? '').trim()
    if (!questionVi || !answerVi || !questionEn || !answerEn) {
      return res.status(400).json({ error: 'Thiếu nội dung VI hoặc EN (đủ 4 trường)' })
    }
    const keywordsVi = parseKeywordsField(req.body, 'keywordsVi')
    const keywordsEn = parseKeywordsField(req.body, 'keywordsEn')
    const sortOrder = Number(req.body?.sortOrder)
    const isActive = req.body?.isActive !== false

    const row = await prisma.faqEntry.create({
      data: {
        questionVi,
        answerVi,
        keywordsVi,
        questionEn,
        answerEn,
        keywordsEn,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        isActive,
      },
    })
    return res.status(201).json(
      jsonSafe({
        faq: mapFaqRow(row),
      })
    )
  } catch (err) {
    console.error('[admin POST faq]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * PATCH /api/admin/faq/:id
 */
router.patch('/faq/:id', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }
    let id
    try {
      id = BigInt(String(req.params.id))
    } catch {
      return res.status(400).json({ error: 'id không hợp lệ' })
    }

    const data = {}
    if (req.body?.questionVi !== undefined) {
      const q = String(req.body.questionVi).trim()
      if (!q) return res.status(400).json({ error: 'questionVi không được rỗng' })
      data.questionVi = q
    }
    if (req.body?.answerVi !== undefined) {
      const a = String(req.body.answerVi).trim()
      if (!a) return res.status(400).json({ error: 'answerVi không được rỗng' })
      data.answerVi = a
    }
    if (req.body?.questionEn !== undefined) {
      const q = String(req.body.questionEn).trim()
      if (!q) return res.status(400).json({ error: 'questionEn không được rỗng' })
      data.questionEn = q
    }
    if (req.body?.answerEn !== undefined) {
      const a = String(req.body.answerEn).trim()
      if (!a) return res.status(400).json({ error: 'answerEn không được rỗng' })
      data.answerEn = a
    }
    if (req.body?.keywordsVi !== undefined) data.keywordsVi = parseKeywordsField(req.body, 'keywordsVi')
    if (req.body?.keywordsEn !== undefined) data.keywordsEn = parseKeywordsField(req.body, 'keywordsEn')
    if (req.body?.sortOrder !== undefined) {
      const n = Number(req.body.sortOrder)
      if (Number.isFinite(n)) data.sortOrder = n
    }
    if (req.body?.isActive !== undefined) data.isActive = Boolean(req.body.isActive)

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Không có trường cập nhật' })
    }

    const row = await prisma.faqEntry.update({
      where: { id },
      data,
    })
    await clearFaqEmbeddingById(id)
    return res.status(200).json(
      jsonSafe({
        faq: mapFaqRow(row),
      })
    )
  } catch (err) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'Không tìm thấy FAQ' })
    }
    console.error('[admin PATCH faq]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * DELETE /api/admin/faq/:id
 */
router.delete('/faq/:id', authMiddleware, async (req, res) => {
  try {
    if (req.auth.userRole !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin' })
    }
    let id
    try {
      id = BigInt(String(req.params.id))
    } catch {
      return res.status(400).json({ error: 'id không hợp lệ' })
    }
    await prisma.faqEntry.delete({ where: { id } })
    return res.status(204).send()
  } catch (err) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'Không tìm thấy FAQ' })
    }
    console.error('[admin DELETE faq]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
