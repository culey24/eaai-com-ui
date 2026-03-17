import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, User, Lock, AlertCircle, BookMarked } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { VALID_CLASS_CODES } from '../../constants/roles'

export default function RegisterForm() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [classCode, setClassCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [registerError, setRegisterError] = useState('')

  const validate = () => {
    const newErrors = {}
    if (!classCode.trim()) {
      newErrors.classCode = 'Vui lòng nhập mã lớp'
    } else if (!VALID_CLASS_CODES.includes(classCode.trim().toUpperCase())) {
      newErrors.classCode = `Mã lớp không hợp lệ. Các mã hợp lệ: ${VALID_CLASS_CODES.join(', ')}`
    }
    if (!username.trim()) {
      newErrors.username = 'Vui lòng nhập tài khoản'
    }
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu'
    } else if (password.length < 4) {
      newErrors.password = 'Mật khẩu phải có ít nhất 4 ký tự'
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setRegisterError('')
    if (!validate()) return

    const result = register(username.trim(), password, classCode.trim())
    if (result && !result.error) {
      navigate('/')
    } else {
      setRegisterError(result?.error || 'Đăng ký thất bại')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-semibold text-slate-800 text-center tracking-tight">Đăng ký tài khoản</h2>

      {registerError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {registerError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Mã lớp <span className="text-red-500">*</span></label>
        <div className="relative">
          <BookMarked className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border ${
              errors.classCode ? 'border-red-300' : 'border-slate-200'
            } focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all duration-200`}
            placeholder="Ví dụ: IS-1, IS-2, IS-3"
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
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Tài khoản</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border ${
              errors.username ? 'border-red-300' : 'border-slate-200'
            } focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all duration-200`}
            placeholder="Nhập tài khoản"
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
        <label className="block text-sm font-medium text-slate-600 mb-1.5">Xác nhận mật khẩu</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border ${
              errors.confirmPassword ? 'border-red-300' : 'border-slate-200'
            } focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all duration-200`}
            placeholder="••••••••"
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
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all duration-200 shadow-glow-primary hover:shadow-glow-primary/80 active:scale-[0.98]"
      >
        <UserPlus className="w-4 h-4" />
        Đăng ký
      </button>

      <p className="text-center text-slate-500 text-sm">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  )
}
