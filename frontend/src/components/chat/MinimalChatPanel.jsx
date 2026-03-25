import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { API_BASE } from '../../config/api'

const SENDER_STORAGE_KEY = 'eeai_minimal_chat_sender'

/**
 * Chat tối giản: polling GET /api/messages + POST /api/messages { senderName, content }
 */
export default function MinimalChatPanel() {
  const [messages, setMessages] = useState([])
  const [senderName, setSenderName] = useState(() => {
    try {
      return localStorage.getItem(SENDER_STORAGE_KEY) || ''
    } catch {
      return ''
    }
  })
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const fetchMessages = useCallback(async () => {
    try {
      setError('')
      const res = await fetch(`${API_BASE}/api/messages`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || data.message || `Lỗi ${res.status}`)
      }
      setMessages(Array.isArray(data.messages) ? data.messages : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được tin nhắn')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchMessages()
    const id = setInterval(fetchMessages, 5000)
    return () => clearInterval(id)
  }, [fetchMessages])

  const handleSend = async (e) => {
    e.preventDefault()
    const name = senderName.trim()
    const text = content.trim()
    if (!name || !text) return
    setSending(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderName: name, content: text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || data.message || `Lỗi ${res.status}`)
      }
      try {
        localStorage.setItem(SENDER_STORAGE_KEY, name)
      } catch {
        /* ignore */
      }
      setContent('')
      await fetchMessages()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gửi thất bại')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 px-4 py-3 md:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-200">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">Chat cộng đồng (tối giản)</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
            làm mới mỗi 5 giây
          </span>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-2" role="alert">
            {error}
          </p>
        )}

        <div className="max-h-40 overflow-y-auto space-y-2 mb-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 p-3">
          {loading && messages.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang tải…
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có tin nhắn.</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className="text-sm border-b border-slate-100 dark:border-slate-800 last:border-0 pb-2 last:pb-0"
              >
                <span className="font-medium text-primary">{m.senderName}</span>
                <span className="text-slate-400 dark:text-slate-500 text-xs ml-2">
                  {m.createdAt
                    ? new Date(m.createdAt).toLocaleString()
                    : ''}
                </span>
                <p className="text-slate-700 dark:text-slate-200 mt-0.5 whitespace-pre-wrap break-words">
                  {m.content}
                </p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSend} className="flex flex-wrap gap-2 items-end">
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Tên hiển thị"
            maxLength={100}
            className="flex-1 min-w-[120px] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nội dung tin nhắn"
            maxLength={4000}
            className="flex-[2] min-w-[160px] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={sending || !senderName.trim() || !content.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Gửi
          </button>
        </form>
      </div>
    </section>
  )
}
