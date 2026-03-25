import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'

const MAX_CHARS = Math.min(Number(process.env.JOURNAL_MAX_EXTRACT_CHARS) || 400_000, 2_000_000)

function extOf(name) {
  const n = String(name || '').toLowerCase()
  const i = n.lastIndexOf('.')
  return i >= 0 ? n.slice(i) : ''
}

/**
 * Trích văn bản từ buffer theo loại file (đuôi mở rộng).
 * @returns {{ text: string, note?: string }}
 */
export async function extractDocumentText(buffer, originalName) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { text: '', note: 'File rỗng.' }
  }
  const ext = extOf(originalName)

  try {
    if (ext === '.txt' || ext === '.md' || ext === '.csv' || ext === '.json' || ext === '.log') {
      let text = buffer.toString('utf8')
      if (text.includes('\uFFFD') && buffer.length < 5_000_000) {
        try {
          text = buffer.toString('latin1')
        } catch {
          /* keep utf8 */
        }
      }
      return { text: truncate(text) }
    }

    if (ext === '.pdf') {
      const data = await pdfParse(buffer)
      const text = truncate((data.text || '').trim())
      return {
        text,
        note: text ? undefined : 'PDF không có lớp văn bản (có thể là scan); cần OCR riêng.',
      }
    }

    if (ext === '.docx') {
      const { value } = await mammoth.extractRawText({ buffer })
      return { text: truncate((value || '').trim()) }
    }

    return {
      text: '',
      note: `Định dạng ${ext || '(không đuôi)'} chưa hỗ trợ trích văn bản; dùng .txt, .md, .pdf (có text), .docx.`,
    }
  } catch (err) {
    console.error('[extractDocumentText]', ext, err)
    return {
      text: '',
      note: `Lỗi đọc file: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

function truncate(s) {
  if (s.length <= MAX_CHARS) return s
  return `${s.slice(0, MAX_CHARS)}\n\n[... đã cắt bớt theo JOURNAL_MAX_EXTRACT_CHARS=${MAX_CHARS} ...]`
}
