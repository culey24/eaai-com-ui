import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
import AdminStatsBlacklistPage from './pages/admin/AdminStatsBlacklistPage'
import AdminSubmissionsPage from './pages/admin/AdminSubmissionsPage'
import AdminJournalFileDownloadPage from './pages/admin/AdminJournalFileDownloadPage'
import AdminSurveyResultsPage from './pages/admin/AdminSurveyResultsPage'
import AdminFaqPage from './pages/admin/AdminFaqPage'
import AdminChangeUserPasswordPage from './pages/admin/AdminChangeUserPasswordPage'
import AdminJournalStorageCheckPage from './pages/admin/AdminJournalStorageCheckPage'
import AdminIs2MonitorPage from './pages/admin/AdminIs2MonitorPage'
import SupporterDashboardPage from './pages/supporter/SupporterDashboardPage'
import SupporterJournalExportPage from './pages/supporter/SupporterJournalExportPage'
import PretestGate from './components/PretestGate'
import SessionExpiredBridge from './components/SessionExpiredBridge'
import ClassesWithWidget from './components/supporter/ClassesWithWidget'
import Sidebar from './components/layout/Sidebar'
import { ROLES } from './constants/roles'

function JournalFileDownloadLegacyRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/journal-file-download${search}`} replace />
}

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
            <PretestGate>
              <HomeOrRedirect />
            </PretestGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <PretestGate>
              <div className="flex h-screen overflow-hidden">
                <Sidebar activeChannelId={null} onSelectChannel={() => {}} />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  <SettingsPage />
                </div>
              </div>
            </PretestGate>
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
            <PretestGate>
              <div className="flex h-screen overflow-hidden">
                <Sidebar activeChannelId={null} onSelectChannel={() => {}} />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  <JournalUploadPage />
                </div>
              </div>
            </PretestGate>
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
        path="/journal-file-download"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.ASSISTANT]}>
              <div className="flex h-screen overflow-hidden">
                <Sidebar activeChannelId={null} onSelectChannel={() => {}} />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  <AdminJournalFileDownloadPage />
                </div>
              </div>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/supporter/journal-export"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[ROLES.ASSISTANT]}>
              <div className="flex h-screen overflow-hidden">
                <Sidebar activeChannelId={null} onSelectChannel={() => {}} />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  <SupporterJournalExportPage />
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
          <Route path="blacklist" element={<AdminStatsBlacklistPage />} />
        </Route>
        <Route path="submissions" element={<AdminSubmissionsPage />} />
        <Route path="journal-file-download" element={<JournalFileDownloadLegacyRedirect />} />
        <Route path="journal-storage-check" element={<AdminJournalStorageCheckPage />} />
        <Route path="surveys" element={<AdminSurveyResultsPage />} />
        <Route path="faq" element={<AdminFaqPage />} />
        <Route path="is2-monitor" element={<AdminIs2MonitorPage />} />
        <Route path="doi-mat-khau-user" element={<AdminChangeUserPasswordPage />} />
        <Route path="xem-mk" element={<Navigate to="/admin/doi-mat-khau-user" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionExpiredBridge />
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
