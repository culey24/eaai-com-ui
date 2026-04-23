import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Brain, Play, Loader2, CheckCircle2, AlertCircle, Users, Calendar } from 'lucide-react'
import { useJournal } from '../../context/JournalContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import { ROLES } from '../../constants/roles'

const CLASSES = ['IS-1', 'IS-2', 'IS-3']

export default function AdminJournalEvaluationPage() {
  const { t } = useLanguage()
  const { getSubmissions } = useJournal()
  const { apiToken, user } = useAuth()
  
  const submissions = getSubmissions()
  
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [selectedClasses, setSelectedClasses] = useState(['IS-1', 'IS-2'])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)

  // Fetch current status on mount
  useEffect(() => {
    if (apiToken && user?.role === ROLES.ADMIN) {
      fetchStatus()
    }
  }, [apiToken, user?.role])

  // Poll status if running
  useEffect(() => {
    let timer
    if (polling) {
      timer = setInterval(fetchStatus, 2000)
    }
    return () => clearInterval(timer)
  }, [polling])

  const fetchStatus = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/journal-evaluate/status`, {
        headers: { Authorization: `Bearer ${apiToken}` }
      })
      if (r.ok) {
        const data = await r.json()
        setStatus(data)
        setPolling(data.isRunning)
      }
    } catch (e) {
      console.error('Failed to fetch status', e)
    }
  }

  const handleStart = async () => {
    if (!selectedPeriodId) {
      window.alert('Vui lòng chọn đợt nộp bài')
      return
    }
    if (selectedClasses.length === 0) {
      window.alert('Vui lòng chọn ít nhất một lớp')
      return
    }

    setLoading(true)
    try {
      const r = await fetch(`${API_BASE}/api/admin/journal-evaluate/batch-broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`
        },
        body: JSON.stringify({
          periodId: selectedPeriodId,
          classCodes: selectedClasses
        })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Lỗi không xác định')
      
      setPolling(true)
      fetchStatus()
    } catch (e) {
      window.alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleClass = (cls) => {
    setSelectedClasses(prev => 
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    )
  }

  const progress = status?.total > 0 ? Math.round((status.processed / status.total) * 100) : 0

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      {/* Header */}
      <div className="flex-shrink-0 px-8 py-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 max-w-5xl mx-auto">
          <Link
            to="/admin"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white text-2xl flex items-center gap-3">
              <Brain className="w-8 h-8 text-indigo-500" />
              Đánh giá Journal hàng loạt
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Phân tích và gửi nhận xét AI tự động cho toàn bộ sinh viên
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Configuration Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Cấu hình đánh giá
              </h2>
              
              <div className="space-y-6">
                {/* Period Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Chọn đợt nộp bài
                  </label>
                  <select
                    value={selectedPeriodId}
                    onChange={(e) => setSelectedPeriodId(e.target.value)}
                    disabled={status?.isRunning}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">-- Chọn đợt nộp --</option>
                    {submissions.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>

                {/* Class Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Chọn lớp áp dụng
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {CLASSES.map(cls => (
                      <button
                        key={cls}
                        type="button"
                        disabled={status?.isRunning}
                        onClick={() => toggleClass(cls)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                          selectedClasses.includes(cls)
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                        } disabled:opacity-50`}
                      >
                        <span className="font-medium">{cls}</span>
                        {selectedClasses.includes(cls) && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleStart}
                  disabled={loading || status?.isRunning || !selectedPeriodId}
                  className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-3 mt-4"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                  {status?.isRunning ? 'Đang xử lý...' : 'Bắt đầu đánh giá & Gửi'}
                </button>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
              <div className="flex gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Hệ thống sẽ chỉ đánh giá những sinh viên **đã có bản nộp** trong đợt đã chọn. 
                  Nhận xét sẽ được gửi ngay lập tức vào khung chat của mỗi sinh viên.
                </p>
              </div>
            </div>
          </div>

          {/* Progress & Results Card */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 h-full">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Tiến độ thực hiện
              </h2>

              {status ? (
                <div className="space-y-12">
                  {/* Progress Bar */}
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-slate-600 dark:text-slate-400">
                        {status.isRunning ? 'Đang xử lý dữ liệu...' : 'Hoàn thành'}
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">{progress}%</span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox label="Tổng số" value={status.total} color="slate" />
                    <StatBox label="Đã đánh giá" value={status.evaluated} color="indigo" />
                    <StatBox label="Bỏ qua (Chưa nộp)" value={status.skipped} color="amber" />
                    <StatBox label="Lỗi" value={status.failed} color="red" />
                  </div>

                  {/* Error Log */}
                  {status.errors?.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">Lỗi chi tiết:</h3>
                      <div className="max-h-48 overflow-y-auto border border-red-100 dark:border-red-900/30 rounded-xl bg-red-50/30 dark:bg-red-900/10 p-4 space-y-2">
                        {status.errors.map((err, i) => (
                          <div key={i} className="text-xs text-red-700 dark:text-red-300">
                            <span className="font-bold">[{err.userId}]:</span> {err.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!status.isRunning && status.processed > 0 && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Đã hoàn thành đợt đánh giá cho {status.lastPeriodId}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Brain className="w-16 h-16 mb-4 opacity-20" />
                  <p>Chọn cấu hình và nhấn Bắt đầu để xem tiến độ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }) {
  const colors = {
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/30'
  }
  
  return (
    <div className={`p-4 rounded-2xl flex flex-col items-center justify-center ${colors[color]}`}>
      <span className="text-xs font-medium uppercase tracking-wider mb-1 opacity-70">{label}</span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  )
}
