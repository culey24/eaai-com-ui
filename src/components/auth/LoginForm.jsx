import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

export default function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(ROLES.CHATBOT_ONLY)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email không hợp lệ'
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
    if (!validate()) return

    login(email, password, role)
    navigate('/')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-semibold text-slate-800 text-center tracking-tight">Đăng nhập</h2>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border ${
              errors.email ? 'border-red-300' : 'border-slate-200'
            } focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all duration-200`}
            placeholder="your@email.com"
          />
        </div>
        {errors.email && (
          <p className="flex items-center gap-1.5 mt-1.5 text-red-500 text-sm">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Mật khẩu</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border ${
              errors.password ? 'border-red-300' : 'border-slate-200'
            } focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all duration-200`}
            placeholder="••••••••"
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
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Loại tài khoản (Mock)</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all duration-200 text-slate-700"
        >
          <option value={ROLES.CHATBOT_ONLY}>Chat với AI</option>
          <option value={ROLES.HUMAN_CHAT}>Chat với Tư vấn viên</option>
          <option value={ROLES.ADMIN_FULL}>Quản trị viên</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all duration-200 shadow-glow-primary hover:shadow-glow-primary/80 active:scale-[0.98]"
      >
        <LogIn className="w-4 h-4" />
        Đăng nhập
      </button>

      <p className="text-center text-slate-500 text-sm">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-primary font-semibold hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </form>
  )
}
