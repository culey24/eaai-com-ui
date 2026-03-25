import { Link, NavLink, Outlet } from 'react-router-dom'
import { ArrowLeft, UserCog } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export default function AdminAccountsLayout() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-4">
          <Link
            to="/admin"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            {t('admin.accountManagement')}
          </h1>
        </div>
        <nav className="flex gap-1">
          <NavLink
            to="/admin/accounts"
            end
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            {t('admin.accountsTab')}
          </NavLink>
          <NavLink
            to="/admin/accounts/support-requests"
            className={({ isActive }) =>
              `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            {t('admin.supportRequests')}
          </NavLink>
        </nav>
      </div>
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
