import { useMemo, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'

export default function SurveyNavigator({ surveyItems, surveyIndex, onNavigate, scores }) {
  const { t } = useLanguage()
  const [filter, setFilter] = useState('all')

  const filteredItems = useMemo(() => {
    if (filter === 'ungraded') {
      return surveyItems.filter((item) => {
        const qScore = scores[item.id]
        return qScore === undefined || qScore === null || qScore === 0
      })
    }
    return surveyItems
  }, [surveyItems, filter, scores])

  return (
    <div className="p-4 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {t('supporter.navigator.title')}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t('supporter.navigator.filterAll')}
          </button>
          <button
            onClick={() => setFilter('ungraded')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              filter === 'ungraded'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t('supporter.navigator.filterUngraded')}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
        {(filter === 'ungraded' ? filteredItems : surveyItems).map((item) => {
          const realIdx = surveyItems.indexOf(item)
          const isActive = surveyIndex === realIdx
          const qScore = scores[item.id]
          const hasScore = qScore !== undefined && qScore !== null && qScore > 0
          const isAnswered = item.answer !== 'Không trả lời' && item.answer !== 'Chưa chọn' && item.answer !== 'Chưa trả lời'

          let badgeColor = 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
          if (isActive) {
            badgeColor = 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-500/30 scale-105 border-indigo-600'
          } else if (hasScore) {
            badgeColor = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700'
          } else if (isAnswered && !hasScore) {
            badgeColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(realIdx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${badgeColor}`}
              title={`${item.questionVi || item.questionEn}${hasScore ? ` (${qScore}đ)` : ''}`}
            >
              {item.section}-{item.index}{hasScore ? ' ✓' : ''}
            </button>
          )
        })}
      </div>
      {filter === 'ungraded' && filteredItems.length === 0 && (
        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold text-center py-1">
          ✅ {t('supporter.navigator.allGraded')}
        </div>
      )}
    </div>
  )
}
