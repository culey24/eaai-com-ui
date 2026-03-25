import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import ChatWindow from '../components/chat/ChatWindow'
import ProfileCompleteBanner from '../components/ProfileCompleteBanner'
import { useMessages } from '../hooks/useMessages'
import { useReports } from '../context/ReportsContext'
import { getChannelsByUser } from '../constants/roles'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user, isProfileComplete } = useAuth()
  const location = useLocation()
  const channels = getChannelsByUser(user) || []
  const [activeChannel, setActiveChannel] = useState(null)
  const { addMessage, getMessagesForChannel } = useMessages(activeChannel?.id)
  const { addReport } = useReports()

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

  const userId = user?.stableId || (user?.name ? `reg-${user.name}` : null)
  const messages = getMessagesForChannel(activeChannel?.id, userId)

  const handleSendMessage = (channelId, content, file) => {
    if (!isProfileComplete()) return
    addMessage(channelId, content, file, 'user', userId)
  }

  const handleReport = (report) => {
    addReport({
      ...report,
      reporterUsername: user?.username ?? user?.name ?? '',
      reporterFullName: (user?.fullName || user?.name || '').trim() || user?.username || '',
    })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activeChannelId={activeChannel?.id}
        onSelectChannel={setActiveChannel}
      />
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
        <ProfileCompleteBanner />
        <ChatWindow
          channel={activeChannel}
          messages={messages}
          onSendMessage={handleSendMessage}
          onReport={handleReport}
          userId={user?.id}
        />
      </main>
    </div>
  )
}
