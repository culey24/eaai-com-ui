import logo from '../../../assets/hcmut_logo/01_logobachkhoasang.png'
import { useLanguage } from '../../context/LanguageContext'

export default function AuthLayout({ children }) {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary/5 p-6">
      <div className="w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-7 -mt-1">
            <img
              src={logo}
              alt={t('auth.logoAlt')}
              className="h-32 w-auto sm:h-36 object-contain object-center select-none"
            />
          </div>
          <h1 className="mx-auto text-slate-800 dark:text-white text-xl sm:text-2xl font-bold tracking-tight max-w-md leading-snug">
            {t('common.appName')}
          </h1>
          <p className="mx-auto text-secondary text-[10px] sm:text-xs font-bold uppercase tracking-tight max-w-md leading-snug mt-3">
            {t('auth.brandUniversity')}
          </p>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">{t('auth.brandSchool')}</p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white rounded-3xl shadow-soft p-8 border border-slate-100">
          {children}
        </div>

        <p className="text-center text-slate-400 text-sm mt-8 font-medium">{t('auth.authFooterTagline')}</p>
      </div>
    </div>
  )
}
