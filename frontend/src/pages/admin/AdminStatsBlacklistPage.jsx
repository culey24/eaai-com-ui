import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, UserX, Ban } from 'lucide-react'
import { useAllUsers } from '../../hooks/useAllUsers'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import { ROLES, ROLE_LABELS } from '../../constants/roles'

function normUser(u) {
  return String(u?.username ?? '')
    .trim()
    .toLowerCase()
}

export default function AdminStatsBlacklistPage() {
  const { t } = useLanguage()
  const { apiToken, user } = useAuth()
  const { allUsers } = useAllUsers()
  const [search, setSearch] = useState('')
  const [exclusions, setExclusions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadList = useCallback(async () => {
    if (!apiToken || user?.role !== ROLES.ADMIN) {
      setExclusions([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const r = await fetch(`${API_BASE}/api/admin/stats-exclusions`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`)
      setExclusions(Array.isArray(data.exclusions) ? data.exclusions : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setExclusions([])
    } finally {
      setLoading(false)
    }
  }, [apiToken, user?.role])

  useEffect(() => {
    loadList()
  }, [loadList])

  const excludedNorm = useMemo(
    () => new Set(exclusions.map((e) => String(e.usernameNormalized || '').toLowerCase())),
    [exclusions]
  )

  const filteredUsers = useMemo(() => {
    const q = (search || '').trim().toLowerCase()
    if (!q) return []
    return allUsers.filter((u) => {
      const un = (u.username || '').toLowerCase()
      const fn = (u.fullName || '').trim().toLowerCase()
      const id = (u.id || '').toLowerCase()
      return un.includes(q) || fn.includes(q) || id.includes(q)
    })
  }, [allUsers, search])

  const addExclusion = async (row) => {
    const username = String(row?.username || '').trim()
    if (!username || !apiToken) return
    setError('')
    try {
      const r = await fetch(`${API_BASE}/api/admin/stats-exclusions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || data.message || `HTTP ${r.status}`)
      await loadList()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const removeExclusion = async (usernameNormalized) => {
    const key = String(usernameNormalized || '').trim().toLowerCase()
    if (!key || !apiToken) return
    setError('')
    try {
      const r = await fetch(
        `${API_BASE}/api/admin/stats-exclusions/${encodeURIComponent(key)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${apiToken}` } }
      )
      if (!r.ok && r.status !== 204) {
        const data = await r.json().catch(() => ({}))
        throw new Error(data.error || data.message || `HTTP ${r.status}`)
      }
      await loadList()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="flex-1 px-6 sm:px-10 lg:px-12 py-8 min-h-0">
        <div className="w-full max-w-[min(100%,88rem)] mx-auto space-y-8">
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-950 dark:text-amber-100/90">
            <Ban className="w-5 h-5 shrink-0 mt-0.5 opacity-80" />
            <p className="leading-relaxed">{t('admin.statsBlacklist.intro')}</p>
          </div>

          {error && (
            <div
              className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-200"
              role="alert"
            >
              {error}
            </div>
          )}

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              {t('admin.statsBlacklist.addSection')}
            </h2>
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.statsBlacklist.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
              />
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto bg-white dark:bg-slate-800/50">
              <table className="w-full text-sm min-w-[42rem]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                    <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {t('admin.nameOrId')}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {t('admin.fullName')}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {t('admin.role')}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                        {search.trim()
                          ? t('admin.statsBlacklist.noSearchResults')
                          : t('admin.statsBlacklist.typeToSearch')}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.slice(0, 80).map((u) => {
                      const n = normUser(u)
                      const listed = excludedNorm.has(n)
                      return (
                        <tr
                          key={u.id}
                          className="border-b border-slate-100 dark:border-slate-700/80 last:border-0"
                        >
                          <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200">
                            {u.username}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                            {u.fullName?.trim() || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            {ROLE_LABELS[u.role] || u.role}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {listed ? (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {t('admin.statsBlacklist.alreadyListed')}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addExclusion(u)}
                                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:opacity-90"
                              >
                                {t('admin.statsBlacklist.add')}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <UserX className="w-4 h-4 text-primary" />
              {t('admin.statsBlacklist.listedTitle')}
              {loading && (
                <span className="text-xs font-normal text-slate-500">{t('common.loading')}</span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('admin.statsBlacklist.envHint')}</p>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto bg-white dark:bg-slate-800/50">
              <table className="w-full text-sm min-w-[36rem]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                    <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      Username
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {t('admin.fullName')}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && exclusions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                        {t('admin.statsBlacklist.listedEmpty')}
                      </td>
                    </tr>
                  ) : (
                    exclusions.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b border-slate-100 dark:border-slate-700/80 last:border-0"
                      >
                        <td className="px-4 py-3 font-mono text-slate-800 dark:text-slate-200">
                          {e.username || e.usernameNormalized}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {e.fullname?.trim() || '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeExclusion(e.usernameNormalized)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            {t('admin.statsBlacklist.remove')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
