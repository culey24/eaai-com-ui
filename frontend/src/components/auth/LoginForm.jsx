import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { formatAuthResultError } from '../../lib/authErrorUi'

export default function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useLanguage()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loginError, setLoginError] = useState('')

  const validate = () => {
    const newErrors = {}
    if (!username.trim()) newErrors.username = t('auth.usernameRequired')
    if (!password) newErrors.password = t('auth.passwordRequired')
    else if (password.length < 4) newErrors.password = t('auth.passwordMinLength')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    if (!validate()) return

    try {
      const result = await login(username.trim(), password)
      if (result?.ok === true) navigate('/')
      else setLoginError(formatAuthResultError(result, t, 'auth.invalidCredentials'))
    } catch {
      setLoginError(t('auth.invalidCredentials'))
    }
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-slate-800">{t('auth.login')}</h2>
        <p className="text-slate-500 mt-2">{t('auth.loginPrompt')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {loginError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {loginError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('auth.username')}</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.usernamePlaceholder')}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl border ${
                errors.username ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-primary'
              } outline-none transition-all duration-200 text-slate-700`}
            />
          </div>
          {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">{t('auth.password')}</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl border ${
                errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-primary'
              } outline-none transition-all duration-200 text-slate-700`}
            />
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all duration-200 shadow-glow-primary"
        >
          <LogIn className="w-5 h-5" />
          {t('auth.login')}
        </button>
      </form>

      <p className="text-center text-slate-500 text-sm">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-primary font-semibold hover:underline">
          {t('auth.register')}
        </Link>
      </p>
    </div>
  )
}
