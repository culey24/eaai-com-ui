import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { ROLES, VALID_CLASS_CODES } from '../constants/roles'
import { CLASS_TO_MODE } from '../constants/admin'

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
  const [assignments, setAssignments] = useState(() => loadJson(ASSIGNMENTS_KEY, {}))
  const [supportRequests, setSupportRequests] = useState(() => loadJson(SUPPORT_REQUESTS_KEY, []))
  const [autoMode, setAutoMode] = useState(() => loadJson(AUTO_MODE_KEY, false))
  const [deadlines, setDeadlines] = useState(() =>
    loadJson(DEADLINES_KEY, {
      default: { label: 'Deadline 1', dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000 },
    })
  )

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

  const getAssignment = useCallback(
    (userId) => assignments[userId] || null,
    [assignments]
  )

  const assignSupporter = useCallback((userId, supporterId, teachingMode) => {
    setAssignments((prev) => ({
      ...prev,
      [userId]: { supporterId, teachingMode, assignedAt: Date.now() },
    }))
  }, [])

  const kickSupporter = useCallback((userId) => {
    setAssignments((prev) => {
      const next = { ...prev }
      delete next[userId]
      return next
    })
  }, [])

  const addSupportRequest = useCallback((supporterId, userId, classCode) => {
    const exists = supportRequests.some(
      (r) => r.supporterId === supporterId && r.userId === userId && r.status === 'pending'
    )
    if (exists) return
    setSupportRequests((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        supporterId,
        userId,
        classCode,
        status: 'pending',
        createdAt: Date.now(),
      },
    ])
  }, [supportRequests])

  const approveRequest = useCallback((requestId) => {
    const req = supportRequests.find((r) => r.id === requestId)
    if (req) {
      setAssignments((a) => ({
        ...a,
        [req.userId]: {
          supporterId: req.supporterId,
          teachingMode: CLASS_TO_MODE[req.classCode] || 'MANUAL',
          assignedAt: Date.now(),
        },
      }))
    }
    setSupportRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'approved', approvedAt: Date.now() } : r
      )
    )
  }, [supportRequests])

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
