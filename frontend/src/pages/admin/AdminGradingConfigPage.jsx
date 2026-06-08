import { useState, useEffect, useMemo } from 'react'
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Shuffle,
  Users,
  Search,
  X,
  Edit,
  UserCheck,
  Clock,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useJournal } from '../../context/JournalContext'
import { API_BASE } from '../../config/api'

const SLOTS = [
  { key: 'sub1_1', label: 'Submission 1 (Đợt chính)', desc: 'Bài nộp lần 1 đúng hạn' },
  { key: 'sub1_2', label: 'Submission 1 (Đợt bổ sung)', desc: 'Bài nộp lần 1 đợt bổ sung (ưu tiên hiển thị nếu có, không trừ điểm)' },
  { key: 'sub2_1', label: 'Submission 2 (Đợt chính)', desc: 'Bài nộp lần 2 đúng hạn' },
  { key: 'sub2_2', label: 'Submission 2 (Đợt bổ sung)', desc: 'Bài nộp lần 2 đợt bổ sung (ưu tiên hiển thị nếu có, không trừ điểm)' },
  { key: 'sub3', label: 'Submission 3', desc: 'Bài nộp lần 3' },
  { key: 'sub4', label: 'Submission 4', desc: 'Bài nộp lần 4' },
  { key: 'final_1', label: 'Final Submission (Đợt chính)', desc: 'File báo cáo tổng kết cuối khóa (.zip)' },
  { key: 'final_2', label: 'Final Submission (Đợt muộn)', desc: 'File nộp muộn cuối khóa (.zip - có đánh dấu nộp muộn)' },
]

export default function AdminGradingConfigPage() {
  const { apiToken } = useAuth()
  const { submissions } = useJournal()

  const [config, setConfig] = useState({
    sub1_1: '',
    sub1_2: '',
    sub2_1: '',
    sub2_2: '',
    sub3: '',
    sub4: '',
    final_1: '',
    final_2: '',
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [message, setMessage] = useState(null)
  const [assignMessage, setAssignMessage] = useState(null)

  // Danh sách học viên & supporter để theo dõi và chỉnh sửa
  const [learners, setLearners] = useState([])
  const [supporters, setSupporters] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const [updatingLearnerId, setUpdatingLearnerId] = useState(null)

  const fetchData = () => {
    if (!apiToken) return
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/api/grading/config`, { headers: { Authorization: `Bearer ${apiToken}` } }).then((r) => r.json()),
      fetch(`${API_BASE}/api/grading/learners`, { headers: { Authorization: `Bearer ${apiToken}` } }).then((r) => r.json()),
      fetch(`${API_BASE}/api/grading/supporters`, { headers: { Authorization: `Bearer ${apiToken}` } }).then((r) => r.json()),
    ])
      .then(([cfgData, lrnData, supData]) => {
        if (cfgData?.config) setConfig(cfgData.config)
        if (lrnData?.learners) setLearners(lrnData.learners)
        if (supData?.supporters) setSupporters(supData.supporters)
      })
      .catch((err) => console.error('[Fetch admin config err]', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [apiToken])

  const hasAssigned = useMemo(() => {
    return learners.some((l) => l.supporterId != null)
  }, [learners])

  const handleSave = async () => {
    if (!apiToken) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`${API_BASE}/api/grading/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (res.ok) {
        setConfig(data.config)
        setMessage({ type: 'success', text: 'Đã lưu cấu hình đợt chấm bài thành công!' })
        setTimeout(() => setMessage(null), 4000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra khi lưu cấu hình.' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ.' })
    } finally {
      setSaving(false)
    }
  }

  const handleAssignRandom = async () => {
    if (!apiToken) return
    if (
      hasAssigned &&
      !window.confirm('Học viên đã được phân bổ trước đó! Bạn có chắc chắn muốn xáo trộn và phân bổ lại toàn bộ? Điểm đã chấm sẽ không bị mất.')
    ) {
      return
    }

    setAssigning(true)
    setAssignMessage(null)
    try {
      const res = await fetch(`${API_BASE}/api/grading/assign-random`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      const data = await res.json()
      if (res.ok) {
        setAssignMessage({
          type: 'success',
          text: data.message || `Phân bổ thành công ${data.assignedStudentsCount} học viên cho ${data.supportersCount} supporter.`,
        })
        fetchData() // Tải lại danh sách
      } else {
        setAssignMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra khi phân bổ Supporter.' })
      }
    } catch (err) {
      setAssignMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ.' })
    } finally {
      setAssigning(false)
    }
  }

  // Đổi supporter cho một học viên
  const handleSingleAssign = async (learnerId, supporterId) => {
    if (!apiToken || !supporterId) return
    setUpdatingLearnerId(learnerId)
    try {
      const res = await fetch(`${API_BASE}/api/grading/assign-single`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
        body: JSON.stringify({ learnerId, supporterId }),
      })
      const data = await res.json()
      if (res.ok) {
        // Cập nhật state local
        setLearners((prev) =>
          prev.map((l) => (l.userId === learnerId ? { ...l, supporterId, supporterName: data.supporterName } : l))
        )
      } else {
        alert(data.error || 'Không thể đổi người chấm.')
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ.')
    } finally {
      setUpdatingLearnerId(null)
    }
  }

  // Thống kê khối lượng cho modal
  const workloadMap = useMemo(() => {
    const map = new Map()
    supporters.forEach((s) => map.set(s.userId, { ...s, assignedCount: 0, gradedCount: 0 }))
    learners.forEach((l) => {
      if (l.supporterId && map.has(l.supporterId)) {
        const item = map.get(l.supporterId)
        item.assignedCount += 1
        if (l.isGraded) item.gradedCount += 1
      }
    })
    return Array.from(map.values())
  }, [supporters, learners])

  const filteredModalLearners = useMemo(() => {
    if (!modalSearch.trim()) return learners
    const q = modalSearch.toLowerCase()
    return learners.filter(
      (l) =>
        (l.fullname || '').toLowerCase().includes(q) ||
        (l.username || '').toLowerCase().includes(q) ||
        (l.studentSchoolId || '').toLowerCase().includes(q) ||
        (l.supporterName || '').toLowerCase().includes(q)
    )
  }, [learners, modalSearch])

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-primary/10 dark:bg-primary/20 text-primary rounded-2xl shadow-inner">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Cấu hình Đợt chấm bài & Phân bổ Supporter
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Ánh xạ các đợt nộp bài trên hệ thống Journal vào các mốc điểm chuẩn và quản lý gán Supporter.
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 transition-all duration-200 hover:scale-105 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>Lưu cấu hình</span>
          </button>
        </div>

        {message && (
          <div
            className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium border animate-fade-in ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Thẻ Quản lý Phân công Người chấm */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-pink-950/30 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" /> Phân bổ Người chấm
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                Quản lý & Phân công Người Chấm Bài (Supporters)
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {hasAssigned
                  ? `Đã phân bổ cho ${learners.filter((l) => l.supporterId != null).length}/${learners.length} học viên. Bạn có thể xem chi tiết từng người và điều chỉnh hoặc xáo trộn lại.`
                  : 'Hệ thống chưa xáo trộn phân bổ. Hãy nhấn nút để phân bổ tự động đều cho tất cả Supporter.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {hasAssigned ? (
                <>
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
                  >
                    <Users className="w-5 h-5" />
                    <span>Xem & Chỉnh sửa Chi tiết Phân bổ</span>
                  </button>
                  <button
                    onClick={handleAssignRandom}
                    disabled={assigning}
                    className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold rounded-xl transition-all disabled:opacity-50 text-sm"
                    title="Xáo trộn lại toàn bộ từ đầu"
                  >
                    {assigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4 text-indigo-600" />}
                    <span>Phân bổ lại ngẫu nhiên</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAssignRandom}
                  disabled={assigning}
                  className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 disabled:opacity-50 whitespace-nowrap"
                >
                  {assigning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Shuffle className="w-5 h-5" />}
                  <span>Phân bổ Ngẫu nhiên & Chia đều</span>
                </button>
              )}
            </div>
          </div>

          {assignMessage && (
            <div
              className={`flex items-center gap-3 mt-4 p-4 rounded-xl text-sm font-medium border animate-fade-in ${
                assignMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}
            >
              {assignMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span>{assignMessage.text}</span>
            </div>
          )}
        </div>

        {/* Bảng Cấu hình mốc */}
        <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden backdrop-blur-xl">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Ánh xạ Mốc Chấm bài</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Lựa chọn đợt Journal tương ứng với từng mốc điểm chuẩn.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {SLOTS.map((slot) => (
                <div key={slot.key} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-slate-800 dark:text-white">{slot.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">{slot.desc}</p>
                  </div>

                  <div className="w-full md:w-96">
                    <select
                      value={config[slot.key] || ''}
                      onChange={(e) => setConfig({ ...config, [slot.key]: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    >
                      <option value="">-- Không chọn (Để trống) --</option>
                      {submissions.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.title} ({new Date(sub.startsAt).toLocaleDateString('vi-VN')} - {new Date(sub.endsAt).toLocaleDateString('vi-VN')})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL CHI TIẾT & CHỈNH SỬA PHÂN BỔ SUPPORTER */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    Chi Tiết & Điều Chỉnh Gán Supporter
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Quản lý danh sách phân công, khối lượng công việc và chuyển đổi người chấm trực tiếp.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Thống kê khối lượng */}
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                  Khối lượng bài của từng Supporter ({supporters.length} người)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {workloadMap.map((s) => (
                    <div key={s.userId} className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="font-bold text-sm text-slate-800 dark:text-white truncate">
                        {s.fullname || s.username}
                      </div>
                      <div className="text-xs text-slate-400">@{s.username}</div>
                      <div className="pt-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-primary">{s.assignedCount} học viên</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Đã chấm {s.gradedCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tìm kiếm */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Danh sách học viên ({filteredModalLearners.length})
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Tìm tên, username, supporter..."
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 text-slate-800 dark:text-slate-200 text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Bảng học viên */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="p-4">Học viên</th>
                      <th className="p-4">Lớp / MSSV</th>
                      <th className="p-4">Người chấm (Supporter)</th>
                      <th className="p-4">Tình trạng chấm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredModalLearners.map((st) => (
                      <tr key={st.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{st.fullname || 'Chưa cập nhật'}</div>
                          <div className="text-xs text-slate-400">@{st.username}</div>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">
                          <span className="font-semibold">{st.userClass}</span>
                          {st.studentSchoolId && <span className="ml-2 text-xs">MSSV: {st.studentSchoolId}</span>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={st.supporterId || ''}
                              onChange={(e) => handleSingleAssign(st.userId, e.target.value)}
                              disabled={updatingLearnerId === st.userId}
                              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                            >
                              <option value="">-- Chưa gán --</option>
                              {supporters.map((sup) => (
                                <option key={sup.userId} value={sup.userId}>
                                  {sup.fullname || sup.username} (@{sup.username})
                                </option>
                              ))}
                            </select>
                            {updatingLearnerId === st.userId && <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />}
                          </div>
                        </td>
                        <td className="p-4">
                          {st.isGraded ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-full">
                              <UserCheck className="w-3.5 h-3.5" /> Đã chấm ({st.totalScore?.toFixed(2)}/10)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold text-xs rounded-full">
                              <Clock className="w-3.5 h-3.5" /> Chưa chấm
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-right flex-shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold rounded-xl transition-all shadow-lg"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
