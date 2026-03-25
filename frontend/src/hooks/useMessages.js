import { useState, useEffect, useCallback } from 'react'

const MESSAGES_STORAGE_KEY = 'eeai_chatbot_messages'

function getStorageKey(channelId, userId) {
  return userId ? `${channelId}::${userId}` : channelId
}

function loadMessages() {
  try {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY)
    const data = stored ? JSON.parse(stored) : {}
    // Migrate old format: { [channelId]: [...] } (no ::) -> { [channelId::legacy]: [...] }
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

/**
 * messages structure: { [channelId::userId]: [{ id, role, content, timestamp }] }
 * role 'assistant' displays as AGENT in admin view
 */
export function useMessages() {
  const [messages, setMessages] = useState(loadMessages)

  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  const addMessage = useCallback((channelId, content, file = null, role = 'user', userId = null) => {
    const key = getStorageKey(channelId, userId)
    const newMsg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role,
      content: content || '',
      fileName: file?.name || null,
      timestamp: Date.now(),
    }

    setMessages((prev) => {
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
  }, [])

  const getMessagesForChannel = useCallback(
    (channelId, userId = null) => {
      if (!channelId) return []
      const key = getStorageKey(channelId, userId)
      return messages[key] || []
    },
    [messages]
  )

  return { messages, addMessage, getMessagesForChannel }
}
