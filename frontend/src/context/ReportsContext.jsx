import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { ROLES } from '../constants/roles'
import { API_BASE } from '../config/api'

const REPORTS_STORAGE_KEY = 'eeai_chatbot_reports'

function loadReports() {
  try {
    const stored = localStorage.getItem(REPORTS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const ReportsContext = createContext(null)

export function ReportsProvider({ children }) {
  const { apiToken, user } = useAuth()
  const [reports, setReports] = useState(loadReports)

  const useRemote = Boolean(
    apiToken &&
      user &&
      (user.role === ROLES.LEARNER || user.role === ROLES.ASSISTANT || user.role === ROLES.ADMIN)
  )

  useEffect(() => {
    if (!useRemote) {
      setReports(loadReports())
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/reports`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        setReports(Array.isArray(data.reports) ? data.reports : [])
      } catch {
        /* giữ state hiện tại */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [useRemote, apiToken])

  useEffect(() => {
    if (useRemote) return
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports))
  }, [reports, useRemote])

  const addReport = useCallback(
    async (report) => {
      if (useRemote && apiToken) {
        try {
          const res = await fetch(`${API_BASE}/api/reports`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiToken}`,
            },
            body: JSON.stringify({
              channelId: report.channelId,
              reportType: report.type || report.reportType,
              type: report.type,
              detail: report.detail ?? null,
              channelLabel: report.channelLabel,
              messageId: report.messageId,
            }),
          })
          if (res.ok) {
            const r2 = await fetch(`${API_BASE}/api/reports`, {
              headers: { Authorization: `Bearer ${apiToken}` },
            })
            if (r2.ok) {
              const data = await r2.json()
              setReports(Array.isArray(data.reports) ? data.reports : [])
            }
            return
          }
        } catch {
          /* ignore */
        }
        return
      }

      const newReport = {
        ...report,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      }
      setReports((prev) => [...prev, newReport])
    },
    [useRemote, apiToken]
  )

  const getReportsForChannel = useCallback(
    (channelId) => reports.filter((r) => r.channelId === channelId),
    [reports]
  )

  return (
    <ReportsContext.Provider value={{ reports, addReport, getReportsForChannel }}>
      {children}
    </ReportsContext.Provider>
  )
}

export function useReports() {
  const ctx = useContext(ReportsContext)
  if (!ctx) throw new Error('useReports must be used within ReportsProvider')
  return ctx
}
