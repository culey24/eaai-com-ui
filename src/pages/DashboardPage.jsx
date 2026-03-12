import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import ChatWindow from '../components/chat/ChatWindow'
import { useMessages } from '../hooks/useMessages'
import { CHANNELS_BY_ROLE } from '../constants/roles'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const location = useLocation()
  const channels = CHANNELS_BY_ROLE[user?.role] || []
  const [activeChannel, setActiveChannel] = useState(null)
  const { addMessage, getMessagesForChannel } = useMessages()

  useEffect(() => {
    if (channels.length > 0) {
      const fromState = location.state?.channel
      const validFromState = fromState && channels.some((c) => c.id === fromState.id)
      setActiveChannel((prev) => {
        if (validFromState) return fromState
        const stillValid = prev && channels.some((c) => c.id === prev.id)
        return stillValid ? prev : channels[0]
      })
    }
  }, [channels, location.state?.channel])

  const messages = getMessagesForChannel(activeChannel?.id)

  const handleSendMessage = (channelId, content, file) => {
    addMessage(channelId, content, file)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activeChannelId={activeChannel?.id}
        onSelectChannel={setActiveChannel}
      />
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <ChatWindow
          channel={activeChannel}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  )
}
