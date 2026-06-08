import { Save, RefreshCw } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { TABS } from '../../lib/surveyUtils'

export default function GradingSidebar({
  activeTab,
  onTabChange,
  onSave,
  saving,
  loading,
  totalScore,
  submissions,
  pretest,
  posttest,
  scores,
  comments,
  gradedCount,
  totalItems,
}) {
  const { t } = useLanguage()

  return (
    <div className="w-full lg:w-[30%] flex flex-col bg-white dark:bg-slate-800 min-h-0 overflow-y-auto border-t lg:border-t-0 border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-2xl">
      <div className="p-6 space-y-6">
        <div className="pb-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
              {t('supporter.sidebar.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('supporter.sidebar.desc')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              {t('supporter.sidebar.totalScore')}
            </div>
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {totalScore} <span className="text-sm font-bold text-slate-400">/10</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-500">{t('supporter.sidebar.progress')}</span>
            <span className="font-bold text-indigo-600">{gradedCount}/{totalItems} {t('supporter.sidebar.items')}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${totalItems > 0 ? (gradedCount / totalItems) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {TABS.map((tab) => {
            const isCurrentTab = activeTab === tab.id
            const hasSub = tab.id.startsWith('sub') || tab.id === 'final'
              ? !!submissions[tab.id]
              : tab.id === 'pretest' ? !!pretest : !!posttest
            const sub = submissions[tab.id]
            const score = scores[tab.id] ?? 0
            const comment = comments[tab.id] || ''
            const isScored = score > 0

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  isCurrentTab
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    isScored
                      ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                      : hasSub
                        ? 'bg-amber-400 ring-4 ring-amber-400/20'
                        : 'bg-slate-300 dark:bg-slate-700'
                  }`} />
                  <div className="min-w-0">
                    <div className={`font-bold text-sm truncate ${isCurrentTab ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-800 dark:text-white'}`}>
                      {tab.label}
                      {!isScored && hasSub && (
                        <span className="ml-2 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] rounded font-bold">
                          {t('supporter.sidebar.needsGrading')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 truncate font-sans">
                      <span className="font-medium">
                        {isScored
                          ? `✅ ${t('supporter.sidebar.statusGraded')}`
                          : hasSub
                            ? (sub?.isLate && !sub?.isSupplementary
                              ? `⚠️ ${t('supporter.sidebar.statusLate')}`
                              : sub?.isSupplementary
                                ? `🔄 ${t('supporter.sidebar.statusSupplementary')}`
                                : `📄 ${t('supporter.sidebar.statusSubmitted')}`)
                            : `❌ ${t('supporter.sidebar.statusNoSubmission')}`}
                      </span>
                      {comment && <span className="text-slate-400 truncate italic">· "{comment}"</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 font-mono">
                  <span className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                    isScored
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {score} / 10
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={onSave}
            disabled={saving || loading}
            className="w-full py-4 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:from-primary/90 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 uppercase tracking-wider"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>💾 {t('supporter.sidebar.saveButton')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
