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
    <pre
      className="my-2 max-w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-left text-[13px] leading-relaxed text-slate-800 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 overflow-x-auto font-mono whitespace-pre"
    >
      {lang ? (
        <span className="mb-2 block font-sans text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {lang}
        </span>
      ) : null}
      <code>{content}</code>
    </pre>
  )
}

const CODE_RE = /(`[^`]+`)/g
const BOLD_RE = /(\*\*[\s\S]*?\*\*)/g
const STRIKE_RE = /(~~[\s\S]*?~~)/g
/** *word* — ít nhất một ký tự giữa hai dấu * */
const ITALIC_SPLIT = /(\*[^*\n]+?\*)/g

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

/**
 * Định dạng nhẹ cho phản hồi agent: **đậm**, *nghiêng*, `code`, ~~gạch~~
 * Khối code: ```lang\\n...\\n```
 * Công thức: `$...$` (inline), `$$...$$` (khối) — KaTeX/LaTeX.
 * Thứ tự: ``` fence ``` → tách công thức → trong mỗi đoạn văn: `code` → **bold** → ~~strike~~ → *italic*
 */
export function formatAgentChatMarkdown(text) {
  if (text == null || text === '') return []
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
    const segments = splitMathSegments(chunk.value)
    for (const seg of segments) {
      if (seg.type === 'text') {
        out.push(...parseCodeAndRest(seg.value, 'md', codeClass))
      } else if (seg.type === 'inline') {
        out.push(<MathInline key={kid('k')} tex={seg.value} />)
      } else {
        out.push(<MathDisplay key={kid('kd')} tex={seg.value} />)
      }
    }
  }
  return out
}
