/**
 * CSV (RFC 4180 cơ bản): dấu phẩy, dấu ngoặc kép.
 *
 * Định dạng mới (song ngữ):
 *   question_vi, answer_vi, question_en, answer_en [, keywords_vi] [, keywords_en]
 *
 * Legacy (chỉ tiếng Việt — EN để trống, admin bổ sung sau):
 *   question, answer [, keywords]  → map vào *_vi
 */

/** @returns {string[][]} */
export function parseCsvRows(text) {
  const raw = String(text || '').replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i]
    if (c === '"') {
      if (inQuotes && raw[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (!inQuotes && (c === '\n' || c === '\r')) {
      if (c === '\r' && raw[i + 1] === '\n') i++
      row.push(cur)
      if (row.some((cell) => String(cell).trim() !== '')) {
        rows.push(row)
      }
      row = []
      cur = ''
    } else if (!inQuotes && c === ',') {
      row.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  row.push(cur)
  if (row.some((cell) => String(cell).trim() !== '')) {
    rows.push(row)
  }
  return rows
}

function parseKeywordsCell(cell) {
  const s = String(cell || '').trim()
  if (!s) return []
  if (s.startsWith('[')) {
    try {
      const j = JSON.parse(s)
      return Array.isArray(j) ? j.map((x) => String(x).trim()).filter(Boolean) : []
    } catch {
      /* fallthrough */
    }
  }
  return s
    .split(/[|;]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

function headerIndex(header, names) {
  for (const n of names) {
    const i = header.indexOf(n)
    if (i !== -1) return i
  }
  return -1
}

/**
 * @returns {{ questionVi: string, answerVi: string, questionEn: string, answerEn: string, keywordsVi: string[], keywordsEn: string[] }[]}
 */
export function parseFaqCsv(text) {
  const lines = parseCsvRows(text)
  if (lines.length < 2) {
    throw new Error('File CSV cần ít nhất header + dòng dữ liệu')
  }
  const header = lines[0].map((h) => String(h).trim().toLowerCase())

  const iQv = headerIndex(header, ['question_vi', 'question vi'])
  const iAv = headerIndex(header, ['answer_vi', 'answer vi'])
  const iQe = headerIndex(header, ['question_en', 'question en'])
  const iAe = headerIndex(header, ['answer_en', 'answer en'])
  const iKv = headerIndex(header, ['keywords_vi', 'keywords'])
  const iKe = headerIndex(header, ['keywords_en'])
  const iQ = headerIndex(header, ['question'])
  const iA = headerIndex(header, ['answer'])

  const fullBilingual = iQv !== -1 && iAv !== -1 && iQe !== -1 && iAe !== -1
  const legacy = iQ !== -1 && iA !== -1 && !fullBilingual

  if (!fullBilingual && !legacy) {
    throw new Error(
      'Dòng đầu cần: question_vi, answer_vi, question_en, answer_en (và tùy chọn keywords_vi, keywords_en). Hoặc legacy: question, answer [, keywords].'
    )
  }

  const out = []
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]
    let questionVi
    let answerVi
    let questionEn
    let answerEn
    let keywordsVi
    let keywordsEn

    if (fullBilingual) {
      questionVi = String(row[iQv] ?? '').trim()
      answerVi = String(row[iAv] ?? '').trim()
      questionEn = String(row[iQe] ?? '').trim()
      answerEn = String(row[iAe] ?? '').trim()
      keywordsVi = iKv !== -1 ? parseKeywordsCell(row[iKv]) : []
      keywordsEn = iKe !== -1 ? parseKeywordsCell(row[iKe]) : []
    } else {
      questionVi = String(row[iQ] ?? '').trim()
      answerVi = String(row[iA] ?? '').trim()
      questionEn = ''
      answerEn = ''
      const ki = header.indexOf('keywords')
      keywordsVi = ki !== -1 ? parseKeywordsCell(row[ki]) : []
      keywordsEn = []
    }

    if (!questionVi || !answerVi) continue
    out.push({ questionVi, answerVi, questionEn, answerEn, keywordsVi, keywordsEn })
  }
  return out
}
