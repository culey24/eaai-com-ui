import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ClipboardList, Eye } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import { ADMIN_SURVEY_TABS, SURVEY_KIND_PRETEST, SURVEY_KIND_POSTTEST } from '../../constants/surveyKinds'
import { ROLES } from '../../constants/roles'

export default function AdminSurveyResultsPage() {
  const { t } = useLanguage()
  const { apiToken, user } = useAuth()
  const [activeKind, setActiveKind] = useState(SURVEY_KIND_PRETEST)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)

  const fetchList = useCallback(async () => {
    if (!apiToken || user?.role !== ROLES.ADMIN) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/survey-submissions?kind=${encodeURIComponent(activeKind)}`,
        { headers: { Authorization: `Bearer ${apiToken}` } }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || data.message || `HTTP ${res.status}`)
        setRows([])
        return
      }
      setRows(Array.isArray(data.submissions) ? data.submissions : [])
    } catch {
      setError(t('admin.surveys.loadError'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [apiToken, user?.role, activeKind, t])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
        <Link
          to="/admin"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-slate-800 dark:text-white text-lg">
            {t('admin.surveys.title')}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl mb-6">
          {t('admin.surveys.intro')}
        </p>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
          {ADMIN_SURVEY_TABS.map(({ kind, labelKey }) => (
            <button
              key={kind}
              type="button"
              onClick={() => setActiveKind(kind)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeKind === kind
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {activeKind === SURVEY_KIND_POSTTEST && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100 mb-6">
            {t('admin.surveys.posttestHint')}
          </div>
        )}

        {error ? (
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        ) : loading ? (
          <p className="text-slate-500">{t('common.loading')}</p>
        ) : rows.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">{t('admin.surveys.empty')}</p>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                    {t('admin.surveys.colUser')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                    {t('admin.surveys.colClass')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                    {t('admin.surveys.colSubmitted')}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 w-24">
                    {t('admin.surveys.colDetail')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800 dark:text-white">{r.username}</span>
                      <span className="block text-xs text-slate-500">{r.fullname}</span>
                      <span className="text-xs text-slate-400">{r.userId}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {r.classCode || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleString(undefined, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setDetail(r)}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Eye className="w-4 h-4" />
                        {t('admin.surveys.view')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl">
            <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {detail.username} · {detail.surveyKind}
                </p>
                <p className="text-xs text-slate-500">{detail.userId}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-sm"
              >
                {t('common.cancel')}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-mono">
              <div>
                <p className="text-sm font-sans font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  sectionA
                </p>
                <pre className="whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(detail.sectionA, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-sm font-sans font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  sectionB
                </p>
                <pre className="whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto max-h-64">
                  {JSON.stringify(detail.sectionB, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-sm font-sans font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  sectionC
                </p>
                <pre className="whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(detail.sectionC, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
