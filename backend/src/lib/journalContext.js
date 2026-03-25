import { prisma } from './prisma.js'

const PER_FILE = Math.min(Number(process.env.JOURNAL_CONTEXT_PER_FILE_CHARS) || 16_000, 200_000)
const TOTAL_CAP = Math.min(Number(process.env.JOURNAL_CONTEXT_TOTAL_CHARS) || 80_000, 400_000)

function clip(s, max) {
  if (s == null || s === '') return ''
  const t = String(s)
  if (t.length <= max) return t
  return `${t.slice(0, max)}\n[... cắt bớt ...]`
}

/**
 * Ngữ cảnh journal cho AI: metadata + đoạn extracted_text (nếu đã upload qua /api/journal/upload).
 */
export async function getJournalContextSummary(userId) {
  if (!userId || typeof userId !== 'string') {
    return 'Không có thông tin journal (thiếu user).'
  }
  try {
    const rows = await prisma.$queryRaw`
      SELECT jp.period_id AS period_id,
             jp.title AS title,
             jp.description AS description,
             ju.original_file_name AS file_name,
             ju.submitted_at AS submitted_at,
             ju.status AS status,
             ju.extracted_text AS extracted_text
      FROM journal_uploads ju
      INNER JOIN journal_periods jp ON jp.period_id = ju.period_id
      WHERE ju.user_id = ${userId}
      ORDER BY ju.submitted_at DESC
      LIMIT 12
    `
    if (!Array.isArray(rows) || rows.length === 0) {
      return [
        'Người học chưa có bản journal nào trên server.',
        'Gợi ý: nộp file qua trang Journal (đăng nhập API) để hệ thống trích văn bản (.txt, .md, .pdf có text, .docx) và đưa vào hội thoại này.',
      ].join('\n')
    }

    const chunks = []
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      const title = r.title ?? ''
      const desc = (r.description || '').trim()
      const fn = r.file_name || '(không tên)'
      const st = r.status || ''
      const at = r.submitted_at ? new Date(r.submitted_at).toISOString() : ''
      const pid = r.period_id || ''
      const head = `${i + 1}. Đợt [${pid}] ${title}${desc ? ` — ${desc.slice(0, 200)}` : ''} | file: ${fn} | ${st} | ${at}`
      const raw = r.extracted_text
      const body =
        raw != null && String(raw).trim() !== ''
          ? clip(String(raw), PER_FILE)
          : '(Chưa có văn bản trích từ file — định dạng không hỗ trợ, PDF scan, hoặc chưa upload qua API.)'
      chunks.push(`${head}\n---\n${body}`)
    }

    const merged = ['Thông tin & nội dung journal trên server:', chunks.join('\n\n---\n\n')].join('\n\n')
    return clip(merged, TOTAL_CAP)
  } catch (err) {
    console.error('[journalContext]', err)
    return 'Không đọc được dữ liệu journal từ CSDL (thiếu cột extracted_text? chạy prisma migrate deploy).'
  }
}
