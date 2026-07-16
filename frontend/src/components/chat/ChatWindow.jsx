import { useRef, useEffect, useLayoutEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Flag, Loader2, ChevronDown, X, ExternalLink, Brain, Sparkles, FileText, ArrowRight, ChevronLeft, RotateCcw } from 'lucide-react'
import MessageItem from './MessageItem'
import ChatInput from './ChatInput'
import ReportModal from './ReportModal'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../constants/roles'
import { API_BASE } from '../../config/api'
import { getSectionBQuestions } from '../../data/posttest/sectionB'

const TOPIC_ID_MAP = {
  'arm': 'association_rules_mining',
  'association_rules_mining': 'association_rules_mining',
  'recommender': 'recommender_system',
  'recommender_system': 'recommender_system',
  'fuzzy': 'fuzzy_logic',
  'fuzzy_logic': 'fuzzy_logic',
  'linear': 'linear_regression',
  'linear_regression': 'linear_regression',
  'logistic': 'logistic_regression',
  'logistic_regression': 'logistic_regression',
  'lda': 'latent_dirichlet_allocation',
  'latent_dirichlet_allocation': 'latent_dirichlet_allocation',
  'dnn': 'deep_neural_networks',
  'deep_neural_networks': 'deep_neural_networks',
  'wordembedding': 'word_embedding',
  'word_embedding': 'word_embedding',
}

const QUIZ_TOPICS_MAP = {
  association_rules_mining: {
    pdfFile: 'Association Rules Mining.pdf',
    pdfTitle: { en: 'Association Rules Mining.pdf', vi: 'Khai thác luật kết hợp.pdf' },
    pages: { en: 'Suggested Pages: 1 – 15', vi: 'Trang gợi ý: 1 – 15' },
  },
  recommender_system: {
    pdfFile: 'RecommenderSystems-Shortened.pdf',
    pdfTitle: { en: 'RecommenderSystems-Shortened.pdf', vi: 'Hệ gợi ý (Rút gọn).pdf' },
    pages: { en: 'Suggested Pages: 10 – 25', vi: 'Trang gợi ý: 10 – 25' },
  },
  fuzzy_logic: {
    pdfFile: 'Chapter3_PartII-Fuzzy.pdf',
    pdfTitle: { en: 'Chapter3_PartII-Fuzzy.pdf', vi: 'Logic mờ.pdf' },
    pages: { en: 'Suggested Pages: 1 – 12', vi: 'Trang gợi ý: 1 – 12' },
  },
  linear_regression: {
    pdfFile: '3-LinearRegression.pdf',
    pdfTitle: { en: '3-LinearRegression.pdf', vi: 'Hồi quy tuyến tính.pdf' },
    pages: { en: 'Suggested Pages: 5 – 18', vi: 'Trang gợi ý: 5 – 18' },
  },
  logistic_regression: {
    pdfFile: '4-LogisticRegression.pdf',
    pdfTitle: { en: '4-LogisticRegression.pdf', vi: 'Hồi quy logistic.pdf' },
    pages: { en: 'Suggested Pages: 1 – 15', vi: 'Trang gợi ý: 1 – 15' },
  },
  latent_dirichlet_allocation: {
    pdfFile: 'Latent-Dirichlet-Allocation.pdf',
    pdfTitle: { en: 'Latent-Dirichlet-Allocation.pdf', vi: 'LDA.pdf' },
    pages: { en: 'Suggested Pages: 1 – 20', vi: 'Trang gợi ý: 1 – 20' },
  },
  deep_neural_networks: {
    pdfFile: '2-DL-NLP.pdf',
    pdfTitle: { en: '2-DL-NLP.pdf', vi: 'Mạng nơ-ron sâu.pdf' },
    pages: { en: 'Suggested Pages: 1 – 25', vi: 'Trang gợi ý: 1 – 25' },
  },
  word_embedding: {
    pdfFile: '2-DL-NLP.pdf',
    pdfTitle: { en: '2-DL-NLP.pdf', vi: 'Nhúng từ.pdf' },
    pages: { en: 'Suggested Pages: 26 – 45', vi: 'Trang gợi ý: 26 – 45' },
  },
}

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
  const { t } = useLanguage()
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
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('chat.learningMaterial')}</p>
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
  const { t, lang } = useLanguage()
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
  const [quizModal, setQuizModal] = useState({ isOpen: false, id: '', title: '' })

  const [quizState, setQuizState] = useState({
    currentIdx: 0,
    answers: {},
    isFinished: false
  })

  // Reset quiz state when quizModal.id changes
  useEffect(() => {
    setQuizState({
      currentIdx: 0,
      answers: {},
      isFinished: false
    })
  }, [quizModal.id])

  const questions = useMemo(() => {
    if (!quizModal.id) return []
    const topicKey = TOPIC_ID_MAP[quizModal.id] || quizModal.id
    return getSectionBQuestions(topicKey)
  }, [quizModal.id])

  const handleChoiceSelect = (choiceKey) => {
    if (quizState.answers[quizState.currentIdx] !== undefined) return
    setQuizState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [prev.currentIdx]: choiceKey
      }
    }))
  }

  const handleNext = () => {
    if (quizState.currentIdx < questions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentIdx: prev.currentIdx + 1
      }))
    } else {
      setQuizState(prev => ({
        ...prev,
        isFinished: true
      }))
    }
  }

  const handlePrev = () => {
    if (quizState.currentIdx > 0) {
      setQuizState(prev => ({
        ...prev,
        currentIdx: prev.currentIdx - 1
      }))
    }
  }

  const handleRestartQuiz = () => {
    setQuizState({
      currentIdx: 0,
      answers: {},
      isFinished: false
    })
  }

  const handlePdfClick = (filename, title) => {
    const url = `${API_BASE}/api/docs/slides/${encodeURIComponent(filename)}`
    setQuizModal({ isOpen: false, id: '', title: '' })
    setPdfModal({ isOpen: true, url, title })
  }

  const handleQuizClick = (id, title, contextContent = '') => {
    if (id === 'gen-1') {
      const contextPrefix = contextContent ? `Based on the following content:\n"""\n${contextContent}\n"""\n\n` : '';
      const promptText = `${contextPrefix}Please create a multiple-choice review question (mini-quiz) for the above lesson content, using the suggest tag format [[quiz:topic_id|Quiz Title]] if it matches the lesson topics. ALWAYS respond in English.`;
      handleSend(promptText);
      return;
    }
    setPdfModal({ isOpen: false, url: '', title: '' })
    setQuizModal({ isOpen: true, id, title })
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
    <div className="flex h-full w-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Left: Chat Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full transition-all duration-300">
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
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        {/* Glowing Orbs Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-primary/20 dark:bg-primary/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob" />
          <div className="absolute top-[20%] right-[-5%] w-96 h-96 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-sky-500/20 dark:bg-sky-500/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob animation-delay-4000" />
        </div>

        <div
          ref={scrollRef}
          onScroll={handleMessagesScroll}
          className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 pb-4 space-y-6 bg-gradient-to-b from-white/40 via-slate-50/40 to-slate-100/40 dark:from-slate-900/60 dark:via-slate-900/60 dark:to-slate-950/60 backdrop-blur-[2px] scrollbar-thin relative z-10"
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
                  onQuizClick={handleQuizClick}
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
      </div>

      {/* Right: Document Viewer */}
      {pdfModal.isOpen && (
        <div className="w-[38%] max-w-[500px] min-w-[320px] p-4 pl-0 flex flex-col z-20 animate-in slide-in-from-right-8 duration-300">
          <div className="flex-1 flex flex-col rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-[-10px_10px_40px_-10px_rgba(0,0,0,0.12)] overflow-hidden">
            <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100/80 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ExternalLink className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[15px] text-slate-800 dark:text-white truncate tracking-tight">{pdfModal.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('chat.referenceMaterials')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPdfModal({ isOpen: false, url: '', title: '' })}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all flex-shrink-0 ml-2 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 relative bg-slate-50/50 dark:bg-slate-900/50 p-3">
              <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-900/5">
                <iframe
                  src={pdfModal.url}
                  className="w-full h-full border-none"
                  title={pdfModal.title}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right: Quiz Viewer */}
      {quizModal.isOpen && (
        <div className="w-[38%] max-w-[500px] min-w-[320px] p-4 pl-0 flex flex-col z-20 animate-in slide-in-from-right-8 duration-300">
          <div className="flex-1 flex flex-col rounded-3xl border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-[-10px_10px_40px_-10px_rgba(0,0,0,0.12)] overflow-hidden">
            <div className="flex-shrink-0 px-5 py-4 border-b border-slate-100/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Brain className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[15px] text-slate-800 dark:text-white truncate tracking-tight">{quizModal.title}</h3>
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">{t('quiz.subtitle')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuizModal({ isOpen: false, id: '', title: '' })}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all flex-shrink-0 ml-2 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 p-6 scrollbar-thin">
              {questions.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
                  <p className="text-sm text-slate-500 font-medium">
                    {lang === 'vi' ? 'Không tìm thấy câu hỏi cho chủ đề này.' : 'No questions found for this topic.'}
                  </p>
                </div>
              ) : quizState.isFinished ? (
                <div className="space-y-6">
                  <div className="text-center py-6 bg-gradient-to-br from-indigo-50 to-indigo-100/30 dark:from-indigo-950/20 dark:to-slate-900/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 p-6">
                    <Sparkles className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {lang === 'vi' ? 'Hoàn thành bài Quiz!' : 'Quiz Completed!'}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {lang === 'vi' ? 'Kết quả làm bài của bạn' : 'Your practice results'}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      {(() => {
                        const correctCount = Object.entries(quizState.answers).reduce((acc, [idx, choice]) => {
                          return acc + (questions[idx]?.answer === choice ? 1 : 0);
                        }, 0);
                        const pct = Math.round((correctCount / questions.length) * 100);
                        return (
                          <div>
                            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                              {correctCount} / {questions.length}
                            </div>
                            <div className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 mt-0.5">
                              {pct}% {lang === 'vi' ? 'chính xác' : 'correct'}
                            </div>
                            <p className="text-xs text-slate-650 dark:text-slate-300 mt-3 max-w-[280px] mx-auto leading-relaxed">
                              {pct >= 80 
                                ? (lang === 'vi' ? 'Tuyệt vời! Bạn nắm rất vững kiến thức phần này.' : 'Excellent job! You have a solid understanding of this topic.')
                                : pct >= 50
                                ? (lang === 'vi' ? 'Khá tốt! Hãy đọc lại tài liệu để lấp các lỗ hổng kiến thức.' : 'Good effort! Try reviewing the materials to fill in any gaps.')
                                : (lang === 'vi' ? 'Cố gắng lên! Bạn nên ôn tập lại kỹ hơn các bài giảng gợi ý.' : 'Keep practicing! Reviewing the suggested reading will help improve.')
                              }
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {lang === 'vi' ? 'Chi tiết đáp án' : 'Answer Key'}
                    </h5>
                    <div className="grid grid-cols-5 gap-2">
                      {questions.map((q, idx) => {
                        const ans = quizState.answers[idx];
                        const isCorrect = q.answer === ans;
                        return (
                          <button
                            key={idx}
                            onClick={() => setQuizState(prev => ({ ...prev, currentIdx: idx, isFinished: false }))}
                            className={`p-2.5 rounded-xl border text-center font-bold text-sm transition-all active:scale-95 ${
                              isCorrect 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex justify-center">
                    <button
                      type="button"
                      onClick={handleRestartQuiz}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-95 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {lang === 'vi' ? 'Làm lại Quiz' : 'Restart Quiz'}
                    </button>
                  </div>

                  {(() => {
                    const topicKey = TOPIC_ID_MAP[quizModal.id] || quizModal.id;
                    const material = QUIZ_TOPICS_MAP[topicKey];
                    if (!material) return null;
                    return (
                      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/60">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> {t('quiz.suggestedMaterials')}
                        </h4>
                        <button 
                          onClick={() => handlePdfClick(material.pdfFile, lang === 'vi' ? material.pdfTitle.vi : material.pdfTitle.en)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors text-left group shadow-sm"
                        >
                          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                              {lang === 'vi' ? material.pdfTitle.vi : material.pdfTitle.en}
                            </p>
                            <p className="text-xs text-slate-500">
                              {lang === 'vi' ? material.pages.vi : material.pages.en}
                            </p>
                          </div>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progress Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                      {lang === 'vi' 
                        ? `Câu hỏi ${quizState.currentIdx + 1} / ${questions.length}` 
                        : `Question ${quizState.currentIdx + 1} of ${questions.length}`
                      }
                    </span>
                    <div className="flex gap-1">
                      {questions.map((_, idx) => {
                        const ans = quizState.answers[idx];
                        const isCurrent = idx === quizState.currentIdx;
                        return (
                          <div 
                            key={idx} 
                            className={`w-2 h-2 rounded-full transition-all ${
                              isCurrent 
                                ? 'bg-indigo-600 scale-125' 
                                : ans !== undefined 
                                ? 'bg-indigo-300 dark:bg-indigo-800' 
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
                      {lang === 'vi' 
                        ? questions[quizState.currentIdx]?.prompt.vi 
                        : questions[quizState.currentIdx]?.prompt.en
                      }
                    </h4>
                  </div>
                  
                  {/* Choices list */}
                  <div className="space-y-3">
                    {(() => {
                      const q = questions[quizState.currentIdx];
                      const userAnswer = quizState.answers[quizState.currentIdx];
                      const isAnswered = userAnswer !== undefined;
                      return q?.choices.map((opt) => {
                        const isSelected = userAnswer === opt.key;
                        const isCorrect = opt.key === q.answer;
                        
                        let btnStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700';
                        let badgeStyle = 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400';
                        let textStyle = 'text-slate-700 dark:text-slate-300';
                        
                        if (isAnswered) {
                          if (isCorrect) {
                            btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
                            badgeStyle = 'bg-emerald-500 border-emerald-500 text-white';
                            textStyle = 'text-emerald-700 dark:text-emerald-400 font-semibold';
                          } else if (isSelected) {
                            btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-500/10 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
                            badgeStyle = 'bg-rose-500 border-rose-500 text-white';
                            textStyle = 'text-rose-700 dark:text-rose-400 font-semibold';
                          } else {
                            btnStyle = 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-50 cursor-default';
                          }
                        }
                        
                        return (
                          <button 
                            key={opt.key} 
                            disabled={isAnswered}
                            onClick={() => handleChoiceSelect(opt.key)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${btnStyle}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-xs font-bold ${badgeStyle}`}>
                                {opt.key}
                              </div>
                              <span className={`text-[15px] ${textStyle}`}>
                                {lang === 'vi' ? opt.vi : opt.en}
                              </span>
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Feedback Explanation */}
                  {(() => {
                    const q = questions[quizState.currentIdx];
                    const userAnswer = quizState.answers[quizState.currentIdx];
                    if (userAnswer === undefined) return null;
                    const isCorrect = userAnswer === q.answer;
                    return (
                      <div className="mt-4 text-[14px] bg-slate-100/80 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-start gap-2.5">
                          {isCorrect ? (
                            <>
                              <Sparkles className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">
                                  {lang === 'vi' ? 'Hoàn toàn chính xác!' : 'Absolutely correct!'}
                                </p>
                                <p className="mt-1 text-slate-600 dark:text-slate-350 leading-relaxed">
                                  {lang === 'vi' 
                                    ? `"${q.choices.find(c => c.key === q.answer)?.vi}" là đáp án chính xác.`
                                    : `"${q.choices.find(c => c.key === q.answer)?.en}" is the correct answer.`
                                  }
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <X className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">
                                  {lang === 'vi' ? 'Chưa chính xác' : 'Incorrect'}
                                </p>
                                <p className="mt-1 text-slate-600 dark:text-slate-350 leading-relaxed">
                                  {lang === 'vi'
                                    ? `Đáp án đúng là ${q.answer}: "${q.choices.find(c => c.key === q.answer)?.vi}".`
                                    : `The correct answer is ${q.answer}: "${q.choices.find(c => c.key === q.answer)?.en}".`
                                  }
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Navigation Footer */}
                  {quizState.answers[quizState.currentIdx] !== undefined && (
                    <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={quizState.currentIdx === 0}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-slate-600 dark:text-slate-305 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {lang === 'vi' ? 'Câu trước' : 'Previous'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleNext}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-500/10"
                      >
                        {quizState.currentIdx === questions.length - 1 
                          ? (lang === 'vi' ? 'Hoàn thành' : 'Finish')
                          : (lang === 'vi' ? 'Câu tiếp theo' : 'Next Question')
                        }
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {(() => {
                    const topicKey = TOPIC_ID_MAP[quizModal.id] || quizModal.id;
                    const material = QUIZ_TOPICS_MAP[topicKey];
                    if (!material) return null;
                    return (
                      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/60">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> {t('quiz.suggestedMaterials')}
                        </h4>
                        <button 
                          onClick={() => handlePdfClick(material.pdfFile, lang === 'vi' ? material.pdfTitle.vi : material.pdfTitle.en)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors text-left group shadow-sm"
                        >
                          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                              {lang === 'vi' ? material.pdfTitle.vi : material.pdfTitle.en}
                            </p>
                            <p className="text-xs text-slate-500">
                              {lang === 'vi' ? material.pages.vi : material.pages.en}
                            </p>
                          </div>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
