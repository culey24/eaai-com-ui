import { useRef, useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Flag, Loader2 } from 'lucide-react'
import MessageItem from './MessageItem'
import ChatInput from './ChatInput'
import ReportModal from './ReportModal'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'
import { API_BASE } from '../../config/api'

/** Supporter/internal-chat: sau khoảng này chưa có phản hồi → gợi ý hệ thống bận (học viên IS-2). */
const IS3_BUSY_AFTER_MS = 45_000

export default function ChatWindow({
  channel,
  messages,
  onSendMessage,
  onReport,
  userId,
  hideReport,
  customTitle,
  messagePerspective = 'learner',
  maskAssistantAsAgent = false,
  /** Khi chat qua API: id hội thoại để tải file đính kèm */
  remoteConversationId = null,
  /** Đang tải thread từ máy chủ (resolve + lần pull đầu) */
  threadLoading = false,
}) {
  const { t } = useLanguage()
  const { isProfileComplete, apiToken, user } = useAuth()
  const canSendChat = isProfileComplete()
  const channelLabel = customTitle ?? (channel?.labelKey ? t(channel.labelKey, { code: channel.code }) : channel?.label)
  const scrollRef = useRef(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [busyClock, setBusyClock] = useState(0)
  /** null = không áp dụng; false = chưa gán supporter (internal-chat / IS-2) */
  const [hasSupporterAssignment, setHasSupporterAssignment] = useState(null)

  const internalMask =
    maskAssistantAsAgent && channel?.id === 'internal-chat' && messagePerspective === 'learner'

  useEffect(() => {
    if (!internalMask || !apiToken || user?.role !== ROLES.LEARNER) {
      setHasSupporterAssignment(null)
      return
    }
    let cancelled = false
    const pull = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me/support-assignment`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (res.ok && data.applicable !== false) {
          setHasSupporterAssignment(data.assigned === true)
        } else {
          setHasSupporterAssignment(true)
        }
      } catch {
        if (!cancelled) setHasSupporterAssignment(true)
      }
    }

    void pull()
    /* Admin có thể gán supporter sau khi học viên đã mở chat — gọi lại định kỳ + khi quay lại tab */
    const intervalId = window.setInterval(() => {
      void pull()
    }, 12_000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void pull()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [internalMask, apiToken, user?.role])

  useEffect(() => {
    if (!internalMask) return undefined
    const id = setInterval(() => setBusyClock((c) => c + 1), 4000)
    return () => clearInterval(id)
  }, [internalMask])

  const showIs3BusyHint = useMemo(() => {
    if (!internalMask || !messages?.length) return false
    const last = messages[messages.length - 1]
    if (last.role !== 'user') return false
    return Date.now() - last.timestamp > IS3_BUSY_AFTER_MS
  }, [internalMask, messages, busyClock])

  const agentMaskLabel = internalMask ? t('chat.agentMaskLabel') : undefined

  const showUnassignedSupporterBg =
    internalMask && hasSupporterAssignment === false
  const blockChatNoSupporter = showUnassignedSupporterBg

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
        className="flex-1 overflow-y-auto p-8 pb-4 space-y-6 bg-slate-50/30 dark:bg-slate-800/30 scrollbar-thin relative"
      >
        {threadLoading && channel ? (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-white/75 dark:bg-slate-900/75 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin" aria-hidden />
            <span className="text-sm text-slate-600 dark:text-slate-400">{t('common.loading')}</span>
          </div>
        ) : null}
        {showUnassignedSupporterBg && (
          <div
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center px-6 py-12"
            aria-hidden
          >
            <p className="text-center text-base sm:text-lg md:text-xl font-medium text-slate-400/95 dark:text-slate-500/95 max-w-lg leading-relaxed tracking-tight">
              {t('chat.is3NoSupporterBackground')}
            </p>
          </div>
        )}
        <div className="relative z-10 min-h-0">
          {!channel ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-center px-8">
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
          ) : messages.length === 0 && !showUnassignedSupporterBg ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('chat.noMessages')}</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{t('chat.noMessagesHint')}</p>
            </div>
          ) : messages.length === 0 && showUnassignedSupporterBg ? (
            <div className="min-h-[45vh]" aria-hidden />
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  perspective={messagePerspective}
                  agentLabel={agentMaskLabel}
                  conversationId={remoteConversationId}
                  apiToken={apiToken}
                />
              ))}
              {showIs3BusyHint && (
                <div className="pt-2">
                  <p className="text-sm text-slate-600 dark:text-slate-300 italic border-l-2 border-amber-400 pl-3 py-2.5 bg-amber-50/80 dark:bg-amber-900/20 rounded-r-xl">
                    {t('chat.is3SystemBusy')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {channel && !canSendChat && !blockChatNoSupporter && (
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
      {messagePerspective === 'learner' ? (
        <div className="flex-shrink-0 px-6 pt-3">
          <div className="max-w-3xl mx-auto rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/90 dark:bg-sky-900/25 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
            {t('chat.technicalSupportNotice')}{' '}
            <a
              href="mailto:avatara.edu.hcmut@gmail.com"
              className="font-medium text-primary hover:underline"
            >
              avatara.edu.hcmut@gmail.com
            </a>
          </div>
        </div>
      ) : null}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={!channel || !canSendChat || blockChatNoSupporter}
        placeholder={
          blockChatNoSupporter
            ? t('chat.is3NoSupporterBackground')
            : !canSendChat && channel
              ? t('chat.inputLockedPlaceholder')
              : t('chat.inputPlaceholder')
        }
      />
    </div>
  )
}
