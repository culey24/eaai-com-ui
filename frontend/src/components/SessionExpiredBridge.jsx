import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../config/api'
import { installAuthFetchGuard } from '../lib/authFetchGuard'

/**
 * Đăng ký guard fetch: JWT hết hạn → logout và chuyển /login (kèm state hiển thị thông báo).
 */
export default function SessionExpiredBridge() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const logoutRef = useRef(logout)
  const navigateRef = useRef(navigate)
  logoutRef.current = logout
  navigateRef.current = navigate

  useEffect(() => {
    return installAuthFetchGuard({
      apiBase: API_BASE,
      onSessionInvalid: () => {
        logoutRef.current()
        navigateRef.current('/login', { replace: true, state: { sessionExpired: true } })
      },
    })
  }, [])

  return null
}
