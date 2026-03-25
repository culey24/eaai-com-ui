import { useState } from 'react'
import { Check, X, UserMinus, Zap } from 'lucide-react'
import { useAdmin } from '../../context/AdminContext'
import { useAllUsers } from '../../hooks/useAllUsers'
import { useLanguage } from '../../context/LanguageContext'

export default function AdminSupportRequestsPage() {
  const { t } = useLanguage()
  const {
    supportRequests,
    autoMode,
    setAutoMode,
    approveRequest,
    rejectRequest,
    kickSupporter,
    assignments,
  } = useAdmin()
  const { allUsers } = useAllUsers()
  const [kicking, setKicking] = useState(null)

  const pending = supportRequests.filter((r) => r.status === 'pending')
  const getUserName = (id) => {
    const u = allUsers.find((x) => x.id === id)
    return u?.username ?? String(id)
  }

  const handleKick = (userId) => {
    kickSupporter(userId)
    setKicking(null)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-shrink-0 px-8 py-5 flex items-center justify-end">
        <label className="flex items-center gap-2 cursor-pointer">
          <Zap className="w-5 h-5 text-amber-500" />
          <span className="text-sm">{t('admin.autoMode')}</span>
          <input
            type="checkbox"
            checked={autoMode}
            onChange={(e) => setAutoMode(e.target.checked)}
            className="rounded"
          />
        </label>
      </div>
      <div className="flex-1 px-8 pb-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Pending requests */}
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4">
              {t('admin.pendingRequests', { count: pending.length })}
            </h2>
            <div className="space-y-3">
              {pending.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 py-4">{t('admin.noPendingRequests')}</p>
              ) : (
                pending.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                  >
                    <div>
                      <span className="font-medium">{getUserName(r.supporterId)}</span>
                      <span className="text-slate-500 mx-2">→</span>
                      <span>{getUserName(r.userId)}</span>
                      <span className="text-slate-500 ml-2">({t('admin.class')} {r.classCode})</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveRequest(r.id)}
                        className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 dark:hover:bg-green-900/50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectRequest(r.id)}
                        className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Current assignments - kick supporter */}
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4">
              {t('admin.currentAssignments')}
            </h2>
            <div className="space-y-3">
              {Object.entries(assignments).length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 py-4">{t('admin.noAssignments')}</p>
              ) : (
                Object.entries(assignments).map(([userId, a]) => (
                  <div
                    key={userId}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <div>
                      <span className="font-medium">{getUserName(userId)}</span>
                      <span className="text-slate-500 mx-2">←</span>
                      <span>{getUserName(a.supporterId)}</span>
                    </div>
                    {kicking === userId ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleKick(userId)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm"
                        >
                          {t('admin.confirmKick')}
                        </button>
                        <button
                          onClick={() => setKicking(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setKicking(userId)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <UserMinus className="w-4 h-4" />
                        {t('admin.kick')}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
