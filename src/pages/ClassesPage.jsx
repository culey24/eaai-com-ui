import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users, FileText, Check, X, Search, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAllUsers } from '../hooks/useAllUsers'
import { useAdmin } from '../context/AdminContext'
import { useJournal } from '../context/JournalContext'
import { useLanguage } from '../context/LanguageContext'
import { ROLES, VALID_CLASS_CODES } from '../constants/roles'
import { CLASS_TO_MODE, hasSupporterMode } from '../constants/admin'

export default function ClassesPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { getByClass, allUsers } = useAllUsers()
  const { assignments, addSupportRequest } = useAdmin()
  const { getSubmissionStats, getJournalsForUser } = useJournal()
  const [expandedClass, setExpandedClass] = useState(null)
  const [search, setSearch] = useState('')

  const isAdmin = user?.role === ROLES.ADMIN
  const isAssistant = user?.role === ROLES.ASSISTANT
  const managedClasses = user?.managedClasses || (isAdmin ? VALID_CLASS_CODES : [])

  const getTeachingMode = (classCode) => CLASS_TO_MODE[classCode] || 'MANUAL'
  const getModeLabel = (mode) => t(`admin.teachingMode.${mode}`) || mode
  const getSupporterName = (supporterId) => allUsers.find((u) => u.id === supporterId)?.username ?? supporterId

  const handleRequestSupport = (learnerId, classCode) => {
    const supporterId = user?.stableId || (user?.name ? `prov-${user.name}` : null)
    if (supporterId) addSupportRequest(supporterId, learnerId, classCode)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
        <Link
          to="/"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          {t('sidebar.classManagement')}
        </h1>
        {isAssistant && (
          <div className="flex-1 max-w-xs relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('admin.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {managedClasses.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">{t('supporter.noManagedClasses')}</p>
          ) : (
            managedClasses.map((classCode) => {
              let members = getByClass(classCode)
              if (isAssistant && search.trim()) {
                const q = search.toLowerCase().trim()
                members = members.filter(
                  (m) =>
                    m.username?.toLowerCase().includes(q) ||
                    m.id?.toLowerCase().includes(q) ||
                    m.fullName?.toLowerCase().includes(q)
                )
              }

              const mode = getTeachingMode(classCode)
              const userIds = getByClass(classCode).map((m) => m.id)
              const stats = getSubmissionStats(userIds)
              const isExpanded = expandedClass === classCode

              return (
                <div
                  key={classCode}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedClass(isExpanded ? null : classCode)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {t('admin.classLabel', { code: classCode })}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {t('admin.mode')}: {getModeLabel(mode)}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>
                          {t('admin.journalStatus')}: {t('admin.journalSubmitted', { submitted: stats.submitted, total: stats.total })}
                        </span>
                      </div>
                      <span className="text-slate-400">{members.length} {t('admin.members')}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
                      {members.length === 0 ? (
                        <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                          {t('admin.noMembers')}
                        </div>
                      ) : (
                        members.map((m) => {
                          const assignment = assignments[m.id]
                          const journals = getJournalsForUser(m.id) || []
                          const submitted = journals.length > 0
                          const hasSupporter = !!assignment
                          const usesSupporter = hasSupporterMode(classCode)

                          return (
                            <div
                              key={m.id}
                              className="px-6 py-4 flex items-center justify-between gap-4"
                            >
                              <div>
                                <span className="font-medium text-slate-800 dark:text-white">
                                  {m.fullName || m.username}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">
                                  {usesSupporter
                                    ? (hasSupporter
                                      ? `${t('admin.supporter')}: ${getSupporterName(assignment.supporterId)}`
                                      : t('admin.noSupporter'))
                                    : t(`admin.teachingMode.${mode}`)}
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
                                {isAssistant && usesSupporter && !hasSupporter && (
                                  <button
                                    onClick={() => handleRequestSupport(m.id, m.classCode || classCode)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm"
                                  >
                                    <UserPlus className="w-4 h-4" />
                                    {t('supporter.requestSupport')}
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
