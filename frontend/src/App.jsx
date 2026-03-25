import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AdminProvider } from './context/AdminContext'
import { ReportsProvider } from './context/ReportsContext'
import { JournalProvider } from './context/JournalContext'
import { SupporterChatProvider } from './context/SupporterChatContext'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import RoleRoute from './components/RoleRoute'
import AuthLayout from './components/auth/AuthLayout'
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import ReportsPage from './pages/ReportsPage'
import ClassesPage from './pages/ClassesPage'
import JournalUploadPage from './pages/JournalUploadPage'
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminChatsPage from './pages/admin/AdminChatsPage'
import AdminClassesPage from './pages/admin/AdminClassesPage'
import AdminAccountsLayout from './pages/admin/AdminAccountsLayout'
import AdminAccountsPage from './pages/admin/AdminAccountsPage'
import AdminSupportRequestsPage from './pages/admin/AdminSupportRequestsPage'
import AdminSubmissionsPage from './pages/admin/AdminSubmissionsPage'
import SupporterDashboardPage from './pages/supporter/SupporterDashboardPage'
import ClassesWithWidget from './components/supporter/ClassesWithWidget'
import Sidebar from './components/layout/Sidebar'
import { ROLES } from './constants/roles'

function HomeOrRedirect() {
  const { user } = useAuth()
  if (user?.role === ROLES.ADMIN) return <Navigate to="/admin" replace />
  if (user?.role === ROLES.ASSISTANT) return <SupporterDashboardPage />
  return <DashboardPage />
}

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
            <HomeOrRedirect />
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
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.ASSISTANT, ROLES.ADMIN]}>
              <div className="flex h-screen overflow-hidden">
                <Sidebar activeChannelId={null} onSelectChannel={() => {}} />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  <ReportsPage />
                </div>
              </div>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/journal"
        element={
          <ProtectedRoute>
            <div className="flex h-screen overflow-hidden">
              <Sidebar activeChannelId={null} onSelectChannel={() => {}} />
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <JournalUploadPage />
              </div>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chats"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.ASSISTANT]}>
              <Navigate to="/" replace />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.ASSISTANT, ROLES.ADMIN]}>
              <div className="flex h-screen overflow-hidden">
                <Sidebar activeChannelId={null} onSelectChannel={() => {}} />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                  <ClassesWithWidget />
                </div>
              </div>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="chats" element={<AdminChatsPage />} />
        <Route path="classes" element={<AdminClassesPage />} />
        <Route path="accounts" element={<AdminAccountsLayout />}>
          <Route index element={<AdminAccountsPage />} />
          <Route path="support-requests" element={<AdminSupportRequestsPage />} />
        </Route>
        <Route path="submissions" element={<AdminSubmissionsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminProvider>
          <ReportsProvider>
            <JournalProvider>
              <LanguageProvider>
                <ThemeProvider>
                  <SupporterChatProvider>
                    <AppRoutes />
                  </SupporterChatProvider>
                </ThemeProvider>
              </LanguageProvider>
            </JournalProvider>
          </ReportsProvider>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
