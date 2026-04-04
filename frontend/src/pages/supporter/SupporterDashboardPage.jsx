import { useState, useEffect } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import ProfileCompleteBanner from '../../components/ProfileCompleteBanner'
import TaskDashboardWidget from '../../components/supporter/TaskDashboardWidget'
import ChatWindow from '../../components/chat/ChatWindow'
import { MessageSquare, FileText } from 'lucide-react'
import { useMessages } from '../../hooks/useMessages'
import { useJournal } from '../../context/JournalContext'
import JournalEntriesSidebarList from '../../components/journal/JournalEntriesSidebarList'
import { useLanguage } from '../../context/LanguageContext'
import { useSupporterStats } from '../../hooks/useSupporterStats'
import { useSupporterChat } from '../../context/SupporterChatContext'
import { CLASS_TO_CHANNEL } from '../../constants/roles'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'

export default function SupporterDashboardPage() {
  const { t } = useLanguage()
  const { apiToken } = useAuth()
  const { selectedUser } = useSupporterChat()
  const channel = selectedUser?.classCode ? CLASS_TO_CHANNEL[selectedUser.classCode] : null
  const { getMessagesForChannel, addMessage, remoteConversationId, remoteThreadLoading } = useMessages(
    channel?.id,
    {
    assistantViewLearnerId: selectedUser?.backendUserId ?? null,
  })
  const { getJournalsForUser } = useJournal()
  const stats = useSupporterStats()
  const [apiJournals, setApiJournals] = useState({ loaded: false, list: null })

  useEffect(() => {
    if (!apiToken || !selectedUser?.backendUserId) {
      setApiJournals({ loaded: false, list: null })
      return
    }
    let cancelled = false
    fetch(
      `${API_BASE}/api/journal/by-user/${encodeURIComponent(selectedUser.backendUserId)}`,
      { headers: { Authorization: `Bearer ${apiToken}` } }
    )
      .then(async (r) => {
        if (!r.ok) return { ok: false }
        const data = await r.json().catch(() => ({ uploads: [] }))
        return { ok: true, data }
      })
      .then((out) => {
        if (cancelled) return
        if (!out.ok) {
          setApiJournals({ loaded: false, list: null })
          return
        }
        const list = (out.data.uploads || []).map((u) => {
          const pid = u.period_id != null && u.period_id !== '' ? String(u.period_id) : null
          return {
            id: `srv-${u.upload_id}`,
            uploadId: u.upload_id != null ? String(u.upload_id) : undefined,
            fileName: u.original_file_name || '—',
            uploadedAt: u.submitted_at ? new Date(u.submitted_at).getTime() : Date.now(),
            submissionId: pid ?? undefined,
            deadlineId: pid ?? undefined,
            fromServer: true,
          }
        })
        setApiJournals({ loaded: true, list })
      })
      .catch(() => {
        if (!cancelled) setApiJournals({ loaded: false, list: null })
      })
    return () => {
      cancelled = true
    }
  }, [apiToken, selectedUser?.backendUserId])

  const getUserDisplayName = (u) =>
    u.fullName?.trim() ? `${u.fullName.trim()} (${u.username})` : (u.username || u.id)

  const messages = channel && selectedUser ? getMessagesForChannel(channel.id, selectedUser.id) : []
  const journalKey = selectedUser?.stableId ?? selectedUser?.id
  const journalsRaw =
    apiJournals.loaded && apiJournals.list
      ? apiJournals.list
      : selectedUser && journalKey
        ? getJournalsForUser(journalKey)
        : []
  const journals = Array.isArray(journalsRaw)
    ? journalsRaw.filter((j) => j && typeof j === 'object')
    : []

  const handleSendMessage = (channelId, content, file) => {
    if (!selectedUser) return
    addMessage(channelId, content, file, 'user', selectedUser.id)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeChannelId={null} onSelectChannel={() => {}} />
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
        <ProfileCompleteBanner />
        <TaskDashboardWidget stats={stats} />

        <div className="flex-1 flex min-h-0">
          {selectedUser ? (
            <>
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <ChatWindow
                  channel={channel}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  userId={selectedUser.id}
                  hideReport
                  messagePerspective="supporter"
                  customTitle={`${getUserDisplayName(selectedUser)} — ${channel ? t('chat.agent', { code: channel.code }) : t('chat.selectChannel')}`}
                  remoteConversationId={remoteConversationId}
                  threadLoading={remoteThreadLoading}
                />
              </div>
              <aside className="w-72 flex-shrink-0 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
                <div className="flex-shrink-0 px-4 py-4 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    {t('journal.title')}
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <JournalEntriesSidebarList
                    journals={journals}
                    downloadLearnerUserId={selectedUser?.backendUserId ?? null}
                  />
                </div>
              </aside>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
              <p>{t('supporter.selectUserToView')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
