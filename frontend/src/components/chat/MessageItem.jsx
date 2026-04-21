import { Bot, User, FileText, Download } from 'lucide-react'
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
}) {
  const { t } = useLanguage()
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
      <div className="flex gap-3.5">
        <div className="flex flex-col items-center gap-1">
          {showAgentLabel && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{agentLabel}</span>
          )}
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow-primary">
            <Bot className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="max-w-[75%] rounded-2xl px-4 py-3 shadow-soft bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 rounded-tl-md">
          <p className="text-[15px] leading-relaxed flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5" aria-hidden>
              <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce [animation-duration:900ms]" />
              <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce [animation-duration:900ms] [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce [animation-duration:900ms] [animation-delay:300ms]" />
            </span>
            <span className="italic text-slate-500 dark:text-slate-400">{t('chat.thinking')}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex gap-3.5 ${alignEnd ? 'flex-row-reverse' : ''}`}>
      <div className="flex flex-col items-center gap-1">
        {showAgentLabel && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{agentLabel}</span>
        )}
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow-primary">
          {useBotAvatar ? (
            <Bot className="w-4 h-4 text-white" />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
      </div>

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-soft ${
          alignEnd
            ? 'bg-primary text-white rounded-tr-md'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-md'
        }`}
      >
        {(message.content || message.fileName) &&
          (message.content ? (
            message.role === 'assistant' ? (
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {formatAgentChatMarkdown(message.content).map((node, i) => {
                  if (node && typeof node === 'object' && node.type === 'pdf-suggest') {
                    return (
                      <button
                        key={node.key || i}
                        type="button"
                        onClick={() => onPdfClick?.(node.filename, node.title)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 my-1 mx-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors text-sm font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        {node.title}
                      </button>
                    )
                  }
                  return node
                })}
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
            {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  )
}
