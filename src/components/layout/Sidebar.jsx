import { useState } from 'react'
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
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { CHANNELS_BY_ROLE, ROLE_LABELS } from '../../constants/roles'
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

export default function Sidebar({ activeChannelId, onSelectChannel }) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const channels = CHANNELS_BY_ROLE[user?.role] || []
  const isSettingsPage = location.pathname === '/settings'

  const handleChannelClick = (ch) => {
    if (isSettingsPage) {
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
            alt="Logo Bách Khoa"
            className="w-10 h-10 rounded-xl object-contain flex-shrink-0"
          />
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-bold text-base tracking-tight text-slate-800 dark:text-white block truncate">BK</span>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold leading-tight mt-0.5 truncate">
                ĐẠI HỌC QUỐC GIA TP.HỒ CHÍ MINH
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

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {!collapsed && (
          <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-widest px-3 py-2.5">
            Kênh chat
          </p>
        )}
        <div className="space-y-1">
          {channels.map((ch) => {
            const Icon = ICON_MAP[ch.icon] || MessageSquare
            const isActive = !isSettingsPage && activeChannelId === ch.id

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
                {!collapsed && <span className="text-sm font-medium truncate">{ch.label}</span>}
              </button>
            )

            return collapsed ? (
              <Tooltip key={ch.id} label={ch.label}>
                {btn}
              </Tooltip>
            ) : (
              btn
            )
          })}
        </div>
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
                Cài đặt
              </Link>
              <button
                onClick={logout}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
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
                  {ROLE_LABELS[user?.role] || user?.role}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
