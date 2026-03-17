import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loginError, setLoginError] = useState('')

  const validate = () => {
    const newErrors = {}
    if (!username.trim()) {
      newErrors.username = 'Vui lòng nhập tài khoản'
    }
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu'
    } else if (password.length < 4) {
      newErrors.password = 'Mật khẩu phải có ít nhất 4 ký tự'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoginError('')
    if (!validate()) return

    const user = login(username.trim(), password)
    if (user) {
      navigate('/')
    } else {
      setLoginError('Tài khoản hoặc mật khẩu không đúng')
    }
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-slate-800">Đăng nhập</h2>
        <p className="text-slate-500 mt-2">Vui lòng nhập tài khoản và mật khẩu</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {loginError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {loginError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Tài khoản</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tài khoản"
              className={`w-full pl-11 pr-4 py-3 rounded-2xl border ${
                errors.username ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-primary'
              } outline-none transition-all duration-200 text-slate-700`}
            />
          </div>
          {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Mật khẩu</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
          Đăng nhập
        </button>
      </form>

      <p className="text-center text-slate-500 text-sm">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-primary font-semibold hover:underline">
          Đăng ký
        </Link>
      </p>
    </div>
  )
}
