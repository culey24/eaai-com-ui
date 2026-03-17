import { useState } from 'react'
import { User, GraduationCap, BookOpen, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PLACEHOLDER = 'Chưa cập nhật'

export default function ProfileCompleteBanner() {
  const { user, updateProfile, isProfileComplete } = useAuth()
  const [expanded, setExpanded] = useState(true)
  const [studentId, setStudentId] = useState(user?.studentId === PLACEHOLDER ? '' : user?.studentId || '')
  const [faculty, setFaculty] = useState(user?.faculty === PLACEHOLDER ? '' : user?.faculty || '')
  const [major, setMajor] = useState(user?.major === PLACEHOLDER ? '' : user?.major || '')
  const [subject, setSubject] = useState(user?.subject === PLACEHOLDER ? '' : user?.subject || '')
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  if (!user || isProfileComplete()) return null

  const validate = () => {
    const newErrors = {}
    if (!studentId.trim()) newErrors.studentId = 'Vui lòng nhập MSSV'
    if (!faculty.trim()) newErrors.faculty = 'Vui lòng nhập Khoa'
    if (!major.trim()) newErrors.major = 'Vui lòng nhập Chuyên ngành'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaved(false)
    if (!validate()) return

    updateProfile({
      studentId: studentId.trim(),
      faculty: faculty.trim(),
      major: major.trim(),
      subject: subject.trim() || PLACEHOLDER,
    })
    setSaved(true)
  }

  const InputField = ({ icon: Icon, label, value, onChange, error, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm ${
            error ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-600'
          } bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none`}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  )

  return (
    <div className="border-b border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-900/20">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-white">Bổ sung thông tin sinh viên</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">MSSV, Khoa, chuyên ngành — vui lòng điền để sử dụng đầy đủ tính năng</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <form onSubmit={handleSubmit} className="px-6 pb-5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InputField
              icon={User}
              label="Mã số sinh viên (MSSV)"
              value={studentId}
              onChange={setStudentId}
              error={errors.studentId}
              placeholder="Ví dụ: 2012345"
            />
            <InputField
              icon={GraduationCap}
              label="Khoa"
              value={faculty}
              onChange={setFaculty}
              error={errors.faculty}
              placeholder="Ví dụ: Khoa Khoa học Máy tính"
            />
            <InputField
              icon={BookOpen}
              label="Chuyên ngành"
              value={major}
              onChange={setMajor}
              error={errors.major}
              placeholder="Ví dụ: Khoa học Máy tính"
            />
            <InputField
              icon={BookOpen}
              label="Môn học quan tâm (tùy chọn)"
              value={subject}
              onChange={setSubject}
              placeholder="Ví dụ: Trí tuệ nhân tạo"
            />
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors"
            >
              Lưu thông tin
            </button>
            {saved && (
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Đã lưu thành công!</span>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
