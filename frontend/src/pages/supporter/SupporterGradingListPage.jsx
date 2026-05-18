import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserCheck, CheckCircle2, Clock, Users, ArrowRight, RefreshCw, Filter, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import { ROLES } from '../../constants/roles'

export default function SupporterGradingListPage() {
  const { apiToken, user } = useAuth()
  const navigate = useNavigate()
  const [learners, setLearners] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('my') // 'my' | 'all'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'graded' | 'ungraded'
  const isAdmin = user?.role === ROLES.ADMIN

  const fetchLearners = () => {
    if (!apiToken) return
    setLoading(true)
    fetch(`${API_BASE}/api/grading/learners`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.learners) {
          setLearners(data.learners)
        }
      })
      .catch((err) => console.error('[Fetch learners err]', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLearners()
  }, [apiToken])

  // Lọc học viên
  const filteredLearners = useMemo(() => {
    return learners.filter((st) => {
      // Tab filter
      if (tab === 'my' && !st.isMyAssigned) return false

      // Status filter
      if (statusFilter === 'graded' && !st.isGraded) return false
      if (statusFilter === 'ungraded' && st.isGraded) return false

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = (st.fullname || '').toLowerCase().includes(q)
        const matchUser = (st.username || '').toLowerCase().includes(q)
        const matchSchoolId = (st.studentSchoolId || '').toLowerCase().includes(q)
        if (!matchName && !matchUser && !matchSchoolId) return false
      }

      return true
    })
  }, [learners, tab, statusFilter, search])

  // Thống kê tiến độ cho Tab hiện tại
  const stats = useMemo(() => {
    const list = tab === 'my' ? learners.filter((l) => l.isMyAssigned) : learners
    const total = list.length
    const graded = list.filter((l) => l.isGraded).length
    const percent = total > 0 ? Math.round((graded / total) * 100) : 0
    return { total, graded, percent }
  }, [learners, tab])

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto p-6 md:p-8">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-primary/10 dark:bg-primary/20 text-primary rounded-2xl shadow-inner">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                Chấm bài Học viên
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold rounded-full border border-amber-200 dark:border-amber-800">
                    <Shield className="w-3 h-3" /> Quyền Admin
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Theo dõi tiến độ, xem hồ sơ bài nộp và đánh giá chất lượng học viên.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLearners}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin/grading-config')}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all"
              >
                <span>Cấu hình Đợt chấm</span>
              </button>
            )}
          </div>
        </div>

        {/* Thanh tiến độ */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-800 dark:to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">Tiến độ chấm bài</div>
              <div className="text-xl font-bold mt-1">
                {tab === 'my' ? 'Học viên được phân công cho bạn' : 'Toàn bộ học viên trong hệ thống'}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-emerald-400">{stats.graded}</div>
                <div className="text-xs text-slate-400 font-medium">Đã chấm</div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="text-center">
                <div className="text-2xl font-extrabold text-slate-200">{stats.total}</div>
                <div className="text-xs text-slate-400 font-medium">Tổng số</div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="text-right">
                <div className="text-2xl font-extrabold text-primary">{stats.percent}%</div>
                <div className="text-xs text-slate-400 font-medium">Hoàn thành</div>
              </div>
            </div>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500 shadow-glow-primary"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>

        {/* Bộ lọc & Tìm kiếm */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            <button
              onClick={() => setTab('my')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'my'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Học viên của tôi</span>
            </button>
            <button
              onClick={() => setTab('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'all'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Tất cả học viên</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
              <Filter className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 px-3 py-1.5 focus:outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="graded">Đã chấm</option>
                <option value="ungraded">Chưa chấm</option>
              </select>
            </div>

            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên, MSSV, Username..."
                className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-primary/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Bảng Danh sách học viên */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-16 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredLearners.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-slate-400 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-600" />
              <div className="text-base font-semibold">Không tìm thấy học viên nào</div>
              <p className="text-sm max-w-sm">
                Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm. Nếu chưa có học viên nào được phân công, vui lòng yêu cầu Quản trị viên phân bổ.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Học viên</th>
                    <th className="py-4 px-6">Lớp / MSSV</th>
                    <th className="py-4 px-6">Người phụ trách</th>
                    <th className="py-4 px-6">Trạng thái</th>
                    <th className="py-4 px-6">Điểm tổng</th>
                    <th className="py-4 px-6 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                  {filteredLearners.map((st) => (
                    <tr
                      key={st.userId}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">
                        <div>{st.fullname || 'Chưa cập nhật tên'}</div>
                        <div className="text-xs text-slate-400 font-normal">@{st.username}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                        <span className="font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded">
                          {st.userClass}
                        </span>
                        {st.studentSchoolId && (
                          <span className="text-xs ml-2 text-slate-400">MSSV: {st.studentSchoolId}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              st.isMyAssigned ? 'bg-primary shadow-glow-primary' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          />
                          <span>{st.supporterName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {st.isGraded ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-full border border-emerald-200 dark:border-emerald-800/80">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã chấm bài
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold text-xs rounded-full border border-amber-200 dark:border-amber-800/80">
                            <Clock className="w-3.5 h-3.5" /> Chưa chấm
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-bold text-base">
                        {st.isGraded && st.totalScore != null ? (
                          <span className="text-primary">{st.totalScore.toFixed(2)}/10</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-normal">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => navigate(`/supporter/grading/${st.userId}`)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary dark:bg-primary/20 dark:hover:bg-primary text-primary hover:text-white font-semibold text-xs rounded-xl transition-all shadow-sm group-hover:shadow-md"
                        >
                          <span>Vào chấm bài</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
