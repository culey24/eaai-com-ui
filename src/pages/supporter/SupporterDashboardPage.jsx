import { useState } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import ProfileCompleteBanner from '../../components/ProfileCompleteBanner'
import TaskDashboardWidget from '../../components/supporter/TaskDashboardWidget'
import { MessageSquare, User, Search, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAdmin } from '../../context/AdminContext'
import { useAllUsers } from '../../hooks/useAllUsers'
import { useMessages } from '../../hooks/useMessages'
import { useJournal } from '../../context/JournalContext'
import { useLanguage } from '../../context/LanguageContext'
import { useSupporterStats } from '../../hooks/useSupporterStats'
import MessageItem from '../../components/chat/MessageItem'

const CLASS_TO_CHANNEL = { 'IS-1': 'ai-chat', 'IS-2': 'human-chat', 'IS-3': 'internal-chat' }

export default function SupporterDashboardPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { assignments } = useAdmin()
  const { allUsers } = useAllUsers()
  const { getMessagesForChannel } = useMessages()
  const { getJournalsForUser } = useJournal()
  const stats = useSupporterStats()
  const [selectedUser, setSelectedUser] = useState(null)
  const [search, setSearch] = useState('')

  const supporterId = user?.stableId || (user?.name ? `prov-${user.name}` : null)
  const myUserIds = Object.entries(assignments)
    .filter(([, a]) => a.supporterId === supporterId)
    .map(([uid]) => uid)
  const assignedUsers = allUsers.filter((u) => myUserIds.includes(u.id))
  const users = search.trim()
    ? assignedUsers.filter((u) =>
        (u.username?.toLowerCase().includes(search.toLowerCase().trim())) ||
        (u.id?.toLowerCase().includes(search.toLowerCase().trim())) ||
        (u.fullName?.toLowerCase().includes(search.toLowerCase().trim()))
      )
    : assignedUsers

  const channelId = selectedUser?.classCode ? CLASS_TO_CHANNEL[selectedUser.classCode] : null
  const messages = channelId && selectedUser ? getMessagesForChannel(channelId, selectedUser.id) : []
  const journals = selectedUser ? getJournalsForUser(selectedUser.id) : []

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeChannelId={null} onSelectChannel={() => {}} />
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
        <ProfileCompleteBanner />
        <TaskDashboardWidget stats={stats} />

        <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {t('supporter.myChats')}
          </h1>
          <div className="flex-1 max-w-xs relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('admin.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
            />
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="w-56 border-r border-slate-100 dark:border-slate-700 p-4 overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm py-4">{t('supporter.noAssignedUsers')}</p>
            ) : (
              <div className="space-y-1">
                {users.map((u) => {
                  const chId = u.classCode ? CLASS_TO_CHANNEL[u.classCode] : null
                  const msgCount = chId ? getMessagesForChannel(chId, u.id).length : 0
                  const isActive = selectedUser?.id === u.id
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-2 ${
                        isActive ? 'bg-primary text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <User className="w-4 h-4 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium block truncate">{u.fullName || u.username}</span>
                        <span className="text-xs opacity-75">
                          {u.classCode && `${u.classCode} · `}{t('admin.messageCount', { count: msgCount })}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {selectedUser ? (
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-800/30">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span className="font-medium">{selectedUser.fullName || selectedUser.username}</span>
                    {selectedUser.classCode && (
                      <span className="text-sm">— {t('admin.classLabel', { code: selectedUser.classCode })}</span>
                    )}
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('admin.chatSection')}</h3>
                    {messages.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 py-4">{t('admin.noMessages')}</p>
                    ) : (
                      messages.map((msg) => (
                        <MessageItem
                          key={msg.id}
                          message={msg}
                          agentLabel={msg.role === 'assistant' ? 'AGENT' : null}
                        />
                      ))
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {t('journal.title')}
                    </h3>
                    {journals.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{t('journal.noVersions')}</p>
                    ) : (
                      <ul className="space-y-2">
                        {journals.map((j) => (
                          <li key={j.id} className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                            <span className="truncate">{j.fileName}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs flex-shrink-0 ml-2">
                              {new Date(j.uploadedAt).toLocaleDateString('vi-VN')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                <p>{t('supporter.selectUserToView')}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
