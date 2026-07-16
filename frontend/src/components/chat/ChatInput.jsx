import { useState, useRef } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export default function ChatInput({ onSend, disabled, placeholder }) {
  const { t } = useLanguage()
  const [message, setMessage] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = message.trim()
    if ((!trimmed && !attachedFile) || disabled) return

    onSend(trimmed, attachedFile)
    setMessage('')
    setAttachedFile(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) setAttachedFile(file)
    e.target.value = ''
  }

  const removeFile = () => setAttachedFile(null)

  return (
    <div className="p-4 pb-6 md:p-6 md:pb-8 bg-gradient-to-t from-slate-50/80 via-slate-50/50 to-transparent dark:from-slate-900/80 dark:via-slate-900/50">
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto rounded-[2rem] border border-white/40 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 ring-1 ring-black/5 dark:ring-white/10 focus-within:ring-primary/40 focus-within:bg-white/95 dark:focus-within:bg-slate-800/95 focus-within:shadow-[0_8px_40px_rgba(0,0,0,0.1)]"
      >
        {attachedFile && (
          <div className="px-5 pt-4 flex items-center gap-2">
            <div className="flex-1 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
              <span className="text-sm text-primary font-medium truncate block">
                {attachedFile.name}
              </span>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label={t('chat.removeFile')}
            >
              ×
            </button>
          </div>
        )}
        <div className="flex gap-2 items-center p-3">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-shrink-0 w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-primary hover:bg-primary/5 text-slate-500 dark:text-slate-400 hover:text-primary flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('chat.attachFile')}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-xl border-0 bg-transparent focus:ring-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed text-[15px] placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-white resize-none min-h-[44px] max-h-[200px] overflow-y-auto"
            style={{ height: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
          />
          <button
            type="submit"
            disabled={(!message.trim() && !attachedFile) || disabled}
            className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(var(--color-primary),0.3)] hover:shadow-[0_6px_20px_rgba(var(--color-primary),0.4)] active:scale-90"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
