import { useSupporterStats } from '../../hooks/useSupporterStats'
import TaskDashboardWidget from '../supporter/TaskDashboardWidget'
import Sidebar from './Sidebar'

export default function SupporterLayout({ children }) {
  const stats = useSupporterStats()
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeChannelId={null} onSelectChannel={() => {}} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TaskDashboardWidget stats={stats} />
        {children}
      </div>
    </div>
  )
}
