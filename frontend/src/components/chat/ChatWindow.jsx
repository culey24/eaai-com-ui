import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Flag } from 'lucide-react'
import MessageItem from './MessageItem'
import ChatInput from './ChatInput'
import ReportModal from './ReportModal'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'

export default function ChatWindow({ channel, messages, onSendMessage, onReport, userId, hideReport, customTitle }) {
  const { t } = useLanguage()
  const { isProfileComplete } = useAuth()
  const canSendChat = isProfileComplete()
  const channelLabel = customTitle ?? (channel?.labelKey ? t(channel.labelKey, { code: channel.code }) : channel?.label)
  const scrollRef = useRef(null)
  const [reportOpen, setReportOpen] = useState(false)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  const handleSend = (content, file) => {
    onSendMessage(channel?.id, content, file)
  }

  const handleReportSubmit = (report) => {
    onReport?.({ ...report, userId })
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Chat header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-800/50 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 dark:text-white text-lg tracking-tight">
          {channelLabel || t('chat.selectChannel')}
        </h2>
        {!hideReport && (
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            disabled={!channel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Flag className="w-4 h-4" />
            {t('chat.report')}
          </button>
        )}
      </div>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        channel={channel}
        onSubmit={handleReportSubmit}
      />

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 pb-4 space-y-6 bg-slate-50/30 dark:bg-slate-800/30 scrollbar-thin"
      >
        {!channel ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <p className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
              {t('chat.welcomeTitle')}
            </p>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
              {t('chat.welcomeDesc')}
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{t('chat.noMessages')}</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{t('chat.noMessagesHint')}</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </div>

      {channel && !canSendChat && (
        <div className="flex-shrink-0 px-6 pt-4">
          <div className="max-w-3xl mx-auto rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/90 dark:bg-amber-900/25 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
            <p>{t('chat.inputLockedHint')}</p>
            <Link
              to="/settings"
              className="inline-block mt-2 font-medium text-primary hover:underline"
            >
              {t('profile.goToSettings')}
            </Link>
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={!channel || !canSendChat}
        placeholder={!canSendChat && channel ? t('chat.inputLockedPlaceholder') : t('chat.inputPlaceholder')}
      />
    </div>
  )
}
