import { useState, useMemo } from 'react'
import { Search, Plus, Trash2 } from 'lucide-react'
import { useAllUsers } from '../../hooks/useAllUsers'
import { useAuth } from '../../context/AuthContext'
import { useAdmin } from '../../context/AdminContext'
import { useLanguage } from '../../context/LanguageContext'
import { ROLES, ROLE_LABELS, VALID_CLASS_CODES } from '../../constants/roles'
import { CLASS_TO_MODE, hasSupporterMode } from '../../constants/admin'
import { uiIdToBackendUserId } from '../../lib/userIds'

export default function AdminAccountsPage() {
  const { t } = useLanguage()
  const { apiToken, user: authUser } = useAuth()
  const {
    allUsers,
    createUser,
    updateUserRole,
    deleteUser,
    roleOverrides,
    roleUpdateError,
    clearRoleUpdateError,
  } = useAllUsers()
  const {
    assignments,
    assignSupporter,
    kickSupporter,
    assignmentSyncError,
    clearAssignmentSyncError,
  } = useAdmin()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    password: '',
    role: 'LEARNER',
    classCode: '',
    managedClasses: [],
  })

  const filtered = allUsers.filter((u) => {
    const q = (search || '').toLowerCase()
    const fullNameLc = (u.fullName || '').trim().toLowerCase()
    const matchSearch =
      !q ||
      u.username.toLowerCase().includes(q) ||
      fullNameLc.includes(q) ||
      u.id.toLowerCase().includes(q)
    const matchRole = !filterRole || u.role === filterRole
    const matchClass = !filterClass || u.classCode === filterClass
    return matchSearch && matchRole && matchClass
  })

  /**
   * Supporter có backend user_id để gán học viên.
   * Với user api-*: sau khi đổi role → ASSISTANT, `dbUserRole` có thể vẫn `student` cho đến khi
   * GET /api/admin/users refetch xong — dùng roleOverrides / UI role để vẫn hiện trong picker.
   */
  const supporters = allUsers.filter((u) => {
    if (u.role !== ROLES.ASSISTANT) return false
    if (uiIdToBackendUserId(u) == null) return false
    if (!u.fromApi) return true
    const db = u.dbUserRole != null ? String(u.dbUserRole).toLowerCase() : ''
    const dbIsSupporter = db === 'support' || db === 'assistant' || db === 'teacher'
    const pendingAssistantUi = roleOverrides[u.id] === ROLES.ASSISTANT
    if (pendingAssistantUi || dbIsSupporter) return true
    return false
  })

  const supportersSorted = useMemo(
    () =>
      [...supporters].sort((a, b) => {
        const la = (a.fullName?.trim() || a.username || a.id).toLowerCase()
        const lb = (b.fullName?.trim() || b.username || b.id).toLowerCase()
        return la.localeCompare(lb)
      }),
    [supporters]
  )

  const handleCreate = () => {
    if (!newUser.username.trim()) return
    if (newUser.role === 'LEARNER' && !VALID_CLASS_CODES.includes(newUser.classCode)) return
    createUser({
      username: newUser.username.trim(),
      fullName: newUser.fullName.trim(),
      password: newUser.password,
      role: newUser.role,
      classCode: newUser.classCode || null,
      managedClasses: newUser.managedClasses.length ? newUser.managedClasses : null,
    })
    setNewUser({
      username: '',
      fullName: '',
      password: '',
      role: 'LEARNER',
      classCode: '',
      managedClasses: [],
    })
    setShowCreate(false)
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="flex-shrink-0 px-6 sm:px-10 lg:px-12 py-5 flex items-center justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:opacity-90 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('admin.createAccount')}
        </button>
      </div>
      <div className="flex-1 px-6 sm:px-10 lg:px-12 pb-10 min-h-0">
        <div className="w-full max-w-[min(100%,88rem)] mx-auto space-y-8">
          {authUser?.role === ROLES.ADMIN && !apiToken && (
            <div
              className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100"
              role="status"
            >
              {t('admin.dbRoleRequiresJwt')}
            </div>
          )}
          {assignmentSyncError && (
            <div
              className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-200 flex items-center justify-between gap-3"
              role="alert"
            >
              <span>{assignmentSyncError}</span>
              <button
                type="button"
                onClick={() => clearAssignmentSyncError()}
                className="shrink-0 underline font-medium"
              >
                {t('common.cancel')}
              </button>
            </div>
          )}
          {roleUpdateError && (
            <div
              className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-200 flex items-center justify-between gap-3"
              role="alert"
            >
              <span>{roleUpdateError}</span>
              <button
                type="button"
                onClick={() => clearRoleUpdateError()}
                className="shrink-0 underline font-medium"
              >
                {t('common.cancel')}
              </button>
            </div>
          )}
          {/* Filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-5">
            <div className="relative flex-1 min-w-[min(100%,240px)]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('admin.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-[15px]"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 min-w-[11rem] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-[15px]"
            >
              <option value="">{t('admin.allRoles')}</option>
              {Object.keys(ROLE_LABELS).map((k) => (
                <option key={k} value={k}>{t(`roles.${k.toLowerCase()}`)}</option>
              ))}
            </select>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-4 py-2.5 min-w-[9rem] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-[15px]"
            >
              <option value="">{t('admin.allClasses')}</option>
              {VALID_CLASS_CODES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Table — cuộn ngang trên màn hẹp, cột supporter đủ rộng */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/20 shadow-sm overflow-hidden">
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[860px] text-[15px]">
                <thead className="bg-slate-50 dark:bg-slate-800/60">
                  <tr>
                    <th className="text-left px-5 sm:px-6 py-4 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {t('admin.nameOrId')}
                    </th>
                    <th className="text-left px-5 sm:px-6 py-4 font-medium text-slate-600 dark:text-slate-400 min-w-[8rem]">
                      {t('admin.fullName')}
                    </th>
                    <th className="text-left px-5 sm:px-6 py-4 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {t('admin.class')}
                    </th>
                    <th className="text-left px-5 sm:px-6 py-4 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {t('admin.role')}
                    </th>
                    <th className="text-left px-5 sm:px-6 py-4 font-medium text-slate-600 dark:text-slate-400 min-w-[14rem] w-[18rem]">
                      {t('admin.supporter')}
                    </th>
                    <th className="text-left px-5 sm:px-6 py-4 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 align-top">
                      <td className="px-5 sm:px-6 py-5 align-top">
                        <span className="font-medium text-slate-800 dark:text-white">{u.username}</span>
                        <span className="block text-xs text-slate-500 mt-0.5 break-all">{u.id}</span>
                      </td>
                      <td className="px-5 sm:px-6 py-5 text-slate-600 dark:text-slate-400 align-top max-w-[14rem]">
                        <span className="line-clamp-3 break-words">{u.fullName?.trim() || '—'}</span>
                      </td>
                      <td className="px-5 sm:px-6 py-5 text-slate-600 dark:text-slate-400 align-top whitespace-nowrap">
                        {u.classCode || '-'}
                      </td>
                      <td className="px-5 sm:px-6 py-5 align-top">
                        <select
                          value={u.role}
                          onChange={(e) => {
                            void updateUserRole(u.id, e.target.value)
                          }}
                          className="min-w-[10.5rem] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                        >
                          {Object.keys(ROLE_LABELS).map((k) => (
                            <option key={k} value={k}>{t(`roles.${k.toLowerCase()}`)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 sm:px-6 py-5 align-top min-w-[14rem]">
                        {u.role === 'LEARNER' ? (
                          hasSupporterMode(u.classCode) ? (
                            <select
                              value={assignments[u.id]?.supporterId ?? ''}
                              onChange={(e) => {
                                const val = e.target.value
                                void (async () => {
                                  const sup = supportersSorted.find((s) => s.id === val)
                                  if (!val) {
                                    await kickSupporter(u.id, { learnerUser: u })
                                  } else {
                                    const mode = CLASS_TO_MODE[u.classCode] || 'MANUAL'
                                    await assignSupporter(u.id, val, mode, {
                                      learnerUser: u,
                                      supporterUser: sup,
                                    })
                                  }
                                })()
                              }}
                              className="min-w-[12rem] w-full max-w-[24rem] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                            >
                              <option value="">{t('admin.noSupporter')}</option>
                              {supportersSorted.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.fullName?.trim()
                                    ? `${s.fullName.trim()} (@${s.username})`
                                    : s.username || s.id}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm text-slate-500 leading-relaxed">
                              {t(`admin.teachingMode.${CLASS_TO_MODE[u.classCode] || 'MANUAL'}`)}
                            </span>
                          )
                        ) : (
                          <span className="text-sm text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-5 sm:px-6 py-5 align-top">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <span className="text-sm text-slate-500 shrink-0">{u.source}</span>
                          {!u.id.startsWith('prov-') && (
                            <button
                              onClick={() => {
                                if (!window.confirm(t('admin.confirmDelete'))) return
                                void (async () => {
                                  if (assignments[u.id]) {
                                    await kickSupporter(u.id, { learnerUser: u })
                                  }
                                  deleteUser(u.id)
                                })()
                              }}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 self-start"
                              title={t('admin.deleteAccount')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-semibold text-lg mb-4">{t('admin.createAccountTitle')}</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder={t('auth.username')}
                value={newUser.username}
                onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <input
                type="text"
                placeholder={t('admin.fullNamePlaceholder')}
                value={newUser.fullName}
                onChange={(e) => setNewUser((p) => ({ ...p, fullName: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <input
                type="password"
                placeholder={t('auth.password')}
                value={newUser.password}
                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                {Object.keys(ROLE_LABELS).map((k) => (
                  <option key={k} value={k}>{t(`roles.${k.toLowerCase()}`)}</option>
                ))}
              </select>
              {newUser.role === 'LEARNER' && (
                <select
                  value={newUser.classCode}
                  onChange={(e) => setNewUser((p) => ({ ...p, classCode: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="">{t('admin.selectClass')}</option>
                  {VALID_CLASS_CODES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-2 rounded-xl bg-primary text-white"
              >
                {t('admin.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
