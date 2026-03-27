import logo from '../../assets/hcmut_logo/logo.png'
import { useLanguage } from '../../context/LanguageContext'

export default function AuthLayout({ children }) {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary/5 p-6">
      <div className="w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl overflow-hidden mb-6 shadow-soft">
            <img src={logo} alt={t('auth.logoAlt')} className="w-full h-full object-contain p-2" />
          </div>
          <h1 className="mx-auto text-secondary text-lg sm:text-xl font-bold uppercase tracking-tight max-w-md leading-snug">
            {t('auth.brandUniversity')}
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">{t('auth.brandSchool')}</p>
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
