import { createContext, useContext, useState, useEffect } from 'react'
import { ROLES, VALID_CLASS_CODES } from '../constants/roles'
import { API_BASE } from '../config/api'
import { AuthErrorCode } from '../lib/authErrorUi'

/** Bật đăng nhập/đăng ký mock (localStorage) khi API lỗi — dev/demo. Production: để false. */
const MOCK_AUTH = import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true'

const AUTH_STORAGE_KEY = 'eeai_chatbot_user'
const REGISTERED_USERS_KEY = 'eeai_registered_users'
const ADMIN_USERS_KEY = 'eeai_admin_users'
const API_TOKEN_KEY = 'eeai_api_token'

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

/** Prisma enum → mã lớp UI */
function mapApiClassToUi(code) {
  if (code == null || code === '') return 'Chưa cập nhật'
  const m = { IS_1: 'IS-1', IS_2: 'IS-2', IS_3: 'IS-3' }
  return m[code] || String(code)
}

function mapApiRoleToApp(role) {
  if (role === 'LEARNER') return ROLES.LEARNER
  if (role === 'ASSISTANT') return ROLES.ASSISTANT
  if (role === 'ADMIN') return ROLES.ADMIN
  return ROLES.LEARNER
}

const PROFILE_PLACEHOLDER = 'Chưa cập nhật'

/** Gộp payload GET/PATCH /api/me/profile vào object user trong UI */
function mergeDbProfileIntoUser(base, p) {
  if (!p || !base) return base
  const fn = (p.fullname || '').trim()
  const classCodeUi = mapApiClassToUi(p.classCode)
  const nz = (v) =>
    v != null && String(v).trim() !== '' ? String(v).trim() : PROFILE_PLACEHOLDER
  return {
    ...base,
    fullName: fn || base.fullName,
    name: fn || base.name,
    email:
      p.email != null && String(p.email).trim() !== ''
        ? String(p.email).trim()
        : base.email,
    dateOfBirth: p.dateOfBirth != null ? String(p.dateOfBirth) : '',
    gender: p.gender != null ? String(p.gender) : '',
    trainingProgramType:
      p.trainingProgramType != null ? String(p.trainingProgramType) : '',
    studentId: nz(p.studentId),
    faculty: nz(p.faculty),
    major: nz(p.major),
    subject: nz(p.subject),
    classCode: base.role === ROLES.LEARNER ? classCodeUi : base.classCode,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [apiToken, setApiToken] = useState(() => {
    try {
      return localStorage.getItem(API_TOKEN_KEY)
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let userToSet = null
      try {
        let stored = null
        try {
          stored = localStorage.getItem(AUTH_STORAGE_KEY)
        } catch {
          stored = null
        }

        if (stored) {
          try {
            userToSet = JSON.parse(stored)
            if (userToSet) {
              let updated = false
              if (userToSet.faculty === undefined) {
                userToSet = { ...userToSet, faculty: PROFILE_PLACEHOLDER }
                updated = true
              }
              if (
                userToSet.dateOfBirth === undefined ||
                userToSet.gender === undefined ||
                userToSet.trainingProgramType === undefined
              ) {
                userToSet = {
                  ...userToSet,
                  dateOfBirth: userToSet.dateOfBirth ?? '',
                  gender: userToSet.gender ?? '',
                  trainingProgramType: userToSet.trainingProgramType ?? '',
                }
                updated = true
              }
              if (!userToSet.stableId && userToSet.name) {
                const src = userToSet.role === ROLES.LEARNER ? 'reg' : 'prov'
                userToSet = { ...userToSet, stableId: `${src}-${userToSet.name}` }
                updated = true
              }
              if (userToSet.username === undefined && userToSet.stableId) {
                const m = String(userToSet.stableId).match(/^(reg|prov|admin)-(.+)$/)
                userToSet = { ...userToSet, username: m ? m[2] : userToSet.name }
                updated = true
              }
              if (userToSet.fullName === undefined) {
                userToSet = {
                  ...userToSet,
                  fullName:
                    userToSet.name && userToSet.name !== userToSet.username ? userToSet.name : '',
                }
                updated = true
              }
              if (updated) {
                try {
                  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userToSet))
                } catch {
                  /* ignore */
                }
              }
            }
          } catch {
            try {
              localStorage.removeItem(AUTH_STORAGE_KEY)
            } catch {
              /* ignore */
            }
            userToSet = null
          }
        }

        /* Tải profile từ DB: xem useEffect syncLearnerProfileFromApi (sau login / khi có token) */
      } catch {
        userToSet = null
      } finally {
        if (!cancelled) {
          setUser(userToSet)
          setIsLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  /** Sau đăng nhập / F5: login API không trả MSSV, khoa… — luôn kéo từ GET /api/me/profile */
  useEffect(() => {
    const learnerId = user?.backendUserId
    if (!apiToken || user?.role !== ROLES.LEARNER || learnerId == null) return

    let cancelled = false
    const ac = new AbortController()
    const tid = setTimeout(() => ac.abort(), 12000)

    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me/profile`, {
          headers: { Authorization: `Bearer ${apiToken}` },
          signal: ac.signal,
        })
        const data = await res.json().catch(() => ({}))
        if (cancelled || !res.ok || !data.profile) return
        setUser((prev) => {
          if (
            !prev ||
            String(prev.backendUserId) !== String(learnerId) ||
            prev.role !== ROLES.LEARNER
          ) {
            return prev
          }
          const merged = mergeDbProfileIntoUser(prev, data.profile)
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(merged))
          } catch {
            /* ignore */
          }
          return merged
        })
      } catch {
        /* offline / timeout */
      } finally {
        clearTimeout(tid)
      }
    })()

    return () => {
      cancelled = true
      ac.abort()
      clearTimeout(tid)
    }
  }, [apiToken, user?.backendUserId, user?.role])

  const persistToken = (token) => {
    if (token) {
      localStorage.setItem(API_TOKEN_KEY, token)
      setApiToken(token)
    } else {
      localStorage.removeItem(API_TOKEN_KEY)
      setApiToken(null)
    }
  }

  const createUserObject = (username, role, extra = {}, source = 'provisioned') => {
    const stableId =
      extra.backendUserId != null
        ? `api-${extra.backendUserId}`
        : source === 'registered'
          ? `reg-${username}`
          : source === 'admin'
            ? `admin-${username}`
            : `prov-${username}`
    const merged = {
      id: Date.now().toString(),
      stableId,
      username,
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
      backendUserId: extra.backendUserId,
      ...extra,
    }
    if (merged.fullName === undefined || merged.fullName === null) {
      merged.fullName =
        merged.name && merged.name !== username ? String(merged.name).trim() : ''
    }
    return merged
  }

  const isClassCodeValid = (code) =>
    code && VALID_CLASS_CODES.includes(String(code).trim().toUpperCase())

  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.token && data.user?.userId) {
        const appRole = mapApiRoleToApp(data.user.role)
        const classCodeUi = mapApiClassToUi(data.user.classCode)
        const fn = (data.user.fullname || '').trim()
        const newUser = createUserObject(data.user.username || username, appRole, {
          classCode:
            appRole === ROLES.LEARNER
              ? classCodeUi
              : data.user.classCode != null
                ? mapApiClassToUi(data.user.classCode)
                : 'Chưa cập nhật',
          managedClasses: Array.isArray(data.user.managedClasses) ? data.user.managedClasses : [],
          name: fn || data.user.username || username,
          fullName: fn,
          backendUserId: data.user.userId,
        }, 'provisioned')
        persistToken(data.token)
        setUser(newUser)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
        return { ok: true, user: newUser }
      }
      if (!MOCK_AUTH) {
        if (data.code) {
          return { ok: false, code: data.code, error: data.error }
        }
        if (res.status === 401) {
          return {
            ok: false,
            code: AuthErrorCode.INVALID_CREDENTIALS,
            error: data.error,
          }
        }
        return {
          ok: false,
          code: AuthErrorCode.LOGIN_FAILED_STATUS,
          status: res.status,
          error: data.error,
        }
      }
    } catch {
      if (!MOCK_AUTH) {
        return { ok: false, code: AuthErrorCode.NETWORK }
      }
    }

    const adminUsers = getAdminUsers()
    const adminUser = adminUsers.find((u) => u.username === username && u.password === password)
    if (adminUser) {
      persistToken(null)
      const fn = adminUser.fullName?.trim()
      const newUser = createUserObject(username, ROLES[adminUser.role] || ROLES.LEARNER, {
        classCode: adminUser.classCode || 'Chưa cập nhật',
        managedClasses: adminUser.managedClasses || [],
        name: fn || username,
        fullName: fn || '',
      }, 'admin')
      setUser(newUser)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
      return { ok: true, user: newUser }
    }

    const provisioned = Object.values(PROVISIONED_ACCOUNTS).find(
      (d) => d.username === username && d.password === password
    )
    if (provisioned) {
      persistToken(null)
      const newUser = createUserObject(provisioned.username, ROLES[provisioned.role], {
        classCode: provisioned.classCode || 'Chưa cập nhật',
        managedClasses: provisioned.managedClasses || [],
      })
      setUser(newUser)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
      return { ok: true, user: newUser }
    }

    const users = getRegisteredUsers()
    const found = users.find((u) => u.username === username && u.password === password)
    if (found) {
      persistToken(null)
      const fn = found.fullName?.trim() || ''
      const newUser = createUserObject(username, ROLES.LEARNER, {
        classCode: found.classCode || 'Chưa cập nhật',
        name: fn || username,
        fullName: fn,
      }, 'registered')
      setUser(newUser)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
      return { ok: true, user: newUser }
    }

    return { ok: false, code: AuthErrorCode.INVALID_CREDENTIALS }
  }

  const register = async (username, password, classCode, fullName = '') => {
    if (!isClassCodeValid(classCode)) {
      return { ok: false, code: AuthErrorCode.CLASS_CODE_INVALID_LOCAL }
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          classCode: String(classCode).trim().toUpperCase(),
          fullName: fullName?.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.token && data.user?.userId) {
        const classCodeUi = mapApiClassToUi(data.user.classCode)
        const fn = (data.user.fullname || fullName || '').trim()
        const newUser = createUserObject(data.user.username || username, ROLES.LEARNER, {
          classCode: classCodeUi,
          name: fn || username,
          fullName: fn,
          backendUserId: data.user.userId,
        }, 'registered')
        persistToken(data.token)
        setUser(newUser)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
        return { ok: true, user: newUser }
      }
      if (res.status === 409) {
        return {
          ok: false,
          code: data.code || AuthErrorCode.ACCOUNT_EXISTS,
          error: data.error,
        }
      }
      if (!MOCK_AUTH) {
        if (data.code) {
          return { ok: false, code: data.code, error: data.error }
        }
        return {
          ok: false,
          code: AuthErrorCode.REGISTER_FAILED_STATUS,
          status: res.status,
          error: data.error,
        }
      }
    } catch {
      if (!MOCK_AUTH) {
        return { ok: false, code: AuthErrorCode.NETWORK }
      }
    }

    if (!MOCK_AUTH) {
      return { ok: false, code: AuthErrorCode.REGISTER_OFFLINE_ONLY }
    }

    if (!saveRegisteredUser(username, password, classCode, fullName)) {
      return { ok: false, code: AuthErrorCode.ACCOUNT_EXISTS }
    }
    const classCodeNorm = String(classCode).trim().toUpperCase()
    const fn = fullName?.trim() || ''
    persistToken(null)
    const newUser = createUserObject(username, ROLES.LEARNER, {
      classCode: classCodeNorm,
      name: fn || username,
      fullName: fn,
    }, 'registered')
    setUser(newUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
    return { ok: true, user: newUser }
  }

  const logout = () => {
    setUser(null)
    persistToken(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const updateProfile = async (updates) => {
    if (!user) return { ok: false, code: AuthErrorCode.NOT_LOGGED_IN }
    const token = apiToken || localStorage.getItem(API_TOKEN_KEY)
    if (
      token &&
      user.backendUserId != null &&
      user.role === ROLES.LEARNER
    ) {
      try {
        const res = await fetch(`${API_BASE}/api/me/profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: updates.email,
            dateOfBirth: updates.dateOfBirth,
            gender: updates.gender,
            trainingProgramType: updates.trainingProgramType,
            studentId: updates.studentId,
            faculty: updates.faculty,
            major: updates.major,
            subject: updates.subject,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (data.code) {
            return {
              ok: false,
              code: data.code,
              status: res.status,
              error: data.error,
            }
          }
          return {
            ok: false,
            code: AuthErrorCode.PROFILE_SAVE_FAILED,
            status: res.status,
            error: data.error,
          }
        }
        if (data.profile) {
          const merged = mergeDbProfileIntoUser(user, data.profile)
          setUser(merged)
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(merged))
          return { ok: true, user: merged }
        }
        const fallback = { ...user, ...updates }
        setUser(fallback)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallback))
        return { ok: true, user: fallback }
      } catch {
        return { ok: false, code: AuthErrorCode.NETWORK }
      }
    }
    const updated = { ...user, ...updates }
    setUser(updated)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated))
    return { ok: true, user: updated }
  }

  const isProfileComplete = (u = user) => {
    if (!u) return true
    if (u.role === ROLES.ASSISTANT || u.role === ROLES.ADMIN) return true
    const empty = (v) => !v || v.trim() === '' || v === 'Chưa cập nhật'
    return !empty(u.studentId) && !empty(u.faculty) && !empty(u.major)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        apiToken,
        login,
        register,
        logout,
        updateProfile,
        isProfileComplete,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
