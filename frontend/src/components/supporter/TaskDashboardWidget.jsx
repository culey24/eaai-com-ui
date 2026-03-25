import { Users, FileText, MessageSquare } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export default function TaskDashboardWidget({ stats }) {
  const { t } = useLanguage()
  const { totalLearners = 0, journalsPending = 0, messagesPending = 0 } = stats || {}

  return (
    <div className="fixed bottom-6 right-6 z-40 flex gap-2 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50">
        <Users className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{totalLearners}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{t('supporter.totalLearners')}</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50">
        <FileText className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium">{journalsPending}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{t('supporter.journalsPending')}</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50">
        <MessageSquare className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium">{messagesPending}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{t('supporter.messagesPending')}</span>
      </div>
    </div>
  )
}
