import Sidebar from '../../components/layout/Sidebar'
import ProfileCompleteBanner from '../../components/ProfileCompleteBanner'
import TaskDashboardWidget from '../../components/supporter/TaskDashboardWidget'
import ChatWindow from '../../components/chat/ChatWindow'
import { MessageSquare, FileText } from 'lucide-react'
import { useMessages } from '../../hooks/useMessages'
import { useJournal } from '../../context/JournalContext'
import { useLanguage } from '../../context/LanguageContext'
import { useSupporterStats } from '../../hooks/useSupporterStats'
import { useSupporterChat } from '../../context/SupporterChatContext'
import { CLASS_TO_CHANNEL } from '../../constants/roles'

export default function SupporterDashboardPage() {
  const { t } = useLanguage()
  const { getMessagesForChannel, addMessage } = useMessages()
  const { getJournalsForUser } = useJournal()
  const stats = useSupporterStats()
  const { selectedUser } = useSupporterChat()

  const getUserDisplayName = (u) =>
    u.fullName?.trim() ? `${u.fullName.trim()} (${u.username})` : (u.username || u.id)

  const channel = selectedUser?.classCode ? CLASS_TO_CHANNEL[selectedUser.classCode] : null
  const messages = channel && selectedUser ? getMessagesForChannel(channel.id, selectedUser.id) : []
  const journals = selectedUser ? getJournalsForUser(selectedUser.id) : []

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
                  customTitle={`${getUserDisplayName(selectedUser)} — ${channel ? t('chat.agent', { code: channel.code }) : t('chat.selectChannel')}`}
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
                  {journals.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('journal.noVersions')}</p>
                  ) : (
                    <ul className="space-y-2">
                      {journals.map((j) => (
                        <li
                          key={j.id}
                          className="flex items-center justify-between gap-2 text-sm text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 p-2.5"
                        >
                          <span className="truncate">{j.fileName}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                            {new Date(j.uploadedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
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
