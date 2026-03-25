import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, User, Mail, Shield, Sun, Moon, GraduationCap, BookOpen, Globe, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

const PLACEHOLDER = 'Chưa cập nhật'

export default function SettingsPage() {
  const { user, updateProfile, isProfileComplete } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { lang, setLang, t } = useLanguage()
  const [editing, setEditing] = useState(false)
  const [studentId, setStudentId] = useState(user?.studentId === PLACEHOLDER ? '' : user?.studentId || '')
  const [faculty, setFaculty] = useState(user?.faculty === PLACEHOLDER ? '' : user?.faculty || '')
  const [major, setMajor] = useState(user?.major === PLACEHOLDER ? '' : user?.major || '')
  const [subject, setSubject] = useState(user?.subject === PLACEHOLDER ? '' : user?.subject || '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '')
  const [gender, setGender] = useState(user?.gender ?? '')
  const [trainingProgramType, setTrainingProgramType] = useState(user?.trainingProgramType ?? '')

  useEffect(() => {
    if (editing) {
      setStudentId(user?.studentId === PLACEHOLDER ? '' : user?.studentId || '')
      setFaculty(user?.faculty === PLACEHOLDER ? '' : user?.faculty || '')
      setMajor(user?.major === PLACEHOLDER ? '' : user?.major || '')
      setSubject(user?.subject === PLACEHOLDER ? '' : user?.subject || '')
      setEmail(user?.email ?? '')
      setDateOfBirth(user?.dateOfBirth ?? '')
      setGender(user?.gender ?? '')
      setTrainingProgramType(user?.trainingProgramType ?? '')
    }
  }, [editing, user])

  // Tự mở form chỉnh sửa khi profile chưa đầy đủ (vd: vừa đăng ký, vào từ banner)
  useEffect(() => {
    if (user && !isProfileComplete()) setEditing(true)
  }, [user])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
        <Link
          to="/"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-slate-800 dark:text-white text-lg">{t('settings.title')}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Thông tin chung */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {t('settings.general')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {t('settings.account')}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{t('settings.account')}</p>
                    <p className="font-medium text-slate-800 dark:text-white">{user?.name || '—'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(!editing)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {editing ? t('common.cancel') : t('settings.editProfile')}
                </button>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{t('settings.email')}</p>
                  <p className="font-medium text-slate-800 dark:text-white">{user?.email || user?.name || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{t('settings.role')}</p>
                  <p className="font-medium text-slate-800 dark:text-white">
                    {t(`roles.${user?.role?.toLowerCase()}`) || user?.role || '—'}
                  </p>
                </div>
              </div>

              {editing && (
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{t('settings.studentInfo')}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('settings.email')}</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('settings.dateOfBirth')}</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('settings.gender')}</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
                      >
                        <option value="">—</option>
                        <option value="male">{t('settings.genderMale')}</option>
                        <option value="female">{t('settings.genderFemale')}</option>
                        <option value="other">{t('settings.genderOther')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('settings.trainingProgramType')}</label>
                      <input
                        type="text"
                        value={trainingProgramType}
                        onChange={(e) => setTrainingProgramType(e.target.value)}
                        placeholder="e.g. Đại học chính quy"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('settings.mssv')}</label>
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="Mã số sinh viên"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('settings.faculty')}</label>
                      <input
                        type="text"
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                        placeholder="Ví dụ: Khoa Khoa học Máy tính"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('settings.major')}</label>
                      <input
                        type="text"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        placeholder="Ví dụ: Khoa học Máy tính"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('settings.subject')}</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Tùy chọn"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateProfile({
                        email: email.trim() || user?.email || user?.name,
                        dateOfBirth: dateOfBirth.trim(),
                        gender: gender.trim(),
                        trainingProgramType: trainingProgramType.trim(),
                        studentId: studentId.trim() || PLACEHOLDER,
                        faculty: faculty.trim() || PLACEHOLDER,
                        major: major.trim() || PLACEHOLDER,
                        subject: subject.trim() || PLACEHOLDER,
                      })
                      setEditing(false)
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
                  >
                    {t('common.save')}
                  </button>
                </div>
              )}

              {!editing && (user?.studentId !== PLACEHOLDER || user?.faculty !== PLACEHOLDER || user?.major !== PLACEHOLDER || user?.dateOfBirth || user?.gender || user?.trainingProgramType) && (
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                  {(user?.dateOfBirth || user?.gender || user?.trainingProgramType) && (
                    <>
                      {user?.dateOfBirth && (
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('settings.dateOfBirth')}</p>
                            <p className="font-medium text-slate-800 dark:text-white">{user.dateOfBirth}</p>
                          </div>
                        </div>
                      )}
                      {user?.gender && (
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('settings.gender')}</p>
                            <p className="font-medium text-slate-800 dark:text-white">
                              {user.gender === 'male' ? t('settings.genderMale') : user.gender === 'female' ? t('settings.genderFemale') : t('settings.genderOther')}
                            </p>
                          </div>
                        </div>
                      )}
                      {user?.trainingProgramType && (
                        <div className="flex items-start gap-3">
                          <GraduationCap className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('settings.trainingProgramType')}</p>
                            <p className="font-medium text-slate-800 dark:text-white">{user.trainingProgramType}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{t('settings.mssv')}</p>
                      <p className="font-medium text-slate-800 dark:text-white">{user?.studentId || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{t('settings.faculty')}</p>
                      <p className="font-medium text-slate-800 dark:text-white">{user?.faculty || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{t('settings.major')}</p>
                      <p className="font-medium text-slate-800 dark:text-white">{user?.major || '—'}</p>
                    </div>
                  </div>
                  {user?.subject && user?.subject !== PLACEHOLDER && (
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{t('settings.subject')}</p>
                        <p className="font-medium text-slate-800 dark:text-white">{user?.subject}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Ngôn ngữ */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                {t('settings.language')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {t('settings.languageDesc')}
              </p>
            </div>
            <div className="p-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`flex-1 py-2.5 px-4 rounded-xl border font-medium text-sm transition-colors ${
                    lang === 'en'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLang('vi')}
                  className={`flex-1 py-2.5 px-4 rounded-xl border font-medium text-sm transition-colors ${
                    lang === 'vi'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  Tiếng Việt
                </button>
              </div>
            </div>
          </section>

          {/* Giao diện */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-primary" />
                {t('settings.theme')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {t('settings.themeDesc')}
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'light' ? (
                    <Sun className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-indigo-400" />
                  )}
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">
                      {theme === 'light' ? t('settings.lightMode') : t('settings.darkMode')}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      {theme === 'light' ? t('settings.lightMode') : t('settings.darkMode')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    toggleTheme()
                  }}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-600'
                  }`}
                  aria-label={theme === 'light' ? 'Bật chế độ tối' : 'Bật chế độ sáng'}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow pointer-events-none transition-all duration-200 ${
                      theme === 'dark' ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
