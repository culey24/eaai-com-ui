import { useState, useEffect, useCallback } from 'react'

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
  }
}

export function useAllUsers() {
  const [registered, setRegistered] = useState(loadRegistered)
  const [adminUsers, setAdminUsers] = useState(loadAdminUsers)
  const [roleOverrides, setRoleOverrides] = useState(loadRoleOverrides)

  useEffect(() => {
    const handler = () => {
      setRegistered(loadRegistered())
      setAdminUsers(loadAdminUsers())
      setRoleOverrides(loadRoleOverrides())
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const allUsers = [
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
  ]

  const getLearners = useCallback(
    () => allUsers.filter((u) => u.role === 'LEARNER'),
    [registered, adminUsers, roleOverrides]
  )

  const getByClass = useCallback(
    (classCode) => allUsers.filter((u) => u.classCode === classCode),
    [registered, adminUsers, roleOverrides]
  )

  const createUser = useCallback(({ username, password, role, classCode, managedClasses, fullName }) => {
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
  }, [adminUsers])

  const updateUserRole = useCallback((userId, role) => {
    const next = { ...roleOverrides, [userId]: role }
    setRoleOverrides(next)
    localStorage.setItem(ROLE_OVERRIDES_KEY, JSON.stringify(next))
  }, [roleOverrides])

  const deleteUser = useCallback((userId) => {
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
  }, [adminUsers, roleOverrides])

  return { allUsers, getLearners, getByClass, createUser, updateUserRole, deleteUser }
}
