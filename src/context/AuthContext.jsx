import { createContext, useContext, useState, useEffect } from 'react'
import { ROLES } from '../constants/roles'

const AUTH_STORAGE_KEY = 'eeai_chatbot_user'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let userToSet = null
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      try {
        userToSet = JSON.parse(stored)
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
    // Tạm thời tắt đăng nhập: dùng user mặc định nếu chưa có
    if (!userToSet) {
      userToSet = {
        id: 'guest',
        email: 'guest@hcmut.edu.vn',
        studentId: 'Chưa cập nhật',
        major: 'Chưa cập nhật',
        subject: 'Chưa cập nhật',
        name: 'Khách',
        role: 'ADMIN_FULL',
        avatar: null,
      }
    }
    setUser(userToSet)
    setIsLoading(false)
  }, [])

  const login = (email, password, role = ROLES.CHATBOT_ONLY) => {
    const newUser = {
      id: Date.now().toString(),
      email,
      studentId: studentId || 'Chưa cập nhật',
      major: major || 'Chưa cập nhật',
      subject: subject || 'Chưa cập nhật',
      name: email.split('@')[0],
      role: role || ROLES.CHATBOT_ONLY,
      avatar: null,
    }
    setUser(newUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
    return newUser
  }

  const register = (email, password, name, role = ROLES.CHATBOT_ONLY) => {
    const newUser = {
      id: Date.now().toString(),
      email,
      studentId: 'Chưa cập nhật',
      major: 'Chưa cập nhật',
      subject: 'Chưa cập nhật',
      name: name || email.split('@')[0],
      role: role || ROLES.CHATBOT_ONLY,
      avatar: null,
    }
    setUser(newUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
    return newUser
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
