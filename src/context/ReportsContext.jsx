import { createContext, useContext, useState, useCallback, useEffect } from 'react'

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
  const [reports, setReports] = useState(loadReports)

  useEffect(() => {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports))
  }, [reports])

  const addReport = useCallback((report) => {
    const newReport = {
      ...report,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }
    setReports((prev) => [...prev, newReport])
    return newReport
  }, [])

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
