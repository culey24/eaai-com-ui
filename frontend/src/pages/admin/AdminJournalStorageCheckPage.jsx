import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, CheckCircle2, FolderSearch, Loader2 } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { useAllUsers } from '../../hooks/useAllUsers'
import { API_BASE } from '../../config/api'
import { ROLES } from '../../constants/roles'
import { uiIdToBackendUserId } from '../../lib/userIds'

const BULK_CONCURRENCY = 8

async function fetchStorageCheck(apiToken, learnerId, periodId) {
  const q = new URLSearchParams({ periodId, learnerId })
  const res = await fetch(`${API_BASE}/api/journal/storage-check?${q}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  })
  const data = await res.json().catch(() => ({}))
  return { res, data }
}

export default function AdminJournalStorageCheckPage() {
  const { t } = useLanguage()
  const { apiToken, user } = useAuth()
  const { allUsers, adminApiLoaded } = useAllUsers()
  const [learnerId, setLearnerId] = useState('')
  const [periodId, setPeriodId] = useState('')
  const [periods, setPeriods] = useState([])
  const [loading, setLoading] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [bulkRows, setBulkRows] = useState([])

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

  useEffect(() => {
    if (periods.length === 0) return
    setPeriodId((prev) => {
      if (prev && periods.some((p) => p.periodId === prev)) return prev
      return periods[0].periodId
    })
  }, [periods])

  const periodTitle = useMemo(() => {
    const p = periods.find((x) => x.periodId === periodId)
    return p?.title || periodId
  }, [periods, periodId])

  const runCheck = async () => {
    setError('')
    setResult(null)
    setBulkRows([])
    const lid = learnerId.trim()
    const pid = String(periodId || '').trim().slice(0, 64)
    if (!apiToken || !pid) {
      setError(t('admin.journalStorageCheck.needPeriod'))
      return
    }
    if (!lid) {
      setError(t('admin.journalStorageCheck.needLearner'))
      return
    }
    setLoading(true)
    try {
      const { res, data } = await fetchStorageCheck(apiToken, lid, pid)
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

  const runCheckAll = useCallback(async () => {
    setError('')
    setResult(null)
    setBulkRows([])
    const pid = String(periodId || '').trim().slice(0, 64)
    if (!apiToken || !pid) {
      setError(t('admin.journalStorageCheck.needPeriod'))
      return
    }
    if (learners.length === 0) {
      setError(t('admin.journalStorageCheck.noLearners'))
      return
    }

    setBulkLoading(true)
    const list = learners.map((u) => ({
      u,
      bid: uiIdToBackendUserId(u),
    }))
    setBulkProgress({ current: 0, total: list.length })

    const out = []
    for (let i = 0; i < list.length; i += BULK_CONCURRENCY) {
      const chunk = list.slice(i, i + BULK_CONCURRENCY)
      const chunkResults = await Promise.all(
        chunk.map(async ({ u, bid }) => {
          try {
            const { res, data } = await fetchStorageCheck(apiToken, bid, pid)
            if (!res.ok) {
              return {
                learnerId: bid,
                username: u.username || '',
                fullName: u.fullName || '',
                error: data?.error || data?.message || `HTTP ${res.status}`,
                payload: null,
              }
            }
            const mismatch =
              Boolean(data.bucketFilesWithoutDbRow) ||
              (Array.isArray(data.extraBucketKeysVersusLatestDb) &&
                data.extraBucketKeysVersusLatestDb.length > 0)
            return {
              learnerId: bid,
              username: u.username || '',
              fullName: u.fullName || '',
              error: null,
              mismatch,
              bucketFileCount: data.bucketFileCount ?? 0,
              dbRowCount: data.dbRowCount ?? 0,
              payload: data,
            }
          } catch (e) {
            return {
              learnerId: bid,
              username: u.username || '',
              fullName: u.fullName || '',
              error: e instanceof Error ? e.message : String(e),
              payload: null,
            }
          }
        })
      )
      out.push(...chunkResults)
      setBulkRows([...out])
      setBulkProgress({ current: Math.min(i + chunk.length, list.length), total: list.length })
    }
    setBulkLoading(false)
  }, [apiToken, learners, periodId, t])

  const bulkStats = useMemo(() => {
    let mismatch = 0
    let errors = 0
    let ok = 0
    for (const r of bulkRows) {
      if (r.error) errors++
      else if (r.mismatch) mismatch++
      else ok++
    }
    return { mismatch, errors, ok }
  }, [bulkRows])

  const needJwt = !apiToken || user?.role !== ROLES.ADMIN
  const periodSelectDisabled = periods.length === 0 || needJwt

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
        <div className="max-w-5xl space-y-6">
          {needJwt && (
            <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
              {t('admin.journalStorageCheck.needJwt')}
            </p>
          )}

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('admin.journalStorageCheck.periodLabel')}
              </label>
              {periods.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.journalStorageCheck.periodEmpty')}</p>
              ) : (
                <select
                  value={periodId}
                  onChange={(e) => setPeriodId(e.target.value)}
                  disabled={periodSelectDisabled}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-white disabled:opacity-60"
                >
                  {periods.map((p) => (
                    <option key={p.periodId} value={p.periodId}>
                      {(p.title || p.periodId) + ` (${p.periodId})`}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('admin.journalStorageCheck.periodHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('admin.journalStorageCheck.learnerLabel')}
              </label>
              {adminApiLoaded && learners.length > 0 ? (
                <select
                  value={learnerId}
                  onChange={(e) => setLearnerId(e.target.value)}
                  disabled={needJwt}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-white disabled:opacity-60"
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
                  disabled={needJwt}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-white font-mono disabled:opacity-60"
                />
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runCheck}
                disabled={loading || bulkLoading || needJwt || !periodId}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t('admin.journalStorageCheck.run')}
              </button>
              <button
                type="button"
                onClick={runCheckAll}
                disabled={loading || bulkLoading || needJwt || !periodId || periods.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium disabled:opacity-50"
              >
                {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t('admin.journalStorageCheck.checkAll')}
              </button>
            </div>
            {bulkLoading && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('admin.journalStorageCheck.checkingProgress', {
                  current: String(bulkProgress.current),
                  total: String(bulkProgress.total),
                })}
                {' — '}
                {periodTitle}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          {bulkRows.length > 0 && !bulkLoading && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
                {t('admin.journalStorageCheck.bulkTableTitle')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('admin.journalStorageCheck.bulkSummary', {
                  mismatch: String(bulkStats.mismatch),
                  errors: String(bulkStats.errors),
                  ok: String(bulkStats.ok),
                })}
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-600">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t('admin.journalStorageCheck.colLearner')}</th>
                      <th className="px-3 py-2 font-medium">{t('admin.journalStorageCheck.colStatus')}</th>
                      <th className="px-3 py-2 font-medium">{t('admin.journalStorageCheck.colBucket')}</th>
                      <th className="px-3 py-2 font-medium">{t('admin.journalStorageCheck.colDb')}</th>
                      <th className="px-3 py-2 font-medium w-28" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {bulkRows.map((row) => (
                      <tr key={row.learnerId} className="text-slate-800 dark:text-slate-200">
                        <td className="px-3 py-2">
                          <div className="font-mono text-xs">{row.learnerId}</div>
                          <div className="text-slate-600 dark:text-slate-400 truncate max-w-[14rem]">
                            {row.username}
                            {row.fullName ? ` — ${row.fullName}` : ''}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          {row.error ? (
                            <span className="text-red-600 dark:text-red-400">{t('admin.journalStorageCheck.statusError')}</span>
                          ) : row.mismatch ? (
                            <span className="text-amber-700 dark:text-amber-300">{t('admin.journalStorageCheck.statusMismatch')}</span>
                          ) : (
                            <span className="text-green-700 dark:text-green-300">{t('admin.journalStorageCheck.statusOk')}</span>
                          )}
                          {row.error && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1 max-w-xs">{row.error}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{row.error ? '—' : String(row.bucketFileCount)}</td>
                        <td className="px-3 py-2 font-mono text-xs">{row.error ? '—' : String(row.dbRowCount)}</td>
                        <td className="px-3 py-2">
                          {row.payload ? (
                            <button
                              type="button"
                              onClick={() => setResult(row.payload)}
                              className="text-primary text-xs font-medium hover:underline"
                            >
                              {t('admin.journalStorageCheck.viewRowDetail')}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
                  {t('admin.journalStorageCheck.detailPanelTitle')}
                </h2>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  {t('admin.journalStorageCheck.closeDetail')}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {result.learnerId} · {result.periodId}
              </p>
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
