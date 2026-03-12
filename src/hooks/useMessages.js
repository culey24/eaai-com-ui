import { useState, useEffect, useCallback } from 'react'

const MESSAGES_STORAGE_KEY = 'eeai_chatbot_messages'

function loadMessages() {
  try {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveMessages(messages) {
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages))
}

/**
 * messages structure: { [channelId]: [{ id, role, content, timestamp }] }
 */
export function useMessages() {
  const [messages, setMessages] = useState(loadMessages)

  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  const addMessage = useCallback((channelId, content, file = null, role = 'user') => {
    const newMsg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role,
      content: content || '',
      fileName: file?.name || null,
      timestamp: Date.now(),
    }

    setMessages((prev) => {
      const channelMsgs = prev[channelId] || []
      const userMsgs = [...channelMsgs, newMsg]

      // Mock AI response
      const aiResponse = {
        id: `${Date.now() + 1}-ai`,
        role: 'assistant',
        content: `Đã nhận tin nhắn của bạn. (Mock phản hồi từ ${channelId})`,
        timestamp: Date.now() + 100,
      }
      const withAi = [...userMsgs, aiResponse]

      return { ...prev, [channelId]: withAi }
    })
  }, [])

  const getMessagesForChannel = useCallback(
    (channelId) => (channelId ? messages[channelId] || [] : []),
    [messages]
  )

  return { messages, addMessage, getMessagesForChannel }
}
