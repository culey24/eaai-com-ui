import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import AuthLayout from './components/auth/AuthLayout'
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import Sidebar from './components/layout/Sidebar'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <GuestRoute>
          <AuthLayout>
            <LoginForm />
          </AuthLayout>
        </GuestRoute>
      } />
      <Route path="/register" element={
        <GuestRoute>
          <AuthLayout>
            <RegisterForm />
          </AuthLayout>
        </GuestRoute>
      } />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <div className="flex h-screen overflow-hidden">
              <Sidebar activeChannelId={null} onSelectChannel={() => {}} />
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <SettingsPage />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
