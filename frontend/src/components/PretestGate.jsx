import { useAuth } from '../context/AuthContext'
import { ROLES } from '../constants/roles'
import { useLanguage } from '../context/LanguageContext'
import { isPretestDisabledViaVite } from '../config/featureFlags'
import PretestModal from './pretest/PretestModal'

export default function PretestGate({ children }) {
  const { t } = useLanguage()
  const { user, apiToken, pretestChecking, pretestNeedsCompletion } = useAuth()

  if (isPretestDisabledViaVite()) {
    return children
  }

  const isApiLearner =
    user?.role === ROLES.LEARNER && Boolean(apiToken) && user?.backendUserId != null

  if (!isApiLearner) {
    return children
  }

  if (pretestChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('common.loading')}</p>
      </div>
    )
  }

  if (pretestNeedsCompletion) {
    return <PretestModal />
  }

  return children
}
