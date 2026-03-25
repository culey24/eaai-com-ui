import { useState } from 'react'
import { Search, Plus, Trash2 } from 'lucide-react'
import { useAllUsers } from '../../hooks/useAllUsers'
import { useAdmin } from '../../context/AdminContext'
import { useLanguage } from '../../context/LanguageContext'
import { ROLES, ROLE_LABELS, VALID_CLASS_CODES } from '../../constants/roles'
import { CLASS_TO_MODE, hasSupporterMode } from '../../constants/admin'

export default function AdminAccountsPage() {
  const { t } = useLanguage()
  const { allUsers, createUser, updateUserRole, deleteUser } = useAllUsers()
  const { assignments, assignSupporter, kickSupporter } = useAdmin()
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
    const matchSearch =
      !q ||
      u.username.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    const matchRole = !filterRole || u.role === filterRole
    const matchClass = !filterClass || u.classCode === filterClass
    return matchSearch && matchRole && matchClass
  })

  const supporters = allUsers.filter((u) => u.role === 'ASSISTANT')
  const getSupporterName = (userId) => {
    const a = assignments[userId]
    if (!a) return null
    return allUsers.find((u) => u.id === a.supporterId)?.username ?? a.supporterId
  }

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
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-shrink-0 px-8 py-5 flex items-center justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          {t('admin.createAccount')}
        </button>
      </div>
      <div className="flex-1 px-8 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('admin.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            >
              <option value="">{t('admin.allRoles')}</option>
              {Object.keys(ROLE_LABELS).map((k) => (
                <option key={k} value={k}>{t(`roles.${k.toLowerCase()}`)}</option>
              ))}
            </select>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            >
              <option value="">{t('admin.allClasses')}</option>
              {VALID_CLASS_CODES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">{t('admin.nameOrId')}</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">{t('admin.fullName')}</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">{t('admin.class')}</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">{t('admin.role')}</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">{t('admin.supporter')}</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800 dark:text-white">{u.username}</span>
                      <span className="block text-xs text-slate-500">{u.id}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {u.fullName?.trim() || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{u.classCode || '-'}</td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                      >
                        {Object.keys(ROLE_LABELS).map((k) => (
                          <option key={k} value={k}>{t(`roles.${k.toLowerCase()}`)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {u.role === 'LEARNER' ? (
                        hasSupporterMode(u.classCode) ? (
                          <select
                            value={assignments[u.id]?.supporterId ?? ''}
                            onChange={(e) => {
                              const val = e.target.value
                              if (!val) {
                                kickSupporter(u.id)
                              } else {
                                const mode = CLASS_TO_MODE[u.classCode] || 'MANUAL'
                                assignSupporter(u.id, val, mode)
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm min-w-[140px]"
                          >
                            <option value="">{t('admin.noSupporter')}</option>
                            {supporters.map((s) => (
                              <option key={s.id} value={s.id}>{s.fullName || s.username}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-slate-500">
                            {t(`admin.teachingMode.${CLASS_TO_MODE[u.classCode] || 'MANUAL'}`)}
                          </span>
                        )
                      ) : (
                        <span className="text-sm text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <span className="text-sm text-slate-500">{u.source}</span>
                      {!u.id.startsWith('prov-') && (
                        <button
                          onClick={() => {
                            if (window.confirm(t('admin.confirmDelete'))) {
                              if (assignments[u.id]) kickSupporter(u.id)
                              deleteUser(u.id)
                            }
                          }}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title={t('admin.deleteAccount')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
