import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeChannelId={null} onSelectChannel={() => {}} isAdminMode />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
