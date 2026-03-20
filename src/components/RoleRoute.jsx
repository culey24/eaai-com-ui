import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Chỉ cho phép truy cập khi user có role nằm trong allowedRoles
 */
export default function RoleRoute({ children, allowedRoles = [] }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />

  return children
}
