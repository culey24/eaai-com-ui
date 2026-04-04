import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  UserPlus,
  UserCog,
  FileText,
  ClipboardList,
  Flag,
  ChevronRight,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useJournal } from '../../context/JournalContext'
import { useAuth } from '../../context/AuthContext'
import { useAllUsers } from '../../hooks/useAllUsers'
import { API_BASE } from '../../config/api'
import { ROLES, VALID_CLASS_CODES } from '../../constants/roles'
import { TOTAL_THEORETICAL_ROSTER } from '../../constants/admin'

function normUsername(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
}

export default function AdminDashboardPage() {
  const { t } = useLanguage()
  const { getActiveSubmission } = useJournal()
  const { apiToken, user } = useAuth()
  const { allUsers } = useAllUsers()
  const activeSubmission = getActiveSubmission()

  const [blacklistNorm, setBlacklistNorm] = useState(() => new Set())
  const [signupExclusionsError, setSignupExclusionsError] = useState('')

  useEffect(() => {
    if (!apiToken || user?.role !== ROLES.ADMIN) {
      setBlacklistNorm(new Set())
      setSignupExclusionsError('')
      return
    }
    let cancelled = false
    setSignupExclusionsError('')
    fetch(`${API_BASE}/api/admin/stats-exclusions`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`)
        return data
      })
      .then((data) => {
        if (cancelled) return
        setBlacklistNorm(
          new Set(
            (Array.isArray(data.exclusions) ? data.exclusions : []).map((e) =>
              normUsername(e.usernameNormalized)
            )
          )
        )
      })
      .catch(() => {
        if (!cancelled) {
          setBlacklistNorm(new Set())
          setSignupExclusionsError(t('admin.classListPage.loadExclusionsError'))
        }
      })
    return () => {
      cancelled = true
    }
  }, [apiToken, user?.role, t])

  const netSignedUpTotal = useMemo(
    () =>
      allUsers.filter(
        (u) =>
          u.role === ROLES.LEARNER &&
          u.classCode &&
          VALID_CLASS_CODES.includes(u.classCode) &&
          !blacklistNorm.has(normUsername(u.username))
      ).length,
    [allUsers, blacklistNorm]
  )

  const totalSignupPct =
    TOTAL_THEORETICAL_ROSTER > 0
      ? Math.round((netSignedUpTotal / TOTAL_THEORETICAL_ROSTER) * 1000) / 10
      : null

  const [serverStats, setServerStats] = useState({
    loading: false,
    submitted: 0,
    total: 0,
    error: null,
  })

  useEffect(() => {
    if (!apiToken || user?.role !== ROLES.ADMIN || !activeSubmission?.id) {
      setServerStats({ loading: false, submitted: 0, total: 0, error: null })
      return
    }
    const periodId = String(activeSubmission.id).trim().slice(0, 64)
    if (!periodId) {
      setServerStats({ loading: false, submitted: 0, total: 0, error: null })
      return
    }
    let cancelled = false
    setServerStats((s) => ({ ...s, loading: true, error: null }))
    fetch(
      `${API_BASE}/api/admin/journal-upload-stats?periodId=${encodeURIComponent(periodId)}`,
      { headers: { Authorization: `Bearer ${apiToken}` } }
    )
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`)
        return data
      })
      .then((data) => {
        if (cancelled) return
        const submitted = Number(data.submitted) || 0
        const total = Number(data.total) || 0
        setServerStats({ loading: false, submitted, total, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        setServerStats({
          loading: false,
          submitted: 0,
          total: 0,
          error: err instanceof Error ? err.message : String(err),
        })
      })
    return () => {
      cancelled = true
    }
  }, [apiToken, user?.role, activeSubmission?.id])

  const stats = { submitted: serverStats.submitted, total: serverStats.total }
  const rate =
    stats.total > 0 && !serverStats.error ? Math.round((stats.submitted / stats.total) * 100) : 0

  const navItems = [
    { to: '/admin/chats', icon: MessageSquare, labelKey: 'admin.chatChannels' },
    { to: '/admin/classes', icon: Users, labelKey: 'admin.classList' },
    { to: '/admin/accounts', icon: UserCog, labelKey: 'admin.accountManagement' },
    { to: '/admin/submissions', icon: FileText, labelKey: 'admin.submissions.title' },
    { to: '/admin/surveys', icon: ClipboardList, labelKey: 'admin.surveys.title' },
    { to: '/reports', icon: Flag, labelKey: 'sidebar.reports' },
  ]

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700">
        <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          {t('admin.dashboard')}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              {t('admin.totalSignupRate')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('admin.totalSignupRateIntro')}</p>
            {signupExclusionsError ? (
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3" role="alert">
                {signupExclusionsError}
              </p>
            ) : null}
            <div className="flex items-end gap-4 flex-wrap">
              <div className="text-4xl font-bold text-primary tabular-nums">
                {totalSignupPct != null ? `${totalSignupPct}%` : '—'}
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm pb-1">
                {t('admin.totalSignupRateFigures', {
                  net: netSignedUpTotal,
                  theoretical: TOTAL_THEORETICAL_ROSTER,
                })}
              </div>
            </div>
          </div>

          {/* Open submission only; counts from API / journal_uploads */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t('admin.journalRate')}
            </h2>
            {!activeSubmission ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t('admin.journalRateNoOpenPeriod')}</p>
            ) : serverStats.loading ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t('admin.journalRateLoading')}</p>
            ) : serverStats.error ? (
              <p className="text-red-600 dark:text-red-400 text-sm">{t('admin.journalRateLoadError')}</p>
            ) : (
              <>
                {activeSubmission.title ? (
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">{activeSubmission.title}</p>
                ) : null}
                <div className="flex items-end gap-4">
                  <div className="text-4xl font-bold text-primary">{rate}%</div>
                  <div className="text-slate-500 dark:text-slate-400 text-sm pb-1">
                    {t('admin.membersSubmitted', { submitted: stats.submitted, total: stats.total })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Nav cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {navItems.map(({ to, icon: Icon, labelKey }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-white">{t(labelKey)}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
