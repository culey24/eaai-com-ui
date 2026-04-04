import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../constants/roles'
import { API_BASE } from '../config/api'

const MESSAGES_STORAGE_KEY = 'eeai_chatbot_messages'

function getStorageKey(channelId, userId) {
  return userId ? `${channelId}::${userId}` : channelId
}

function loadMessages() {
  try {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY)
    const data = stored ? JSON.parse(stored) : {}
    const migrated = {}
    for (const [k, v] of Object.entries(data)) {
      if (Array.isArray(v) && !k.includes('::')) {
        migrated[`${k}::legacy`] = v
      } else {
        migrated[k] = v
      }
    }
    return migrated
  } catch {
    return {}
  }
}

function saveMessages(messages) {
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages))
}

function mapRemoteRows(messages) {
  return (messages || []).map((m) => ({
    id: String(m.id),
    role:
      m.senderRole === 'user'
        ? 'user'
        : m.senderRole === 'system'
          ? 'system'
          : 'assistant',
    content: m.content || '',
    fileName: m.fileName || null,
    fileStorageKey: m.fileStorageKey || null,
    timestamp: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
  }))
}

/**
 * Tin nhắn kênh chat.
 * - Learner có JWT: poll API theo conversation của kênh.
 * - Assistant có JWT + assistantViewLearnerId: xem thread của learner (cùng kênh).
 * - Admin có JWT + adminViewLearnerId: xem thread learner trên trang quản trị (cùng kênh).
 * - Khác: localStorage + mock phản hồi.
 *
 * @param {string | null} pollChannelId — kênh đang mở (vd. activeChannel.id).
 * @param {{ assistantViewLearnerId?: string | null, adminViewLearnerId?: string | null }} [options] — backend user id của learner (assistant/admin).
 */
export function useMessages(pollChannelId = null, options = {}) {
  const assistantViewLearnerId = options.assistantViewLearnerId ?? null
  const adminViewLearnerId = options.adminViewLearnerId ?? null
  const { user, apiToken } = useAuth()
  const [localMessages, setLocalMessages] = useState(loadMessages)
  const [remoteList, setRemoteList] = useState([])
  const [conversationId, setConversationId] = useState(null)
  /** Remote thread: false trong lúc resolve conversation hoặc lần pull đầu sau khi có conversationId. */
  const [remoteReady, setRemoteReady] = useState(true)

  const isRemoteLearner = Boolean(apiToken && user?.backendUserId && user?.role === ROLES.LEARNER)

  const isRemoteAssistant = Boolean(
    apiToken &&
      user?.role === ROLES.ASSISTANT &&
      assistantViewLearnerId &&
      pollChannelId
  )

  const isRemoteAdmin = Boolean(
    apiToken && user?.role === ROLES.ADMIN && adminViewLearnerId && pollChannelId
  )

  const useRemoteThread = isRemoteLearner || isRemoteAssistant || isRemoteAdmin

  /* Tìm conversationId */
  useEffect(() => {
    if (!useRemoteThread || !pollChannelId || !apiToken) {
      setConversationId(null)
      setRemoteList([])
      setRemoteReady(true)
      return
    }

    setRemoteReady(false)
    setConversationId(null)
    setRemoteList([])

    let cancelled = false
    /** touchLoading: chỉ lần gọi đầu (đổi learner/kênh) — interval không được tắt loading / xoá conversation. */
    const resolveConv = async (touchLoading = false) => {
      try {
        const res = await fetch(`${API_BASE}/api/conversations`, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${apiToken}` },
        })
        if (!res.ok) {
          if (touchLoading && !cancelled) setRemoteReady(true)
          return
        }
        const data = await res.json()
        if (cancelled) return
        const conv = data.conversations?.find((c) => {
          if (String(c.channelId) !== String(pollChannelId)) return false
          if (isRemoteLearner) return true
          if (isRemoteAdmin) return String(c.learnerId) === String(adminViewLearnerId)
          return String(c.learnerId) === String(assistantViewLearnerId)
        })
        const cid = conv?.id != null ? String(conv.id) : null
        if (touchLoading) {
          setConversationId(cid)
          if (!cancelled && cid == null) setRemoteReady(true)
        } else if (cid != null) {
          setConversationId(cid)
        }
      } catch {
        if (touchLoading && !cancelled) {
          setConversationId(null)
          setRemoteReady(true)
        }
      }
    }

    void resolveConv(true)
    const tConv = setInterval(() => {
      void resolveConv(false)
    }, 12000)
    return () => {
      cancelled = true
      clearInterval(tConv)
    }
  }, [
    useRemoteThread,
    isRemoteLearner,
    isRemoteAssistant,
    isRemoteAdmin,
    pollChannelId,
    apiToken,
    assistantViewLearnerId,
    adminViewLearnerId,
  ])

  /* Poll tin nhắn từ DB */
  useEffect(() => {
    if (!useRemoteThread || !apiToken || !conversationId) {
      return
    }

    let cancelled = false
    let initialPull = true
    const pull = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/messages/${conversationId}`, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${apiToken}` },
        })
        if (!res.ok) {
          if (!cancelled && initialPull) {
            setRemoteReady(true)
            initialPull = false
          }
          return
        }
        const data = await res.json()
        if (cancelled) return
        setRemoteList(mapRemoteRows(data.messages))
        if (initialPull) {
          setRemoteReady(true)
          initialPull = false
        }
      } catch {
        if (!cancelled && initialPull) {
          setRemoteReady(true)
          initialPull = false
        }
      }
    }

    pull()
    const tid = setInterval(pull, 5000)
    return () => {
      cancelled = true
      clearInterval(tid)
    }
  }, [useRemoteThread, apiToken, conversationId, pollChannelId])

  useEffect(() => {
    if (useRemoteThread) return
    saveMessages(localMessages)
  }, [localMessages, useRemoteThread])

  const addMessage = useCallback(
    async (channelId, content, file = null, role = 'user', userId = null) => {
      if (
        isRemoteLearner &&
        apiToken &&
        pollChannelId &&
        channelId === pollChannelId &&
        role === 'user'
      ) {
        const useLlmStylePendingUi =
          channelId === 'ai-chat' || channelId === 'human-chat'
        const batchId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const optimisticUser = {
          id: `opt-${batchId}`,
          role: 'user',
          content: content || '',
          fileName: file?.name || null,
          fileStorageKey: null,
          timestamp: Date.now(),
        }
        const thinkingPlaceholder = {
          id: `thinking-${batchId}`,
          role: 'assistant',
          content: '',
          isThinking: true,
          fileName: null,
          fileStorageKey: null,
          timestamp: Date.now() + 1,
        }
        if (useLlmStylePendingUi) {
          setRemoteList((prev) => [...prev, optimisticUser, thinkingPlaceholder])
        }
        const rollbackOptimistic = () => {
          if (!useLlmStylePendingUi) return
          setRemoteList((prev) =>
            prev.filter((m) => m.id !== optimisticUser.id && m.id !== thinkingPlaceholder.id)
          )
        }
        try {
          let res
          if (file) {
            const fd = new FormData()
            fd.append('channelId', channelId)
            fd.append('content', content || '')
            fd.append('role', 'user')
            fd.append('file', file)
            if (conversationId) fd.append('conversationId', String(conversationId))
            res = await fetch(`${API_BASE}/api/messages`, {
              method: 'POST',
              cache: 'no-store',
              headers: { Authorization: `Bearer ${apiToken}` },
              body: fd,
            })
          } else {
            res = await fetch(`${API_BASE}/api/messages`, {
              method: 'POST',
              cache: 'no-store',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiToken}`,
              },
              body: JSON.stringify({
                channelId,
                content: content || '',
                role: 'user',
                ...(conversationId ? { conversationId: String(conversationId) } : {}),
              }),
            })
          }
          const data = await res.json().catch(() => ({}))
          if (res.ok && data.message?.conversationId != null) {
            const cid = String(data.message.conversationId)
            setConversationId(cid)
            const r2 = await fetch(`${API_BASE}/api/messages/${cid}`, {
              cache: 'no-store',
              headers: { Authorization: `Bearer ${apiToken}` },
            })
            if (r2.ok) {
              const d2 = await r2.json()
              setRemoteList(mapRemoteRows(d2.messages))
            } else {
              rollbackOptimistic()
            }
          } else {
            rollbackOptimistic()
          }
        } catch {
          rollbackOptimistic()
        }
        return
      }

      if (
        isRemoteAssistant &&
        apiToken &&
        pollChannelId &&
        channelId === pollChannelId &&
        role === 'user' &&
        assistantViewLearnerId
      ) {
        try {
          let res
          if (file) {
            const fd = new FormData()
            fd.append('channelId', channelId)
            fd.append('content', content || '')
            fd.append('role', 'assistant')
            fd.append('file', file)
            if (conversationId) fd.append('conversationId', String(conversationId))
            else fd.append('learnerId', assistantViewLearnerId)
            res = await fetch(`${API_BASE}/api/messages`, {
              method: 'POST',
              cache: 'no-store',
              headers: { Authorization: `Bearer ${apiToken}` },
              body: fd,
            })
          } else {
            const body = conversationId
              ? {
                  channelId,
                  content: content || '',
                  role: 'assistant',
                  conversationId,
                }
              : {
                  channelId,
                  content: content || '',
                  role: 'assistant',
                  learnerId: assistantViewLearnerId,
                }
            res = await fetch(`${API_BASE}/api/messages`, {
              method: 'POST',
              cache: 'no-store',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiToken}`,
              },
              body: JSON.stringify(body),
            })
          }
          const data = await res.json().catch(() => ({}))
          const cid =
            data.message?.conversationId != null
              ? String(data.message.conversationId)
              : conversationId
          if (res.ok && cid) {
            setConversationId(cid)
            const r2 = await fetch(`${API_BASE}/api/messages/${cid}`, {
              cache: 'no-store',
              headers: { Authorization: `Bearer ${apiToken}` },
            })
            if (r2.ok) {
              const d2 = await r2.json()
              setRemoteList(mapRemoteRows(d2.messages))
            }
          }
        } catch {
          /* ignore */
        }
        return
      }

      const key = getStorageKey(channelId, userId)
      const newMsg = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role,
        content: content || '',
        fileName: file?.name || null,
        timestamp: Date.now(),
      }

      setLocalMessages((prev) => {
        const channelMsgs = prev[key] || []
        const userMsgs = [...channelMsgs, newMsg]
        if (channelId === 'internal-chat') {
          return { ...prev, [key]: userMsgs }
        }
        const aiResponse = {
          id: `${Date.now() + 1}-ai`,
          role: 'assistant',
          content: `Đã nhận tin nhắn của bạn. (Mock phản hồi từ ${channelId})`,
          timestamp: Date.now() + 100,
        }
        return { ...prev, [key]: [...userMsgs, aiResponse] }
      })
    },
    [
      isRemoteLearner,
      isRemoteAssistant,
      apiToken,
      pollChannelId,
      conversationId,
      assistantViewLearnerId,
    ]
  )

  const assistantViewerKey = assistantViewLearnerId ? `api-${assistantViewLearnerId}` : null
  const adminViewerKey = adminViewLearnerId ? `api-${adminViewLearnerId}` : null

  const getMessagesForChannel = useCallback(
    (channelId, userId = null) => {
      if (!channelId) return []
      if (isRemoteLearner && channelId === pollChannelId && user?.backendUserId) {
        return remoteList
      }
      if (
        isRemoteAssistant &&
        assistantViewerKey &&
        channelId === pollChannelId &&
        userId === assistantViewerKey
      ) {
        return remoteList
      }
      if (
        isRemoteAdmin &&
        adminViewerKey &&
        channelId === pollChannelId &&
        userId === adminViewerKey
      ) {
        return remoteList
      }
      const key = getStorageKey(channelId, userId)
      return localMessages[key] || []
    },
    [
      isRemoteLearner,
      isRemoteAssistant,
      isRemoteAdmin,
      pollChannelId,
      remoteList,
      localMessages,
      user?.backendUserId,
      assistantViewerKey,
      adminViewerKey,
    ]
  )

  const remoteThreadLoading = Boolean(
    useRemoteThread && pollChannelId && apiToken && !remoteReady
  )

  return {
    messages: localMessages,
    addMessage,
    getMessagesForChannel,
    remoteConversationId: useRemoteThread ? conversationId : null,
    remoteThreadLoading,
  }
}
