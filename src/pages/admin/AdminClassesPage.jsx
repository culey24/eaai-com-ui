import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users, FileText, Check, X } from 'lucide-react'
import { useAllUsers } from '../../hooks/useAllUsers'
import { useAdmin } from '../../context/AdminContext'
import { useJournal } from '../../context/JournalContext'
import { useLanguage } from '../../context/LanguageContext'
import { VALID_CLASS_CODES } from '../../constants/roles'
import { CLASS_TO_MODE, hasSupporterMode } from '../../constants/admin'

export default function AdminClassesPage() {
  const { t } = useLanguage()
  const { getByClass } = useAllUsers()
  const { getSubmissionStats, getJournalsForUser } = useJournal()
  const { assignments } = useAdmin()
  const [expandedClass, setExpandedClass] = useState(null)

  const getTeachingMode = (classCode) => CLASS_TO_MODE[classCode] || 'MANUAL'
  const getModeLabel = (mode) => t(`admin.teachingMode.${mode}`) || mode

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
          {VALID_CLASS_CODES.map((classCode) => {
            const members = getByClass(classCode)
            const mode = getTeachingMode(classCode)
            const userIds = members.map((m) => m.id)
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
                    <span className="font-semibold text-slate-800 dark:text-white">{t('admin.classLabel', { code: classCode })}</span>
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
                        const mode = getTeachingMode(classCode)
                        const usesSupporter = hasSupporterMode(classCode)

                        return (
                          <div
                            key={m.id}
                            className="px-6 py-4 flex items-center justify-between gap-4"
                          >
                            <div>
                              <span className="font-medium text-slate-800 dark:text-white">{m.username}</span>
                              <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">
                                {usesSupporter
                                  ? (assignment ? `${t('admin.supporter')}: ${assignment.supporterId}` : t('admin.noSupporter'))
                                  : t(`admin.teachingMode.${mode}`)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-slate-500">
                                {t('admin.journalStatus')}: {submitted ? (
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
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
