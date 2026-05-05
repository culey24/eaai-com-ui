import { useState, useMemo, useCallback, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import { POSTTEST_TOPICS } from '../../data/posttest/posttestTopics'
import { SECTION_C_ITEMS } from '../../data/posttest/sectionCItems'
import { getSectionBQuestions } from '../../data/posttest/sectionB'

const EMPTY_A = {
  yearOfStudy: '',
  gender: '',
  studentStatus: '',
  selfLearningScale: '',
  topicFirst: '',
  topicSecond: '',
  studiedTopic1: '',
  studiedTopic2: '',
  familiarityTopic1Scale: '',
  familiarityTopic2Scale: '',
  usedGenAi: '',
  aiLearningFrequency: '',
  aiToolPrimary: '',
  aiStudyPurpose: '',
  attendedAiTraining: '',
}

function emptySectionC() {
  return Object.fromEntries(SECTION_C_ITEMS.map((_, i) => [`c${i + 1}`, '']))
}

function emptyBlock10() {
  return Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`q${i + 1}`, '']))
}

function FieldLabel({ en, vi }) {
  return (
    <div className="mb-1">
      <span className="font-medium text-slate-900 dark:text-white">{en}</span>
      {vi ? <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{vi}</p> : null}
    </div>
  )
}

function CheckboxChoiceGroup({ value, onChange, options, disabled }) {
  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-600 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/80"
        >
          <input
            type="checkbox"
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-2 border-slate-400 dark:border-slate-500 accent-primary"
          />
          <span className="text-slate-900 dark:text-white text-sm leading-snug">{opt.label}</span>
        </label>
      ))}
    </div>
  )
}

export default function PosttestModal({ onComplete, onCancel }) {
  const { t, lang } = useLanguage()
  const { apiToken, user } = useAuth()
  const [step, setStep] = useState(0)
  const [sectionA, setSectionA] = useState(EMPTY_A)
  const [sectionB, setSectionB] = useState({})
  const [sectionC, setSectionC] = useState(emptySectionC)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  // Auto-fill Section A if user already did pretest (mock/simple)
  useEffect(() => {
    if (apiToken) {
      fetch(`${API_BASE}/api/me/pretest`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.sectionA) {
            setSectionA((prev) => ({
              ...prev,
              ...data.sectionA,
              // Keep topics empty to force selection? Or pre-fill if same?
              // Let's pre-fill but user can change.
            }))
          }
        })
        .catch(() => {})
    }
  }, [apiToken])

  const t1 = sectionA.topicFirst
  const t2 = sectionA.topicSecond
  const qs1 = useMemo(() => (t1 ? getSectionBQuestions(t1) : []), [t1])
  const qs2 = useMemo(() => (t2 ? getSectionBQuestions(t2) : []), [t2])

  const topicTitle = (id) => {
    const x = POSTTEST_TOPICS.find((p) => p.id === id)
    if (!x) return id
    return lang === 'vi' ? x.title.vi : x.title.en
  }

  const setA = (k, v) => setSectionA((p) => ({ ...p, [k]: v }))

  const ensureB = useCallback(
    (a) => {
      const u1 = a.topicFirst
      const u2 = a.topicSecond
      if (!u1 || !u2 || u1 === u2) return
      setSectionB((prev) => ({
        ...prev,
        [u1]: prev[u1] || emptyBlock10(),
        [u2]: prev[u2] || emptyBlock10(),
      }))
    },
    [setSectionB]
  )

  const validateA = () => {
    for (const k of Object.keys(EMPTY_A)) {
      if (!String(sectionA[k] ?? '').trim()) return false
    }
    if (sectionA.topicFirst === sectionA.topicSecond) return false
    return true
  }

  const validateBlock = (topicId, qs) => {
    const b = sectionB[topicId]
    if (!b) return false
    for (let i = 1; i <= 10; i++) {
      if (!String(b[`q${i}`] ?? '').trim()) return false
    }
    return qs.length === 10
  }

  const validateC = () => {
    for (let i = 1; i <= 10; i++) {
      const v = Number(sectionC[`c${i}`])
      if (!Number.isInteger(v) || v < 1 || v > 5) return false
    }
    return true
  }

  const next = () => {
    setError('')
    if (step === 0) {
      setStep(1)
      return
    }
    if (step === 1) {
      if (!validateA()) {
        setError(t('pretest.validation.sectionA') || 'Vui lòng hoàn thành Phần A')
        return
      }
      ensureB(sectionA)
      setStep(2)
      return
    }
    if (step === 2) {
      if (!validateBlock(t1, qs1)) {
        setError(t('pretest.validation.sectionB') || 'Vui lòng hoàn thành Phần B (Topic 1)')
        return
      }
      setStep(3)
      return
    }
    if (step === 3) {
      if (!validateBlock(t2, qs2)) {
        setError(t('pretest.validation.sectionB') || 'Vui lòng hoàn thành Phần B (Topic 2)')
        return
      }
      setStep(4)
    }
  }

  const back = () => {
    setError('')
    setStep((s) => Math.max(0, s - 1))
  }

  const submit = async () => {
    setError('')
    if (!validateC()) {
      setError(t('pretest.validation.sectionC') || 'Vui lòng hoàn thành Phần C')
      return
    }
    const sectionCNumeric = Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [`c${i + 1}`, Number(sectionC[`c${i + 1}`])])
    )
    const body = {
      sectionA,
      sectionB: {
        [t1]: sectionB[t1],
        [t2]: sectionB[t2],
      },
      sectionC: sectionCNumeric,
    }
    setSending(true)
    try {
      const res = await fetch(`${API_BASE}/api/me/posttest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.detail || data.error || 'Lỗi khi nộp bài')
        return
      }
      if (onComplete) onComplete()
    } catch {
      setError('Lỗi khi nộp bài')
    } finally {
      setSending(false)
    }
  }

  const renderSectionA = () => (
    <div className="space-y-5 max-w-3xl">
      <section>
        <h3 className="text-lg font-semibold text-primary mb-3">Section A: Demographics & Topics</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Please provide your background info and choose 2 topics you want to be assessed on.</p>
      </section>

      <div>
        <FieldLabel en="1. What is your current year of study?" vi="1. Bạn đang học năm thứ mấy?" />
        <CheckboxChoiceGroup
          value={sectionA.yearOfStudy}
          onChange={(v) => setA('yearOfStudy', v)}
          options={[
            { value: '2nd year', label: '2nd year / Năm 2' },
            { value: '3rd year', label: '3rd year / Năm 3' },
            { value: '4th year', label: '4th year / Năm 4' },
            { value: 'Postgraduate', label: 'Postgraduate / Sau đại học' },
          ]}
        />
      </div>

      <div>
        <FieldLabel en="2. Gender" vi="2. Giới tính" />
        <CheckboxChoiceGroup
          value={sectionA.gender}
          onChange={(v) => setA('gender', v)}
          options={[
            { value: 'Male', label: 'Male / Nam' },
            { value: 'Female', label: 'Female / Nữ' },
            { value: 'Other', label: 'Other / Khác' },
            { value: 'Prefer not to say', label: 'Prefer not to say / Không trả lời' },
          ]}
        />
      </div>

      <div>
        <FieldLabel en="3. Current status" vi="3. Tình trạng hiện tại" />
        <CheckboxChoiceGroup
          value={sectionA.studentStatus}
          onChange={(v) => setA('studentStatus', v)}
          options={[
            { value: 'Full-time student', label: 'Full-time student / Sinh viên chính quy' },
            { value: 'Working student', label: 'Working student / Vừa học vừa làm' },
          ]}
        />
      </div>

      <div>
        <FieldLabel en="4. Self-learning ability (1–5)" vi="4. Khả năng tự học (1–5)" />
        <CheckboxChoiceGroup
          value={sectionA.selfLearningScale}
          onChange={(v) => setA('selfLearningScale', v)}
          options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
        />
      </div>

      <div>
        <FieldLabel en="5. First topic for knowledge assessment" vi="5. Chủ đề thứ nhất để đánh giá kiến thức" />
        <CheckboxChoiceGroup
          value={sectionA.topicFirst}
          onChange={(v) => {
            setSectionA((p) => ({
              ...p,
              topicFirst: v,
              topicSecond: p.topicSecond === v ? '' : p.topicSecond,
            }))
          }}
          options={POSTTEST_TOPICS.map((x) => ({
            value: x.id,
            label: lang === 'vi' ? x.title.vi : x.title.en,
          }))}
        />
      </div>

      <div>
        <FieldLabel en="6. Second topic for knowledge assessment" vi="6. Chủ đề thứ hai để đánh giá kiến thức" />
        <CheckboxChoiceGroup
          value={sectionA.topicSecond}
          onChange={(v) => setA('topicSecond', v)}
          disabled={!sectionA.topicFirst}
          options={POSTTEST_TOPICS.filter((x) => x.id !== sectionA.topicFirst).map((x) => ({
            value: x.id,
            label: lang === 'vi' ? x.title.vi : x.title.en,
          }))}
        />
      </div>

      <div>
        <FieldLabel en="7. Have you studied Topic 1 before?" vi="7. Bạn đã từng học Chủ đề 1 chưa?" />
        <CheckboxChoiceGroup
          value={sectionA.studiedTopic1}
          onChange={(v) => setA('studiedTopic1', v)}
          options={[
            { value: 'Never', label: 'Never / Chưa bao giờ' },
            { value: 'Self-taught', label: 'Self-taught / Tự học' },
            { value: 'University course', label: 'University course / Khóa đại học' },
            { value: 'Online course', label: 'Online course / Khóa trực tuyến' },
          ]}
        />
      </div>

      <div>
        <FieldLabel en="8. Have you studied Topic 2 before?" vi="8. Bạn đã từng học Chủ đề 2 chưa?" />
        <CheckboxChoiceGroup
          value={sectionA.studiedTopic2}
          onChange={(v) => setA('studiedTopic2', v)}
          options={[
            { value: 'Never', label: 'Never / Chưa bao giờ' },
            { value: 'Self-taught', label: 'Self-taught / Tự học' },
            { value: 'University course', label: 'University course / Khóa đại học' },
            { value: 'Online course', label: 'Online course / Khóa trực tuyến' },
          ]}
        />
      </div>

      <div>
        <FieldLabel en="9. Familiarity with Topic 1 (1–5)" vi="9. Mức quen thuộc với Chủ đề 1 (1–5)" />
        <CheckboxChoiceGroup
          value={sectionA.familiarityTopic1Scale}
          onChange={(v) => setA('familiarityTopic1Scale', v)}
          options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
        />
      </div>

      <div>
        <FieldLabel en="10. Familiarity with Topic 2 (1–5)" vi="10. Mức quen thuộc với Chủ đề 2 (1–5)" />
        <CheckboxChoiceGroup
          value={sectionA.familiarityTopic2Scale}
          onChange={(v) => setA('familiarityTopic2Scale', v)}
          options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
        />
      </div>

      <div>
        <FieldLabel en="11. Have you used GenAI tools (e.g. ChatGPT, Gemini) for learning?" vi="11. Bạn đã dùng công cụ GenAI (ChatGPT, Gemini…) để học chưa?" />
        <CheckboxChoiceGroup
          value={sectionA.usedGenAi}
          onChange={(v) => setA('usedGenAi', v)}
          options={[
            { value: 'Yes', label: 'Yes / Có' },
            { value: 'No', label: 'No / Không' },
          ]}
        />
      </div>

      <div>
        <FieldLabel en="12. How often do you use AI for learning?" vi="12. Bạn dùng AI cho học tập với tần suất nào?" />
        <CheckboxChoiceGroup
          value={sectionA.aiLearningFrequency}
          onChange={(v) => setA('aiLearningFrequency', v)}
          options={[
            { value: 'Daily', label: 'Daily / Hàng ngày' },
            { value: 'Several times a week', label: 'Several times a week / Vài lần/tuần' },
            { value: 'Rarely', label: 'Rarely / Hiếm' },
            { value: 'Never', label: 'Never / Không bao giờ' },
          ]}
        />
      </div>

      <div>
        <FieldLabel en="13. AI tool you use most" vi="13. Công cụ AI bạn dùng nhiều nhất" />
        <CheckboxChoiceGroup
          value={sectionA.aiToolPrimary}
          onChange={(v) => setA('aiToolPrimary', v)}
          options={[
            { value: 'None', label: 'None / Không dùng' },
            { value: 'ChatGPT', label: 'ChatGPT' },
            { value: 'Gemini', label: 'Gemini' },
            { value: 'Copilot', label: 'Copilot' },
            { value: 'Claude', label: 'Claude' },
            { value: 'Other', label: 'Other / Khác' },
          ]}
        />
      </div>

      <div>
        <FieldLabel en="14. Primary purpose of using AI in your studies" vi="14. Mục đích chính khi dùng AI trong học tập" />
        <textarea
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 min-h-[80px]"
          value={sectionA.aiStudyPurpose}
          onChange={(e) => setA('aiStudyPurpose', e.target.value)}
          placeholder="e.g. solving exercises, explaining concepts…"
        />
      </div>

      <div>
        <FieldLabel en="15. Attended a course or workshop on using AI effectively?" vi="15. Đã tham gia khóa học/workshop về sử dụng AI hiệu quả?" />
        <CheckboxChoiceGroup
          value={sectionA.attendedAiTraining}
          onChange={(v) => setA('attendedAiTraining', v)}
          options={[
            { value: 'Yes', label: 'Yes / Có' },
            { value: 'No', label: 'No / Không' },
          ]}
        />
      </div>
    </div>
  )

  const renderSectionB = (topicId, qs) => (
    <div className="space-y-8 max-w-3xl">
      <h3 className="text-lg font-semibold text-primary">Section B: {topicTitle(topicId)}</h3>
      {qs.map((q, idx) => {
        const qn = `q${idx + 1}`
        const val = sectionB[topicId]?.[qn] ?? ''
        const setVal = (v) => {
          setSectionB((prev) => ({
            ...prev,
            [topicId]: { ...prev[topicId], [qn]: v },
          }))
        }
        return (
          <div key={qn} className="border-b border-slate-100 dark:border-slate-800 pb-6">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{q.bloom.en} · {q.bloom.vi}</p>
            <FieldLabel en={q.prompt.en} vi={q.prompt.vi} />
            <div className="mt-2 space-y-2">
              {q.choices.map((ch) => (
                <label
                  key={ch.key}
                  className="flex items-start gap-2 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-600 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                >
                  <input
                    type="checkbox"
                    checked={val === ch.key}
                    onChange={() => setVal(ch.key)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-2 border-slate-400 dark:border-slate-500 accent-primary"
                  />
                  <span>
                    <span className="font-mono font-semibold">{ch.key}.</span> <span className="text-slate-900 dark:text-white">{ch.en}</span>
                    {ch.vi && ch.vi !== ch.en ? <span className="block text-sm text-slate-600 dark:text-slate-400">{ch.vi}</span> : null}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderSectionC = () => (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-semibold text-primary mb-1">Section C: Attitudes & Reflection</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Please rate your agreement (1: Strongly Disagree, 5: Strongly Agree)</p>
      </div>
      {SECTION_C_ITEMS.map((item, idx) => {
        const key = `c${idx + 1}`
        return (
          <div key={key}>
            <FieldLabel en={`${idx + 1}. ${item.en}`} vi={item.vi} />
            <CheckboxChoiceGroup
              value={sectionC[key]}
              onChange={(v) => setSectionC((p) => ({ ...p, [key]: v }))}
              options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
            />
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      <header className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Post-course Survey (Post-test)</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Please complete this survey to finalize your submission.</p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">&times;</button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

        {step === 0 && (
          <div className="max-w-2xl space-y-4">
            <p className="text-lg text-slate-800 dark:text-slate-200">Welcome to the Post-test assessment.</p>
            <p className="text-slate-600 dark:text-slate-400">This survey evaluates your knowledge gain and attitudes after completing the course. Your responses are valuable for our research.</p>
            <button onClick={() => setStep(1)} className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-medium">Start Survey</button>
          </div>
        )}
        {step === 1 && renderSectionA()}
        {step === 2 && t1 && renderSectionB(t1, qs1)}
        {step === 3 && t2 && renderSectionB(t2, qs2)}
        {step === 4 && renderSectionC()}
      </div>

      <footer className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
        <span className="text-sm text-slate-500">Step {step + 1} / 5</span>
        <div className="flex gap-3">
          {step > 1 && <button onClick={back} className="px-4 py-2 border rounded-xl">Back</button>}
          {step > 0 && step < 4 && <button onClick={next} className="px-6 py-2 bg-primary text-white rounded-xl">Next</button>}
          {step === 4 && (
            <button onClick={submit} disabled={sending} className="px-6 py-2 bg-primary text-white rounded-xl disabled:opacity-50">
              {sending ? 'Submitting...' : 'Submit Post-test'}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
