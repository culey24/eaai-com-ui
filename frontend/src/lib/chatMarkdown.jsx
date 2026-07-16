import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

/**
 * Định dạng nhẹ cho phản hồi agent: **đậm**, *nghiêng*, `code`, ~~gạch~~, Header
 * Khối code: ```lang\n...\n```
 * Công thức: `$...$` (inline), `$$...$$` (khối) — KaTeX/LaTeX.
 */
export function formatAgentChatMarkdown(text) {
  if (text == null || text === '') return []
  
  // Clean up bullet lines that only contain suggestions to prevent empty bullets in UI
  const BULLET_WITH_SUGGESTION_RE = /^[ \t]*([*\-+]|\d+\.)[ \t]*(?:.*?:)?[ \t]*(\[\[(?:pdf|web|quiz):[^|]+\|[^\]]+\]\])[ \t]*(?:\r?\n|$)/gm
  let cleanedText = text.replace(BULLET_WITH_SUGGESTION_RE, '$2\n')

  const out = []
  
  // Combine PDF, Web, and Quiz regex for splitting
  const SUGGEST_RE = /(\[\[(?:pdf|web|quiz):[^|]+\|[^\]]+\]\]|\[\[quiz-loading\]\])/g
  const parts = cleanedText.split(SUGGEST_RE)
  
  let finalMarkdownText = ''
  
  let _keySeq = 0;
  function kid(prefix) {
    return `${prefix}-${_keySeq++}`
  }

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
        key: kid('pdf')
      })
    } else if (webMatch) {
      out.push({
        type: 'web-suggest',
        url: webMatch[1],
        title: webMatch[2],
        key: kid('web')
      })
    } else if (quizMatch) {
      out.push({
        type: 'quiz-suggest',
        id: quizMatch[1],
        title: quizMatch[2],
        key: kid('quiz')
      })
    } else if (quizLoadingMatch) {
      out.push({
        type: 'quiz-loading',
        key: kid('quizload')
      })
    } else {
      finalMarkdownText += part
    }
  })

  // Push the actual ReactMarkdown component
  if (finalMarkdownText.trim()) {
    out.push(
      <div key={kid('md')} className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            if (!inline && match) {
              return (
                <div className="my-4 overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50 dark:bg-[#0d1117] shadow-sm">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/40 border-b border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]" />
                      <div className="w-3 h-3 rounded-full bg-amber-400/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]" />
                      <div className="w-3 h-3 rounded-full bg-green-400/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]" />
                    </div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      {match[1]}
                    </span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-left text-[13.5px] leading-relaxed text-slate-800 dark:text-slate-200 font-mono whitespace-pre">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              )
            } else if (!inline) {
               return (
                <div className="my-4 overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50 dark:bg-[#0d1117] shadow-sm">
                  <pre className="p-4 overflow-x-auto text-left text-[13.5px] leading-relaxed text-slate-800 dark:text-slate-200 font-mono whitespace-pre">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              )
            }
            return (
              <code className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-200/90 dark:bg-slate-700/90 font-mono text-[0.9em] text-slate-800 dark:text-slate-200" {...props}>
                {children}
              </code>
            )
          },
          table({children}) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                  {children}
                </table>
              </div>
            )
          },
          thead({children}) {
            return <thead className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">{children}</thead>
          },
          th({children}) {
            return <th className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{children}</th>
          },
          td({children}) {
            return <td className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{children}</td>
          },
          a({children, href}) {
            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-colors">{children}</a>
          },
          ul({children}) {
            return <ul className="list-disc list-outside ml-5 my-3 space-y-1.5 text-slate-700 dark:text-slate-300 marker:text-primary">{children}</ul>
          },
          ol({children}) {
            return <ol className="list-decimal list-outside ml-5 my-3 space-y-1.5 text-slate-700 dark:text-slate-300 marker:text-primary">{children}</ol>
          },
          li({children}) {
            return <li className="leading-relaxed pl-1">{children}</li>
          },
          h1({children}) {
            return <h1 className="text-2xl font-bold mt-6 mb-4 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">{children}</h1>
          },
          h2({children}) {
            return <h2 className="text-xl font-bold mt-5 mb-3 text-slate-800 dark:text-slate-100">{children}</h2>
          },
          h3({children}) {
            return <h3 className="text-lg font-semibold mt-4 mb-2 text-slate-800 dark:text-slate-100">{children}</h3>
          },
          h4({children}) {
            return <h4 className="text-base font-semibold mt-4 mb-2 text-slate-800 dark:text-slate-100">{children}</h4>
          },
          blockquote({children}) {
            return <blockquote className="border-l-[4px] border-primary/50 bg-primary/5 pl-4 pr-2 py-3 my-4 rounded-r-xl italic text-slate-700 dark:text-slate-300">{children}</blockquote>
          },
          p({children}) {
            return <div className="my-2.5 leading-relaxed">{children}</div>
          },
          strong({children}) {
             return <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
          },
          del({children}) {
             return <del className="opacity-70">{children}</del>
          },
        }}
      >
        {finalMarkdownText}
        </ReactMarkdown>
      </div>
    )
  }

  return out
}
