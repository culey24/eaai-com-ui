import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAdmin } from '../context/AdminContext'
import { useAllUsers } from './useAllUsers'
import { useJournal } from '../context/JournalContext'
import { useMessages } from './useMessages'

const CLASS_TO_CHANNEL = { 'IS-1': 'ai-chat', 'IS-2': 'human-chat', 'IS-3': 'internal-chat' }

export function useSupporterStats() {
  const { user } = useAuth()
  const { assignments } = useAdmin()
  const { allUsers } = useAllUsers()
  const { getJournalsForUser } = useJournal()
  const { getMessagesForChannel } = useMessages()

  return useMemo(() => {
    const supporterId = user?.stableId || (user?.name ? `prov-${user.name}` : null)
    if (!supporterId) return { totalLearners: 0, journalsPending: 0, messagesPending: 0 }

    const myAssignments = Object.entries(assignments).filter(([, a]) => a.supporterId === supporterId)
    const totalLearners = myAssignments.length

    let journalsPending = 0
    let messagesPending = 0

    for (const [userId] of myAssignments) {
      const journals = getJournalsForUser(userId) || []
      if (journals.length > 0) journalsPending++

      const u = allUsers.find((x) => x.id === userId)
      const channelId = u?.classCode ? CLASS_TO_CHANNEL[u.classCode] : null
      if (channelId) {
        const msgs = getMessagesForChannel(channelId, userId) || []
        const last = msgs[msgs.length - 1]
        if (last?.role === 'user') messagesPending++
      }
    }

    return { totalLearners, journalsPending, messagesPending }
  }, [user, assignments, allUsers, getJournalsForUser, getMessagesForChannel])
}
