import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const JOURNAL_STORAGE_KEY = 'eeai_chatbot_journals'
const SUBMISSIONS_STORAGE_KEY = 'eeai_chatbot_submissions'

function loadJson(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

function loadSubmissions() {
  const list = loadJson(SUBMISSIONS_STORAGE_KEY, [])
  if (list.length === 0) {
    const defaultSub = {
      id: 'default',
      title: 'Submission 1',
      description: '',
      deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
    }
    return [defaultSub]
  }
  return list
}

function loadJournals() {
  return loadJson(JOURNAL_STORAGE_KEY, {})
}

const JournalContext = createContext(null)

export function JournalProvider({ children }) {
  const [submissions, setSubmissions] = useState(loadSubmissions)
  const [journals, setJournals] = useState(loadJournals)

  useEffect(() => {
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions))
  }, [submissions])

  // Migrate submissions: add description if missing
  useEffect(() => {
    const needsMigrate = submissions.some((s) => s.description === undefined)
    if (needsMigrate) {
      setSubmissions((prev) =>
        prev.map((s) => (s.description === undefined ? { ...s, description: '' } : s))
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journals))
  }, [journals])

  // Migrate old journals: deadlineId -> submissionId (once on mount)
  useEffect(() => {
    let changed = false
    const migrated = {}
    for (const [userId, entries] of Object.entries(journals)) {
      const mapped = (entries || []).map((j) => {
        if (j.deadlineId && !j.submissionId) {
          changed = true
          return { ...j, submissionId: j.deadlineId, deadlineId: j.deadlineId }
        }
        return j
      })
      migrated[userId] = mapped
    }
    if (changed) setJournals(migrated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getActiveSubmission = useCallback(() => {
    const now = Date.now()
    const sorted = [...submissions].sort((a, b) => a.deadline - b.deadline)
    return sorted.find((s) => s.deadline > now) || null
  }, [submissions])

  const getSubmissions = useCallback(() => submissions, [submissions])

  const addSubmission = useCallback((title, description, deadline) => {
    const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const sub = { id, title, description: description || '', deadline: new Date(deadline).getTime(), createdAt: Date.now() }
    setSubmissions((prev) => [...prev, sub].sort((a, b) => a.deadline - b.deadline))
    return sub
  }, [])

  const updateSubmission = useCallback((id, updates) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)).sort((a, b) => a.deadline - b.deadline)
    )
  }, [])

  const deleteSubmission = useCallback((id) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id))
    setJournals((prev) => {
      const next = {}
      for (const [userId, entries] of Object.entries(prev)) {
        next[userId] = (entries || []).filter((j) => j.submissionId !== id)
      }
      return next
    })
  }, [])

  const getJournalsForUser = useCallback(
    (userId, submissionId = null) => {
      const entries = journals[userId] || []
      if (submissionId) return entries.filter((j) => j.submissionId === submissionId)
      return entries
    },
    [journals]
  )

  const getJournalForUserAndSubmission = useCallback(
    (userId, submissionId) => {
      const entries = journals[userId] || []
      return entries.find((j) => j.submissionId === submissionId) || null
    },
    [journals]
  )

  const getAllJournals = useCallback(() => journals, [journals])

  const getSubmissionStats = useCallback(
    (userIds, submissionId = null) => {
      const targetId = submissionId || getActiveSubmission()?.id
      if (!targetId) return { submitted: 0, total: userIds.length, notSubmitted: userIds.length }

      const total = userIds.length
      const submitted = userIds.filter((uid) => {
        const userJournals = journals[uid] || []
        return userJournals.some((j) => (j.submissionId || j.deadlineId) === targetId)
      }).length
      return { submitted, total, notSubmitted: total - submitted }
    },
    [journals, getActiveSubmission]
  )

  const addJournal = useCallback((userId, file, submissionId = null) => {
    const targetId = submissionId || getActiveSubmission()?.id
    if (!targetId) return null

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fileName: file.name,
      fileSize: file.size,
      submissionId: targetId,
      deadlineId: targetId,
      uploadedAt: Date.now(),
    }
    setJournals((prev) => {
      const userEntries = (prev[userId] || []).filter((j) => (j.submissionId || j.deadlineId) !== targetId)
      return {
        ...prev,
        [userId]: [...userEntries, entry],
      }
    })
    return entry
  }, [getActiveSubmission])

  const updateJournal = useCallback((userId, submissionId, file) => {
    const targetId = submissionId || getActiveSubmission()?.id
    if (!targetId) return null

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fileName: file.name,
      fileSize: file.size,
      submissionId: targetId,
      deadlineId: targetId,
      uploadedAt: Date.now(),
    }
    setJournals((prev) => {
      const userEntries = prev[userId] || []
      const hasMatch = userEntries.some((j) => (j.submissionId || j.deadlineId) === targetId)
      const newEntries = hasMatch
        ? userEntries.map((j) => ((j.submissionId || j.deadlineId) === targetId ? entry : j))
        : [...userEntries, entry]
      return { ...prev, [userId]: newEntries }
    })
    return entry
  }, [getActiveSubmission])

  const deleteJournal = useCallback((userId, submissionId) => {
    const targetId = submissionId || getActiveSubmission()?.id
    if (!targetId) return
    setJournals((prev) => ({
      ...prev,
      [userId]: (prev[userId] || []).filter((j) => (j.submissionId || j.deadlineId) !== targetId),
    }))
  }, [getActiveSubmission])

  const isSubmissionOpen = useCallback(
    (submissionId) => {
      const sub = submissions.find((s) => s.id === submissionId)
      return sub ? sub.deadline > Date.now() : false
    },
    [submissions]
  )

  const value = {
    journals,
    submissions,
    getSubmissions,
    getActiveSubmission,
    addSubmission,
    updateSubmission,
    deleteSubmission,
    getJournalsForUser,
    getJournalForUserAndSubmission,
    getAllJournals,
    getSubmissionStats,
    addJournal,
    updateJournal,
    deleteJournal,
    isSubmissionOpen,
  }

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>
}

export function useJournal() {
  const ctx = useContext(JournalContext)
  if (!ctx) throw new Error('useJournal must be used within JournalProvider')
  return ctx
}
