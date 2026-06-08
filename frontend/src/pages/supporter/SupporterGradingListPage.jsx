import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserCheck, CheckCircle2, Clock, Users, ArrowRight, RefreshCw, Filter, Shield, ChevronUp, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { API_BASE } from '../../config/api'
import { ROLES } from '../../constants/roles'

const PAGE_SIZE = 20

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="py-4 px-6">
          <div className={`h-4 bg-slate-200 dark:bg-slate-700 rounded ${i === 0 ? 'w-32' : i === 5 ? 'w-20' : 'w-24'}`} />
        </td>
      ))}
    </tr>
  )
}

export default function SupporterGradingListPage() {
  const { apiToken, user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [learners, setLearners] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('my')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState('fullname')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
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

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-slate-300 dark:text-slate-600" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />
  }

  const filteredLearners = useMemo(() => {
    let list = learners.filter((st) => {
      if (tab === 'my' && !st.isMyAssigned) return false
      if (statusFilter === 'graded' && !st.isGraded) return false
      if (statusFilter === 'ungraded' && st.isGraded) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = (st.fullname || '').toLowerCase().includes(q)
        const matchUser = (st.username || '').toLowerCase().includes(q)
        const matchSchoolId = (st.studentSchoolId || '').toLowerCase().includes(q)
        if (!matchName && !matchUser && !matchSchoolId) return false
      }
      return true
    })

    list.sort((a, b) => {
      let aVal, bVal
      switch (sortField) {
        case 'fullname':
          aVal = (a.fullname || '').toLowerCase()
          bVal = (b.fullname || '').toLowerCase()
          break
        case 'score':
          aVal = a.totalScore ?? -1
          bVal = b.totalScore ?? -1
          break
        case 'status':
          aVal = a.isGraded ? 1 : 0
          bVal = b.isGraded ? 1 : 0
          break
        case 'class':
          aVal = (a.userClass || '').toLowerCase()
          bVal = (b.userClass || '').toLowerCase()
          break
        default:
          aVal = (a.fullname || '').toLowerCase()
          bVal = (b.fullname || '').toLowerCase()
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [learners, tab, statusFilter, search, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredLearners.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedLearners = filteredLearners.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  useEffect(() => {
    if (safePage !== page) setPage(safePage)
  }, [safePage, page])

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-primary/10 dark:bg-primary/20 text-primary rounded-2xl shadow-inner">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                {t('supporter.grading.list.title')}
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold rounded-full border border-amber-200 dark:border-amber-800">
                    <Shield className="w-3 h-3" /> {t('supporter.grading.list.adminBadge')}
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('supporter.grading.list.desc')}
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
              <span>{t('supporter.grading.list.refresh')}</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin/grading-config')}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all"
              >
                <span>{t('supporter.grading.list.config')}</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-800 dark:to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                {t('supporter.grading.list.progressTitle')}
              </div>
              <div className="text-xl font-bold mt-1">
                {tab === 'my' ? t('supporter.grading.list.progressMy') : t('supporter.grading.list.progressAll')}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-emerald-400">{stats.graded}</div>
                <div className="text-xs text-slate-400 font-medium">{t('supporter.grading.list.graded')}</div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="text-center">
                <div className="text-2xl font-extrabold text-slate-200">{stats.total}</div>
                <div className="text-xs text-slate-400 font-medium">{t('supporter.grading.list.total')}</div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="text-right">
                <div className="text-2xl font-extrabold text-primary">{stats.percent}%</div>
                <div className="text-xs text-slate-400 font-medium">{t('supporter.grading.list.completed')}</div>
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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            <button
              onClick={() => { setTab('my'); setPage(1) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'my'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t('supporter.grading.list.myTab')}</span>
            </button>
            <button
              onClick={() => { setTab('all'); setPage(1) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === 'all'
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t('supporter.grading.list.allTab')}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
              <Filter className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 px-3 py-1.5 focus:outline-none"
              >
                <option value="all">{t('supporter.grading.list.statusAll')}</option>
                <option value="graded">{t('supporter.grading.list.statusGraded')}</option>
                <option value="ungraded">{t('supporter.grading.list.statusUngraded')}</option>
              </select>
            </div>

            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder={t('supporter.grading.list.searchPlaceholder')}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-primary/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">{t('supporter.grading.list.colLearner')}</th>
                  <th className="py-4 px-6">{t('supporter.grading.list.colClass')}</th>
                  <th className="py-4 px-6">{t('supporter.grading.list.colSupporter')}</th>
                  <th className="py-4 px-6">{t('supporter.grading.list.colStatus')}</th>
                  <th className="py-4 px-6">{t('supporter.grading.list.colScore')}</th>
                  <th className="py-4 px-6 text-right">{t('supporter.grading.list.colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          ) : filteredLearners.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-slate-400 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-600" />
              <div className="text-base font-semibold">{t('supporter.grading.list.noResults')}</div>
              <p className="text-sm max-w-sm">
                {t('supporter.grading.list.noResultsHint')}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6">
                        <button onClick={() => toggleSort('fullname')} className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                          {t('supporter.grading.list.colLearner')} <SortIcon field="fullname" />
                        </button>
                      </th>
                      <th className="py-4 px-6">
                        <button onClick={() => toggleSort('class')} className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                          {t('supporter.grading.list.colClass')} <SortIcon field="class" />
                        </button>
                      </th>
                      <th className="py-4 px-6">{t('supporter.grading.list.colSupporter')}</th>
                      <th className="py-4 px-6">
                        <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                          {t('supporter.grading.list.colStatus')} <SortIcon field="status" />
                        </button>
                      </th>
                      <th className="py-4 px-6">
                        <button onClick={() => toggleSort('score')} className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                          {t('supporter.grading.list.colScore')} <SortIcon field="score" />
                        </button>
                      </th>
                      <th className="py-4 px-6 text-right">{t('supporter.grading.list.colAction')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                    {pagedLearners.map((st) => (
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
                              <CheckCircle2 className="w-3.5 h-3.5" /> {t('supporter.grading.list.gradedBadge')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold text-xs rounded-full border border-amber-200 dark:border-amber-800/80">
                              <Clock className="w-3.5 h-3.5" /> {t('supporter.grading.list.ungradedBadge')}
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
                            onClick={() => navigate(`/supporter/grading/${st.userId}`, {
                              state: { learnerIds: filteredLearners.map((l) => l.userId) }
                            })}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary dark:bg-primary/20 dark:hover:bg-primary text-primary hover:text-white font-semibold text-xs rounded-xl transition-all shadow-sm group-hover:shadow-md"
                          >
                            <span>{t('supporter.grading.list.enterGrading')}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {t('supporter.grading.list.showing', {
                      from: (safePage - 1) * PAGE_SIZE + 1,
                      to: Math.min(safePage * PAGE_SIZE, filteredLearners.length),
                      total: filteredLearners.length,
                    })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-all"
                    >
                      {t('supporter.grading.list.prev')}
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (safePage <= 3) {
                        pageNum = i + 1
                      } else if (safePage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = safePage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            safePage === pageNum
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-all"
                    >
                      {t('supporter.grading.list.next')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
