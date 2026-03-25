import { createContext, useContext, useState, useEffect } from 'react'
import { ROLES, VALID_CLASS_CODES } from '../constants/roles'

const AUTH_STORAGE_KEY = 'eeai_chatbot_user'
const REGISTERED_USERS_KEY = 'eeai_registered_users'
const ADMIN_USERS_KEY = 'eeai_admin_users'

/** Tài khoản demo (MOCKUP) - Assistants & Admin được cấp riêng, không đăng ký */
const PROVISIONED_ACCOUNTS = {
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'ADMIN',
  },
  assistant1: {
    username: 'assistant1',
    password: 'assistant123',
    role: 'ASSISTANT',
    managedClasses: ['IS-1', 'IS-2'],
  },
  assistant2: {
    username: 'assistant2',
    password: 'assistant123',
    role: 'ASSISTANT',
    managedClasses: ['IS-2', 'IS-3'],
  },
  demo: {
    username: 'demo',
    password: 'demo123',
    role: 'LEARNER',
    classCode: 'IS-1',
  },
}

const AuthContext = createContext(null)

function getRegisteredUsers() {
  try {
    const stored = localStorage.getItem(REGISTERED_USERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getAdminUsers() {
  try {
    const stored = localStorage.getItem(ADMIN_USERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRegisteredUser(username, password, classCode, fullName = '') {
  const users = getRegisteredUsers()
  if (users.some((u) => u.username === username)) return false
  users.push({ username, password, classCode, fullName: fullName?.trim() || '' })
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
        if (userToSet) {
          let updated = false
          if (userToSet.faculty === undefined) {
            userToSet = { ...userToSet, faculty: 'Chưa cập nhật' }
            updated = true
          }
          if (userToSet.dateOfBirth === undefined || userToSet.gender === undefined || userToSet.trainingProgramType === undefined) {
            userToSet = {
              ...userToSet,
              dateOfBirth: userToSet.dateOfBirth ?? '',
              gender: userToSet.gender ?? '',
              trainingProgramType: userToSet.trainingProgramType ?? '',
            }
            updated = true
          }
          if (!userToSet.stableId && userToSet.name) {
            const src = userToSet.role === 'LEARNER' ? 'reg' : 'prov'
            userToSet = { ...userToSet, stableId: `${src}-${userToSet.name}` }
            updated = true
          }
          if (updated) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userToSet))
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
    setUser(userToSet)
    setIsLoading(false)
  }, [])

  const createUserObject = (username, role, extra = {}, source = 'provisioned') => {
    const stableId = source === 'registered' ? `reg-${username}` : source === 'admin' ? `admin-${username}` : `prov-${username}`
    return {
    id: Date.now().toString(),
    stableId,
    email: extra.email ?? username,
    studentId: 'Chưa cập nhật',
    faculty: 'Chưa cập nhật',
    major: 'Chưa cập nhật',
    subject: 'Chưa cập nhật',
    name: username,
    role,
    avatar: null,
    classCode: 'Chưa cập nhật',
    dateOfBirth: '',
    gender: '',
    trainingProgramType: '',
    ...extra,
  }
  }

  const isClassCodeValid = (code) =>
    code && VALID_CLASS_CODES.includes(String(code).trim().toUpperCase())

  const login = (username, password) => {
    // Kiểm tra tài khoản admin tạo
    const adminUsers = getAdminUsers()
    const adminUser = adminUsers.find((u) => u.username === username && u.password === password)
    if (adminUser) {
      const newUser = createUserObject(username, ROLES[adminUser.role] || ROLES.LEARNER, {
        classCode: adminUser.classCode || 'Chưa cập nhật',
        managedClasses: adminUser.managedClasses || [],
      }, 'admin')
      setUser(newUser)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
      return newUser
    }
    // Kiểm tra tài khoản được cấp (admin, assistant, demo learner)
    const provisioned = Object.values(PROVISIONED_ACCOUNTS).find(
      (d) => d.username === username && d.password === password
    )
    if (provisioned) {
      const newUser = createUserObject(provisioned.username, ROLES[provisioned.role], {
        classCode: provisioned.classCode || 'Chưa cập nhật',
        managedClasses: provisioned.managedClasses || [],
      })
      setUser(newUser)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
      return newUser
    }
    // Kiểm tra Learner đã đăng ký
    const users = getRegisteredUsers()
    const found = users.find(
      (u) => u.username === username && u.password === password
    )
    if (found) {
      const newUser = createUserObject(username, ROLES.LEARNER, {
        classCode: found.classCode || 'Chưa cập nhật',
        name: found.fullName?.trim() || username,
      }, 'registered')
      setUser(newUser)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
      return newUser
    }
    return null
  }

  const register = (username, password, classCode, fullName = '') => {
    if (!isClassCodeValid(classCode)) return { error: 'Mã lớp không hợp lệ' }
    if (!saveRegisteredUser(username, password, classCode, fullName)) return { error: 'Tài khoản này đã tồn tại' }
    const classCodeNorm = String(classCode).trim().toUpperCase()
    const newUser = createUserObject(username, ROLES.LEARNER, {
      classCode: classCodeNorm,
      name: fullName?.trim() || username,
    }, 'registered')
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
    if (u.role === ROLES.ASSISTANT || u.role === ROLES.ADMIN) return true
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
