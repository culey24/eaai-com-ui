import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const JOURNAL_STORAGE_KEY = 'eeai_chatbot_journals'

function loadJournals() {
  try {
    const stored = localStorage.getItem(JOURNAL_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

const JournalContext = createContext(null)

export function JournalProvider({ children }) {
  const [journals, setJournals] = useState(loadJournals)

  useEffect(() => {
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journals))
  }, [journals])

  const getJournalsForUser = useCallback(
    (userId) => journals[userId] || [],
    [journals]
  )

  const getAllJournals = useCallback(() => journals, [journals])

  const getSubmissionStats = useCallback(
    (userIds, deadlineId = 'default') => {
      const total = userIds.length
      const submitted = userIds.filter((uid) => {
        const userJournals = journals[uid] || []
        return userJournals.some((j) => j.deadlineId === deadlineId)
      }).length
      return { submitted, total, notSubmitted: total - submitted }
    },
    [journals]
  )

  const addJournal = useCallback((userId, file, deadlineId = 'default') => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fileName: file.name,
      fileSize: file.size,
      deadlineId,
      uploadedAt: Date.now(),
    }
    setJournals((prev) => ({
      ...prev,
      [userId]: [...(prev[userId] || []), entry],
    }))
    return entry
  }, [])

  return (
    <JournalContext.Provider value={{ journals, getJournalsForUser, getAllJournals, getSubmissionStats, addJournal }}>
      {children}
    </JournalContext.Provider>
  )
}

export function useJournal() {
  const ctx = useContext(JournalContext)
  if (!ctx) throw new Error('useJournal must be used within JournalProvider')
  return ctx
}
