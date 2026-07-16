import katex from 'katex'

let _keySeq = 0
function kid(prefix) {
  return `${prefix}-${_keySeq++}`
}

function renderKatexHtml(tex, displayMode) {
  const t = String(tex).trim()
  if (!t) return null
  try {
    return katex.renderToString(t, {
      throwOnError: false,
      displayMode,
      strict: 'ignore',
    })
  } catch {
    return null
  }
}

/** Tách `$$ ... $$` (khối) trước, rồi từng đoạn văn bản tách `$ ... $` (inline). */
function splitMathSegments(text) {
  const out = []
  let i = 0
  const s = String(text)
  while (i < s.length) {
    const dd = s.indexOf('$$', i)
    if (dd === -1) {
      if (i < s.length) out.push({ type: 'text', value: s.slice(i) })
      break
    }
    if (dd > i) out.push({ type: 'text', value: s.slice(i, dd) })
    const endDd = s.indexOf('$$', dd + 2)
    if (endDd === -1) {
      out.push({ type: 'text', value: s.slice(dd) })
      break
    }
    out.push({ type: 'display', value: s.slice(dd + 2, endDd) })
    i = endDd + 2
  }

  const withInline = []
  for (const part of out) {
    if (part.type !== 'text') {
      withInline.push(part)
      continue
    }
    let j = 0
    const t = part.value
    while (j < t.length) {
      const a = t.indexOf('$', j)
      if (a === -1) {
        if (j < t.length) withInline.push({ type: 'text', value: t.slice(j) })
        break
      }
      if (a > j) withInline.push({ type: 'text', value: t.slice(j, a) })
      const b = t.indexOf('$', a + 1)
      if (b === -1) {
        withInline.push({ type: 'text', value: t.slice(a) })
        break
      }
      withInline.push({ type: 'inline', value: t.slice(a + 1, b) })
      j = b + 1
    }
  }
  return withInline
}

function MathInline({ tex }) {
  const html = renderKatexHtml(tex, false)
  if (!html) {
    return (
      <code className="px-1 py-0.5 rounded-md bg-slate-200/90 dark:bg-slate-600/90 font-mono text-[0.9em]">
        ${tex}$
      </code>
    )
  }
  return (
    <span
      className="inline-block align-middle mx-0.5 max-w-full overflow-x-auto [&_.katex]:text-[1em] [&_.katex]:text-current"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function MathDisplay({ tex }) {
  const html = renderKatexHtml(tex, true)
  if (!html) {
    return (
      <pre className="my-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-700/80 text-left text-sm overflow-x-auto font-mono whitespace-pre-wrap">
        {`$$${tex}$$`}
      </pre>
    )
  }
  return (
    <div
      className="my-2 overflow-x-auto text-center [&_.katex-display]:my-0 [&_.katex]:text-current"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

const FENCE = '```'

/** Dòng chỉ chứa fence đóng (có thể có khoảng trắng hai đầu). Trả về index bắt đầu dòng đó, hoặc -1. */
function findClosingFenceLineStart(text, from) {
  let pos = from
  while (pos < text.length) {
    const lineEnd = text.indexOf('\n', pos)
    const end = lineEnd === -1 ? text.length : lineEnd
    const line = text.slice(pos, end)
    if (line.trim() === FENCE) return pos
    if (lineEnd === -1) break
    pos = lineEnd + 1
  }
  return -1
}

/**
 * Tách khối ```lang\\n...\\n``` (CommonMark-style). Phải chạy trước khi tách $ để nội dung code không bị hiểu nhầm là công thức.
 */
function splitFencedCode(text) {
  const out = []
  let i = 0
  const s = String(text)
  while (i < s.length) {
    const start = s.indexOf(FENCE, i)
    if (start === -1) {
      if (i < s.length) out.push({ type: 'text', value: s.slice(i) })
      break
    }
    if (start > i) out.push({ type: 'text', value: s.slice(i, start) })
    const afterOpen = start + FENCE.length
    const firstNl = s.indexOf('\n', afterOpen)
    if (firstNl === -1) {
      out.push({ type: 'text', value: s.slice(start) })
      break
    }
    const lang = s.slice(afterOpen, firstNl).trim() || undefined
    const bodyStart = firstNl + 1
    const closeLineStart = findClosingFenceLineStart(s, bodyStart)
    if (closeLineStart === -1) {
      out.push({ type: 'text', value: s.slice(start) })
      break
    }
    let body = s.slice(bodyStart, closeLineStart)
    if (body.endsWith('\r\n')) body = body.slice(0, -2)
    else if (body.endsWith('\n')) body = body.slice(0, -1)
    out.push({ type: 'fenced', lang, content: body })
    const closeLineEnd = s.indexOf('\n', closeLineStart)
    i = closeLineEnd === -1 ? s.length : closeLineEnd + 1
  }
  return out
}

function CodeBlock({ lang, content }) {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50 dark:bg-[#0d1117] shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]" />
          <div className="w-3 h-3 rounded-full bg-amber-400/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]" />
          <div className="w-3 h-3 rounded-full bg-green-400/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]" />
        </div>
        {lang && (
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {lang}
          </span>
        )}
      </div>
      <pre className="p-4 overflow-x-auto text-left text-[13.5px] leading-relaxed text-slate-800 dark:text-slate-200 font-mono whitespace-pre">
        <code>{content}</code>
      </pre>
    </div>
  )
}

const CODE_RE = /(`[^`]+`)/g
const BOLD_RE = /(\*\*[\s\S]*?\*\*)/g
const STRIKE_RE = /(~~[\s\S]*?~~)/g
/** *word* — ít nhất một ký tự giữa hai dấu * */
const ITALIC_SPLIT = /(\*[^*\n]+?\*)/g
function splitSuggestions(text) {
  const out = []
  let i = 0
  const s = String(text)
  // Combine PDF, Web, and Quiz regex for splitting
  const SUGGEST_RE = /(\[\[(?:pdf|web|quiz):[^|]+\|[^\]]+\]\]|\[\[quiz-loading\]\])/g
  const parts = s.split(SUGGEST_RE)
  
  parts.forEach((part) => {
    if (!part) return
    const pdfMatch = /^\[\[pdf:([^|]+)\|([^\]]+)\]\]$/.exec(part)
    const webMatch = /^\[\[web:([^|]+)\|([^\]]+)\]\]$/.exec(part)
    const quizMatch = /^\[\[quiz:([^|]+)\|([^\]]+)\]\]$/.exec(part)
    const quizLoadingMatch = /^\[\[quiz-loading\]\]$/.exec(part)
    
    if (pdfMatch) {
      out.push({
        type: 'pdf-suggest',
        filename: pdfMatch[1],
        title: pdfMatch[2],
      })
    } else if (webMatch) {
      out.push({
        type: 'web-suggest',
        url: webMatch[1],
        title: webMatch[2],
      })
    } else if (quizMatch) {
      out.push({
        type: 'quiz-suggest',
        id: quizMatch[1],
        title: quizMatch[2],
      })
    } else if (quizLoadingMatch) {
      out.push({
        type: 'quiz-loading',
      })
    } else {
      out.push({ type: 'text', value: part })
    }
  })
  return out
}

function parseItalic(str, keyPrefix) {
  const parts = str.split(ITALIC_SPLIT)
  const out = []
  parts.forEach((part) => {
    if (/^\*([^*\n]+)\*$/.test(part) && !part.startsWith('**')) {
      out.push(
        <em key={kid(`${keyPrefix}i`)} className="italic">
          {part.slice(1, -1)}
        </em>
      )
    } else if (part) {
      out.push(part)
    }
  })
  return out
}

function parseStrike(str, keyPrefix) {
  const parts = str.split(STRIKE_RE)
  const out = []
  parts.forEach((part, i) => {
    if (/^~~([\s\S]*)~~$/.test(part)) {
      const inner = part.slice(2, -2)
      out.push(
        <del key={kid(`${keyPrefix}s`)} className="opacity-85">
          {parseItalic(inner, `${keyPrefix}si${i}`)}
        </del>
      )
    } else if (part) {
      out.push(...parseItalic(part, `${keyPrefix}z${i}`))
    }
  })
  return out
}

function parseBold(str, keyPrefix) {
  const parts = str.split(BOLD_RE)
  const out = []
  parts.forEach((part, i) => {
    if (/^\*\*([\s\S]*)\*\*$/.test(part)) {
      const inner = part.slice(2, -2)
      out.push(
        <strong key={kid(`${keyPrefix}b`)} className="font-semibold">
          {parseStrike(inner, `${keyPrefix}bi${i}`)}
        </strong>
      )
    } else if (part) {
      out.push(...parseStrike(part, `${keyPrefix}t${i}`))
    }
  })
  return out
}

function parseCodeAndRest(str, keyPrefix, codeClass) {
  const parts = str.split(CODE_RE)
  const out = []
  parts.forEach((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      out.push(
        <code key={kid(`${keyPrefix}c`)} className={codeClass}>
          {part.slice(1, -1)}
        </code>
      )
    } else if (part) {
      out.push(...parseBold(part, `${keyPrefix}p${i}`))
    }
  })
  return out
}

function parseBlocks(str, keyPrefix, codeClass) {
  // Tách dòng bằng newline nhưng giữ nguyên format
  const parts = str.split('\n')
  const out = []
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const headerMatch = /^(#{1,6})\s+(.+)$/.exec(part)
    const quoteMatch = /^>\s+(.+)$/.exec(part)
    const listMatch = /^([*\-]|\d+\.)\s+(.+)$/.exec(part)

    if (headerMatch) {
      const level = headerMatch[1].length
      const content = headerMatch[2]
      const Tag = `h${level}`
      let sizeClass = 'text-base font-semibold mt-3 mb-1'
      if (level === 1) sizeClass = 'text-2xl font-bold mt-5 mb-3 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2'
      else if (level === 2) sizeClass = 'text-xl font-bold mt-4 mb-2 text-slate-800 dark:text-slate-100'
      else if (level === 3) sizeClass = 'text-lg font-semibold mt-3 mb-2 text-slate-800 dark:text-slate-100'

      out.push(
        <Tag key={kid(`${keyPrefix}h`)} className={sizeClass}>
          {parseCodeAndRest(content, `${keyPrefix}hi${i}`, codeClass)}
        </Tag>
      )
    } else if (quoteMatch) {
      const content = quoteMatch[1]
      out.push(
        <blockquote key={kid(`${keyPrefix}bq`)} className="border-l-[3px] border-primary/40 bg-primary/5 pl-4 py-2 my-2 rounded-r-xl italic text-slate-700 dark:text-slate-300">
          {parseCodeAndRest(content, `${keyPrefix}bqi${i}`, codeClass)}
        </blockquote>
      )
    } else if (listMatch) {
      const marker = listMatch[1]
      const content = listMatch[2]
      const isOrdered = marker.includes('.')
      
      out.push(
        <div key={kid(`${keyPrefix}li`)} className="flex items-start gap-2.5 my-1.5 group">
          <span className={`flex-shrink-0 font-medium select-none ${isOrdered ? 'text-slate-500 dark:text-slate-400 mt-0.5 text-sm' : 'text-primary mt-1'}`}>
            {isOrdered ? marker : '•'}
          </span>
          <span className="flex-1 leading-relaxed">
            {parseCodeAndRest(content, `${keyPrefix}lii${i}`, codeClass)}
          </span>
        </div>
      )
    } else if (part.trim() === '') {
      // Empty line adds some vertical rhythm if we want, or just a br
      out.push(<br key={kid(`${keyPrefix}br${i}`)} />)
    } else {
      out.push(
        <div key={kid(`${keyPrefix}div${i}`)} className="my-1.5">
          {parseCodeAndRest(part, `${keyPrefix}p${i}`, codeClass)}
        </div>
      )
    }
  }
  return out
}

/**
 * Định dạng nhẹ cho phản hồi agent: **đậm**, *nghiêng*, `code`, ~~gạch~~, Header
 * Khối code: ```lang\n...\n```
 * Công thức: `$...$` (inline), `$$...$$` (khối) — KaTeX/LaTeX.
 * Thứ tự: ``` fence ``` → tách công thức → tách gợi ý (PDF/Web) → trong mỗi đoạn văn: Header → `code` → **bold** → ~~strike** → *italic*
 */
export function formatAgentChatMarkdown(text) {
  if (text == null || text === '') return []
  
  // Clean up bullet lines that only contain suggestions to prevent empty bullets in UI
  const BULLET_WITH_SUGGESTION_RE = /^[ \t]*([*\-+]|\d+\.)[ \t]*(?:.*?:)?[ \t]*(\[\[(?:pdf|web|quiz):[^|]+\|[^\]]+\]\])[ \t]*(?:\r?\n|$)/gm
  text = text.replace(BULLET_WITH_SUGGESTION_RE, '$2\n')

  _keySeq = 0
  const codeClass =
    'px-1 py-0.5 rounded-md bg-slate-200/90 dark:bg-slate-600/90 font-mono text-[0.9em]'
  const chunks = splitFencedCode(text)
  const out = []
  for (const chunk of chunks) {
    if (chunk.type === 'fenced') {
      out.push(<CodeBlock key={kid('cb')} lang={chunk.lang} content={chunk.content} />)
      continue
    }
    const mathSegments = splitMathSegments(chunk.value)
    for (const mSeg of mathSegments) {
      if (mSeg.type === 'inline') {
        out.push(<MathInline key={kid('k')} tex={mSeg.value} />)
      } else if (mSeg.type === 'display') {
        out.push(<MathDisplay key={kid('kd')} tex={mSeg.value} />)
      } else {
        // text segment -> split by suggestions
        const suggestSegments = splitSuggestions(mSeg.value)
        for (const sSeg of suggestSegments) {
          if (sSeg.type === 'pdf-suggest') {
            out.push({ ...sSeg, key: kid('pdf') })
          } else if (sSeg.type === 'web-suggest') {
            out.push({ ...sSeg, key: kid('web') })
          } else if (sSeg.type === 'quiz-suggest') {
            out.push({ ...sSeg, key: kid('quiz') })
          } else if (sSeg.type === 'quiz-loading') {
            out.push({ ...sSeg, key: kid('quizload') })
          } else {
            // text segment -> parse formatting
            out.push(...parseBlocks(sSeg.value, 'md', codeClass))
          }
        }
      }
    }
  }
  return out
}
