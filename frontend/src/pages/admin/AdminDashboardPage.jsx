import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  UserCog,
  FileText,
  ClipboardList,
  Flag,
  ChevronRight,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useJournal } from '../../context/JournalContext'
import { useAllUsers } from '../../hooks/useAllUsers'

export default function AdminDashboardPage() {
  const { t } = useLanguage()
  const { getSubmissionStats } = useJournal()
  const { getLearners } = useAllUsers()

  const learners = getLearners()
  const learnerIds = learners.map((l) => l.id)
  const stats = getSubmissionStats(learnerIds)
  const rate = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0

  const navItems = [
    { to: '/admin/chats', icon: MessageSquare, labelKey: 'admin.chatChannels' },
    { to: '/admin/classes', icon: Users, labelKey: 'admin.classList' },
    { to: '/admin/accounts', icon: UserCog, labelKey: 'admin.accountManagement' },
    { to: '/admin/submissions', icon: FileText, labelKey: 'admin.submissions.title' },
    { to: '/admin/surveys', icon: ClipboardList, labelKey: 'admin.surveys.title' },
    { to: '/reports', icon: Flag, labelKey: 'sidebar.reports' },
  ]

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700">
        <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          {t('admin.dashboard')}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Journal submission rate */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t('admin.journalRate')}
            </h2>
            <div className="flex items-end gap-4">
              <div className="text-4xl font-bold text-primary">{rate}%</div>
              <div className="text-slate-500 dark:text-slate-400 text-sm pb-1">
                {t('admin.membersSubmitted', { submitted: stats.submitted, total: stats.total })}
              </div>
            </div>
          </div>

          {/* Nav cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {navItems.map(({ to, icon: Icon, labelKey }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-white">{t(labelKey)}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
