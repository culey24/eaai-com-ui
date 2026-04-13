import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../config/api'
import { ROLES } from '../constants/roles'

const REGISTERED_KEY = 'eeai_registered_users'
const ADMIN_USERS_KEY = 'eeai_admin_users'
const ROLE_OVERRIDES_KEY = 'eeai_admin_role_overrides'

const PROVISIONED = {
  admin: { username: 'admin', role: 'ADMIN' },
  assistant1: { username: 'assistant1', role: 'ASSISTANT', managedClasses: ['IS-1', 'IS-2'] },
  assistant2: { username: 'assistant2', role: 'ASSISTANT', managedClasses: ['IS-2', 'IS-3'] },
  demo: { username: 'demo', role: 'LEARNER', classCode: 'IS-1' },
}

function loadRegistered() {
  try {
    return JSON.parse(localStorage.getItem(REGISTERED_KEY) || '[]')
  } catch {
    return []
  }
}

function loadAdminUsers() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_USERS_KEY) || '[]')
  } catch {
    return []
  }
}

function loadRoleOverrides() {
  try {
    return JSON.parse(localStorage.getItem(ROLE_OVERRIDES_KEY) || '{}')
  } catch {
    return {}
  }
}

function mapDbRoleToUi(role) {
  const r = String(role || '').toLowerCase()
  if (r === 'student') return 'LEARNER'
  if (r === 'support' || r === 'assistant' || r === 'teacher') return 'ASSISTANT'
  if (r === 'admin') return 'ADMIN'
  return 'LEARNER'
}

function mapUserClassToUi(uc) {
  if (uc == null || uc === '') return null
  const m = { IS_1: 'IS-1', IS_2: 'IS-2', IS_3: 'IS-3' }
  return m[uc] || String(uc)
}

function toUser(entry, id, source, roleOverride) {
  const role = roleOverride ?? entry.role
  return {
    id,
    username: entry.username,
    fullName: entry.fullName ?? null,
    role,
    classCode: entry.classCode ?? null,
    managedClasses: entry.managedClasses ?? null,
    source,
    fromApi: entry.fromApi === true,
    backendUserId: entry.backendUserId,
    /** Vai trò thật trên DB (student|assistant|admin) — khác `role` UI khi có roleOverrides */
    dbUserRole: entry.dbUserRole,
  }
}

export function useAllUsers() {
  const { apiToken, user } = useAuth()
  const [registered, setRegistered] = useState(loadRegistered)
  const [adminUsers, setAdminUsers] = useState(loadAdminUsers)
  const [roleOverrides, setRoleOverrides] = useState(loadRoleOverrides)
  /** null = chưa gọi API hoặc lỗi mạng (dùng local); mảng = đã có phản hồi (có thể rỗng) */
  const [adminApiRows, setAdminApiRows] = useState(null)
  const [adminApiLoaded, setAdminApiLoaded] = useState(false)
  /** Tăng sau khi PATCH role trên DB để GET /api/admin/users tải lại */
  const [adminUsersRefresh, setAdminUsersRefresh] = useState(0)
  const [supporterApiRows, setSupporterApiRows] = useState(null)
  const [supporterApiLoaded, setSupporterApiLoaded] = useState(false)
  const [supporterLearnersRefresh, setSupporterLearnersRefresh] = useState(0)
  const [roleUpdateError, setRoleUpdateError] = useState(null)

  useEffect(() => {
    const handler = () => {
      setRegistered(loadRegistered())
      setAdminUsers(loadAdminUsers())
      setRoleOverrides(loadRoleOverrides())
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  useEffect(() => {
    if (!apiToken || user?.role !== ROLES.ADMIN) {
      setAdminApiRows(null)
      setAdminApiLoaded(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/users`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        })
        if (!res.ok) {
          if (!cancelled) {
            setAdminApiRows(null)
            setAdminApiLoaded(true)
          }
          return
        }
        const data = await res.json()
        if (cancelled) return
        setAdminApiRows(Array.isArray(data.users) ? data.users : [])
        setAdminApiLoaded(true)
        /** Sau deploy / đổi DB, localStorage có thể còn roleOverrides cho api-* (Supporter ảo) — xóa để UI khớp DB. */
        setRoleOverrides((prev) => {
          const next = { ...prev }
          let changed = false
          for (const k of Object.keys(next)) {
            if (k.startsWith('api-')) {
              delete next[k]
              changed = true
            }
          }
          if (!changed) return prev
          try {
            localStorage.setItem(ROLE_OVERRIDES_KEY, JSON.stringify(next))
          } catch {
            /* ignore */
          }
          return next
        })
      } catch {
        if (!cancelled) {
          setAdminApiRows(null)
          setAdminApiLoaded(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiToken, user?.role, adminUsersRefresh])

  useEffect(() => {
    const onFocus = () => {
      if (!apiToken) return
      if (user?.role === ROLES.ASSISTANT) {
        setSupporterLearnersRefresh((n) => n + 1)
      }
      if (user?.role === ROLES.ADMIN) {
        setAdminUsersRefresh((n) => n + 1)
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [apiToken, user?.role])

  useEffect(() => {
    if (!apiToken || user?.role !== ROLES.ASSISTANT) {
      setSupporterApiRows(null)
      setSupporterApiLoaded(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/supporter/learners`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        })
        if (!res.ok) {
          if (!cancelled) {
            setSupporterApiRows(null)
            setSupporterApiLoaded(true)
          }
          return
        }
        const data = await res.json()
        if (cancelled) return
        setSupporterApiRows(Array.isArray(data.learners) ? data.learners : [])
        setSupporterApiLoaded(true)
      } catch {
        if (!cancelled) {
          setSupporterApiRows(null)
          setSupporterApiLoaded(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiToken, user?.role, supporterLearnersRefresh])

  const adminApiUsers = useMemo(() => {
    if (!Array.isArray(adminApiRows)) return []
    /** Luôn hiển thị role từ DB — không gộp roleOverrides (tránh lệch local). */
    return adminApiRows.map((u) =>
      toUser(
        {
          username: u.username,
          fullName: u.fullname,
          role: mapDbRoleToUi(u.userRole),
          classCode: mapUserClassToUi(u.userClass),
          managedClasses: null,
          fromApi: true,
          backendUserId: String(u.userId),
          dbUserRole: u.userRole,
        },
        `api-${u.userId}`,
        'api',
        undefined
      )
    )
  }, [adminApiRows])

  const supporterApiLearners = useMemo(() => {
    if (!Array.isArray(supporterApiRows)) return []
    return supporterApiRows.map((l) =>
      toUser(
        {
          username: l.username,
          fullName: (l.fullname || '').trim() || null,
          role: 'LEARNER',
          classCode: l.classCode,
          managedClasses: null,
          fromApi: true,
          backendUserId: String(l.userId),
        },
        `api-${l.userId}`,
        'api',
        roleOverrides[`api-${l.userId}`]
      )
    )
  }, [supporterApiRows, roleOverrides])

  const localBase = useMemo(
    () => [
      ...Object.entries(PROVISIONED).map(([username, data]) =>
        toUser(data, `prov-${username}`, 'provisioned', roleOverrides[`prov-${username}`])
      ),
      ...registered.map((u) =>
        toUser(
          { ...u, role: 'LEARNER' },
          `reg-${u.username}`,
          'registered',
          roleOverrides[`reg-${u.username}`]
        )
      ),
      ...adminUsers.map((u) =>
        toUser(u, `admin-${u.username}`, 'admin', roleOverrides[`admin-${u.username}`])
      ),
    ],
    [registered, adminUsers, roleOverrides]
  )

  const allUsers = useMemo(() => {
    /** Admin có JWT: chỉ danh sách từ GET /api/admin/users — không ghép provisioned/registered/admin-local. */
    if (user?.role === ROLES.ADMIN && apiToken) {
      if (!adminApiLoaded) return []
      if (Array.isArray(adminApiRows)) return adminApiUsers
      return []
    }
    /** Không yêu cầu Array.isArray(supporterApiRows): khi GET /supporter/learners lỗi, rows=null nhưng vẫn gộp
     *  (supporterApiLearners=[]), tránh rơi về localBase-only → mất toàn bộ học viên api-* trong allUsers. */
    if (user?.role === ROLES.ASSISTANT && apiToken && supporterApiLoaded) {
      const nonLearnerLocal = localBase.filter((u) => u.role !== 'LEARNER')
      const localLearners = localBase.filter(
        (u) =>
          u.role === 'LEARNER' &&
          !supporterApiLearners.some((a) => a.username === u.username)
      )
      return [...nonLearnerLocal, ...supporterApiLearners, ...localLearners]
    }
    return localBase
  }, [
    localBase,
    user?.role,
    apiToken,
    adminApiLoaded,
    adminApiRows,
    adminApiUsers,
    supporterApiLoaded,
    supporterApiRows,
    supporterApiLearners,
  ])

  const getLearners = useCallback(
    () => allUsers.filter((u) => u.role === 'LEARNER'),
    [allUsers]
  )

  const getByClass = useCallback(
    (classCode) => allUsers.filter((u) => u.classCode === classCode),
    [allUsers]
  )

  const createUser = useCallback(
    ({ username, password, role, classCode, managedClasses, fullName }) => {
      const next = [
        ...adminUsers,
        {
          username,
          password: password || '',
          role: role || 'LEARNER',
          classCode: classCode || null,
          managedClasses: managedClasses || null,
          fullName: fullName?.trim() || '',
        },
      ]
      setAdminUsers(next)
      localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(next))
    },
    [adminUsers]
  )

  const clearRoleUpdateError = useCallback(() => setRoleUpdateError(null), [])

  const updateUserRole = useCallback(
    async (userId, role) => {
      setRoleUpdateError(null)

      /** Tài khoản trên DB — bắt buộc PATCH; không được ghi roleOverrides trước (tránh UI đổi mà DB vẫn student). */
      if (userId.startsWith('api-')) {
        if (!apiToken || user?.role !== ROLES.ADMIN) {
          const msg =
            'Để lưu vai trò vào database, admin phải đăng nhập bằng tài khoản trên máy chủ (có JWT). Đăng nhập demo/local không gửi API — chỉ thay đổi hiển thị cục bộ, không ghi DB.'
          setRoleUpdateError(msg)
          return { ok: false, error: msg }
        }
        const backendId = userId.slice(4).trim().slice(0, 10)
        if (!backendId) {
          const msg = 'Không xác định được mã người dùng trên server.'
          setRoleUpdateError(msg)
          return { ok: false, error: msg }
        }
        try {
          const res = await fetch(
            `${API_BASE}/api/admin/users/${encodeURIComponent(backendId)}/role`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiToken}`,
              },
              body: JSON.stringify({ role }),
            }
          )
          const data = await res.json().catch(() => ({}))
          if (!res.ok) {
            const msg =
              data.error || data.message || (data.code ? String(data.code) : null) || `Lỗi HTTP ${res.status}`
            setRoleUpdateError(msg)
            return { ok: false, error: msg }
          }
          setRoleOverrides((prev) => {
            const next = { ...prev }
            delete next[userId]
            try {
              localStorage.setItem(ROLE_OVERRIDES_KEY, JSON.stringify(next))
            } catch {
              /* ignore */
            }
            return next
          })
          setAdminUsersRefresh((n) => n + 1)
          return { ok: true }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Lỗi mạng'
          setRoleUpdateError(msg)
          return { ok: false, error: msg }
        }
      }

      const next = { ...roleOverrides, [userId]: role }
      setRoleOverrides(next)
      try {
        localStorage.setItem(ROLE_OVERRIDES_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return { ok: true }
    },
    [roleOverrides, apiToken, user?.role]
  )

  const updateUserClass = useCallback(
    async (userId, classCode) => {
      setRoleUpdateError(null)
      if (!userId.startsWith('api-')) {
        const msg =
          'Chỉ tài khoản trên máy chủ (danh sách từ API) mới đổi được mã lớp qua giao diện này.'
        setRoleUpdateError(msg)
        return { ok: false, error: msg }
      }
      if (!apiToken || user?.role !== ROLES.ADMIN) {
        const msg =
          'Để lưu mã lớp vào database, admin phải đăng nhập bằng tài khoản trên máy chủ (có JWT).'
        setRoleUpdateError(msg)
        return { ok: false, error: msg }
      }
      const backendId = userId.slice(4).trim().slice(0, 10)
      if (!backendId) {
        const msg = 'Không xác định được mã người dùng trên server.'
        setRoleUpdateError(msg)
        return { ok: false, error: msg }
      }
      try {
        const res = await fetch(
          `${API_BASE}/api/admin/users/${encodeURIComponent(backendId)}/class`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiToken}`,
            },
            body: JSON.stringify({ classCode }),
          }
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const msg =
            data.error || data.message || (data.code ? String(data.code) : null) || `Lỗi HTTP ${res.status}`
          setRoleUpdateError(msg)
          return { ok: false, error: msg }
        }
        setAdminUsersRefresh((n) => n + 1)
        return { ok: true }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Lỗi mạng'
        setRoleUpdateError(msg)
        return { ok: false, error: msg }
      }
    },
    [apiToken, user?.role]
  )

  const deleteUser = useCallback(
    (userId) => {
      if (userId.startsWith('api-')) return false
      if (userId.startsWith('prov-')) return false
      if (userId.startsWith('reg-')) {
        const username = userId.replace('reg-', '')
        const users = loadRegistered().filter((u) => u.username !== username)
        setRegistered(users)
        localStorage.setItem(REGISTERED_KEY, JSON.stringify(users))
      } else if (userId.startsWith('admin-')) {
        const username = userId.replace('admin-', '')
        const next = adminUsers.filter((u) => u.username !== username)
        setAdminUsers(next)
        localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(next))
      }
      const nextOverrides = { ...roleOverrides }
      delete nextOverrides[userId]
      setRoleOverrides(nextOverrides)
      localStorage.setItem(ROLE_OVERRIDES_KEY, JSON.stringify(nextOverrides))
      return true
    },
    [adminUsers, roleOverrides]
  )

  return {
    allUsers,
    getLearners,
    getByClass,
    createUser,
    updateUserRole,
    updateUserClass,
    deleteUser,
    roleUpdateError,
    clearRoleUpdateError,
    adminApiLoaded,
    /** null = lỗi mạng / 403; [] = DB rỗng; chỉ có nghĩa khi adminApiLoaded */
    adminApiRows,
    /** Map userId → role UI khi admin đổi dropdown trước / song song khi GET users sync lại */
    roleOverrides,
    /** null = chưa có phản hồi / lỗi; mảng (có thể rỗng) = GET /api/supporter/learners đã trả về */
    supporterApiRows,
    supporterApiLearners,
  }
}
