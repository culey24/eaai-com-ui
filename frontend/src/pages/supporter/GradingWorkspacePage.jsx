import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeft, Save, CheckCircle2, AlertCircle,
  RefreshCw, Cloud, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { API_BASE } from '../../config/api'
import { TABS, computeTotalScore, buildSurveyItems } from '../../lib/surveyUtils'
import FilePreviewer from '../../components/supporter/FilePreviewer'
import SubmissionGradingBox from '../../components/supporter/SubmissionGradingBox'
import SurveyGrader from '../../components/supporter/SurveyGrader'
import SurveyNavigator from '../../components/supporter/SurveyNavigator'
import GradingSidebar from '../../components/supporter/GradingSidebar'
import useAutoSave from '../../hooks/useAutoSave'
import useUnsavedWarning from '../../hooks/useUnsavedWarning'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'

export default function GradingWorkspacePage() {
  const { learnerId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { apiToken } = useAuth()
  const { t } = useLanguage()

  const learnerIds = location.state?.learnerIds || []
  const currentIdx = learnerIds.indexOf(learnerId)
  const prevLearnerId = currentIdx > 0 ? learnerIds[currentIdx - 1] : null
  const nextLearnerId = currentIdx < learnerIds.length - 1 ? learnerIds[currentIdx + 1] : null

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('sub1')
  const [surveyIndex, setSurveyIndex] = useState(0)
  const [initialized, setInitialized] = useState(false)

  const [learner, setLearner] = useState(null)
  const [submissions, setSubmissions] = useState({})
  const [pretest, setPretest] = useState(null)
  const [posttest, setPosttest] = useState(null)
  const [gradingInfo, setGradingInfo] = useState(null)
  const [config, setConfig] = useState(null)

  const [scores, setScores] = useState({})
  const [comments, setComments] = useState({})
  const [pretestQScores, setPretestQScores] = useState({})
  const [posttestQScores, setPosttestQScores] = useState({})

  useEffect(() => {
    if (!apiToken || !learnerId) return
    setLoading(true)
    fetch(`${API_BASE}/api/grading/learner/${encodeURIComponent(learnerId)}`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.learner) {
          setLearner(data.learner)
          setSubmissions(data.submissions || {})
          setPretest(data.pretest || null)
          setPosttest(data.posttest || null)
          setConfig(data.config || null)

          const initScores = data.grading?.scores || {}
          const initComments = data.grading?.comments || {}

          const newScores = { ...initScores }
          ;['sub1', 'sub2', 'sub3', 'sub4', 'final'].forEach((key) => {
            if (!data.submissions?.[key] && newScores[key] === undefined) {
              newScores[key] = 0
            }
          })

          setScores(newScores)
          setComments(initComments)
          setPretestQScores(initScores.pretest_q || {})
          setPosttestQScores(initScores.posttest_q || {})
          setGradingInfo(data.grading || null)
        }
      })
      .catch((err) => console.error('[Fetch workspace err]', err))
      .finally(() => {
        setLoading(false)
        setInitialized(true)
      })
  }, [apiToken, learnerId])

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId)
    setSurveyIndex(0)
  }, [])

  const handleScoreChange = useCallback((key, value) => {
    setScores((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleCommentChange = useCallback((key, value) => {
    setComments((prev) => ({ ...prev, [key]: value }))
  }, [])

  const adjustScore = useCallback((key, delta) => {
    setScores((prev) => {
      const current = parseFloat(prev[key]) || 0
      let next = parseFloat((current + delta).toFixed(2))
      if (next < 0) next = 0
      if (next > 10) next = 10
      return { ...prev, [key]: next }
    })
  }, [])

  const totalScore = useMemo(() => computeTotalScore(scores), [scores])

  const surveyItems = useMemo(
    () => buildSurveyItems({ activeTab, pretest, posttest }),
    [activeTab, pretest, posttest]
  )

  const gradedCount = useMemo(() => {
    return TABS.filter((t) => {
      const s = parseFloat(scores[t.id])
      return !isNaN(s) && s > 0
    }).length
  }, [scores])

  const isDirty = useMemo(() => {
    if (!initialized) return false
    return Object.values(scores).some((s) => parseFloat(s) > 0) ||
           Object.values(comments).some((c) => c && c.trim().length > 0) ||
           Object.values(pretestQScores).some((s) => s > 0) ||
           Object.values(posttestQScores).some((s) => s > 0)
  }, [initialized, scores, comments, pretestQScores, posttestQScores])

  const autoSaveData = useMemo(() => ({
    scores, comments, pretestQScores, posttestQScores, totalScore,
  }), [scores, comments, pretestQScores, posttestQScores, totalScore])

  const handleAutoSave = useCallback(async () => {
    if (!apiToken || !learnerId || !isDirty) return
    setSaving(true)
    setMessage(null)
    try {
      const fullScores = {
        ...scores,
        pretest_q: pretestQScores,
        posttest_q: posttestQScores,
      }
      const payload = { scores: fullScores, comments, totalScore }
      const res = await fetch(`${API_BASE}/api/grading/learner/${encodeURIComponent(learnerId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setGradingInfo(data.grading)
      }
    } catch (err) {
      console.error('[Auto-save error]', err)
    } finally {
      setSaving(false)
    }
  }, [apiToken, learnerId, scores, comments, totalScore, pretestQScores, posttestQScores, isDirty])

  const { isSaving: autoSaving, lastSaved } = useAutoSave(
    autoSaveData,
    handleAutoSave,
    8000
  )

  useUnsavedWarning(initialized && isDirty)

  useKeyboardShortcut({ key: 's', ctrl: true }, (e) => {
    e.preventDefault()
    handleSave()
  })

  useKeyboardShortcut({ key: 'ArrowLeft' }, () => {
    if (activeTab === 'pretest' || activeTab === 'posttest') {
      setSurveyIndex((prev) => Math.max(0, prev - 1))
    }
  })

  useKeyboardShortcut({ key: 'ArrowRight' }, () => {
    if ((activeTab === 'pretest' || activeTab === 'posttest') && surveyItems.length > 0) {
      setSurveyIndex((prev) => Math.min(surveyItems.length - 1, prev + 1))
    }
  })

  const handleSave = useCallback(async () => {
    if (!apiToken || !learnerId) return
    setSaving(true)
    setMessage(null)
    try {
      const fullScores = {
        ...scores,
        pretest_q: pretestQScores,
        posttest_q: posttestQScores,
      }
      const payload = { scores: fullScores, comments, totalScore }

      const res = await fetch(`${API_BASE}/api/grading/learner/${encodeURIComponent(learnerId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setGradingInfo(data.grading)
        setMessage({ type: 'success', text: t('supporter.workspace.saveSuccess') })
        setTimeout(() => setMessage(null), 4000)
      } else {
        setMessage({ type: 'error', text: data.error || t('supporter.workspace.saveError') })
      }
    } catch (err) {
      console.error('[handleSave error]', err)
      setMessage({ type: 'error', text: t('supporter.workspace.connectionError') })
    } finally {
      setSaving(false)
    }
  }, [apiToken, learnerId, scores, comments, totalScore, pretestQScores, posttestQScores, t])

  const handleQuestionScoreChange = useCallback((tabId, qId, scoreVal) => {
    const isPre = tabId === 'pretest'
    const setter = isPre ? setPretestQScores : setPosttestQScores

    setter((prev) => {
      const nextQ = { ...prev, [qId]: parseFloat(scoreVal) || 0 }
      let sum = 0
      Object.entries(nextQ).forEach(([k, v]) => {
        if (k.startsWith('B')) sum += v
      })
      const totalSurveyScore = parseFloat(Math.min(10, sum).toFixed(2))
      setScores((s) => ({ ...s, [tabId]: totalSurveyScore }))
      return nextQ
    })
  }, [])

  const autoGradeMCQ = useCallback((tabId) => {
    const isPre = tabId === 'pretest'
    const setter = isPre ? setPretestQScores : setPosttestQScores

    setter((prev) => {
      const nextQ = { ...prev }
      let sum = 0
      surveyItems.forEach((item) => {
        if (item.section.startsWith('B') && item.type === 'mcq') {
          const isCorrect =
            item.answer === item.correctAnswer &&
            item.answer !== 'Không trả lời' &&
            item.answer !== 'Chưa chọn' &&
            item.answer !== ''
          const pts = isCorrect ? 0.5 : 0
          nextQ[item.id] = pts
        }
      })
      Object.entries(nextQ).forEach(([k, v]) => {
        if (k.startsWith('B')) sum += v
      })
      const totalSurveyScore = parseFloat(Math.min(10, sum).toFixed(2))
      setScores((s) => ({ ...s, [tabId]: totalSurveyScore }))
      return nextQ
    })

    setMessage({
      type: 'success',
      text: t('supporter.workspace.addedScore', {
        type: tabId === 'pretest'
          ? t('supporter.workspace.surveyTypePretest')
          : t('supporter.workspace.surveyTypePosttest'),
      }),
    })
    setTimeout(() => setMessage(null), 3000)
  }, [surveyItems, t])

  const renderViewerContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      )
    }

    if (activeTab.startsWith('sub') || activeTab === 'final') {
      const sub = submissions[activeTab]

      if (!sub) {
        return (
          <div className="flex flex-col items-center justify-center h-96 text-center p-8 space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-full">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {t('supporter.workspace.noSubmission')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                {t('supporter.workspace.noSubmissionHint')}
              </p>
            </div>
            <SubmissionGradingBox
              activeTab={activeTab}
              score={scores[activeTab] ?? 0}
              comment={comments[activeTab] || ''}
              onScoreChange={handleScoreChange}
              onCommentChange={handleCommentChange}
              onAdjustScore={adjustScore}
              onSave={handleSave}
              saving={saving}
              minWordLimit={config?.minWordLimit}
              noSubmission
            />
          </div>
        )
      }

      return (
        <div className="space-y-6">
          <FilePreviewer
            learnerId={learnerId}
            submission={sub}
            apiToken={apiToken}
            activeTab={activeTab}
          />
          <SubmissionGradingBox
            activeTab={activeTab}
            score={scores[activeTab] ?? 0}
            comment={comments[activeTab] || ''}
            onScoreChange={handleScoreChange}
            onCommentChange={handleCommentChange}
            onAdjustScore={adjustScore}
            onSave={handleSave}
            saving={saving}
            minWordLimit={config?.minWordLimit}
          />
        </div>
      )
    }

    if (activeTab === 'pretest' || activeTab === 'posttest') {
      const s = activeTab === 'pretest' ? pretest : posttest
      const surveyType = activeTab === 'pretest'
        ? t('supporter.workspace.surveyTypePretest')
        : t('supporter.workspace.surveyTypePosttest')

      if (!s || surveyItems.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-96 text-center p-8 space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-full">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {t('supporter.workspace.noSurvey')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                {t('supporter.workspace.noSurveyHint', { type: surveyType })}
              </p>
            </div>
          </div>
        )
      }

      return (
        <div className="space-y-6">
          <SurveyNavigator
            surveyItems={surveyItems}
            surveyIndex={surveyIndex}
            onNavigate={setSurveyIndex}
            scores={activeTab === 'pretest' ? pretestQScores : posttestQScores}
          />
          <SurveyGrader
            activeTab={activeTab}
            surveyItems={surveyItems}
            surveyIndex={surveyIndex}
            onNavigate={setSurveyIndex}
            scores={scores}
            pretestQScores={pretestQScores}
            posttestQScores={posttestQScores}
            onQuestionScoreChange={handleQuestionScoreChange}
            onAutoGradeMCQ={autoGradeMCQ}
            onSave={handleSave}
            saving={saving}
            comments={comments}
            onCommentChange={handleCommentChange}
          />
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/supporter/grading')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
              title={t('supporter.workspace.back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {learnerIds.length > 0 && (
              <>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                <button
                  onClick={() => navigate(`/supporter/grading/${prevLearnerId}`, { state: { learnerIds }, replace: true })}
                  disabled={!prevLearnerId}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none"
                  title={t('supporter.workspace.prevLearner')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-400 min-w-[3rem] text-center">
                  {currentIdx + 1}/{learnerIds.length}
                </span>
                <button
                  onClick={() => navigate(`/supporter/grading/${nextLearnerId}`, { state: { learnerIds }, replace: true })}
                  disabled={!nextLearnerId}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none"
                  title={t('supporter.workspace.nextLearner')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                {learner ? learner.fullname : t('supporter.workspace.loading')}
              </h1>
              {learner?.username && (
                <span className="text-xs px-2.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-full font-mono font-medium">
                  @{learner.username}
                </span>
              )}
            </div>
            {learner && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
                <span>
                  {t('supporter.workspace.class')}:{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{learner.userClass}</span>
                </span>
                {learner.studentSchoolId && (
                  <span>
                    {t('supporter.workspace.studentId')}:{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{learner.studentSchoolId}</span>
                  </span>
                )}
                {gradingInfo?.gradedAt && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('supporter.workspace.gradedAt', {
                      time: new Date(gradingInfo.gradedAt).toLocaleString(),
                    })}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {autoSaving && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-xl border border-blue-200 dark:border-blue-800 animate-pulse">
              <Cloud className="w-3.5 h-3.5" />
              <span>{t('supporter.workspace.autoSaving')}</span>
            </div>
          )}
          {lastSaved && !autoSaving && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('supporter.workspace.savedAt', { time: lastSaved.toLocaleTimeString() })}</span>
            </div>
          )}
          {message && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold animate-fade-in shadow-sm ${
                message.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{message.text}</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:from-primary/90 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 disabled:opacity-50 uppercase tracking-wider"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{t('supporter.workspace.saveButton')}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <div className="flex-1 lg:w-[70%] flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 min-h-0">
          <div className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 overflow-x-auto flex-shrink-0 scrollbar-none backdrop-blur-xl shadow-sm">
            {TABS.map((t) => {
              const hasSub = t.id.startsWith('sub') || t.id === 'final'
                ? !!submissions[t.id]
                : t.id === 'pretest' ? !!pretest : !!posttest
              const isScored = parseFloat(scores[t.id]) > 0

              return (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === t.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-105'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isScored
                        ? 'bg-emerald-500'
                        : hasSub
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                    }`}
                  />
                </button>
              )
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
              {renderViewerContent()}
            </div>
          </div>
        </div>

        <GradingSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSave={handleSave}
          saving={saving}
          loading={loading}
          totalScore={totalScore}
          submissions={submissions}
          pretest={pretest}
          posttest={posttest}
          scores={scores}
          comments={comments}
          gradedCount={gradedCount}
          totalItems={TABS.length}
        />
      </div>

    </div>
  )
}
