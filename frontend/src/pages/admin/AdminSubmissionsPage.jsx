import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Plus, Pencil, Trash2, Calendar, Copy, Download, Link2, Unlink, Shield, ChevronDown, RefreshCw } from 'lucide-react'
import { useJournal } from '../../context/JournalContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import { ROLES } from '../../constants/roles'
import { exportJournalSubmissionsMatrixCsv } from '../../lib/journalMatrixCsvExport'

export default function AdminSubmissionsPage() {
  const { t } = useLanguage()
  const { getSubmissions, addSubmission, updateSubmission, deleteSubmission } = useJournal()
  const { apiToken, user } = useAuth()
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formStartsAt, setFormStartsAt] = useState('')
  const [formEndsAt, setFormEndsAt] = useState('')
  const [formRequirePosttest, setFormRequirePosttest] = useState(false)
  const [formRequirePosttest2, setFormRequirePosttest2] = useState(false)
  const [formIsEndOfCourse, setFormIsEndOfCourse] = useState(false)
  const [formIsPosttest, setFormIsPosttest] = useState(false)
  const [formIsPosttest2, setFormIsPosttest2] = useState(false)
  const [copyingEmailsForPeriodId, setCopyingEmailsForPeriodId] = useState(null)
  const [exportingCsv, setExportingCsv] = useState(false)

  // Quản lý link tải shared (thu hồi / bỏ thu hồi)
  const [linkPanelOpen, setLinkPanelOpen] = useState(false)
  const [linkRows, setLinkRows] = useState([])
  const [revokedKeys, setRevokedKeys] = useState(new Set())
  const [linkPanelLoading, setLinkPanelLoading] = useState(false)
  const [mutatingKey, setMutatingKey] = useState('')

  const submissions = getSubmissions()
  const submissionIdsKey = useMemo(() => submissions.map((s) => s.id).join('|'), [submissions])

  /** periodId → { loading_, error, submitted, total, byClass } từ journal_uploads + users */
  const [periodServerStats, setPeriodServerStats] = useState({})

  useEffect(() => {
    if (!apiToken || user?.role !== ROLES.ADMIN) {
      setPeriodServerStats({})
      return
    }
    const ids = submissions.map((s) => s.id)
    if (ids.length === 0) {
      setPeriodServerStats({})
      return
    }
    let cancelled = false
    setPeriodServerStats((prev) => {
      const next = { ...prev }
      for (const id of ids) {
        next[id] = { loading: true, error: null, submitted: 0, total: 0, byClass: [] }
      }
      return next
    })
    Promise.all(
      ids.map(async (periodId) => {
        try {
          const r = await fetch(
            `${API_BASE}/api/admin/journal-upload-stats?periodId=${encodeURIComponent(periodId)}`,
            { headers: { Authorization: `Bearer ${apiToken}` } }
          )
          const data = await r.json().catch(() => ({}))
          if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`)
          return {
            periodId,
            payload: {
              loading: false,
              error: null,
              submitted: Number(data.submitted) || 0,
              total: Number(data.total) || 0,
              byClass: Array.isArray(data.byClass) ? data.byClass : [],
            },
          }
        } catch (e) {
          return {
            periodId,
            payload: {
              loading: false,
              error: e instanceof Error ? e.message : String(e),
              submitted: 0,
              total: 0,
              byClass: [],
            },
          }
        }
      })
    ).then((results) => {
      if (cancelled) return
      const next = {}
      for (const { periodId, payload } of results) {
        next[periodId] = payload
      }
      setPeriodServerStats(next)
    })
    return () => {
      cancelled = true
    }
  }, [apiToken, user?.role, submissionIdsKey])

  const formatTs = (ts) =>
    new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

  const now = Date.now()
  const isOpenWindow = (sub) => sub.startsAt <= now && sub.endsAt > now
  const isScheduled = (sub) => sub.startsAt > now

  const handleCreate = async () => {
    if (!formTitle.trim() || !formStartsAt || !formEndsAt) return
    if (new Date(formStartsAt).getTime() >= new Date(formEndsAt).getTime()) return
    try {
      await addSubmission(formTitle.trim(), formDescription.trim(), formStartsAt, formEndsAt, {
        requirePosttest: formRequirePosttest,
        requirePosttest2: formRequirePosttest2,
        isEndOfCourse: formIsEndOfCourse,
        isPosttest: formIsPosttest,
        isPosttest2: formIsPosttest2,
      })
      setFormTitle('')
      setFormDescription('')
      setFormStartsAt('')
      setFormEndsAt('')
      setFormRequirePosttest(false)
      setFormRequirePosttest2(false)
      setFormIsEndOfCourse(false)
      setFormIsPosttest(false)
      setFormIsPosttest2(false)
      setShowForm(false)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e))
    }
  }

  const handleUpdate = async () => {
    if (!editingId || !formTitle.trim() || !formStartsAt || !formEndsAt) return
    if (new Date(formStartsAt).getTime() >= new Date(formEndsAt).getTime()) return
    try {
      await updateSubmission(editingId, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        startsAt: new Date(formStartsAt).getTime(),
        endsAt: new Date(formEndsAt).getTime(),
        requirePosttest: formRequirePosttest,
        requirePosttest2: formRequirePosttest2,
        isEndOfCourse: formIsEndOfCourse,
        isPosttest: formIsPosttest,
        isPosttest2: formIsPosttest2,
      })
      setEditingId(null)
      setFormTitle('')
      setFormDescription('')
      setFormStartsAt('')
      setFormEndsAt('')
      setFormRequirePosttest(false)
      setFormRequirePosttest2(false)
      setFormIsEndOfCourse(false)
      setFormIsPosttest(false)
      setFormIsPosttest2(false)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.submissions.confirmDelete'))) return
    try {
      await deleteSubmission(id)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e))
    }
  }

  const startEdit = (sub) => {
    setEditingId(sub.id)
    setFormTitle(sub.title)
    setFormDescription(sub.description || '')
    setFormStartsAt(new Date(sub.startsAt).toISOString().slice(0, 16))
    setFormEndsAt(new Date(sub.endsAt).toISOString().slice(0, 16))
    setFormRequirePosttest(!!sub.requirePosttest)
    setFormRequirePosttest2(!!sub.requirePosttest2)
    setFormIsEndOfCourse(!!sub.isEndOfCourse)
    setFormIsPosttest(!!sub.isPosttest)
    setFormIsPosttest2(!!sub.isPosttest2)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormTitle('')
    setFormDescription('')
    setFormStartsAt('')
    setFormEndsAt('')
    setFormRequirePosttest(false)
    setFormRequirePosttest2(false)
    setFormIsEndOfCourse(false)
    setFormIsPosttest(false)
    setFormIsPosttest2(false)
    setShowForm(false)
  }

  const exportSubmissionsMatrixCsv = async () => {
    if (!apiToken || user?.role !== ROLES.ADMIN) return
    setExportingCsv(true)
    try {
      await exportJournalSubmissionsMatrixCsv({ apiToken, t })
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e))
    } finally {
      setExportingCsv(false)
    }
  }

  const copyPendingSubmissionEmails = async (periodId) => {
    if (!apiToken || user?.role !== ROLES.ADMIN) return
    setCopyingEmailsForPeriodId(periodId)
    try {
      const r = await fetch(
        `${API_BASE}/api/admin/journal-upload-stats?periodId=${encodeURIComponent(periodId)}&pendingEmails=1`,
        { headers: { Authorization: `Bearer ${apiToken}` } }
      )
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`)
      const list = Array.isArray(data.pendingEmails) ? data.pendingEmails : []
      if (list.length === 0) {
        window.alert(t('admin.submissions.copyPendingEmailsNone'))
        return
      }
      const text = list.join(', ')
      try {
        await navigator.clipboard.writeText(text)
        window.alert(t('admin.submissions.copyPendingEmailsSuccess', { count: list.length }))
      } catch {
        window.prompt(t('admin.submissions.copyPendingEmailsFallback'), text)
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e))
    } finally {
      setCopyingEmailsForPeriodId(null)
    }
  }

  const loadDownloadLinkData = async () => {
    if (!apiToken || user?.role !== ROLES.ADMIN) return
    setLinkPanelLoading(true)
    try {
      const [matrixRes, revokedRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/journal-submissions-matrix`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        }),
        fetch(`${API_BASE}/api/admin/journal-download-links/revoked`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        }),
      ])
      const matrix = await matrixRes.json().catch(() => ({}))
      const revokedData = await revokedRes.json().catch(() => ({}))
      if (!matrixRes.ok) throw new Error(matrix.error || matrix.message || `HTTP ${matrixRes.status}`)
      const periods = Array.isArray(matrix.periods) ? matrix.periods : []
      const rows = Array.isArray(matrix.rows) ? matrix.rows : []
      const flat = []
      for (const row of rows) {
        const uid = row?.userId != null ? String(row.userId) : ''
        const by = row?.uploadsByPeriod && typeof row.uploadsByPeriod === 'object' ? row.uploadsByPeriod : {}
        for (const p of periods) {
          const pid = p?.periodId != null ? String(p.periodId) : ''
          const info = pid ? by[pid] : null
          const upId = info?.uploadId != null ? String(info.uploadId) : ''
          if (!uid || !upId) continue
          flat.push({
            key: `journal:${uid}:${upId}`,
            userId: uid,
            username: row?.username || '',
            fullName: row?.fullName || '',
            periodId: pid,
            periodTitle: p?.title || pid,
            uploadId: upId,
            fileName: info?.originalFileName || '',
            downloadUrl: info?.downloadUrl ? `${API_BASE}${info.downloadUrl}` : '',
          })
        }
      }
      const revokedSet = new Set(
        Array.isArray(revokedData.revoked) ? revokedData.revoked.map((r) => r.downloadKey) : []
      )
      setLinkRows(flat)
      setRevokedKeys(revokedSet)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e))
    } finally {
      setLinkPanelLoading(false)
    }
  }

  const toggleRevokeLink = async (row) => {
    if (!apiToken || user?.role !== ROLES.ADMIN) return
    setMutatingKey(row.key)
    const isRevoked = revokedKeys.has(row.key)
    try {
      const r = await fetch(
        `${API_BASE}/api/admin/journal-download-links/${isRevoked ? 'unrevoke' : 'revoke'}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ learnerId: row.userId, uploadId: row.uploadId }),
        }
      )
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`)
      setRevokedKeys((prev) => {
        const next = new Set(prev)
        if (isRevoked) next.delete(row.key)
        else next.add(row.key)
        return next
      })
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e))
    } finally {
      setMutatingKey('')
    }
  }

  const copyDownloadLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      window.alert('Đã copy link tải file.')
    } catch {
      window.prompt('Copy link tải file:', url)
    }
  }

  const dateTimeFields = (
    <>
      <div>
        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
          {t('admin.submissions.startsAtLabel')}
        </label>
        <input
          type="datetime-local"
          value={formStartsAt}
          onChange={(e) => setFormStartsAt(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
          {t('admin.submissions.endsAtLabel')}
        </label>
        <input
          type="datetime-local"
          value={formEndsAt}
          onChange={(e) => setFormEndsAt(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
        />
      </div>
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          {t('admin.submissions.requirePosttestLabel') || 'Gating Rule (Requires Survey to Submit)'}
        </p>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={formRequirePosttest}
            onChange={(e) => setFormRequirePosttest(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          {t('admin.submissions.requirePosttestLabel')}
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={formRequirePosttest2}
            onChange={(e) => setFormRequirePosttest2(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          {t('admin.submissions.requirePosttest2Label')}
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={formIsEndOfCourse}
            onChange={(e) => setFormIsEndOfCourse(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          {t('admin.submissions.isEndOfCourseLabel')}
        </label>
      </div>
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          Survey-Only Rule (No file submission)
        </p>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={formIsPosttest}
            onChange={(e) => setFormIsPosttest(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          {t('admin.submissions.isPosttestLabel')}
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={formIsPosttest2}
            onChange={(e) => setFormIsPosttest2(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          {t('admin.submissions.isPosttest2Label')}
        </label>
      </div>
    </>
  )

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t('admin.submissions.title')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t('admin.submissions.desc')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {apiToken && user?.role === ROLES.ADMIN && (
            <button
              type="button"
              onClick={() => void exportSubmissionsMatrixCsv()}
              disabled={exportingCsv}
              title={t('admin.submissions.exportCsvTitle')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {exportingCsv ? t('admin.submissions.exportCsvLoading') : t('admin.submissions.exportCsv')}
            </button>
          )}
          {!showForm && !editingId && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('admin.submissions.create')}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {apiToken && user?.role === ROLES.ADMIN && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  const next = !linkPanelOpen
                  setLinkPanelOpen(next)
                  if (next) void loadDownloadLinkData()
                }}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/40"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Quản lý link tải file (submissions)
                  {revokedKeys.size > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                      {revokedKeys.size} đã thu hồi
                    </span>
                  )}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${linkPanelOpen ? 'rotate-180' : ''}`} />
              </button>
              {linkPanelOpen && (
                <div className="border-t border-slate-100 dark:border-slate-700">
                  <div className="p-4 flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Link ký vĩnh viễn (không cần đăng nhập) được nhúng vào CSV khi xuất. Thu hồi để chặn link ngay lập tức.
                    </p>
                    <button
                      type="button"
                      onClick={() => void loadDownloadLinkData()}
                      disabled={linkPanelLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-60 shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${linkPanelLoading ? 'animate-spin' : ''}`} />
                      Làm mới
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto px-4 pb-4">
                    {linkPanelLoading ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">Đang tải danh sách...</p>
                    ) : linkRows.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">Chưa có submission nào.</p>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-700 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <th className="py-2 pr-3">Học viên</th>
                            <th className="py-2 pr-3">Đợt nộp</th>
                            <th className="py-2 pr-3">File</th>
                            <th className="py-2 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                          {linkRows.map((row) => {
                            const revoked = revokedKeys.has(row.key)
                            const busy = mutatingKey === row.key
                            return (
                              <tr key={row.key} className={revoked ? 'opacity-60' : ''}>
                                <td className="py-2 pr-3">
                                  <div className="font-medium text-slate-800 dark:text-white">
                                    {row.fullName || row.username}
                                  </div>
                                  <div className="text-xs text-slate-400">@{row.username}</div>
                                </td>
                                <td className="py-2 pr-3 text-slate-600 dark:text-slate-300">{row.periodTitle}</td>
                                <td className="py-2 pr-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                                      {row.fileName || row.uploadId}
                                    </span>
                                    {row.downloadUrl && (
                                      <button
                                        type="button"
                                        onClick={() => void copyDownloadLink(row.downloadUrl)}
                                        title="Copy link tải"
                                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => void toggleRevokeLink(row)}
                                    disabled={busy || !row.downloadUrl}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-50 ${
                                      revoked
                                        ? 'border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                        : 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    }`}
                                  >
                                    {busy ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : revoked ? (
                                      <Link2 className="w-3.5 h-3.5" />
                                    ) : (
                                      <Unlink className="w-3.5 h-3.5" />
                                    )}
                                    {revoked ? 'Bỏ thu hồi' : 'Thu hồi'}
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {showForm && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
                {t('admin.submissions.create')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.submissions.titleLabel')}
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={t('admin.submissions.titlePlaceholder')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.submissions.descriptionLabel')}
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder={t('admin.submissions.descriptionPlaceholder')}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white resize-none"
                  />
                </div>
                {dateTimeFields}
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
                  >
                    {t('common.save')}
                  </button>
                  <button onClick={cancelEdit} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm">
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {submissions.length === 0 && !showForm ? (
            <div className="text-center py-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">{t('admin.submissions.noSubmissions')}</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
              >
                {t('admin.submissions.create')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => {
                const srv = periodServerStats[sub.id]
                const statsByClass =
                  srv && !srv.loading && !srv.error && Array.isArray(srv.byClass)
                    ? srv.byClass.filter((row) => row.total > 0)
                    : []
                const open = isOpenWindow(sub)
                const scheduled = isScheduled(sub)
                const isEditing = editingId === sub.id
                const notSubmittedCount =
                  srv && !srv.loading && !srv.error ? Math.max(0, (srv.total || 0) - (srv.submitted || 0)) : 0
                const showCopyPendingEmails =
                  Boolean(apiToken) &&
                  user?.role === ROLES.ADMIN &&
                  srv &&
                  !srv.loading &&
                  !srv.error &&
                  notSubmittedCount > 0

                return (
                  <div
                    key={sub.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
                  >
                    {isEditing ? (
                      <div className="p-6 space-y-4">
                        <input
                          type="text"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          placeholder={t('admin.submissions.titlePlaceholder')}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                        <textarea
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          placeholder={t('admin.submissions.descriptionPlaceholder')}
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white resize-none"
                        />
                        <input
                          type="datetime-local"
                          value={formStartsAt}
                          onChange={(e) => setFormStartsAt(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                        <input
                          type="datetime-local"
                          value={formEndsAt}
                          onChange={(e) => setFormEndsAt(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            {t('admin.submissions.requirePosttestLabel') || 'Gating Rule (Requires Survey to Submit)'}
                          </p>
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={formRequirePosttest}
                              onChange={(e) => setFormRequirePosttest(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            {t('admin.submissions.requirePosttestLabel')}
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={formRequirePosttest2}
                              onChange={(e) => setFormRequirePosttest2(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            {t('admin.submissions.requirePosttest2Label')}
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={formIsEndOfCourse}
                              onChange={(e) => setFormIsEndOfCourse(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            {t('admin.submissions.isEndOfCourseLabel')}
                          </label>
                        </div>
                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Survey-Only Rule (No file submission)
                          </p>
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={formIsPosttest}
                              onChange={(e) => setFormIsPosttest(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            {t('admin.submissions.isPosttestLabel')}
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={formIsPosttest2}
                              onChange={(e) => setFormIsPosttest2(e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            {t('admin.submissions.isPosttest2Label')}
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdate}
                            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
                          >
                            {t('common.save')}
                          </button>
                          <button onClick={cancelEdit} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm">
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-6 h-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-800 dark:text-white truncate">{sub.title}</h3>
                            {sub.description && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {sub.description}
                              </p>
                            )}
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {t('admin.submissions.startsAtLabel')}: {formatTs(sub.startsAt)}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {t('admin.submissions.endsAtLabel')}: {formatTs(sub.endsAt)}
                            </p>
                            <div className="flex gap-2 mt-2 items-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  open
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : scheduled
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {open
                                  ? t('admin.submissions.active')
                                  : scheduled
                                    ? t('admin.submissions.scheduled')
                                    : t('admin.submissions.ended')}
                              </span>
                              {sub.requirePosttest && (
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                                  Post-test
                                </span>
                              )}
                              {sub.requirePosttest2 && (
                                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                                  Post-test 2
                                </span>
                              )}
                              {sub.isEndOfCourse && (
                                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                                  End of Course
                                </span>
                              )}
                              {sub.isPosttest && (
                                <span className="px-2 py-0.5 rounded bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 text-[10px] font-bold uppercase tracking-wider">
                                  Post-test 1 Only
                                </span>
                              )}
                              {sub.isPosttest2 && (
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                                  Post-test 2 Only
                                </span>
                              )}
                            </div>
                            <div className="mt-2 space-y-1">
                              {!srv || srv.loading ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.submissions.statsLoading')}</p>
                              ) : srv.error ? (
                                <p className="text-sm text-red-600 dark:text-red-400">{srv.error}</p>
                              ) : (
                                <>
                                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                    {t('admin.membersSubmitted', { submitted: srv.submitted, total: srv.total })}
                                  </p>
                                  {statsByClass.map(({ classCode, submitted, total }) => (
                                    <p key={classCode} className="text-sm text-slate-500 dark:text-slate-400 pl-0">
                                      {t('admin.classLabel', { code: classCode })}:{' '}
                                      {t('admin.journalSubmitted', { submitted, total })}
                                    </p>
                                  ))}
                                  {statsByClass.length === 0 && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                      {srv.total === 0 ? t('admin.noMembers') : t('admin.submissions.noClassBreakdown')}
                                    </p>
                                  )}
                                  {showCopyPendingEmails && (
                                    <button
                                      type="button"
                                      onClick={() => void copyPendingSubmissionEmails(sub.id)}
                                      disabled={copyingEmailsForPeriodId === sub.id}
                                      title={t('admin.submissions.copyPendingEmailsTitle')}
                                      className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-60"
                                    >
                                      <Copy className="w-4 h-4 shrink-0" />
                                      {copyingEmailsForPeriodId === sub.id
                                        ? t('admin.submissions.copyPendingEmailsLoading')
                                        : t('admin.submissions.copyPendingEmails')}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => startEdit(sub)}
                            title={t('admin.submissions.edit')}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id)}
                            title={t('admin.submissions.delete')}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
