import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { ROLES } from '../constants/roles'
import { API_BASE } from '../config/api'

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

/** Chuẩn hóa submission: startsAt, endsAt (legacy: deadline) */
function normalizeSubmission(s) {
  const endsAt = s.endsAt ?? s.deadline ?? Date.now() + 30 * 24 * 60 * 60 * 1000
  const startsAt = s.startsAt !== undefined && s.startsAt !== null ? s.startsAt : s.createdAt ?? 0
  return { ...s, endsAt, startsAt, deadline: endsAt }
}

function loadSubmissions() {
  const list = loadJson(SUBMISSIONS_STORAGE_KEY, [])
  if (list.length === 0) {
    const now = Date.now()
    const defaultSub = normalizeSubmission({
      id: 'default',
      title: 'Submission 1',
      description: '',
      deadline: now + 30 * 24 * 60 * 60 * 1000,
      createdAt: now,
    })
    return [defaultSub]
  }
  return list.map(normalizeSubmission)
}

function loadJournals() {
  return loadJson(JOURNAL_STORAGE_KEY, {})
}

const JournalContext = createContext(null)

export function JournalProvider({ children }) {
  const { apiToken, user } = useAuth()
  const [submissions, setSubmissions] = useState(loadSubmissions)
  const [journals, setJournals] = useState(loadJournals)

  useEffect(() => {
    if (!apiToken || user?.role !== ROLES.LEARNER || !user?.backendUserId || !user?.stableId) return
    let cancelled = false
    fetch(`${API_BASE}/api/journal/me`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
      .then((r) => (r.ok ? r.json() : { uploads: [] }))
      .then((data) => {
        if (cancelled) return
        const stableId = user.stableId
        const serverEntries = (data.uploads || []).map((u) => ({
          id: `srv-${u.upload_id}`,
          uploadId: u.upload_id != null ? String(u.upload_id) : undefined,
          fileName: u.original_file_name || 'file',
          fileSize: 0,
          submissionId: u.period_id,
          deadlineId: u.period_id,
          uploadedAt: u.submitted_at ? new Date(u.submitted_at).getTime() : Date.now(),
          fromServer: true,
        }))
        setJournals((prev) => {
          const local = prev[stableId] || []
          const localOnly = local.filter(
            (j) =>
              !j.fromServer &&
              !serverEntries.some(
                (s) => (s.submissionId || s.deadlineId) === (j.submissionId || j.deadlineId)
              )
          )
          return { ...prev, [stableId]: [...serverEntries, ...localOnly] }
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [apiToken, user?.role, user?.backendUserId, user?.stableId])

  useEffect(() => {
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions))
  }, [submissions])

  // Migrate submissions: description, startsAt/endsAt
  useEffect(() => {
    setSubmissions((prev) => {
      let changed = false
      const next = prev.map((s) => {
        let u = { ...s }
        if (u.description === undefined) {
          u.description = ''
          changed = true
        }
        const norm = normalizeSubmission(u)
        if (norm.endsAt !== u.endsAt || norm.startsAt !== u.startsAt) changed = true
        return norm
      })
      return changed ? next : prev
    })
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
    const open = submissions.filter((s) => s.startsAt <= now && s.endsAt > now)
    open.sort((a, b) => a.endsAt - b.endsAt)
    return open[0] || null
  }, [submissions])

  /** Submissions đã bắt đầu (learner được thấy) */
  const getSubmissionsStartedForLearner = useCallback(() => {
    const now = Date.now()
    return submissions.filter((s) => s.startsAt <= now).sort((a, b) => a.endsAt - b.endsAt)
  }, [submissions])

  const getSubmissions = useCallback(() => submissions, [submissions])

  const addSubmission = useCallback((title, description, startsAt, endsAt) => {
    const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const start = new Date(startsAt).getTime()
    const end = new Date(endsAt).getTime()
    const sub = normalizeSubmission({
      id,
      title,
      description: description || '',
      startsAt: start,
      endsAt: end,
      createdAt: Date.now(),
    })
    setSubmissions((prev) => [...prev, sub].sort((a, b) => a.endsAt - b.endsAt))
    return sub
  }, [])

  const updateSubmission = useCallback((id, updates) => {
    setSubmissions((prev) =>
      prev
        .map((s) => {
          if (s.id !== id) return s
          const merged = { ...s, ...updates }
          if (updates.startsAt !== undefined) {
            merged.startsAt =
              typeof updates.startsAt === 'number' ? updates.startsAt : new Date(updates.startsAt).getTime()
          }
          if (updates.endsAt !== undefined) {
            merged.endsAt =
              typeof updates.endsAt === 'number' ? updates.endsAt : new Date(updates.endsAt).getTime()
          }
          if (updates.deadline !== undefined) {
            merged.endsAt =
              typeof updates.deadline === 'number' ? updates.deadline : new Date(updates.deadline).getTime()
          }
          return normalizeSubmission(merged)
        })
        .sort((a, b) => a.endsAt - b.endsAt)
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
      if (!sub) return false
      const now = Date.now()
      return sub.startsAt <= now && sub.endsAt > now
    },
    [submissions]
  )

  const value = {
    journals,
    submissions,
    getSubmissions,
    getSubmissionsStartedForLearner,
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
