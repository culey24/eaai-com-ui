import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users, Search, Clock, UserCheck, BellRing } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'

export default function AdminIs2MonitorPage() {
  const { t } = useLanguage()
  const { apiToken } = useAuth()
  const [learners, setLearners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const tid = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tid)
  }, [])

  useEffect(() => {
    if (!apiToken) return
    let cancelled = false
    setLoading(true)
    fetch(`${API_BASE}/api/admin/monitor/is2`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`)
        return data
      })
      .then((data) => {
        if (!cancelled) {
          setLearners(data.learners || [])
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiToken])

  const filtered = learners.filter((l) => {
    const q = search.toLowerCase().trim()
    return (
      !q ||
      l.username.toLowerCase().includes(q) ||
      l.fullname.toLowerCase().includes(q) ||
      l.supporterName.toLowerCase().includes(q)
    )
  })

  const formatTime = (dateStr) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    })
  }

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '—'
    const diff = Math.floor((now - new Date(dateStr)) / 1000)
    if (diff < 10) return 'Vừa xong'
    if (diff < 60) return `${diff} giây trước`
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
    return formatTime(dateStr)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
        <Link
          to="/admin"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Giám sát học viên IS-2
          {!loading && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
              {filtered.length}
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono text-sm">
          <Clock className="w-4 h-4" />
          {now.toLocaleTimeString('vi-VN')}
        </div>
        <div className="flex-1 max-w-xs relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm học viên hoặc supporter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-[15px]">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Học viên</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Lần cuối tương tác</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Supporter phụ trách</th>
                  <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Không có học viên nào khớp với tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800 dark:text-white">{l.fullname}</div>
                        <div className="text-xs text-slate-500">@{l.username}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 opacity-50" />
                          <span className="font-medium text-slate-700 dark:text-slate-200">
                            {getTimeAgo(l.lastMessageAt)}
                          </span>
                          <span className="text-xs opacity-50">({formatTime(l.lastMessageAt)})</span>
                        </div>
                        {l.lastSenderRole && (
                          <div className={`text-[10px] uppercase font-bold mt-1 ${l.lastSenderRole === 'user' ? 'text-primary' : 'text-emerald-500'}`}>
                            {l.lastSenderRole === 'user' ? 'Học viên gửi' : 'Bot/Supporter phản hồi'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 opacity-50 text-emerald-500" />
                          {l.supporterName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to="/admin/chats"
                          state={{ selectedUsername: l.username }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-all"
                        >
                          <BellRing className="w-3.5 h-3.5" />
                          Nhắc hỗ trợ
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
