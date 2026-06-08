import { useMemo } from 'react'
import { Save, RefreshCw, Plus, Minus, AlertCircle } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { TABS } from '../../lib/surveyUtils'

export default function SubmissionGradingBox({
  activeTab,
  score,
  comment,
  onScoreChange,
  onCommentChange,
  onAdjustScore,
  onSave,
  saving,
  minWordLimit,
  noSubmission,
}) {
  const { t } = useLanguage()

  const wordCount = useMemo(() => {
    return (comment || '').trim().split(/\s+/).filter(Boolean).length
  }, [comment])

  const isSurvey = activeTab === 'pretest' || activeTab === 'posttest'
  const limit = minWordLimit ?? 100
  const meetsWordLimit = wordCount >= limit
  const tabLabel = TABS.find((t) => t.id === activeTab)?.label || activeTab

  return (
    <div className="mt-8 p-6 bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900/60 rounded-3xl shadow-xl space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg flex-shrink-0">
            📝
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {noSubmission
                ? t('supporter.gradingBox.defaultScore')
                : t('supporter.gradingBox.title', { tab: tabLabel })
              }
            </h3>
            {!noSubmission && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('supporter.gradingBox.desc')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => onAdjustScore(activeTab, -0.5)}
            className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all"
            title={t('supporter.gradingBox.decrease')}
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            min="0"
            max="10"
            step="0.25"
            value={score ?? ''}
            onChange={(e) => onScoreChange(activeTab, parseFloat(e.target.value) || 0)}
            className="w-20 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-center font-black text-lg text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <span className="text-sm font-bold text-slate-400">/ 10</span>
          <button
            onClick={() => onAdjustScore(activeTab, 0.5)}
            className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all"
            title={t('supporter.gradingBox.increase')}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
            {t('supporter.gradingBox.commentLabel')}
          </label>
          {!isSurvey && (
            <span className={`text-xs font-bold ${meetsWordLimit ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
              {t('supporter.gradingBox.wordCount', { count: wordCount, limit })}
            </span>
          )}
        </div>
        <textarea
          rows={3}
          value={comment || ''}
          onChange={(e) => onCommentChange(activeTab, e.target.value)}
          placeholder={noSubmission
            ? t('supporter.gradingBox.noSubmissionComment')
            : t('supporter.gradingBox.commentPlaceholder', { tab: tabLabel })
          }
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none leading-relaxed"
        />
        {!isSurvey && score > 0 && !meetsWordLimit && (
          <p className="text-xs text-amber-500 font-semibold mt-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {t('supporter.gradingBox.wordCountWarning', {
                limit,
                remaining: limit - wordCount,
              })}
            </span>
          </p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onSave}
          disabled={saving || (!isSurvey && score > 0 && !meetsWordLimit)}
          className="px-6 py-2.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{t('supporter.gradingBox.saveButton')}</span>
        </button>
      </div>
    </div>
  )
}
