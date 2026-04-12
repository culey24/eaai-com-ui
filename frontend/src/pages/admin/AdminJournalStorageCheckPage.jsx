import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, CheckCircle2, FolderSearch, Loader2 } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { useAllUsers } from '../../hooks/useAllUsers'
import { API_BASE } from '../../config/api'
import { ROLES } from '../../constants/roles'
import { uiIdToBackendUserId } from '../../lib/userIds'

export default function AdminJournalStorageCheckPage() {
  const { t } = useLanguage()
  const { apiToken, user } = useAuth()
  const { allUsers, adminApiLoaded } = useAllUsers()
  const [learnerId, setLearnerId] = useState('')
  const [periodId, setPeriodId] = useState('default')
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const learners = useMemo(
    () =>
      allUsers
        .filter((u) => u.fromApi && u.role === ROLES.LEARNER && uiIdToBackendUserId(u) != null)
        .sort((a, b) => (a.username || '').localeCompare(b.username || '', undefined, { sensitivity: 'base' })),
    [allUsers]
  )

  useEffect(() => {
    if (!apiToken) return
    let cancelled = false
    fetch(`${API_BASE}/api/journal/periods`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.periods) return
        setPeriods(data.periods)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [apiToken])

  const runCheck = async () => {
    setError('')
    setResult(null)
    const lid = learnerId.trim()
    const pid = String(periodId || 'default').trim().slice(0, 64) || 'default'
    if (!apiToken || !lid) {
      setError(t('admin.journalStorageCheck.needLearner'))
      return
    }
    setLoading(true)
    try {
      const q = new URLSearchParams({ periodId: pid, learnerId: lid })
      const res = await fetch(`${API_BASE}/api/journal/storage-check?${q}`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || data?.message || `HTTP ${res.status}`)
        return
      }
      setResult(data)
    } catch {
      setError(t('auth.errors.network'))
    } finally {
      setLoading(false)
    }
  }

  const needJwt = !apiToken || user?.role !== ROLES.ADMIN

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-2">
          <Link
            to="/admin"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            aria-label={t('common.back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
            <FolderSearch className="w-5 h-5 text-primary" />
            {t('admin.journalStorageCheck.title')}
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl">{t('admin.journalStorageCheck.intro')}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl space-y-6">
          {needJwt && (
            <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
              {t('admin.journalStorageCheck.needJwt')}
            </p>
          )}

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('admin.journalStorageCheck.learnerLabel')}
              </label>
              {adminApiLoaded && learners.length > 0 ? (
                <select
                  value={learnerId}
                  onChange={(e) => setLearnerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-white"
                >
                  <option value="">{t('admin.journalStorageCheck.pickLearner')}</option>
                  {learners.map((u) => {
                    const bid = uiIdToBackendUserId(u)
                    return (
                      <option key={u.id || bid} value={bid}>
                        {(u.username || bid) + (u.fullName ? ` — ${u.fullName}` : '')} ({bid})
                      </option>
                    )
                  })}
                </select>
              ) : (
                <input
                  type="text"
                  value={learnerId}
                  onChange={(e) => setLearnerId(e.target.value)}
                  placeholder={t('admin.journalStorageCheck.learnerPlaceholder')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-white font-mono"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('admin.journalStorageCheck.periodLabel')}
              </label>
              <input
                type="text"
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value)}
                list="journal-storage-period-ids"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-white font-mono"
              />
              <datalist id="journal-storage-period-ids">
                {periods.map((p) => (
                  <option key={p.periodId} value={p.periodId} label={p.title || p.periodId} />
                ))}
              </datalist>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('admin.journalStorageCheck.periodHint')}</p>
            </div>
            <button
              type="button"
              onClick={runCheck}
              disabled={loading || needJwt}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t('admin.journalStorageCheck.run')}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          {result && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
              <div className="flex flex-wrap gap-3">
                {result.bucketFilesWithoutDbRow ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-3 py-1.5 rounded-lg">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {t('admin.journalStorageCheck.flagBucketOnly')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/40 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    {t('admin.journalStorageCheck.flagHasDbOrEmpty')}
                  </span>
                )}
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t('admin.journalStorageCheck.counts', {
                    bucket: String(result.bucketFileCount ?? 0),
                    db: String(result.dbRowCount ?? 0),
                  })}
                </span>
              </div>

              {Array.isArray(result.extraBucketKeysVersusLatestDb) && result.extraBucketKeysVersusLatestDb.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">
                    {t('admin.journalStorageCheck.extraKeysTitle')}
                  </h3>
                  <ul className="text-xs font-mono bg-slate-100 dark:bg-slate-900 rounded-lg p-3 space-y-1 break-all max-h-40 overflow-y-auto">
                    {result.extraBucketKeysVersusLatestDb.map((k) => (
                      <li key={k}>{k}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">
                  {t('admin.journalStorageCheck.latestDbKey')}
                </h3>
                <p className="text-xs font-mono bg-slate-100 dark:bg-slate-900 rounded-lg p-3 break-all">
                  {result.latestDbStorageKey || '—'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">
                  {t('admin.journalStorageCheck.bucketListTitle')}
                </h3>
                <ul className="text-xs font-mono bg-slate-100 dark:bg-slate-900 rounded-lg p-3 space-y-1 break-all max-h-48 overflow-y-auto">
                  {(result.bucketKeys || []).length ? (
                    result.bucketKeys.map((k) => <li key={k}>{k}</li>)
                  ) : (
                    <li className="text-slate-500">{t('admin.journalStorageCheck.emptyList')}</li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">
                  {t('admin.journalStorageCheck.dbRowsTitle')}
                </h3>
                <pre className="text-xs font-mono bg-slate-100 dark:bg-slate-900 rounded-lg p-3 overflow-x-auto max-h-56 overflow-y-auto">
                  {JSON.stringify(result.dbRows || [], null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
