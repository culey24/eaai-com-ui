import {
  Sparkles, Save, RefreshCw, Check,
  ChevronLeft, ChevronRight,
  MessageSquare,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export default function SurveyGrader({
  activeTab,
  surveyItems,
  surveyIndex,
  onNavigate,
  scores,
  pretestQScores,
  posttestQScores,
  onQuestionScoreChange,
  onAutoGradeMCQ,
  onSave,
  saving,
  comments,
  onCommentChange,
}) {
  const { t } = useLanguage()
  const activeItem = surveyItems[surveyIndex] || surveyItems[0]
  const currentQScores = activeTab === 'pretest' ? pretestQScores : posttestQScores
  const surveyType = activeTab === 'pretest'
    ? t('supporter.workspace.surveyTypePretest')
    : t('supporter.workspace.surveyTypePosttest')

  return (
    <div className="space-y-6">
      <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="px-3.5 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-200 border border-white/10">
            {t('supporter.survey.scoreBanner', { type: surveyType })}
          </span>
          <h3 className="text-xl font-extrabold text-white">
            {t('supporter.survey.scoreTotal', {
              score: scores[activeTab] ?? 0,
            })}
          </h3>
          <p className="text-xs text-indigo-200 max-w-md leading-relaxed">
            {t('supporter.survey.scoreDesc')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-center md:justify-end w-full md:w-auto">
          <button
            onClick={() => onAutoGradeMCQ(activeTab)}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2 hover:scale-105"
            title={t('supporter.survey.autoGrade')}
          >
            <Sparkles className="w-4 h-4 text-slate-950 flex-shrink-0" />
            <span>{t('supporter.survey.autoGrade')}</span>
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-6 py-3 bg-white hover:bg-slate-100 text-indigo-950 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 hover:scale-105 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{t('supporter.survey.saveButton')}</span>
          </button>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 block">
          {t('supporter.survey.commentLabel', { type: surveyType })}
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <textarea
            rows={2}
            value={comments[activeTab] || ''}
            onChange={(e) => onCommentChange(activeTab, e.target.value)}
            placeholder={t('supporter.survey.commentPlaceholder')}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none font-sans"
          />
        </div>
      </div>

      <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold text-xs rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-800/80">
            {activeItem.sectionTitle}
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {t('supporter.survey.questionOf', {
              index: activeItem.index,
              total: surveyItems.filter((i) => i.section === activeItem.section).length,
            })}
          </div>
        </div>

        {activeItem.bloom && (
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            {t('supporter.survey.bloomLevel', {
              en: activeItem.bloom.en,
              vi: activeItem.bloom.vi,
            })}
          </div>
        )}

        <div className="space-y-2">
          <div className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
            {activeItem.questionVi || activeItem.questionEn}
          </div>
          {activeItem.questionEn && activeItem.questionVi && activeItem.questionEn !== activeItem.questionVi && (
            <div className="text-sm text-slate-500 dark:text-slate-400 italic">
              {activeItem.questionEn}
            </div>
          )}
        </div>

        {activeItem.type === 'mcq' && activeItem.choices ? (
          <div className="space-y-3 pt-2">
            {activeItem.choices.map((ch) => {
              const isSelected = activeItem.answer === ch.key
              const isCorrect = activeItem.correctAnswer === ch.key
              return (
                <div
                  key={ch.key}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-sm'
                      : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {ch.key}
                  </div>
                  <div className="flex-1 text-sm space-y-1">
                    <div className={`font-semibold ${isSelected ? 'text-indigo-950 dark:text-indigo-200 font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                      {ch.vi || ch.en}
                    </div>
                    {ch.en && ch.vi && ch.en !== ch.vi && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 italic">{ch.en}</div>
                    )}
                  </div>
                  {isSelected && (
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-full flex-shrink-0 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> {t('supporter.survey.studentChose')}
                    </span>
                  )}
                  {isCorrect && (
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-full flex-shrink-0">
                      {t('supporter.survey.correctAnswer')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ) : activeItem.type === 'likert' || activeItem.type === 'info' ? (
          <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-1.5">
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {t('supporter.survey.studentAnswer')}
            </div>
            <div className="text-base font-bold text-indigo-950 dark:text-indigo-100">
              {activeItem.answer}
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {activeItem.hintVi || activeItem.hintEn ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl text-xs space-y-1">
                <div className="font-bold uppercase">{t('supporter.survey.hint')}</div>
                <div>{activeItem.hintVi || activeItem.hintEn}</div>
              </div>
            ) : null}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl whitespace-pre-wrap font-mono text-sm text-slate-800 dark:text-slate-200 min-h-32 leading-relaxed">
              {activeItem.answer && activeItem.answer !== 'Không trả lời' ? (
                activeItem.answer
              ) : (
                <span className="italic text-slate-400">{t('supporter.survey.noAnswer')}</span>
              )}
            </div>
          </div>
        )}

        {activeItem.section.startsWith('B') && (
          <div className="mt-6 p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md shadow-indigo-500/20">
                ✨
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-indigo-800 dark:text-indigo-200 uppercase tracking-wider">
                  {t('supporter.survey.scoreLabel')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate font-sans">
                  {activeItem.type === 'mcq'
                    ? activeItem.answer === activeItem.correctAnswer
                      ? `✅ ${t('supporter.survey.mcqCorrect')}`
                      : `❌ ${t('supporter.survey.mcqIncorrect')}`
                    : `✍️ ${t('supporter.survey.freeText')}`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: t('supporter.survey.score0'), value: 0, activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/30' },
                { label: t('supporter.survey.score025'), value: 0.25, activeClass: 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/30 font-extrabold' },
                { label: t('supporter.survey.score05'), value: 0.5, activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30' },
              ].map((opt) => {
                const currentQScore = currentQScores[activeItem.id] ?? 0
                const isSelected = currentQScore === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => onQuestionScoreChange(activeTab, activeItem.id, opt.value)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? `${opt.activeClass} scale-105`
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <button
            onClick={() => onNavigate(Math.max(0, surveyIndex - 1))}
            disabled={surveyIndex === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-all disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('supporter.survey.prev')}</span>
          </button>

          <div className="text-xs font-bold text-slate-400 font-mono">
            {surveyIndex + 1} / {surveyItems.length}
          </div>

          <button
            onClick={() => onNavigate(Math.min(surveyItems.length - 1, surveyIndex + 1))}
            disabled={surveyIndex === surveyItems.length - 1}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-40"
          >
            <span>{t('supporter.survey.next')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
