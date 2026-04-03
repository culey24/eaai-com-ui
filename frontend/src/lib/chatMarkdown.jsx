let _keySeq = 0
function kid(prefix) {
  return `${prefix}-${_keySeq++}`
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
 * Thứ tự: `code` → **bold** → ~~strike~~ → *italic*
 */
export function formatAgentChatMarkdown(text) {
  if (text == null || text === '') return []
  _keySeq = 0
  const codeClass =
    'px-1 py-0.5 rounded-md bg-slate-200/90 dark:bg-slate-600/90 font-mono text-[0.9em]'
  return parseCodeAndRest(String(text), 'md', codeClass)
}
