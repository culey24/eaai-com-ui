import { useState, useMemo, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bot,
  UserCircle,
  Shield,
  LogOut,
  Settings,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Flag,
  Users,
  User,
  FileText,
  LayoutDashboard,
  UserCog,
  ClipboardList,
  BookOpen,
  KeyRound,
  FolderSearch,
  Download,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAdmin } from '../../context/AdminContext'
import { useSupporterChat } from '../../context/SupporterChatContext'
import { useAllUsers } from '../../hooks/useAllUsers'
import { getChannelsByUser, ROLES } from '../../constants/roles'
import logo from '../../assets/hcmut_logo/logo.png'

const ICON_MAP = {
  Bot,
  UserCircle,
  Shield,
}

function Tooltip({ children, label }) {
  return (
    <div className="relative group">
      {children}
      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
        {label}
      </span>
    </div>
  )
}

export default function Sidebar({ activeChannelId, onSelectChannel, isAdminMode }) {
  const { user, logout, apiToken } = useAuth()
  const { t } = useLanguage()
  const { assignments } = useAdmin()
  const { allUsers, supporterApiRows, supporterApiLearners } = useAllUsers()
  const supporterChat = useSupporterChat()
  const selectedSupporterChatUser = supporterChat?.selectedUser
  const setSupporterChatUser = supporterChat?.setSelectedUser
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const channels = getChannelsByUser(user) || []
  /** Khớp gán admin: ưu tiên api-{backendUserId} (JWT/DB), fallback stableId / prov- */
  const supporterKey =
    user?.backendUserId != null && String(user.backendUserId).trim() !== ''
      ? `api-${String(user.backendUserId).trim()}`
      : user?.stableId || (user?.name ? `prov-${user.name}` : null)
  const assignedUserIds = Object.entries(assignments)
    .filter(([, a]) => a.supporterId === supporterKey || a.supporterId === user?.stableId)
    .map(([uid]) => uid)
  const assignedUsers = allUsers.filter((u) => assignedUserIds.includes(u.id))
  const getUserDisplayName = (u) =>
    u.fullName?.trim() ? `${u.fullName.trim()} (${u.username})` : (u.username || u.id)
  const isSettingsPage = location.pathname === '/settings'
  const isReportsPage = location.pathname === '/reports'
  const isClassesPage = location.pathname === '/classes'
  const isJournalPage = location.pathname === '/journal'
  const isJournalExportPage = location.pathname === '/supporter/journal-export'
  const isAssistant = user?.role === ROLES.ASSISTANT
  /** Gộp API + gán + placeholder từ assignments (học viên api-* chưa có trong allUsers khi GET lỗi / chưa đồng bộ). */
  const supporterChatUsers = useMemo(() => {
    if (!isAssistant || !user) return []
    const fromApi = Array.isArray(supporterApiRows) ? supporterApiLearners : []
    const byId = new Map()
    for (const u of fromApi) byId.set(u.id, u)
    for (const u of assignedUsers) {
      if (!byId.has(u.id)) byId.set(u.id, u)
    }
    const assignmentLearnerKeys = Object.entries(assignments)
      .filter(
        ([, a]) =>
          a &&
          (a.supporterId === supporterKey ||
            a.supporterId === user?.stableId ||
            (user?.backendUserId &&
              a.supporterId === String(user.backendUserId).trim()))
      )
      .map(([k]) => k)
      .filter((k) => typeof k === 'string' && k.startsWith('api-'))
    for (const key of assignmentLearnerKeys) {
      if (byId.has(key)) continue
      const bid = key.slice(4).trim().slice(0, 10)
      if (!bid) continue
      byId.set(key, {
        id: key,
        username: bid,
        fullName: null,
        role: ROLES.LEARNER,
        classCode: 'IS-2',
        managedClasses: null,
        backendUserId: bid,
        fromApi: true,
        source: 'assignment',
      })
    }
    return Array.from(byId.values())
  }, [
    isAssistant,
    user,
    supporterKey,
    assignments,
    supporterApiRows,
    supporterApiLearners,
    assignedUsers,
  ])

  /** Chọn học viên đầu tiên khi có danh sách (trước đây main trống vì chưa click). */
  useEffect(() => {
    if (!isAssistant || supporterChatUsers.length === 0) return
    if (selectedSupporterChatUser) return
    setSupporterChatUser?.(supporterChatUsers[0])
  }, [isAssistant, supporterChatUsers, selectedSupporterChatUser, setSupporterChatUser])

  const isAdmin = user?.role === ROLES.ADMIN
  const isLearner = user?.role === ROLES.LEARNER
  const isAdminArea = isAdminMode || location.pathname.startsWith('/admin')

  const getChannelLabel = (ch) => (ch.labelKey ? t(ch.labelKey, { code: ch.code }) : ch.label)

  const handleChannelClick = (ch) => {
    if (isSettingsPage || isReportsPage || isClassesPage || isJournalPage || isJournalExportPage) {
      navigate('/', { state: { channel: ch } })
    } else {
      onSelectChannel?.(ch)
    }
  }

  return (
    <aside
      className={`flex flex-col bg-white dark:bg-slate-900 min-h-screen border-r border-slate-100 dark:border-slate-700 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[72px]' : 'w-72'
      }`}
    >
      {/* Logo area */}
      <div className={`p-4 border-b border-slate-100 flex items-center shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'min-w-0 justify-center' : ''}`}>
          <img
            src={logo}
            alt={t('auth.logoAlt')}
            className="w-10 h-10 rounded-xl object-contain flex-shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-slate-800 dark:text-white block leading-snug line-clamp-2">
                {t('common.appName')}
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold leading-tight mt-0.5 truncate">
                {t('auth.brandUniversity')}
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Thu gọn sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {/* Admin: Dashboard, Kênh chat, Lớp, Tài khoản, Yêu cầu supporter */}
        {isAdmin && isAdminArea && (
          <>
            {!collapsed && (
              <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-widest px-3 py-2.5">
                {t('roles.admin')}
              </p>
            )}
            <div className="space-y-1">
              <Link
                to="/admin"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  location.pathname === '/admin' || location.pathname === '/admin/'
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{t('admin.dashboardNav')}</span>}
              </Link>
              <Link
                to="/admin/chats"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  location.pathname === '/admin/chats'
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{t('admin.chatChannels')}</span>}
              </Link>
              <Link
                to="/admin/is2-monitor"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  location.pathname === '/admin/is2-monitor'
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <Users className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{t('admin.is2Monitor')}</span>}
              </Link>
              <Link
                to="/admin/classes"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  location.pathname === '/admin/classes'
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <Users className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{t('admin.classList')}</span>}
              </Link>
              <Link
                to="/admin/accounts"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  location.pathname.startsWith('/admin/accounts')
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <UserCog className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{t('admin.accountManagement')}</span>}
              </Link>
              <Link
                to="/admin/submissions"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  location.pathname === '/admin/submissions'
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <FileText className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{t('admin.submissions.title')}</span>}
              </Link>
              <Link
                to="/admin/journal-storage-check"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  location.pathname === '/admin/journal-storage-check'
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <FolderSearch className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{t('admin.journalStorageCheck.nav')}</span>
                )}
              </Link>
              <Link
                to="/admin/surveys"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  location.pathname === '/admin/surveys'
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <ClipboardList className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{t('admin.surveys.title')}</span>}
              </Link>
              <Link
                to="/admin/faq"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  location.pathname === '/admin/faq'
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <BookOpen className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{t('admin.faq.nav')}</span>}
              </Link>
              <Link
                to="/admin/doi-mat-khau-user"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  location.pathname === '/admin/doi-mat-khau-user' ||
                  location.pathname === '/admin/xem-mk'
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <KeyRound className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{t('admin.changeUserPassword.nav')}</span>}
              </Link>
              <Link
                to="/reports"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  location.pathname === '/reports'
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <Flag className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{t('sidebar.reports')}</span>}
              </Link>
            </div>
          </>
        )}

        {/* Admin: link to Admin khi đang ở trang khác */}
        {isAdmin && !isAdminArea && (
          <div className="space-y-1 mt-2">
            <Link
              to="/admin"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary"
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium truncate">{t('roles.admin')}</span>}
            </Link>
          </div>
        )}

        {/* Assistant/Admin (non-admin-area): Báo cáo, Quản lý lớp */}
        {(isAssistant || isAdmin) && !isAdminArea && (
          <>
            {!collapsed && (
              <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-widest px-3 py-2.5">
                {t('sidebar.management')}
              </p>
            )}
            <div className="space-y-1">
              <Link
                to="/reports"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isReportsPage
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <Flag className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{t('sidebar.reports')}</span>}
              </Link>
              <Link
                to="/classes"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isClassesPage
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                }`}
              >
                <Users className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium truncate">{t('sidebar.classManagement')}</span>}
              </Link>
              {isAssistant && (
                <Link
                  to="/supporter/journal-export"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isJournalExportPage
                      ? 'bg-primary text-white shadow-glow-primary'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                  }`}
                >
                  <Download className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{t('supporter.journalExport.nav')}</span>
                  )}
                </Link>
              )}
            </div>
          </>
        )}

        {/* Journal Upload - cho Learner */}
        {isLearner && (
          <div className="space-y-1 mt-2">
            {!collapsed && (
              <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-widest px-3 py-2.5">
                {t('sidebar.journalUpload')}
              </p>
            )}
            <Link
              to="/journal"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                collapsed ? 'justify-center' : ''
              } ${
                isJournalPage
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
              }`}
            >
              <FileText className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium truncate">{t('sidebar.journalUpload')}</span>}
            </Link>
          </div>
        )}

        {/* Kênh chat: Assistant = chỉ learner được gán, Learner = kênh theo lớp */}
        {isAssistant ? (
          supporterChatUsers.length > 0 && (
            <>
              {!collapsed && (
                <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-widest px-3 py-2.5 mt-2">
                  {t('sidebar.chatsWithLearners')}
                </p>
              )}
              <div className="space-y-1">
                {supporterChatUsers.map((u) => {
                  const isActive = location.pathname === '/' && selectedSupporterChatUser?.id === u.id
                  const handleUserClick = () => {
                    setSupporterChatUser?.(u)
                    if (location.pathname === '/reports' || location.pathname === '/classes') {
                      navigate('/')
                    }
                  }
                  const btn = (
                    <button
                      key={u.id}
                      onClick={handleUserClick}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                        collapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-primary text-white shadow-glow-primary'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                      }`}
                    >
                      <User className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm font-medium truncate">{getUserDisplayName(u)}</span>}
                    </button>
                  )
                  return collapsed ? (
                    <Tooltip key={u.id} label={getUserDisplayName(u)}>
                      {btn}
                    </Tooltip>
                  ) : (
                    btn
                  )
                })}
              </div>
            </>
          )
        ) : (
          channels.length > 0 && (
            <>
              {!collapsed && (
                <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-widest px-3 py-2.5 mt-2">
                  {t('sidebar.chatChannels')}
                </p>
              )}
              <div className="space-y-3">
                {(() => {
                  const byClass = {}
                  channels.forEach((ch) => {
                    const code = ch.code || ch.id
                    if (!byClass[code]) byClass[code] = []
                    byClass[code].push(ch)
                  })
                  const classCodes = Object.keys(byClass).sort()
                  return classCodes.map((code) => (
                    <div key={code} className="space-y-1">
                      {!collapsed && (
                        <p className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {t('admin.classLabel', { code })}
                        </p>
                      )}
                      {byClass[code].map((ch) => {
                        const Icon = ICON_MAP[ch.icon] || MessageSquare
                        const isActive = !isSettingsPage && !isReportsPage && !isClassesPage && !isJournalPage && activeChannelId === ch.id
                        const btn = (
                          <button
                            key={ch.id}
                            onClick={() => handleChannelClick(ch)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                              collapsed ? 'justify-center' : ''
                            } ${
                              isActive
                                ? 'bg-primary text-white shadow-glow-primary'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
                            }`}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span className="text-sm font-medium truncate">{getChannelLabel(ch)}</span>}
                          </button>
                        )
                        return collapsed ? (
                          <Tooltip key={ch.id} label={getChannelLabel(ch)}>
                            {btn}
                          </Tooltip>
                        ) : (
                          btn
                        )
                      })}
                    </div>
                  ))
                })()}
              </div>
            </>
          )
        )}
      </div>

      {/* User section - Cài đặt & Đăng xuất hiển thị trực tiếp */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-700 shrink-0 space-y-2">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Tooltip label={user?.name}>
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow-primary text-white font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </Tooltip>
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              aria-label="Mở rộng sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Link
                to="/settings"
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-colors text-sm font-medium ${
                  isSettingsPage
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-primary/10 text-slate-600 hover:text-primary'
                }`}
              >
                <Settings className="w-4 h-4" />
                {t('common.settings')}
              </Link>
              <button
                onClick={logout}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                {t('common.logout')}
              </button>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-glow-primary">
                <span className="text-sm font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-800 dark:text-white">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {t(`roles.${user?.role?.toLowerCase()}`) || user?.role}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
