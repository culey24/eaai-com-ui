import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ClipboardList, UserX, X } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import { ADMIN_SURVEY_TABS, SURVEY_KIND_PRETEST, SURVEY_KIND_POSTTEST } from '../../constants/surveyKinds'
import { ROLES } from '../../constants/roles'
import { aggregateSurveySubmissions, SURVEY_SECTION_A_KEYS } from '../../lib/surveyAggregate'
import { PRETEST_TOPICS } from '../../data/pretest/pretestTopics'
import { SECTION_C_ITEMS } from '../../data/pretest/sectionCItems'
import { getSectionBQuestions } from '../../data/pretest/sectionB'

const SURVEY_USERNAME_BLACKLIST_KEY = 'eeai_admin_survey_username_blacklist'

function normalizeSurveyUsername(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
}

function readBlacklistFromStorage() {
  try {
    const raw = localStorage.getItem(SURVEY_USERNAME_BLACKLIST_KEY)
    if (!raw) return []
    const p = JSON.parse(raw)
    if (!Array.isArray(p)) return []
    return [...new Set(p.map((x) => String(x ?? '').trim()).filter(Boolean))]
  } catch {
    return []
  }
}

function writeBlacklistToStorage(list) {
  try {
    localStorage.setItem(SURVEY_USERNAME_BLACKLIST_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

function topicLabel(id, lang) {
  const x = PRETEST_TOPICS.find((p) => p.id === id)
  if (!x) return id
  return lang === 'vi' ? x.title.vi : x.title.en
}

function DistributionBlock({ title, dist, total }) {
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return null
  return (
    <div className="mb-5">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">{title}</p>
      <div className="space-y-2">
        {entries.map(([label, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 1000) / 10 : 0
          return (
            <div key={label + String(count)} className="flex flex-col gap-0.5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-slate-600 dark:text-slate-400 break-words min-w-0">{label}</span>
                <span className="tabular-nums text-slate-800 dark:text-slate-100 shrink-0">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/80 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AdminSurveyResultsPage() {
  const { t, lang } = useLanguage()
  const { apiToken, user } = useAuth()
  const [activeKind, setActiveKind] = useState(SURVEY_KIND_PRETEST)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [blacklist, setBlacklist] = useState(() => readBlacklistFromStorage())
  const [blacklistInput, setBlacklistInput] = useState('')

  useEffect(() => {
    writeBlacklistToStorage(blacklist)
  }, [blacklist])

  const blacklistNormSet = useMemo(
    () => new Set(blacklist.map((u) => normalizeSurveyUsername(u))),
    [blacklist]
  )

  const submittersInRows = useMemo(() => {
    const byNorm = new Map()
    for (const r of rows) {
      const u = r?.username
      if (u == null || String(u).trim() === '') continue
      const n = normalizeSurveyUsername(u)
      if (!byNorm.has(n)) byNorm.set(n, String(u).trim())
    }
    return [...byNorm.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: 'base' }))
      .map(([norm, display]) => ({ norm, display }))
  }, [rows])

  const filteredRows = useMemo(
    () => rows.filter((r) => !blacklistNormSet.has(normalizeSurveyUsername(r?.username))),
    [rows, blacklistNormSet]
  )

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

  const stats = useMemo(() => aggregateSurveySubmissions(filteredRows), [filteredRows])

  const addBlacklistFromInput = () => {
    const u = blacklistInput.trim()
    if (!u) return
    const n = normalizeSurveyUsername(u)
    if (blacklistNormSet.has(n)) {
      setBlacklistInput('')
      return
    }
    setBlacklist((prev) => {
      if (prev.some((x) => normalizeSurveyUsername(x) === n)) return prev
      return [...prev, u]
    })
    setBlacklistInput('')
  }

  const removeBlacklist = (norm) => {
    setBlacklist((prev) => prev.filter((x) => normalizeSurveyUsername(x) !== norm))
  }

  const togglePickerUsername = (display, norm) => {
    if (blacklistNormSet.has(norm)) {
      removeBlacklist(norm)
    } else {
      setBlacklist((prev) => {
        if (prev.some((x) => normalizeSurveyUsername(x) === norm)) return prev
        return [...prev, display]
      })
    }
  }

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
          {t('admin.surveys.introStats')}
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

        {!error && !loading && rows.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-800/40 p-5 mb-6 max-w-4xl">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <UserX className="w-4 h-4 text-primary shrink-0" />
              {t('admin.surveys.blacklist.title')}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">{t('admin.surveys.blacklist.hint')}</p>

            <div className="flex flex-wrap gap-2 mb-4 min-h-[2rem]">
              {blacklist.length === 0 ? (
                <span className="text-xs text-slate-500 dark:text-slate-500">—</span>
              ) : (
                blacklist.map((u) => {
                  const n = normalizeSurveyUsername(u)
                  return (
                    <span
                      key={n}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 pl-2.5 pr-1 py-1 text-xs font-medium"
                    >
                      {u}
                      <button
                        type="button"
                        onClick={() => removeBlacklist(n)}
                        className="p-0.5 rounded-md hover:bg-slate-300/80 dark:hover:bg-slate-600"
                        aria-label="remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )
                })
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <input
                type="text"
                value={blacklistInput}
                onChange={(e) => setBlacklistInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addBlacklistFromInput()
                  }
                }}
                placeholder={t('admin.surveys.blacklist.addPlaceholder')}
                className="flex-1 min-w-[10rem] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={addBlacklistFromInput}
                className="rounded-xl bg-slate-200 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                {t('admin.surveys.blacklist.add')}
              </button>
              {blacklist.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setBlacklist([])}
                  className="rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t('admin.surveys.blacklist.clearAll')}
                </button>
              ) : null}
            </div>

            <div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('admin.surveys.blacklist.inDataset')}
              </p>
              {submittersInRows.length === 0 ? (
                <p className="text-xs text-slate-500">{t('admin.surveys.blacklist.noneInDataset')}</p>
              ) : (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-600 divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900/60">
                  {submittersInRows.map(({ norm, display }) => (
                    <label
                      key={norm}
                      className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    >
                      <input
                        type="checkbox"
                        checked={blacklistNormSet.has(norm)}
                        onChange={() => togglePickerUsername(display, norm)}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                      <span className="text-slate-800 dark:text-slate-100">{display}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {rows.length > 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 tabular-nums">
                {t('admin.surveys.blacklist.filteredMeta', {
                  n: filteredRows.length,
                  raw: rows.length,
                  excluded: rows.length - filteredRows.length,
                })}
              </p>
            ) : null}
          </section>
        ) : null}

        {error ? (
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        ) : loading ? (
          <p className="text-slate-500">{t('common.loading')}</p>
        ) : rows.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">{t('admin.surveys.empty')}</p>
        ) : filteredRows.length === 0 ? (
          <p className="text-amber-700 dark:text-amber-300 text-sm max-w-4xl">
            {t('admin.surveys.blacklist.filteredOutAll')}
          </p>
        ) : (
          <div className="space-y-10 max-w-4xl">
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              {t('admin.surveys.stats.total', { count: stats.n })}
            </p>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-6">
              <h2 className="text-lg font-semibold text-primary mb-4">{t('admin.surveys.stats.sectionA')}</h2>
              <div className="space-y-6">
                {SURVEY_SECTION_A_KEYS.filter((key) => key !== 'aiStudyPurpose').map((key) => {
                  let dist = { ...stats.sectionA[key] }
                  if (key === 'topicFirst' || key === 'topicSecond') {
                    dist = Object.fromEntries(
                      Object.entries(dist).map(([k, v]) => [topicLabel(k, lang), v])
                    )
                  }
                  return (
                    <DistributionBlock
                      key={key}
                      title={t(`admin.surveys.stats.aKeys.${key}`)}
                      dist={dist}
                      total={stats.n}
                    />
                  )
                })}
              <div className="mb-2">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                  {t('admin.surveys.stats.aKeys.aiStudyPurpose')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin.surveys.stats.freeTextHint')}</p>
              </div>
              </div>
              {stats.purposeSamples.length > 0 ? (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                    {t('admin.surveys.stats.aiPurposeSamples', { count: stats.purposeSamples.length })}
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-400 max-h-48 overflow-y-auto">
                    {stats.purposeSamples.slice(0, 25).map((s, i) => (
                      <li key={i} className="break-words">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-6">
              <h2 className="text-lg font-semibold text-primary mb-1">{t('admin.surveys.stats.sectionB')}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{t('admin.surveys.stats.topicNote')}</p>
              <div className="space-y-10">
                {Object.keys(stats.sectionB)
                  .sort()
                  .map((topicId) => {
                    const qs = getSectionBQuestions(topicId)
                    const topicStats = stats.sectionB[topicId]
                    return (
                      <div
                        key={topicId}
                        className="border border-slate-200 dark:border-slate-600 rounded-xl p-4 bg-white dark:bg-slate-900/50"
                      >
                        <h3 className="font-medium text-slate-900 dark:text-white mb-4">
                          {topicLabel(topicId, lang)}
                        </h3>
                        <div className="space-y-6">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                            const qk = `q${num}`
                            const dist = topicStats?.[qk] || {}
                            const qMeta = qs[num - 1]
                            const title = qMeta
                              ? `${t('admin.surveys.stats.qShort', { num })} — ${lang === 'vi' ? qMeta.prompt.vi : qMeta.prompt.en}`
                              : t('admin.surveys.stats.qShort', { num })
                            return (
                              <DistributionBlock
                                key={qk}
                                title={title}
                                dist={dist}
                                total={stats.n}
                              />
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-6">
              <h2 className="text-lg font-semibold text-primary mb-4">{t('admin.surveys.stats.sectionC')}</h2>
              <div className="space-y-6">
                {SECTION_C_ITEMS.map((item, idx) => {
                  const ck = `c${idx + 1}`
                  const distRaw = stats.sectionC[ck] || {}
                  const dist = Object.fromEntries(
                    [1, 2, 3, 4, 5].map((n) => [
                      `${n} — ${t(`pretest.likert.${n}`)}`,
                      distRaw[n] || 0,
                    ])
                  )
                  const title =
                    (lang === 'vi' ? `${idx + 1}. ${item.vi}` : `${idx + 1}. ${item.en}`)
                  return (
                    <DistributionBlock
                      key={ck}
                      title={title}
                      dist={dist}
                      total={stats.n}
                    />
                  )
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
