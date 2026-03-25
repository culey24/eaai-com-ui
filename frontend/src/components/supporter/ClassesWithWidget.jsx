import { useAuth } from '../../context/AuthContext'
import { useSupporterStats } from '../../hooks/useSupporterStats'
import TaskDashboardWidget from './TaskDashboardWidget'
import ClassesPage from '../../pages/ClassesPage'
import { ROLES } from '../../constants/roles'

export default function ClassesWithWidget() {
  const { user } = useAuth()
  const stats = useSupporterStats()
  const isAssistant = user?.role === ROLES.ASSISTANT

  return (
    <>
      {isAssistant && <TaskDashboardWidget stats={stats} />}
      <ClassesPage />
    </>
  )
}
