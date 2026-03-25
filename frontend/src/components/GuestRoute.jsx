import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Chỉ cho phép truy cập khi chưa đăng nhập (trang Login/Register)
 */
export default function GuestRoute({ children }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (user) {
    return <Navigate to={location.state?.from?.pathname || '/'} replace />
  }

  return children
}
