import { createContext, useContext, useState } from 'react'

const SupporterChatContext = createContext(null)

export function SupporterChatProvider({ children }) {
  const [selectedUser, setSelectedUser] = useState(null)
  return (
    <SupporterChatContext.Provider value={{ selectedUser, setSelectedUser }}>
      {children}
    </SupporterChatContext.Provider>
  )
}

export function useSupporterChat() {
  const ctx = useContext(SupporterChatContext)
  return ctx
}
