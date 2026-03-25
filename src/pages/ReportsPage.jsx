import { Link } from 'react-router-dom'
import { ArrowLeft, Flag } from 'lucide-react'
import { useReports } from '../context/ReportsContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { ROLES } from '../constants/roles'

export default function ReportsPage() {
  const { reports } = useReports()
  const { user } = useAuth()
  const { t } = useLanguage()
  const isAdmin = user?.role === ROLES.ADMIN
  const managedClasses = user?.managedClasses || []

  // Assistant chỉ xem báo cáo của lớp mình quản lý
  const filteredReports = isAdmin
    ? reports
    : reports.filter((r) => {
        const channelLabel = r.channelLabel || ''
        const match = managedClasses.some((c) => channelLabel.includes(c))
        return match
      })

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
        <Link
          to="/"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
          <Flag className="w-5 h-5 text-amber-500" />
          {t('report.title')}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          {filteredReports.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Flag className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('report.noReports')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {t(`report.types.${r.type}`) || r.type}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {r.channelLabel} • {r.timestamp && new Date(r.timestamp).toLocaleString('vi-VN')}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {t('report.reporter')}:{' '}
                        {r.reporterFullName || r.reporterUsername
                          ? t('report.reporterMeta', {
                              fullName: r.reporterFullName || r.reporterUsername || '—',
                              username: r.reporterUsername || '—',
                            })
                          : t('report.reporterUnknown')}
                      </p>
                      {r.detail && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{r.detail}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
