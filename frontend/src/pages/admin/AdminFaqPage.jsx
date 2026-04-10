import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Upload,
  Download,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import { ROLES } from '../../constants/roles'

const SAMPLE_CSV = `question_vi,answer_vi,question_en,answer_en,keywords_vi,keywords_en
"Ví dụ: Hạn nộp journal?","Hạn nộp theo từng đợt trên giao diện Journal.","What is the journal deadline?","Submit before the period closes on the Journal screen.","deadline|hạn nộp","deadline|submission"
`

function faqMatchesSearch(row, tokens) {
  if (tokens.length === 0) return true
  const kvi = Array.isArray(row.keywordsVi) ? row.keywordsVi : []
  const ken = Array.isArray(row.keywordsEn) ? row.keywordsEn : []
  const hay = [
    row.questionVi,
    row.answerVi,
    row.questionEn,
    row.answerEn,
    ...kvi,
    ...ken,
  ]
    .join(' ')
    .toLowerCase()
  return tokens.every((t) => hay.includes(t))
}

export default function AdminFaqPage() {
  const { t } = useLanguage()
  const { apiToken, user } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [questionVi, setQuestionVi] = useState('')
  const [answerVi, setAnswerVi] = useState('')
  const [keywordsViStr, setKeywordsViStr] = useState('')
  const [questionEn, setQuestionEn] = useState('')
  const [answerEn, setAnswerEn] = useState('')
  const [keywordsEnStr, setKeywordsEnStr] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const searchTokens = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return q.split(/\s+/).filter(Boolean)
  }, [searchQuery])

  const filteredList = useMemo(
    () => list.filter((row) => faqMatchesSearch(row, searchTokens)),
    [list, searchTokens]
  )

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const load = useCallback(async () => {
    if (!apiToken || user?.role !== ROLES.ADMIN) {
      setList([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const r = await fetch(`${API_BASE}/api/admin/faq`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`)
      setList(Array.isArray(data.faq) ? data.faq : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setList([])
    } finally {
      setLoading(false)
    }
  }, [apiToken, user?.role])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setEditingId(null)
    setQuestionVi('')
    setAnswerVi('')
    setKeywordsViStr('')
    setQuestionEn('')
    setAnswerEn('')
    setKeywordsEnStr('')
    setSortOrder(0)
    setIsActive(true)
  }

  const openCreate = () => {
    resetForm()
    const maxSo = list.reduce((m, x) => Math.max(m, Number(x.sortOrder) || 0), 0)
    setSortOrder(maxSo + 1)
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.id)
    setQuestionVi(row.questionVi || '')
    setAnswerVi(row.answerVi || '')
    setKeywordsViStr(Array.isArray(row.keywordsVi) ? row.keywordsVi.join(', ') : '')
    setQuestionEn(row.questionEn || '')
    setAnswerEn(row.answerEn || '')
    setKeywordsEnStr(Array.isArray(row.keywordsEn) ? row.keywordsEn.join(', ') : '')
    setSortOrder(Number(row.sortOrder) || 0)
    setIsActive(row.isActive !== false)
    setFormOpen(true)
  }

  const parseKeywords = (s) =>
    String(s || '')
      .split(/[,;]/)
      .map((x) => x.trim())
      .filter(Boolean)

  const saveManual = async () => {
    if (!apiToken) return
    const qv = questionVi.trim()
    const av = answerVi.trim()
    const qe = questionEn.trim()
    const ae = answerEn.trim()
    if (!qv || !av || !qe || !ae) {
      setError(t('admin.faq.validationRequired'))
      return
    }
    setSaving(true)
    setError('')
    try {
      const keywordsVi = parseKeywords(keywordsViStr)
      const keywordsEn = parseKeywords(keywordsEnStr)
      const payload = {
        questionVi: qv,
        answerVi: av,
        keywordsVi,
        questionEn: qe,
        answerEn: ae,
        keywordsEn,
        sortOrder,
        isActive,
      }
      if (editingId) {
        const r = await fetch(`${API_BASE}/api/admin/faq/${encodeURIComponent(editingId)}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`)
      } else {
        const r = await fetch(`${API_BASE}/api/admin/faq`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`)
      }
      setFormOpen(false)
      resetForm()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!apiToken || !window.confirm(t('admin.faq.confirmDelete'))) return
    setError('')
    try {
      const r = await fetch(`${API_BASE}/api/admin/faq/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      if (!r.ok && r.status !== 204) {
        const data = await r.json().catch(() => ({}))
        throw new Error(data.error || data.message || `HTTP ${r.status}`)
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const onCsvSelected = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !apiToken) return
    setImporting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch(`${API_BASE}/api/admin/faq/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiToken}` },
        body: fd,
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setImporting(false)
    }
  }

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'faq-sample-bilingual.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const localeBlock = (title, borderClass, children) => (
    <div
      className={`rounded-xl border ${borderClass} bg-slate-50/80 dark:bg-slate-800/40 p-4 space-y-3`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </p>
      {children}
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-auto">
      <div className="flex-shrink-0 px-10 lg:px-14 py-6 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-4">
        <Link
          to="/admin"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          {t('admin.faq.title')}
        </h1>
        <div className="flex flex-wrap gap-2 ml-auto">
          <button
            type="button"
            onClick={downloadSample}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="w-4 h-4" />
            {t('admin.faq.downloadSample')}
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium cursor-pointer hover:opacity-95 disabled:opacity-50">
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {t('admin.faq.importCsv')}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={importing}
              onChange={onCsvSelected}
            />
          </label>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-sm font-medium hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            {t('admin.faq.addManual')}
          </button>
        </div>
      </div>

      <div className="flex-1 px-10 lg:px-14 py-10 max-w-7xl mx-auto w-full space-y-8">
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-4xl">
          {t('admin.faq.intro')}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500 border-l-2 border-slate-200 dark:border-slate-600 pl-3 max-w-4xl">
          {t('admin.faq.vectorNote')}
        </p>

        {error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/90 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span>{t('common.loading')}</span>
          </div>
        ) : list.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 py-8">{t('admin.faq.empty')}</p>
        ) : (
          <>
            <div className="relative max-w-2xl">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('admin.faq.searchPlaceholder')}
                autoComplete="off"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/80 pl-12 pr-11 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                aria-label={t('admin.faq.searchPlaceholder')}
              />
              {searchQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label={t('admin.faq.searchClear')}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {filteredList.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 py-6">{t('admin.faq.searchNoResults')}</p>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredList.map((row) => {
                  const isOpen = expandedIds.has(row.id)
                  const kwVi = Array.isArray(row.keywordsVi) ? row.keywordsVi : []
                  const kwEn = Array.isArray(row.keywordsEn) ? row.keywordsEn : []
                  const displayIndex = list.findIndex((x) => x.id === row.id) + 1
                  return (
                    <div
                      key={row.id}
                      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 shadow-sm overflow-hidden"
                    >
                      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:p-7">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(row.id)}
                            aria-expanded={isOpen}
                            aria-label={isOpen ? t('admin.faq.collapseRow') : t('admin.faq.expandRow')}
                            className="flex flex-1 min-w-0 gap-3 sm:gap-4 text-left rounded-xl -m-2 p-2 hover:bg-slate-50/90 dark:hover:bg-slate-800/70 transition-colors"
                          >
                            <ChevronRight
                              className={`w-5 h-5 shrink-0 mt-0.5 text-slate-400 transition-transform duration-200 ${
                                isOpen ? 'rotate-90' : ''
                              }`}
                              aria-hidden
                            />
                            <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400 w-7 shrink-0">
                              {displayIndex}
                            </span>
                            <div className="flex-1 min-w-0 space-y-2">
                              <p className="font-medium text-slate-800 dark:text-slate-100 text-[15px] leading-snug">
                                {row.questionVi}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">
                                {row.questionEn || '—'}
                              </p>
                              {!isOpen ? (
                                <div className="space-y-1 pt-1">
                                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                                    {row.answerVi}
                                  </p>
                                  <p className="text-sm text-slate-500 dark:text-slate-500 line-clamp-1">
                                    {row.answerEn || '—'}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          </button>
                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-end gap-3 shrink-0 pl-8 sm:pl-0">
                            <span
                              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                row.isActive
                                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {row.isActive ? t('admin.faq.colActive') : t('admin.faq.inactive')}
                            </span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEdit(row)
                                }}
                                className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                                aria-label={t('admin.faq.edit')}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  remove(row.id)
                                }}
                                className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                                aria-label={t('admin.faq.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        {isOpen ? (
                          <div className="border-t border-slate-100 dark:border-slate-700 pt-5 pl-0 sm:pl-[3.25rem]">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                              {localeBlock(
                                t('admin.faq.localeVi'),
                                'border-amber-200/80 dark:border-amber-900/40',
                                <>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-1">
                                      {t('admin.faq.colQuestion')}
                                    </p>
                                    <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                                      {row.questionVi}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-1">
                                      {t('admin.faq.colAnswer')}
                                    </p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                      {row.answerVi}
                                    </p>
                                  </div>
                                  {kwVi.length > 0 ? (
                                    <div>
                                      <p className="text-xs font-semibold text-slate-500 mb-2">
                                        {t('admin.faq.colKeywords')}
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {kwVi.map((k, ki) => (
                                          <span
                                            key={`vi-${k}-${ki}`}
                                            className="inline-flex rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 px-3 py-1 text-xs"
                                          >
                                            {k}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </>
                              )}
                              {localeBlock(
                                t('admin.faq.localeEn'),
                                'border-sky-200/80 dark:border-sky-900/40',
                                <>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-1">
                                      {t('admin.faq.colQuestion')}
                                    </p>
                                    <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                                      {row.questionEn || '—'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-1">
                                      {t('admin.faq.colAnswer')}
                                    </p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                      {row.answerEn || '—'}
                                    </p>
                                  </div>
                                  {kwEn.length > 0 ? (
                                    <div>
                                      <p className="text-xs font-semibold text-slate-500 mb-2">
                                        {t('admin.faq.colKeywords')}
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {kwEn.map((k, ki) => (
                                          <span
                                            key={`en-${k}-${ki}`}
                                            className="inline-flex rounded-full bg-sky-50 dark:bg-sky-900/25 text-sky-900 dark:text-sky-100 px-3 py-1 text-xs"
                                          >
                                            {k}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {formOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-5xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-700 p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              {editingId ? t('admin.faq.editTitle') : t('admin.faq.createTitle')}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-4 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 p-4 sm:p-5">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  {t('admin.faq.localeVi')}
                </p>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-500">{t('admin.faq.colQuestion')}</span>
                  <textarea
                    value={questionVi}
                    onChange={(e) => setQuestionVi(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-500">{t('admin.faq.colAnswer')}</span>
                  <textarea
                    value={answerVi}
                    onChange={(e) => setAnswerVi(e.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-500">{t('admin.faq.keywordsHint')}</span>
                  <input
                    type="text"
                    value={keywordsViStr}
                    onChange={(e) => setKeywordsViStr(e.target.value)}
                    placeholder={t('admin.faq.keywordsPlaceholder')}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="space-y-4 rounded-xl border border-sky-200/80 dark:border-sky-900/40 bg-sky-50/30 dark:bg-sky-950/20 p-4 sm:p-5">
                <p className="text-sm font-bold text-sky-900 dark:text-sky-200">
                  {t('admin.faq.localeEn')}
                </p>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-500">{t('admin.faq.colQuestion')}</span>
                  <textarea
                    value={questionEn}
                    onChange={(e) => setQuestionEn(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-500">{t('admin.faq.colAnswer')}</span>
                  <textarea
                    value={answerEn}
                    onChange={(e) => setAnswerEn(e.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-slate-500">{t('admin.faq.keywordsHint')}</span>
                  <input
                    type="text"
                    value={keywordsEnStr}
                    onChange={(e) => setKeywordsEnStr(e.target.value)}
                    placeholder={t('admin.faq.keywordsPlaceholder')}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center border-t border-slate-100 dark:border-slate-700 pt-4">
              <label className="flex items-center gap-2 text-sm">
                <span className="text-slate-600 dark:text-slate-400">{t('admin.faq.sortOrder')}</span>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-24 rounded-xl border border-slate-200 dark:border-slate-600 text-sm px-2 py-1"
                />
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>{t('admin.faq.colActive')}</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false)
                  resetForm()
                }}
                className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={saveManual}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
