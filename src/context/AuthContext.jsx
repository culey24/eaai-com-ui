import { createContext, useContext, useState, useEffect } from 'react'
import { ROLES, VALID_CLASS_CODES } from '../constants/roles'

const AUTH_STORAGE_KEY = 'eeai_chatbot_user'
const REGISTERED_USERS_KEY = 'eeai_registered_users'

/** Tài khoản admin để test: admin / admin123 */
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' }

const AuthContext = createContext(null)

function getRegisteredUsers() {
  try {
    const stored = localStorage.getItem(REGISTERED_USERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRegisteredUser(username, password, classCode) {
  const users = getRegisteredUsers()
  if (users.some((u) => u.username === username)) return false
  users.push({ username, password, classCode })
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users))
  return true
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let userToSet = null
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      try {
        userToSet = JSON.parse(stored)
        if (userToSet && userToSet.faculty === undefined) {
          userToSet = { ...userToSet, faculty: 'Chưa cập nhật' }
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userToSet))
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
    setUser(userToSet)
    setIsLoading(false)
  }, [])

  const createUserObject = (username, role, extra = {}) => ({
    id: Date.now().toString(),
    email: username,
    studentId: 'Chưa cập nhật',
    faculty: 'Chưa cập nhật',
    major: 'Chưa cập nhật',
    subject: 'Chưa cập nhật',
    name: username,
    role,
    avatar: null,
    classCode: 'Chưa cập nhật',
    ...extra,
  })

  const isClassCodeValid = (code) =>
    code && VALID_CLASS_CODES.includes(String(code).trim().toUpperCase())

  const login = (username, password) => {
    // Kiểm tra admin
    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const newUser = createUserObject(username, ROLES.ADMIN_FULL)
      setUser(newUser)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
      return newUser
    }
    // Kiểm tra user đã đăng ký
    const users = getRegisteredUsers()
    const found = users.find(
      (u) => u.username === username && u.password === password
    )
    if (found) {
      const newUser = createUserObject(username, ROLES.CHATBOT_ONLY, {
        classCode: found.classCode || 'Chưa cập nhật',
      })
      setUser(newUser)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
      return newUser
    }
    return null
  }

  const register = (username, password, classCode) => {
    if (!isClassCodeValid(classCode)) return { error: 'Mã lớp không hợp lệ' }
    if (!saveRegisteredUser(username, password, classCode)) return { error: 'Tài khoản này đã tồn tại' }
    const classCodeNorm = String(classCode).trim().toUpperCase()
    const newUser = createUserObject(username, ROLES.CHATBOT_ONLY, { classCode: classCodeNorm })
    setUser(newUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
    return newUser
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const updateProfile = (updates) => {
    if (!user) return null
    const updated = { ...user, ...updates }
    setUser(updated)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated))
    return updated
  }

  const isProfileComplete = (u = user) => {
    if (!u) return true
    const empty = (v) => !v || v.trim() === '' || v === 'Chưa cập nhật'
    return !empty(u.studentId) && !empty(u.faculty) && !empty(u.major)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, isProfileComplete, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
