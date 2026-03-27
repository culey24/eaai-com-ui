import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, User, Lock, AlertCircle, BookMarked, Info } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { VALID_CLASS_CODES } from '../../constants/roles'

export default function RegisterForm() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { t } = useLanguage()
  const [classCode, setClassCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [registerError, setRegisterError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!classCode.trim()) newErrors.classCode = t('auth.classCodeRequired')
    else if (!VALID_CLASS_CODES.includes(classCode.trim().toUpperCase())) {
      newErrors.classCode = t('auth.invalidClassCode', { codes: VALID_CLASS_CODES.join(', ') })
    }
    if (!username.trim()) newErrors.username = t('auth.usernameRequired')
    if (!password) newErrors.password = t('auth.passwordRequired')
    else if (password.length < 4) newErrors.password = t('auth.passwordMinLength')
    if (password !== confirmPassword) newErrors.confirmPassword = t('auth.passwordMismatch')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setRegisterError('')
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const result = await register(username.trim(), password, classCode.trim(), fullName.trim())
      if (result?.ok === true) {
        setTimeout(() => navigate('/', { replace: true }), 0)
      } else {
        setRegisterError(result?.error || t('auth.accountExists'))
      }
    } catch {
      setRegisterError(t('auth.accountExists'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-semibold text-slate-800 text-center tracking-tight">{t('auth.register')}</h2>

      {registerError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {registerError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('auth.classCode')} <span className="text-red-500">*</span></label>
        <div className="relative">
          <BookMarked className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border ${
              errors.classCode ? 'border-red-300' : 'border-slate-200'
            } focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all duration-200`}
            placeholder={t('auth.classCodePlaceholder')}
          />
        </div>
        {errors.classCode && (
          <p className="flex items-center gap-1.5 mt-1.5 text-red-500 text-sm">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.classCode}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('auth.fullName')}</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all duration-200"
            placeholder={t('auth.fullNamePlaceholder')}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('auth.username')}</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border ${
              errors.username ? 'border-red-300' : 'border-slate-200'
            } focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all duration-200`}
            placeholder={t('auth.usernamePlaceholder')}
          />
        </div>
        {errors.username && (
          <p className="flex items-center gap-1.5 mt-1.5 text-red-500 text-sm">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.username}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('auth.password')}</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border ${
              errors.password ? 'border-red-300' : 'border-slate-200'
            } focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all duration-200`}
            placeholder={t('auth.passwordPlaceholder')}
          />
        </div>
        {errors.password && (
          <p className="flex items-center gap-1.5 mt-1.5 text-red-500 text-sm">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.password}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('auth.confirmPassword')}</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border ${
              errors.confirmPassword ? 'border-red-300' : 'border-slate-200'
            } focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all duration-200`}
            placeholder={t('auth.confirmPasswordPlaceholder')}
          />
        </div>
        {errors.confirmPassword && (
          <p className="flex items-center gap-1.5 mt-1.5 text-red-500 text-sm">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all duration-200 shadow-glow-primary hover:shadow-glow-primary/80 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            {t('auth.creatingAccount')}
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            {t('auth.register')}
          </>
        )}
      </button>

      <p className="text-center text-slate-500 text-sm">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          {t('auth.login')}
        </Link>
      </p>

      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1">
          <Info className="w-3.5 h-3.5" />
          {t('auth.registerDemoHint', { codes: VALID_CLASS_CODES.join(', ') })}
        </p>
      </div>
    </form>
  )
}
