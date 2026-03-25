import { useState, useRef } from 'react'
import { Send, Paperclip } from 'lucide-react'

export default function ChatInput({ onSend, disabled, placeholder = 'Nhập tin nhắn...' }) {
  const [message, setMessage] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const fileInputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = message.trim()
    if ((!trimmed && !attachedFile) || disabled) return

    onSend(trimmed, attachedFile)
    setMessage('')
    setAttachedFile(null)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) setAttachedFile(file)
    e.target.value = ''
  }

  const removeFile = () => setAttachedFile(null)

  return (
    <div className="p-6 pb-8">
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-soft hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50"
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
              aria-label="Xóa file"
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
            aria-label="Đính kèm file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 px-4 py-2.5 rounded-xl border-0 bg-transparent focus:ring-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed text-[15px] placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={(!message.trim() && !attachedFile) || disabled}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-primary active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
