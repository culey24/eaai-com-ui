import { useState, useCallback, useEffect } from 'react'

const REPORTS_STORAGE_KEY = 'eeai_chatbot_reports'

function loadReports() {
  try {
    const stored = localStorage.getItem(REPORTS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveReports(reports) {
  localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports))
}

export function useReports() {
  const [reports, setReports] = useState(loadReports)

  useEffect(() => {
    saveReports(reports)
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

  return { reports, addReport, getReportsForChannel }
}
