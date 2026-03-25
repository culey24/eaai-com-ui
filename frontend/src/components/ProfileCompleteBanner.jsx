import { Link } from 'react-router-dom'
import { User, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function ProfileCompleteBanner() {
  const { user, isProfileComplete } = useAuth()
  const { t } = useLanguage()

  if (!user || isProfileComplete()) return null

  return (
    <div className="border-b border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-900/20">
      <Link
        to="/settings"
        className="block px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-white">{t('profile.completeRequired')}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('profile.completeDesc')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-primary font-medium text-sm">
          <Settings className="w-4 h-4" />
          {t('profile.goToSettings')}
        </div>
      </Link>
    </div>
  )
}
