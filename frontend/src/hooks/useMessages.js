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
    role: m.senderRole === 'user' ? 'user' : 'assistant',
    content: m.content || '',
    fileName: m.fileName || null,
    timestamp: m.createdAt ? new Date(m.createdAt).getTime() : Date.now(),
  }))
}

/**
 * Tin nhắn kênh chat.
 * - Learner có JWT + backendUserId: lấy từ API, làm mới định kỳ (polling), không Socket.io.
 * - Các trường hợp khác: localStorage như cũ.
 *
 * @param {string | null} pollChannelId — kênh đang mở (vd. activeChannel.id); chỉ learner API dùng để poll.
 */
export function useMessages(pollChannelId = null) {
  const { user, apiToken } = useAuth()
  const [localMessages, setLocalMessages] = useState(loadMessages)
  const [remoteList, setRemoteList] = useState([])
  const [conversationId, setConversationId] = useState(null)

  const isRemoteLearner =
    Boolean(apiToken && user?.backendUserId && user?.role === ROLES.LEARNER)

  /* Tìm conversationId theo kênh */
  useEffect(() => {
    if (!isRemoteLearner || !pollChannelId || !apiToken) {
      setConversationId(null)
      setRemoteList([])
      return
    }

    let cancelled = false
    const resolveConv = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/conversations`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const conv = data.conversations?.find(
          (c) => String(c.channelId) === String(pollChannelId)
        )
        setConversationId(conv?.id != null ? String(conv.id) : null)
      } catch {
        if (!cancelled) setConversationId(null)
      }
    }

    resolveConv()
    const tConv = setInterval(resolveConv, 12000)
    return () => {
      cancelled = true
      clearInterval(tConv)
    }
  }, [isRemoteLearner, pollChannelId, apiToken])

  /* Poll tin nhắn từ DB */
  useEffect(() => {
    if (!isRemoteLearner || !apiToken || !conversationId) {
      if (isRemoteLearner && pollChannelId && !conversationId) setRemoteList([])
      return
    }

    let cancelled = false
    const pull = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/messages/${conversationId}`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        setRemoteList(mapRemoteRows(data.messages))
      } catch {
        /* lỗi mạng — giữ list cũ */
      }
    }

    pull()
    const tid = setInterval(pull, 5000)
    return () => {
      cancelled = true
      clearInterval(tid)
    }
  }, [isRemoteLearner, apiToken, conversationId, pollChannelId])

  useEffect(() => {
    if (isRemoteLearner) return
    saveMessages(localMessages)
  }, [localMessages, isRemoteLearner])

  const addMessage = useCallback(
    async (channelId, content, file = null, role = 'user', userId = null) => {
      if (
        isRemoteLearner &&
        apiToken &&
        pollChannelId &&
        channelId === pollChannelId &&
        role === 'user'
      ) {
        try {
          const res = await fetch(`${API_BASE}/api/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiToken}`,
            },
            body: JSON.stringify({
              channelId,
              content: content || '',
              fileName: file?.name || undefined,
              role: 'user',
            }),
          })
          const data = await res.json().catch(() => ({}))
          if (res.ok && data.message?.conversationId != null) {
            const cid = String(data.message.conversationId)
            setConversationId(cid)
            const r2 = await fetch(`${API_BASE}/api/messages/${cid}`, {
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

        const aiResponse = {
          id: `${Date.now() + 1}-ai`,
          role: 'assistant',
          content: `Đã nhận tin nhắn của bạn. (Mock phản hồi từ ${channelId})`,
          timestamp: Date.now() + 100,
        }
        const withAi = [...userMsgs, aiResponse]

        return { ...prev, [key]: withAi }
      })
    },
    [isRemoteLearner, apiToken, pollChannelId]
  )

  const getMessagesForChannel = useCallback(
    (channelId, userId = null) => {
      if (!channelId) return []
      if (isRemoteLearner && channelId === pollChannelId && user?.backendUserId) {
        return remoteList
      }
      const key = getStorageKey(channelId, userId)
      return localMessages[key] || []
    },
    [isRemoteLearner, pollChannelId, remoteList, localMessages, user?.backendUserId]
  )

  return { messages: localMessages, addMessage, getMessagesForChannel }
}
