import { Bot, User, FileText, Download, ExternalLink, Brain, Sparkles, Loader2 } from 'lucide-react'
import { formatAgentChatMarkdown } from '../../lib/chatMarkdown'
import { API_BASE } from '../../config/api'
import { useLanguage } from '../../context/LanguageContext'

/**
 * @param {'learner' | 'supporter'} perspective — learner: tin user bên phải; supporter: tin học viên (user) bên trái, tin supporter (assistant) bên phải.
 */
export default function MessageItem({
  message,
  agentLabel,
  perspective = 'learner',
  conversationId = null,
  apiToken = null,
  onPdfClick = null,
  onQuizClick = null,
}) {
  const { t, lang } = useLanguage()
  const fromLearner = message.role === 'user'
  const alignEnd = perspective === 'learner' ? fromLearner : !fromLearner
  const showAgentLabel = agentLabel && perspective === 'learner' && !fromLearner
  const useBotAvatar = perspective === 'learner' && !fromLearner
  const canDownloadRemote =
    Boolean(conversationId && apiToken && message.id && message.fileStorageKey)

  const handleDownload = async () => {
    if (!canDownloadRemote) return
    try {
      const r = await fetch(
        `${API_BASE}/api/messages/${encodeURIComponent(conversationId)}/files/${encodeURIComponent(message.id)}`,
        { headers: { Authorization: `Bearer ${apiToken}` } }
      )
      if (!r.ok) throw new Error(String(r.status))
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = message.fileName || 'attachment'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.alert(t('chat.downloadAttachmentFailed'))
    }
  }

  if (message.role === 'system') {
    return (
      <div className="flex justify-center">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-lg px-2 italic">
          {message.content}
        </p>
      </div>
    )
  }

  if (message.isThinking && message.role === 'assistant') {
    return (
      <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col items-center gap-1">
          {showAgentLabel && (
            <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-400 dark:text-slate-500">{agentLabel}</span>
          )}
          <div className="flex-shrink-0 w-10 h-10 rounded-[14px] bg-gradient-to-tr from-primary to-primary/70 flex items-center justify-center shadow-[0_0_20px_rgba(var(--color-primary),0.3)] animate-pulse">
            <Bot className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="max-w-[75%] rounded-[1.25rem] px-5 py-3.5 shadow-sm bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60 rounded-tl-sm ring-1 ring-black/5 dark:ring-white/5">
          <p className="text-[15px] leading-relaxed flex items-center gap-3">
            <span className="flex items-center gap-1" aria-hidden>
              <span className="w-2.5 h-2.5 rounded-full bg-primary/80 animate-bounce [animation-duration:800ms]" />
              <span className="w-2.5 h-2.5 rounded-full bg-primary/80 animate-bounce [animation-duration:800ms] [animation-delay:150ms]" />
              <span className="w-2.5 h-2.5 rounded-full bg-primary/80 animate-bounce [animation-duration:800ms] [animation-delay:300ms]" />
            </span>
            <span className="italic font-medium text-slate-500/80 dark:text-slate-400/80 tracking-wide">{t('chat.thinking')}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${alignEnd ? 'flex-row-reverse' : ''}`}>
      <div className="flex flex-col items-center gap-1">
        {showAgentLabel && (
          <span className="text-[11px] font-semibold tracking-wide uppercase text-slate-400 dark:text-slate-500">{agentLabel}</span>
        )}
        <div className={`flex-shrink-0 w-10 h-10 rounded-[14px] flex items-center justify-center shadow-md ${useBotAvatar ? 'bg-gradient-to-tr from-primary to-indigo-500 shadow-primary/30' : 'bg-gradient-to-tr from-slate-700 to-slate-900 shadow-slate-900/20 dark:from-slate-600 dark:to-slate-800'}`}>
          {useBotAvatar ? (
            <Bot className="w-5 h-5 text-white" />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>
      </div>

      <div
        className={`max-w-[75%] rounded-[1.5rem] px-5 py-3.5 ${
          alignEnd
            ? 'bg-gradient-to-br from-primary to-indigo-500 text-white rounded-tr-sm shadow-[0_8px_30px_-6px_rgba(var(--color-primary),0.3)] hover:shadow-[0_12px_40px_-6px_rgba(var(--color-primary),0.4)] transition-shadow duration-300'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700/60 rounded-tl-sm shadow-sm hover:shadow-md transition-shadow duration-300 ring-1 ring-black/5 dark:ring-white/5'
        }`}
      >
        {(message.content || message.fileName) &&
          (message.content ? (
            message.role === 'assistant' ? (
              <div className="flex flex-col">
                {(() => {
                  const nodes = formatAgentChatMarkdown(message.content);
                  const citations = nodes.filter(
                    (n) => n && typeof n === 'object' && (n.type === 'pdf-suggest' || n.type === 'web-suggest')
                  );
                  const quizzes = nodes.filter(
                    (n) => n && typeof n === 'object' && (n.type === 'quiz-suggest' || n.type === 'quiz-loading')
                  );
                  const contentNodes = nodes.filter(
                    (n) => !(n && typeof n === 'object' && (n.type === 'pdf-suggest' || n.type === 'web-suggest' || n.type === 'quiz-suggest' || n.type === 'quiz-loading'))
                  );

                  return (
                    <>
                      {citations.length > 0 && (
                        <div className="mb-3 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{t('chat.referenceMaterials')}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {citations.map((node, i) => {
                              if (node.type === 'pdf-suggest') {
                                return (
                                  <button
                                    key={node.key || i}
                                    type="button"
                                    onClick={() => onPdfClick?.(node.filename, node.title)}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all shadow-sm group text-left"
                                  >
                                    <FileText className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors flex-shrink-0" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors line-clamp-1 max-w-[200px]">
                                      {node.title}
                                    </span>
                                  </button>
                                )
                              }
                              if (node.type === 'web-suggest') {
                                return (
                                  <a
                                    key={node.key || i}
                                    href={node.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-600 transition-all shadow-sm group text-left no-underline"
                                  >
                                    <ExternalLink className="w-4 h-4 text-emerald-500/60 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 transition-colors line-clamp-1 max-w-[200px]">
                                      {node.title}
                                    </span>
                                  </a>
                                )
                              }
                              return null
                            })}
                          </div>
                        </div>
                      )}
                      <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {contentNodes}
                      </div>
                      
                      {quizzes.length > 0 && (
                        <div className="mt-4 flex flex-col gap-3">
                          {quizzes.map((node, i) => {
                            if (node.type === 'quiz-loading') {
                              return (
                                <div key={node.key || i} className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 shadow-sm animate-pulse">
                                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-spin" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{t('quiz.loadingTitle')}</p>
                                    <p className="text-[13px] text-amber-600/80 dark:text-amber-400/80">{t('quiz.loadingSubtitle')}</p>
                                  </div>
                                </div>
                              )
                            }
                            if (node.type === 'quiz-suggest') {
                              return (
                                <button
                                  key={node.key || i}
                                  type="button"
                                  onClick={() => onQuizClick?.(node.id, node.title)}
                                  className="w-full relative overflow-hidden group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] hover:shadow-[0_12px_30px_-6px_rgba(79,70,229,0.6)] transition-all hover:-translate-y-0.5 active:scale-[0.98] border border-white/10 text-left"
                                >
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors transform translate-x-10 -translate-y-10" />
                                  <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                                      <Brain className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">{t('quiz.badge')}</span>
                                      </div>
                                      <h4 className="text-base font-bold text-white tracking-wide">{node.title}</h4>
                                      <p className="text-[13px] text-indigo-100 mt-0.5">{t('quiz.suggestSubtitle')}</p>
                                    </div>
                                  </div>
                                  <div className="relative z-10 px-4 py-2 rounded-xl bg-white text-indigo-600 font-bold text-sm shadow-md group-hover:bg-indigo-50 transition-colors">
                                    {t('quiz.cta')}
                                  </div>
                                </button>
                              )
                            }
                            return null
                          })}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )
          ) : (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {message.fileName ? t('chat.attachedFileOnly') : ''}
            </p>
          ))}
        {message.fileName && (
          <div
            className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-xl ${
              alignEnd ? 'bg-white/20' : 'bg-primary/10'
            }`}
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm truncate flex-1 min-w-0">{message.fileName}</span>
            {canDownloadRemote && (
              <button
                type="button"
                onClick={handleDownload}
                className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                  alignEnd
                    ? 'hover:bg-white/20 text-white'
                    : 'hover:bg-primary/20 text-primary dark:text-primary'
                }`}
                title={t('chat.downloadAttachment')}
                aria-label={t('chat.downloadAttachment')}
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        {message.timestamp && (
          <p
            className={`text-xs mt-1.5 ${
              alignEnd ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {new Date(message.timestamp).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
        
        {message.role === 'assistant' && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onQuizClick?.('gen-1', t('quiz.create'), message.content)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-colors active:scale-95"
            >
              <Brain className="w-3.5 h-3.5" />
              {t('quiz.create')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
