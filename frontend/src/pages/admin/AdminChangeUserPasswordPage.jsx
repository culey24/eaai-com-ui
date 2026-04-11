import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { useAllUsers } from '../../hooks/useAllUsers'
import { API_BASE } from '../../config/api'
import { ROLES } from '../../constants/roles'
import { uiIdToBackendUserId } from '../../lib/userIds'

export default function AdminChangeUserPasswordPage() {
  const { t } = useLanguage()
  const { apiToken, user } = useAuth()
  const { allUsers, adminApiLoaded } = useAllUsers()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [passkey, setPasskey] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const apiUsers = useMemo(
    () =>
      allUsers.filter((u) => u.fromApi && uiIdToBackendUserId(u) != null).sort((a, b) => {
        const la = (a.username || '').toLowerCase()
        const lb = (b.username || '').toLowerCase()
        return la.localeCompare(lb)
      }),
    [allUsers]
  )

  const submit = async () => {
    setError('')
    setSuccess(null)
    const backendId = selectedUserId.trim()
    if (!apiToken || !backendId) return
    if (newPassword !== newPassword2) {
      setError(t('admin.changeUserPassword.mismatch'))
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/users/${encodeURIComponent(backendId)}/set-password`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ passkey, newPassword }),
        }
      )
      const data = await res.json().catch(() => ({}))
      if (res.status === 403 && data?.code === 'BAD_PASSKEY') {
        setError(t('admin.changeUserPassword.badPasskey'))
        return
      }
      if (res.status === 400 && data?.code === 'PASSWORD_TOO_SHORT') {
        setError(data?.error || t('admin.changeUserPassword.tooShort'))
        return
      }
      if (!res.ok) {
        setError(data?.error || t('admin.changeUserPassword.requestFailed'))
        return
      }
      setSuccess(data)
      setNewPassword('')
      setNewPassword2('')
    } catch {
      setError(t('admin.changeUserPassword.requestFailed'))
    } finally {
      setLoading(false)
    }
  }

  const needJwt = !apiToken || user?.role !== ROLES.ADMIN
  const canSubmit =
    Boolean(selectedUserId && passkey.trim() && newPassword.length >= 4 && newPassword2.length >= 4)

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="flex-shrink-0 px-6 sm:px-10 lg:px-12 py-5 border-b border-slate-100 dark:border-slate-800">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('admin.changeUserPassword.backAdmin')}
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('admin.changeUserPassword.title')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('admin.changeUserPassword.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 sm:px-10 lg:px-12 py-8">
        <div className="w-full max-w-xl mx-auto space-y-6">
          {needJwt ? (
            <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
              {t('admin.changeUserPassword.needJwt')}
            </p>
          ) : null}

          {!needJwt && adminApiLoaded && apiUsers.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('admin.changeUserPassword.noUsers')}</p>
          ) : null}

          {!needJwt ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-6 space-y-4 shadow-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                  {t('admin.changeUserPassword.userLabel')}
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">{t('admin.changeUserPassword.pickUser')}</option>
                  {apiUsers.map((u) => {
                    const id = uiIdToBackendUserId(u)
                    const label = u.fullName?.trim()
                      ? `${u.fullName.trim()} (${u.username})`
                      : u.username || id
                    return (
                      <option key={u.id} value={id}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                  {t('admin.changeUserPassword.passkeyLabel')}
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                  placeholder={t('admin.changeUserPassword.passkeyPlaceholder')}
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                  {t('admin.changeUserPassword.newPasswordLabel')}
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                  placeholder={t('admin.changeUserPassword.newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                  {t('admin.changeUserPassword.confirmLabel')}
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                  placeholder={t('admin.changeUserPassword.confirmPlaceholder')}
                  value={newPassword2}
                  onChange={(e) => setNewPassword2(e.target.value)}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{t('admin.changeUserPassword.hint')}</p>
              </div>

              {error ? (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              ) : null}

              <button
                type="button"
                disabled={loading || !canSubmit}
                onClick={submit}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-white py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t('admin.changeUserPassword.submit')}
              </button>
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 p-5 space-y-2 text-sm text-emerald-900 dark:text-emerald-100">
              <p className="font-medium">{t('admin.changeUserPassword.successTitle')}</p>
              <p>
                {success.username}
                {success.fullname ? ` — ${success.fullname}` : null}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
