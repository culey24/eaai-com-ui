import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Mail, Lock, AlertCircle, User, GraduationCap, BookOpen } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'

export default function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [studentId, setStudentId] = useState('')
  const [major, setMajor] = useState('')
  const [subject, setSubject] = useState('')
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

    login(email, password, studentId, major, subject, role)
    navigate('/')
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-slate-800">Đăng nhập</h2>
        <p className="text-slate-500 mt-2">Vui lòng điền thông tin sinh viên</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Ô nhập Mã số sinh viên */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Mã số sinh viên</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Ví dụ: 2012345"
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all duration-200 text-slate-700"
            />
          </div>
        </div>

        {/* Ô nhập Chuyên ngành */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Chuyên ngành</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <GraduationCap className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="Ví dụ: Khoa học Máy tính"
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all duration-200 text-slate-700"
            />
          </div>
        </div>

        {/* Ô nhập Môn học */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Môn học quan tâm</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <BookOpen className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ví dụ: Trí tuệ nhân tạo"
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all duration-200 text-slate-700"
            />
          </div>
        </div>

        {/* Ô nhập Email */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Email trường</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sv@hcmut.edu.vn"
              className={`w-full pl-11 pr-4 py-3 rounded-2xl border ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-primary'
                } outline-none transition-all duration-200 text-slate-700`}
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Ô nhập Mật khẩu */}
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
              className={`w-full pl-11 pr-4 py-3 rounded-2xl border ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-primary'
                } outline-none transition-all duration-200 text-slate-700`}
            />
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        {/* Nút Đăng nhập */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 rounded-2xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all duration-200 shadow-glow-primary"
        >
          <LogIn className="w-5 h-5" />
          Đăng nhập
        </button>
      </form>
    </div>
  )
}
