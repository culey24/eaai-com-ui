import { Bot, User, FileText } from 'lucide-react'

export default function MessageItem({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow-primary">
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-soft ${
          isUser
            ? 'bg-primary text-white rounded-tr-md'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-md'
        }`}
      >
        {(message.content || message.fileName) && (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {message.content || (message.fileName ? 'Đã đính kèm file' : '')}
          </p>
        )}
        {message.fileName && (
          <div className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-xl ${
            isUser ? 'bg-white/20' : 'bg-primary/10'
          }`}>
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm truncate">{message.fileName}</span>
          </div>
        )}
        {message.timestamp && (
          <p
            className={`text-xs mt-1.5 ${
              isUser ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
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
