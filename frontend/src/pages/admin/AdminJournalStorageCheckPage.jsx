import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, CheckCircle2, FolderSearch, Loader2 } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { useAllUsers } from '../../hooks/useAllUsers'
import { API_BASE } from '../../config/api'
import { ROLES } from '../../constants/roles'
import { uiIdToBackendUserId } from '../../lib/userIds'
import {
  loadJournalAuditHistory,
  saveJournalAuditHistoryEntry,
  deleteJournalAuditHistoryEntry,
} from '../../lib/adminJournalStorageHistory'

const BULK_CONCURRENCY = 8

async function fetchStorageCheck(apiToken, learnerId, periodId) {
  const q = new URLSearchParams({ periodId, learnerId })
  const res = await fetch(`${API_BASE}/api/journal/storage-check?${q}`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  })
  const data = await res.json().catch(() => ({}))
  return { res, data }
}

function rowStatusRank(r) {
  if (r.error) return 0
  if (r.mismatch) return 1
  return 2
}

function compareAuditRows(a, b, sortKey) {
  switch (sortKey) {
    case 'learnerId_desc':
      return (b.learnerId || '').localeCompare(a.learnerId || '', undefined, { sensitivity: 'base' })
    case 'learnerId_asc':
      return (a.learnerId || '').localeCompare(b.learnerId || '', undefined, { sensitivity: 'base' })
    case 'username_asc':
      return (a.username || '').localeCompare(b.username || '', undefined, { sensitivity: 'base' })
    case 'bucket_desc':
      return (b.bucketFileCount ?? 0) - (a.bucketFileCount ?? 0)
    case 'bucket_asc':
      return (a.bucketFileCount ?? 0) - (b.bucketFileCount ?? 0)
    case 'db_desc':
      return (b.dbRowCount ?? 0) - (a.dbRowCount ?? 0)
    case 'db_asc':
      return (a.dbRowCount ?? 0) - (b.dbRowCount ?? 0)
    case 'badFirst':
    default: {
      const d = rowStatusRank(a) - rowStatusRank(b)
      if (d !== 0) return d
      return (a.learnerId || '').localeCompare(b.learnerId || '', undefined, { sensitivity: 'base' })
    }
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function csvEscape(s) {
  return `"${String(s ?? '').replace(/"/g, '""')}"`
}

function exportAuditCsv(rows, periodId) {
  const header = ['learner_id', 'username', 'full_name', 'status', 'bucket_files', 'db_rows', 'error']
  const lines = [header.join(',')]
  for (const r of rows) {
    const st = r.error ? 'error' : r.mismatch ? 'mismatch' : 'ok'
    lines.push(
      [
        csvEscape(r.learnerId),
        csvEscape(r.username),
        csvEscape(r.fullName),
        st,
        r.error ? '' : String(r.bucketFileCount ?? 0),
        r.error ? '' : String(r.dbRowCount ?? 0),
        csvEscape(r.error || ''),
      ].join(',')
    )
  }
  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `journal-storage-audit-${periodId}-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

function openAuditPrintWindow({ periodId, periodTitle, createdAt, rows, labels }) {
  const w = window.open('', '_blank')
  if (!w) return
  const dateStr = new Date(createdAt).toLocaleString()
  const bodyRows = rows
    .map((r) => {
      const st = r.error ? labels.stError : r.mismatch ? labels.stMismatch : labels.stOk
      const b = r.error ? '—' : String(r.bucketFileCount ?? 0)
      const d = r.error ? '—' : String(r.dbRowCount ?? 0)
      return `<tr>
        <td>${escapeHtml(r.learnerId)}</td>
        <td>${escapeHtml(r.username)}</td>
        <td>${escapeHtml(r.fullName)}</td>
        <td>${escapeHtml(st)}</td>
        <td style="text-align:right">${escapeHtml(b)}</td>
        <td style="text-align:right">${escapeHtml(d)}</td>
        <td>${escapeHtml(r.error || '')}</td>
      </tr>`
    })
    .join('')
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(labels.docTitle)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 16px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    .meta { font-size: 12px; color: #444; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; font-size: 10px; }
    th, td { border: 1px solid #999; padding: 4px 6px; vertical-align: top; }
    th { background: #eee; text-align: left; }
    @media print { body { margin: 8px; } }
  </style></head><body>
  <h1>${escapeHtml(labels.docTitle)}</h1>
  <div class="meta">${escapeHtml(periodTitle)} · period_id: ${escapeHtml(periodId)} · ${escapeHtml(dateStr)}</div>
  <table><thead><tr>
    <th>${escapeHtml(labels.colLearner)}</th>
    <th>${escapeHtml(labels.colUser)}</th>
    <th>${escapeHtml(labels.colName)}</th>
    <th>${escapeHtml(labels.colStatus)}</th>
    <th>${escapeHtml(labels.colBucket)}</th>
    <th>${escapeHtml(labels.colDb)}</th>
    <th>${escapeHtml(labels.colErr)}</th>
  </tr></thead><tbody>${bodyRows}</tbody></table>
  <p style="font-size:10px;color:#666;margin-top:12px">${escapeHtml(labels.printFooter)}</p>
  </body></html>`)
  w.document.close()
  w.focus()
  requestAnimationFrame(() => {
    try {
      w.print()
    } catch {
      /* ignore */
    }
  })
}

function slimHistoryRow(r) {
  return {
    learnerId: r.learnerId,
    username: r.username || '',
    fullName: r.fullName || '',
    error: r.error ?? null,
    mismatch: Boolean(r.mismatch),
    bucketFileCount: r.bucketFileCount ?? 0,
    dbRowCount: r.dbRowCount ?? 0,
  }
}

export default function AdminJournalStorageCheckPage() {
  const { t, lang } = useLanguage()
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
  const [historyList, setHistoryList] = useState(() => loadJournalAuditHistory())
  const [selectedHistoryId, setSelectedHistoryId] = useState('')
  const [rowSearch, setRowSearch] = useState('')
  const [sortKey, setSortKey] = useState('badFirst')
  const [lastBulkCompletedAt, setLastBulkCompletedAt] = useState(null)

  const learners = useMemo(
    () =>
      allUsers
        .filter((u) => u.fromApi && u.role === ROLES.LEARNER && uiIdToBackendUserId(u) != null)
        .sort((a, b) => (a.username || '').localeCompare(b.username || '', undefined, { sensitivity: 'base' })),
    [allUsers]
  )

  const refreshHistory = useCallback(() => {
    setHistoryList(loadJournalAuditHistory())
  }, [])

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

  const baseRows = useMemo(() => {
    if (selectedHistoryId) {
      const h = historyList.find((e) => e.id === selectedHistoryId)
      return h?.rows?.length ? h.rows.map((r) => ({ ...r, payload: null })) : []
    }
    return bulkRows
  }, [selectedHistoryId, historyList, bulkRows])

  const sessionMeta = useMemo(() => {
    if (selectedHistoryId) {
      const h = historyList.find((e) => e.id === selectedHistoryId)
      if (!h) return { periodId, periodTitle, createdAt: lastBulkCompletedAt || Date.now() }
      return { periodId: h.periodId, periodTitle: h.periodTitle, createdAt: h.createdAt }
    }
    return { periodId, periodTitle, createdAt: lastBulkCompletedAt || Date.now() }
  }, [selectedHistoryId, historyList, periodId, periodTitle, lastBulkCompletedAt])

  const filteredSortedRows = useMemo(() => {
    const q = rowSearch.trim().toLowerCase()
    let list = baseRows
    if (q) {
      list = list.filter((r) => {
        const hay = [r.learnerId, r.username, r.fullName, r.error].filter(Boolean).join(' ').toLowerCase()
        return hay.includes(q)
      })
    }
    return [...list].sort((a, b) => compareAuditRows(a, b, sortKey))
  }, [baseRows, rowSearch, sortKey])

  const bulkStats = useMemo(() => {
    let mismatch = 0
    let errors = 0
    let ok = 0
    for (const r of baseRows) {
      if (r.error) errors++
      else if (r.mismatch) mismatch++
      else ok++
    }
    return { mismatch, errors, ok }
  }, [baseRows])

  const runCheck = async () => {
    setError('')
    setResult(null)
    setBulkRows([])
    setSelectedHistoryId('')
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
    setSelectedHistoryId('')
    const pid = String(periodId || '').trim().slice(0, 64)
    const ptitle = periods.find((p) => p.periodId === pid)?.title || pid
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

    let mismatch = 0
    let errors = 0
    let ok = 0
    for (const r of out) {
      if (r.error) errors++
      else if (r.mismatch) mismatch++
      else ok++
    }
    const ts = Date.now()
    saveJournalAuditHistoryEntry({
      createdAt: ts,
      periodId: pid,
      periodTitle: ptitle,
      stats: { mismatch, errors, ok },
      rows: out.map(slimHistoryRow),
    })
    setLastBulkCompletedAt(ts)
    refreshHistory()
    setBulkLoading(false)
  }, [apiToken, learners, periodId, periods, refreshHistory])

  const handleExportCsv = () => {
    exportAuditCsv(filteredSortedRows, sessionMeta.periodId)
  }

  const handleExportPrint = () => {
    const labels = {
      docTitle: t('admin.journalStorageCheck.title'),
      colLearner: 'user_id',
      colUser: lang === 'vi' ? 'Username' : 'Username',
      colName: lang === 'vi' ? 'Họ tên' : 'Full name',
      colStatus: t('admin.journalStorageCheck.colStatus'),
      colBucket: t('admin.journalStorageCheck.colBucket'),
      colDb: t('admin.journalStorageCheck.colDb'),
      colErr: 'Error',
      stError: t('admin.journalStorageCheck.statusError'),
      stMismatch: t('admin.journalStorageCheck.statusMismatch'),
      stOk: t('admin.journalStorageCheck.statusOk'),
      printFooter: t('admin.journalStorageCheck.exportPrintHint'),
    }
    openAuditPrintWindow({
      periodId: sessionMeta.periodId,
      periodTitle: sessionMeta.periodTitle,
      createdAt: sessionMeta.createdAt,
      rows: filteredSortedRows,
      labels,
    })
  }

  const handleDeleteHistoryEntry = () => {
    if (!selectedHistoryId) return
    deleteJournalAuditHistoryEntry(selectedHistoryId)
    refreshHistory()
    setSelectedHistoryId('')
  }

  const needJwt = !apiToken || user?.role !== ROLES.ADMIN
  const periodSelectDisabled = periods.length === 0 || needJwt
  const hasBulkTable = baseRows.length > 0 && !bulkLoading
  const viewingHistory = Boolean(selectedHistoryId)

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
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('admin.journalStorageCheck.historySavedNote')}</p>
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

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-white dark:bg-slate-900/40">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('admin.journalStorageCheck.historyLabel')}
            </label>
            <select
              value={selectedHistoryId}
              onChange={(e) => {
                setSelectedHistoryId(e.target.value)
                setResult(null)
              }}
              className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-white"
            >
              <option value="">{bulkRows.length > 0 ? t('admin.journalStorageCheck.historyCurrent') : t('admin.journalStorageCheck.historyPick')}</option>
              {historyList.map((h) => (
                <option key={h.id} value={h.id}>
                  {new Date(h.createdAt).toLocaleString()} — {h.periodTitle || h.periodId} (
                  {t('admin.journalStorageCheck.bulkSummary', {
                    mismatch: String(h.stats?.mismatch ?? 0),
                    errors: String(h.stats?.errors ?? 0),
                    ok: String(h.stats?.ok ?? 0),
                  })}
                  )
                </option>
              ))}
            </select>
            {historyList.length === 0 && <p className="text-xs text-slate-500">{t('admin.journalStorageCheck.historyEmpty')}</p>}
            {viewingHistory && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-lg">
                  {t('admin.journalStorageCheck.historyViewingBadge')}
                </span>
                <button
                  type="button"
                  onClick={handleDeleteHistoryEntry}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  {t('admin.journalStorageCheck.historyDelete')}
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          {hasBulkTable && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex flex-wrap items-end gap-3 justify-between">
                <div>
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
                </div>
                <p className="text-xs text-slate-500">
                  {t('admin.journalStorageCheck.filteredCount', {
                    shown: String(filteredSortedRows.length),
                    total: String(baseRows.length),
                  })}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[12rem]">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.journalStorageCheck.searchPlaceholder')}
                  </label>
                  <input
                    type="search"
                    value={rowSearch}
                    onChange={(e) => setRowSearch(e.target.value)}
                    placeholder={t('admin.journalStorageCheck.searchPlaceholder')}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.journalStorageCheck.sortLabel')}
                  </label>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-white min-w-[12rem]"
                  >
                    <option value="badFirst">{t('admin.journalStorageCheck.sortBadFirst')}</option>
                    <option value="learnerId_asc">{t('admin.journalStorageCheck.sortLearnerIdAsc')}</option>
                    <option value="learnerId_desc">{t('admin.journalStorageCheck.sortLearnerIdDesc')}</option>
                    <option value="username_asc">{t('admin.journalStorageCheck.sortUsernameAsc')}</option>
                    <option value="bucket_desc">{t('admin.journalStorageCheck.sortBucketDesc')}</option>
                    <option value="bucket_asc">{t('admin.journalStorageCheck.sortBucketAsc')}</option>
                    <option value="db_desc">{t('admin.journalStorageCheck.sortDbDesc')}</option>
                    <option value="db_asc">{t('admin.journalStorageCheck.sortDbAsc')}</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {t('admin.journalStorageCheck.exportCsv')}
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPrint}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {t('admin.journalStorageCheck.exportPrintPdf')}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin.journalStorageCheck.exportPrintHint')}</p>

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
                    {filteredSortedRows.map((row) => (
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
                          ) : viewingHistory ? (
                            <span className="text-xs text-slate-400">{t('admin.journalStorageCheck.historyNoDetail')}</span>
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
