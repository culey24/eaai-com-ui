import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { ROLES } from '../constants/roles'
import { CLASS_TO_MODE } from '../constants/admin'
import { API_BASE } from '../config/api'
import { uiIdToBackendUserId } from '../lib/userIds'

const ASSIGNMENTS_KEY = 'eeai_admin_assignments'
const SUPPORT_REQUESTS_KEY = 'eeai_admin_support_requests'
const AUTO_MODE_KEY = 'eeai_admin_auto_mode'
const DEADLINES_KEY = 'eeai_admin_deadlines'

function loadJson(key, def = {}) {
  try {
    const s = localStorage.getItem(key)
    return s ? JSON.parse(s) : def
  } catch {
    return def
  }
}

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const { apiToken, user } = useAuth()
  const [assignments, setAssignments] = useState(() => loadJson(ASSIGNMENTS_KEY, {}))
  const [supportRequests, setSupportRequests] = useState(() => loadJson(SUPPORT_REQUESTS_KEY, []))
  const [autoMode, setAutoMode] = useState(() => loadJson(AUTO_MODE_KEY, false))
  const [deadlines, setDeadlines] = useState(() =>
    loadJson(DEADLINES_KEY, {
      default: { label: 'Deadline 1', dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000 },
    })
  )
  const [assignmentSyncError, setAssignmentSyncError] = useState(null)

  useEffect(() => {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments))
  }, [assignments])
  useEffect(() => {
    localStorage.setItem(SUPPORT_REQUESTS_KEY, JSON.stringify(supportRequests))
  }, [supportRequests])
  useEffect(() => {
    localStorage.setItem(AUTO_MODE_KEY, JSON.stringify(autoMode))
  }, [autoMode])
  useEffect(() => {
    localStorage.setItem(DEADLINES_KEY, JSON.stringify(deadlines))
  }, [deadlines])

  /** Đồng bộ từ DB khi admin đăng nhập JWT — nguồn chính cho tài khoản api-*. */
  useEffect(() => {
    if (!apiToken || user?.role !== ROLES.ADMIN) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/supporter-assignments`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        })
        if (!res.ok || cancelled) return
        const data = await res.json().catch(() => ({}))
        const rows = Array.isArray(data.assignments) ? data.assignments : []
        const fromApi = {}
        for (const row of rows) {
          if (!row.learnerId || !row.supporterId) continue
          fromApi[`api-${row.learnerId}`] = {
            supporterId: `api-${row.supporterId}`,
            teachingMode: row.teachingMode,
            assignedAt: row.assignedAt ? new Date(row.assignedAt).getTime() : Date.now(),
          }
        }
        if (cancelled) return
        setAssignments((prev) => {
          const rest = {}
          for (const [k, v] of Object.entries(prev)) {
            if (!k.startsWith('api-')) rest[k] = v
          }
          return { ...rest, ...fromApi }
        })
        setAssignmentSyncError(null)
      } catch {
        /* offline — giữ localStorage */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiToken, user?.role])

  const clearAssignmentSyncError = useCallback(() => setAssignmentSyncError(null), [])

  const getAssignment = useCallback(
    (userId) => assignments[userId] || null,
    [assignments]
  )

  const assignSupporter = useCallback(
    async (learnerUiKey, supporterUiKey, teachingMode, meta = {}) => {
      const learnerDb = meta.learnerUser != null ? uiIdToBackendUserId(meta.learnerUser) : null
      const supporterDb =
        meta.supporterUser != null ? uiIdToBackendUserId(meta.supporterUser) : null

      if (apiToken && user?.role === ROLES.ADMIN && learnerDb && supporterDb) {
        const res = await fetch(`${API_BASE}/api/admin/supporter-assignments`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            learnerId: learnerDb,
            supporterId: supporterDb,
            teachingMode,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const msg = data.error || `HTTP ${res.status}`
          setAssignmentSyncError(msg)
          return { ok: false, error: msg }
        }
      }

      setAssignmentSyncError(null)
      setAssignments((prev) => ({
        ...prev,
        [learnerUiKey]: { supporterId: supporterUiKey, teachingMode, assignedAt: Date.now() },
      }))
      return { ok: true }
    },
    [apiToken, user?.role]
  )

  const kickSupporter = useCallback(
    async (learnerUiKey, meta = {}) => {
      const learnerDb =
        meta.learnerUser != null
          ? uiIdToBackendUserId(meta.learnerUser)
          : typeof learnerUiKey === 'string' && learnerUiKey.startsWith('api-')
            ? learnerUiKey.slice(4).slice(0, 10)
            : null

      if (apiToken && user?.role === ROLES.ADMIN && learnerDb) {
        const res = await fetch(
          `${API_BASE}/api/admin/supporter-assignments/${encodeURIComponent(learnerDb)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${apiToken}` },
          }
        )
        if (!res.ok && res.status !== 404) {
          const data = await res.json().catch(() => ({}))
          const msg = data.error || `HTTP ${res.status}`
          setAssignmentSyncError(msg)
          return { ok: false, error: msg }
        }
      }

      setAssignmentSyncError(null)
      setAssignments((prev) => {
        const next = { ...prev }
        delete next[learnerUiKey]
        return next
      })
      return { ok: true }
    },
    [apiToken, user?.role]
  )

  const addSupportRequest = useCallback((supporterId, userId, classCode) => {
    setSupportRequests((prev) => {
      const exists = prev.some(
        (r) => r.supporterId === supporterId && r.userId === userId && r.status === 'pending'
      )
      if (exists) return prev
      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          supporterId,
          userId,
          classCode,
          status: 'pending',
          createdAt: Date.now(),
        },
      ]
    })
  }, [])

  const approveRequest = useCallback(
    async (requestId, meta = {}) => {
      const requestRow = supportRequests.find((r) => r.id === requestId)
      if (!requestRow) return { ok: false, error: 'request_not_found' }

      const learnerDb =
        meta.learnerUser != null ? uiIdToBackendUserId(meta.learnerUser) : null
      const supporterDb =
        meta.supporterUser != null ? uiIdToBackendUserId(meta.supporterUser) : null
      const mode = CLASS_TO_MODE[requestRow.classCode] || 'MANUAL'

      if (apiToken && user?.role === ROLES.ADMIN && learnerDb && supporterDb) {
        const res = await fetch(`${API_BASE}/api/admin/supporter-assignments`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            learnerId: learnerDb,
            supporterId: supporterDb,
            teachingMode: mode,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const msg = data.error || `HTTP ${res.status}`
          setAssignmentSyncError(msg)
          return { ok: false, error: msg }
        }
      }

      setAssignmentSyncError(null)
      setAssignments((a) => ({
        ...a,
        [requestRow.userId]: {
          supporterId: requestRow.supporterId,
          teachingMode: mode,
          assignedAt: Date.now(),
        },
      }))
      setSupportRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: 'approved', approvedAt: Date.now() } : r
        )
      )
      return { ok: true }
    },
    [apiToken, user?.role, supportRequests]
  )

  const rejectRequest = useCallback((requestId) => {
    setSupportRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r))
    )
  }, [])

  return (
    <AdminContext.Provider
      value={{
        assignments,
        supportRequests,
        autoMode,
        setAutoMode,
        deadlines,
        setDeadlines,
        getAssignment,
        assignSupporter,
        kickSupporter,
        addSupportRequest,
        approveRequest,
        rejectRequest,
        assignmentSyncError,
        clearAssignmentSyncError,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
