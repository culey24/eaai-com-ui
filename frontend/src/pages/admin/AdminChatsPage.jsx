import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MessageSquare, User, Search, FileText } from 'lucide-react'
import { VALID_CLASS_CODES } from '../../constants/roles'
import { useMessages } from '../../hooks/useMessages'
import { useAllUsers } from '../../hooks/useAllUsers'
import { useJournal } from '../../context/JournalContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import MessageItem from '../../components/chat/MessageItem'
import JournalEntriesSidebarList from '../../components/journal/JournalEntriesSidebarList'

const CLASS_TO_CHANNEL = {
  'IS-1': 'ai-chat',
  'IS-2': 'internal-chat',
  'IS-3': 'human-chat',
}

export default function AdminChatsPage() {
  const { t } = useLanguage()
  const { apiToken } = useAuth()
  const { getLearners } = useAllUsers()
  const { getJournalsForUser } = useJournal()
  const [selectedUser, setSelectedUser] = useState(null)
  const [search, setSearch] = useState('')

  const channelId = selectedUser?.classCode ? CLASS_TO_CHANNEL[selectedUser.classCode] : null
  const { getMessagesForChannel, remoteConversationId } = useMessages(channelId, {
    adminViewLearnerId: selectedUser?.backendUserId ?? null,
  })

  const allLearners = getLearners()
  const filteredUsers = search.trim()
    ? allLearners.filter((u) =>
        (u.username && u.username.toLowerCase().includes(search.toLowerCase().trim())) ||
        (u.classCode && u.classCode.toLowerCase().includes(search.toLowerCase().trim()))
      )
    : allLearners

  const usersByClass = VALID_CLASS_CODES.reduce((acc, code) => {
    acc[code] = filteredUsers.filter((u) => u.classCode === code)
    return acc
  }, {})
  const usersWithoutClass = filteredUsers.filter((u) => !u.classCode || !VALID_CLASS_CODES.includes(u.classCode))

  const messagesRaw =
    channelId && selectedUser ? getMessagesForChannel(channelId, selectedUser.id) : []
  const messages = Array.isArray(messagesRaw)
    ? messagesRaw
        .filter((m) => m && typeof m === 'object')
        .map((m) => (m.role ? m : { ...m, role: 'user' }))
    : []
  const journalUserKey = selectedUser?.stableId ?? selectedUser?.id
  const journalsRaw =
    selectedUser && journalUserKey ? getJournalsForUser(journalUserKey) : []
  const journals = Array.isArray(journalsRaw) ? journalsRaw.filter((j) => j && typeof j === 'object') : []

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
        <Link
          to="/admin"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          {t('admin.chatChannels')}
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
        {/* User list - grouped by class */}
        <div className="w-56 border-r border-slate-100 dark:border-slate-700 p-4 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm py-4">{t('admin.noMembers')}</p>
          ) : (
            <div className="space-y-4">
              {VALID_CLASS_CODES.map((classCode) => {
                const usersInClass = usersByClass[classCode] || []
                if (usersInClass.length === 0) return null
                return (
                  <div key={classCode}>
                    <p className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {t('admin.classLabel', { code: classCode })}
                    </p>
                    <div className="space-y-1 mt-1">
                      {usersInClass.map((u) => {
                        const chId = u.classCode ? CLASS_TO_CHANNEL[u.classCode] : null
                        const msgCount = chId ? getMessagesForChannel(chId, u.id).length : 0
                        const isActive = selectedUser?.id === u.id
                        return (
                          <button
                            key={u.id}
                            onClick={() => setSelectedUser(u)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-2 ${
                              isActive
                                ? 'bg-primary text-white'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <User className="w-4 h-4 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="font-medium block truncate">{u.username}</span>
                              <span className="text-xs opacity-75">
                                {t('admin.messageCount', { count: msgCount })}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              {usersWithoutClass.length > 0 && (
                <div>
                  <p className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t('admin.other')}
                  </p>
                  <div className="space-y-1 mt-1">
                    {usersWithoutClass.map((u) => {
                      const chId = u.classCode ? CLASS_TO_CHANNEL[u.classCode] : null
                      const msgCount = chId ? getMessagesForChannel(chId, u.id).length : 0
                      const isActive = selectedUser?.id === u.id
                      return (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-2 ${
                            isActive
                              ? 'bg-primary text-white'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <User className="w-4 h-4 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-medium block truncate">{u.username}</span>
                            <span className="text-xs opacity-75">
                              {t('admin.messageCount', { count: msgCount })}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat (center) + Journal (right sidebar) */}
        {selectedUser ? (
          <div className="flex-1 flex min-h-0 flex-col md:flex-row overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-slate-50/30 dark:bg-slate-800/30">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span className="font-medium">{selectedUser.username}</span>
                    {selectedUser.classCode && (
                      <span className="text-sm">— {t('admin.classLabel', { code: selectedUser.classCode })}</span>
                    )}
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {t('admin.chatSection')}
                    </h3>
                    {messages.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 py-4">{t('admin.noMessages')}</p>
                    ) : (
                      messages.map((msg, idx) => (
                        <MessageItem
                          key={msg.id != null ? String(msg.id) : `m-${idx}`}
                          message={msg}
                          agentLabel={msg.role === 'assistant' ? 'AGENT' : null}
                          conversationId={remoteConversationId}
                          apiToken={apiToken}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <aside
              className="flex w-full md:w-[min(22rem,40vw)] md:shrink-0 flex-col border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 max-h-[min(42vh,22rem)] md:max-h-none min-h-0"
              aria-label={t('journal.title')}
            >
              <div className="flex-shrink-0 px-4 py-4 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  {t('journal.title')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {selectedUser.username}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <JournalEntriesSidebarList
                  journals={journals}
                  downloadLearnerUserId={selectedUser?.backendUserId ?? null}
                />
              </div>
            </aside>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-800/30">
            <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
            <p>{t('admin.selectUserToViewChat')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
