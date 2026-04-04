import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users, FileText, Check, X, Ban } from 'lucide-react'
import { useAllUsers } from '../../hooks/useAllUsers'
import { useAdmin } from '../../context/AdminContext'
import { useJournal } from '../../context/JournalContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { VALID_CLASS_CODES, ROLES } from '../../constants/roles'
import { CLASS_TO_MODE, hasSupporterMode, getTheoreticalRosterForClass } from '../../constants/admin'
import { API_BASE } from '../../config/api'

function normUsername(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
}

export default function AdminClassesPage() {
  const { t } = useLanguage()
  const { apiToken, user } = useAuth()
  const { getByClass } = useAllUsers()
  const { getSubmissionStats, getJournalsForUser } = useJournal()
  const { assignments } = useAdmin()
  const [expandedClass, setExpandedClass] = useState(null)
  const [blacklistNorm, setBlacklistNorm] = useState(() => new Set())
  const [exclusionsError, setExclusionsError] = useState('')

  useEffect(() => {
    if (!apiToken || user?.role !== ROLES.ADMIN) {
      setBlacklistNorm(new Set())
      setExclusionsError('')
      return
    }
    let cancelled = false
    setExclusionsError('')
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
        const next = new Set(
          (Array.isArray(data.exclusions) ? data.exclusions : []).map((e) =>
            normUsername(e.usernameNormalized)
          )
        )
        setBlacklistNorm(next)
      })
      .catch(() => {
        if (!cancelled) {
          setBlacklistNorm(new Set())
          setExclusionsError(t('admin.classListPage.loadExclusionsError'))
        }
      })
    return () => {
      cancelled = true
    }
  }, [apiToken, user?.role, t])

  const getTeachingMode = (classCode) => CLASS_TO_MODE[classCode] || 'MANUAL'
  const getModeLabel = (mode) => t(`admin.teachingMode.${mode}`) || mode

  const classSummaries = useMemo(() => {
    return VALID_CLASS_CODES.map((classCode) => {
      const classMembers = getByClass(classCode)
      const learnersAll = classMembers.filter((u) => u.role === ROLES.LEARNER)
      const learnersNet = learnersAll.filter((u) => !blacklistNorm.has(normUsername(u.username)))
      const learnersExcluded = learnersAll.filter((u) => blacklistNorm.has(normUsername(u.username)))
      const theoretical = getTheoreticalRosterForClass(classCode)
      const participationPct =
        theoretical && theoretical > 0 ? (learnersNet.length / theoretical) * 100 : null
      const stats = getSubmissionStats(learnersNet.map((m) => m.id))
      return {
        classCode,
        learnersNet,
        learnersExcluded,
        theoretical,
        participationPct,
        stats,
      }
    })
  }, [getByClass, getSubmissionStats, blacklistNorm])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
        <Link to="/admin" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          {t('admin.classList')}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('admin.classListPage.intro')}
          </p>
          {exclusionsError ? (
            <p className="text-sm text-amber-700 dark:text-amber-300" role="alert">
              {exclusionsError}
            </p>
          ) : null}

          {classSummaries.map(
            ({
              classCode,
              learnersNet,
              learnersExcluded,
              theoretical,
              participationPct,
              stats,
            }) => {
              const mode = getTeachingMode(classCode)
              const isExpanded = expandedClass === classCode
              const participationLabel =
                participationPct != null
                  ? `${Math.round(participationPct * 10) / 10}%`
                  : '—'

              return (
                <div
                  key={classCode}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedClass(isExpanded ? null : classCode)}
                    className="w-full px-6 py-4 flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {t('admin.classLabel', { code: classCode })}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {t('admin.mode')}: {getModeLabel(mode)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-primary tabular-nums">
                        {learnersNet.length} {t('admin.classListPage.countUnit')}{' '}
                        <span className="text-slate-500 dark:text-slate-400 font-normal">
                          ({t('admin.classListPage.registeredNet')})
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      <div className="rounded-lg bg-white/70 dark:bg-slate-900/40 px-3 py-2 border border-slate-200/80 dark:border-slate-600/60">
                        <p className="text-slate-500 dark:text-slate-500 text-[11px] uppercase tracking-wide mb-0.5">
                          {t('admin.classListPage.theoretical')}
                        </p>
                        <p className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                          {theoretical != null ? theoretical : '—'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/70 dark:bg-slate-900/40 px-3 py-2 border border-slate-200/80 dark:border-slate-600/60">
                        <p className="text-slate-500 dark:text-slate-500 text-[11px] uppercase tracking-wide mb-0.5">
                          {t('admin.classListPage.participation')}
                        </p>
                        <p className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                          {participationLabel}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/70 dark:bg-slate-900/40 px-3 py-2 border border-slate-200/80 dark:border-slate-600/60 sm:col-span-2 lg:col-span-2">
                        <p className="text-slate-500 dark:text-slate-500 text-[11px] uppercase tracking-wide mb-0.5">
                          {t('admin.classListPage.registeredGross')}
                        </p>
                        <p className="tabular-nums text-slate-800 dark:text-slate-100">
                          {learnersNet.length + learnersExcluded.length}
                          {learnersExcluded.length > 0 ? (
                            <span className="text-slate-500 dark:text-slate-500 ml-1">
                              ({learnersExcluded.length} {t('admin.classListPage.badgeExcluded').toLowerCase()})
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span>
                        {t('admin.journalStatus')}:{' '}
                        {t('admin.journalSubmitted', { submitted: stats.submitted, total: stats.total })}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                      {learnersNet.length === 0 && learnersExcluded.length === 0 ? (
                        <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                          {t('admin.noMembers')}
                        </div>
                      ) : (
                        <>
                          {learnersNet.map((m) => {
                            const assignment = assignments[m.id]
                            const journals = getJournalsForUser(m.id) || []
                            const submitted = journals.length > 0
                            const modeRow = getTeachingMode(classCode)
                            const usesSupporter = hasSupporterMode(classCode)

                            return (
                              <div
                                key={m.id}
                                className="px-6 py-4 flex items-center justify-between gap-4"
                              >
                                <div>
                                  <span className="font-medium text-slate-800 dark:text-white">
                                    {m.username}
                                  </span>
                                  <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">
                                    {usesSupporter
                                      ? assignment
                                        ? `${t('admin.supporter')}: ${assignment.supporterId}`
                                        : t('admin.noSupporter')
                                      : t(`admin.teachingMode.${modeRow}`)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-slate-500">
                                    {t('admin.journalStatus')}:{' '}
                                    {submitted ? (
                                      <span className="text-green-600 flex items-center gap-1">
                                        <Check className="w-4 h-4" /> {t('admin.submitted')}
                                      </span>
                                    ) : (
                                      <span className="text-amber-600 flex items-center gap-1">
                                        <X className="w-4 h-4" /> {t('admin.notSubmitted')}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            )
                          })}

                          {learnersExcluded.length > 0 ? (
                            <div className="px-6 py-4 bg-slate-100/60 dark:bg-slate-800/40">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2 mb-3">
                                <Ban className="w-3.5 h-3.5" />
                                {t('admin.classListPage.excludedSection', {
                                  count: learnersExcluded.length,
                                })}
                              </p>
                              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                {learnersExcluded.map((m) => (
                                  <li key={m.id} className="flex items-center justify-between gap-2">
                                    <span className="font-mono">{m.username}</span>
                                    <span className="text-[11px] uppercase tracking-wide text-slate-500">
                                      {t('admin.classListPage.badgeExcluded')}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            }
          )}
        </div>
      </div>
    </div>
  )
}
