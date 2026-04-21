import { useRef, useEffect, useLayoutEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Flag, Loader2, ChevronDown, X, ExternalLink } from 'lucide-react'
import MessageItem from './MessageItem'
import ChatInput from './ChatInput'
import ReportModal from './ReportModal'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'
import { API_BASE } from '../../config/api'

/** Supporter/internal-chat: sau khoảng này chưa có phản hồi → gợi ý hệ thống bận (học viên IS-2). */
const IS3_BUSY_AFTER_MS = 45_000

/** Khoảng cách tới đáy (px): gần hơn mức này thì coi là đang theo dõi tin mới → vẫn dính đáy khi poll. */
const SCROLL_BOTTOM_THRESHOLD_PX = 80

function messagesEndSignature(msgs) {
  if (!msgs?.length) return '0'
  const last = msgs[msgs.length - 1]
  return `${msgs.length}:${last.id}`
}

function PdfViewerModal({ isOpen, onClose, pdfUrl, title }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white leading-tight">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tài liệu học tập</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 bg-slate-100 dark:bg-slate-800 relative">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-none"
            title={title}
          />
        </div>
      </div>
    </div>
  )
}

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
  const prevChannelIdRef = useRef(null)
  const prevThreadLoadingRef = useRef(threadLoading)
  const lastEndSigRef = useRef('')
  const [reportOpen, setReportOpen] = useState(false)
  const [showJumpToLatest, setShowJumpToLatest] = useState(false)
  const [busyClock, setBusyClock] = useState(0)
  /** null = không áp dụng; false = chưa gán supporter (internal-chat / IS-2) */
  const [hasSupporterAssignment, setHasSupporterAssignment] = useState(null)
  
  const [pdfModal, setPdfModal] = useState({ isOpen: false, url: '', title: '' })

  const handlePdfClick = (filename, title) => {
    const url = `${API_BASE}/api/docs/slides/${encodeURIComponent(filename)}`
    setPdfModal({ isOpen: true, url, title })
  }

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

  const distanceFromBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return 0
    return el.scrollHeight - el.scrollTop - el.clientHeight
  }, [])

  const scrollMessagesToBottom = useCallback((behavior = 'smooth') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  const handleMessagesScroll = useCallback(() => {
    if (distanceFromBottom() < SCROLL_BOTTOM_THRESHOLD_PX) {
      setShowJumpToLatest(false)
    }
  }, [distanceFromBottom])

  useLayoutEffect(() => {
    const el = scrollRef.current
    const cid = channel?.id
    if (!cid) {
      prevChannelIdRef.current = null
      return
    }
    if (!el) return

    if (prevChannelIdRef.current !== cid) {
      prevChannelIdRef.current = cid
      prevThreadLoadingRef.current = threadLoading
      lastEndSigRef.current = messagesEndSignature(messages)
      el.scrollTop = el.scrollHeight
      setShowJumpToLatest(false)
      return
    }

    if (threadLoading) {
      prevThreadLoadingRef.current = true
      return
    }

    if (prevThreadLoadingRef.current && !threadLoading) {
      prevThreadLoadingRef.current = false
      lastEndSigRef.current = messagesEndSignature(messages)
      el.scrollTop = el.scrollHeight
      setShowJumpToLatest(false)
      return
    }
    prevThreadLoadingRef.current = threadLoading

    const sig = messagesEndSignature(messages)
    if (sig === lastEndSigRef.current) {
      return
    }
    lastEndSigRef.current = sig

    if (distanceFromBottom() < SCROLL_BOTTOM_THRESHOLD_PX) {
      el.scrollTop = el.scrollHeight
      setShowJumpToLatest(false)
    } else {
      setShowJumpToLatest(true)
    }
  }, [messages, channel?.id, threadLoading, distanceFromBottom])

  const handleSend = (content, file) => {
    onSendMessage(channel?.id, content, file)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollMessagesToBottom('smooth')
        setShowJumpToLatest(false)
      })
    })
  }

  const handleJumpToLatest = () => {
    scrollMessagesToBottom('smooth')
    setShowJumpToLatest(false)
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

      {/* Messages: không kéo đáy mỗi poll nếu user đã kéo lên; nút mũi tên xuống khi có tin mới */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        <div
          ref={scrollRef}
          onScroll={handleMessagesScroll}
          className="flex-1 min-h-0 overflow-y-auto p-8 pb-4 space-y-6 bg-slate-50/30 dark:bg-slate-800/30 scrollbar-thin relative"
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
                  onPdfClick={handlePdfClick}
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
        {channel && messages.length > 0 && !threadLoading && showJumpToLatest ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center z-20">
            <button
              type="button"
              onClick={handleJumpToLatest}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-primary shadow-md transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
              title={t('chat.scrollToLatest')}
              aria-label={t('chat.scrollToLatest')}
            >
              <ChevronDown className="h-5 w-5" aria-hidden />
            </button>
          </div>
        ) : null}
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

      <PdfViewerModal
        isOpen={pdfModal.isOpen}
        onClose={() => setPdfModal({ ...pdfModal, isOpen: false })}
        pdfUrl={pdfModal.url}
        title={pdfModal.title}
      />
    </div>
  )
}
