import { useState, useMemo, useCallback } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'
import { PRETEST_TOPICS } from '../../data/pretest/pretestTopics'
import { SECTION_C_ITEMS } from '../../data/pretest/sectionCItems'
import { getSectionBQuestions } from '../../data/pretest/sectionB'

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

export default function PretestModal() {
  const { t, lang } = useLanguage()
  const { apiToken, logout, refreshPretestStatus } = useAuth()
  const [step, setStep] = useState(0)
  const [sectionA, setSectionA] = useState(EMPTY_A)
  const [sectionB, setSectionB] = useState({})
  const [sectionC, setSectionC] = useState(emptySectionC)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const t1 = sectionA.topicFirst
  const t2 = sectionA.topicSecond
  const qs1 = useMemo(() => (t1 ? getSectionBQuestions(t1) : []), [t1])
  const qs2 = useMemo(() => (t2 ? getSectionBQuestions(t2) : []), [t2])

  const topicTitle = (id) => {
    const x = PRETEST_TOPICS.find((p) => p.id === id)
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
        [u1]: { ...emptyBlock10(), ...prev[u1] },
        [u2]: { ...emptyBlock10(), ...prev[u2] },
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
    for (let i = 1; i <= 15; i++) {
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
        setError(t('pretest.validation.sectionA'))
        return
      }
      ensureB(sectionA)
      setStep(2)
      return
    }
    if (step === 2) {
      if (!validateBlock(t1, qs1)) {
        setError(t('pretest.validation.sectionB'))
        return
      }
      setStep(3)
      return
    }
    if (step === 3) {
      if (!validateBlock(t2, qs2)) {
        setError(t('pretest.validation.sectionB'))
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
      setError(t('pretest.validation.sectionC'))
      return
    }
    const sectionCNumeric = Object.fromEntries(
      Array.from({ length: 15 }, (_, i) => [`c${i + 1}`, Number(sectionC[`c${i + 1}`])])
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
      const res = await fetch(`${API_BASE}/api/me/pretest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.detail || data.error || t('pretest.submitError'))
        return
      }
      await refreshPretestStatus()
    } catch {
      setError(t('pretest.submitError'))
    } finally {
      setSending(false)
    }
  }

  const topicOptions = (excludeId) =>
    PRETEST_TOPICS.filter((x) => x.id !== excludeId).map((x) => (
      <option key={x.id} value={x.id}>
        {lang === 'vi' ? x.title.vi : x.title.en}
      </option>
    ))

  const renderSectionA = () => (
    <div className="space-y-5 max-w-3xl">
      <section>
        <h3 className="text-lg font-semibold text-primary mb-3">{t('pretest.sectionA.title')}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t('pretest.sectionA.subtitleVi')}</p>
      </section>

      <div>
        <FieldLabel en="1. What is your current year of study?" vi="1. Bạn đang học năm thứ mấy?" />
        <select
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          value={sectionA.yearOfStudy}
          onChange={(e) => setA('yearOfStudy', e.target.value)}
        >
          <option value="">{t('pretest.select')}</option>
          <option value="2nd year">2nd year / Năm 2</option>
          <option value="3rd year">3rd year / Năm 3</option>
          <option value="4th year">4th year / Năm 4</option>
          <option value="Postgraduate">Postgraduate / Sau đại học</option>
        </select>
      </div>

      <div>
        <FieldLabel en="2. Gender" vi="2. Giới tính" />
        <select
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          value={sectionA.gender}
          onChange={(e) => setA('gender', e.target.value)}
        >
          <option value="">{t('pretest.select')}</option>
          <option value="Male">Male / Nam</option>
          <option value="Female">Female / Nữ</option>
          <option value="Other">Other / Khác</option>
          <option value="Prefer not to say">Prefer not to say / Không trả lời</option>
        </select>
      </div>

      <div>
        <FieldLabel en="3. Current status" vi="3. Tình trạng hiện tại" />
        <select
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          value={sectionA.studentStatus}
          onChange={(e) => setA('studentStatus', e.target.value)}
        >
          <option value="">{t('pretest.select')}</option>
          <option value="Full-time student">Full-time student / Sinh viên chính quy</option>
          <option value="Working student">Working student / Vừa học vừa làm</option>
        </select>
      </div>

      <div>
        <FieldLabel
          en="4. Self-learning ability (1–5)"
          vi="4. Khả năng tự học (1–5)"
        />
        <select
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          value={sectionA.selfLearningScale}
          onChange={(e) => setA('selfLearningScale', e.target.value)}
        >
          <option value="">{t('pretest.select')}</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={String(n)}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel
          en="5. First topic for knowledge assessment"
          vi="5. Chủ đề thứ nhất để đánh giá kiến thức"
        />
        <select
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          value={sectionA.topicFirst}
          onChange={(e) => {
            const v = e.target.value
            setA('topicFirst', v)
            if (sectionA.topicSecond === v) setA('topicSecond', '')
          }}
        >
          <option value="">{t('pretest.select')}</option>
          {PRETEST_TOPICS.map((x) => (
            <option key={x.id} value={x.id}>
              {lang === 'vi' ? x.title.vi : x.title.en}
            </option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel
          en="6. Second topic for knowledge assessment"
          vi="6. Chủ đề thứ hai để đánh giá kiến thức"
        />
        <select
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          value={sectionA.topicSecond}
          onChange={(e) => setA('topicSecond', e.target.value)}
          disabled={!sectionA.topicFirst}
        >
          <option value="">{t('pretest.select')}</option>
          {topicOptions(sectionA.topicFirst)}
        </select>
      </div>

      <div>
        <FieldLabel
          en="7. Have you studied Topic 1 before?"
          vi="7. Bạn đã từng học Chủ đề 1 chưa?"
        />
        <select
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          value={sectionA.studiedTopic1}
          onChange={(e) => setA('studiedTopic1', e.target.value)}
        >
          <option value="">{t('pretest.select')}</option>
          <option value="Never">Never / Chưa bao giờ</option>
          <option value="Self-taught">Self-taught / Tự học</option>
          <option value="University course">University course / Khóa đại học</option>
          <option value="Online course">Online course / Khóa trực tuyến</option>
        </select>
      </div>

      <div>
        <FieldLabel
          en="8. Have you studied Topic 2 before?"
          vi="8. Bạn đã từng học Chủ đề 2 chưa?"
        />
        <select
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          value={sectionA.studiedTopic2}
          onChange={(e) => setA('studiedTopic2', e.target.value)}
        >
          <option value="">{t('pretest.select')}</option>
          <option value="Never">Never / Chưa bao giờ</option>
          <option value="Self-taught">Self-taught / Tự học</option>
          <option value="University course">University course / Khóa đại học</option>
          <option value="Online course">Online course / Khóa trực tuyến</option>
        </select>
      </div>

      <div>
        <FieldLabel
          en="9. Familiarity with Topic 1 (1–5)"
          vi="9. Mức quen thuộc với Chủ đề 1 (1–5)"
        />
        <select
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          value={sectionA.familiarityTopic1Scale}
          onChange={(e) => setA('familiarityTopic1Scale', e.target.value)}
        >
          <option value="">{t('pretest.select')}</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={String(n)}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel
          en="10. Familiarity with Topic 2 (1–5)"
          vi="10. Mức quen thuộc với Chủ đề 2 (1–5)"
        />
        <select
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          value={sectionA.familiarityTopic2Scale}
          onChange={(e) => setA('familiarityTopic2Scale', e.target.value)}
        >
          <option value="">{t('pretest.select')}</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={String(n)}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel
          en="11. Have you used GenAI tools (e.g. ChatGPT, Gemini) for learning?"
          vi="11. Bạn đã dùng công cụ GenAI (ChatGPT, Gemini…) để học chưa?"
        />
        <select
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          value={sectionA.usedGenAi}
          onChange={(e) => setA('usedGenAi', e.target.value)}
        >
          <option value="">{t('pretest.select')}</option>
          <option value="Yes">Yes / Có</option>
          <option value="No">No / Không</option>
        </select>
      </div>

      <div>
        <FieldLabel
          en="12. How often do you use AI for learning?"
          vi="12. Bạn dùng AI cho học tập với tần suất nào?"
        />
        <select
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          value={sectionA.aiLearningFrequency}
          onChange={(e) => setA('aiLearningFrequency', e.target.value)}
        >
          <option value="">{t('pretest.select')}</option>
          <option value="Daily">Daily / Hàng ngày</option>
          <option value="Several times a week">Several times a week / Vài lần/tuần</option>
          <option value="Rarely">Rarely / Hiếm</option>
          <option value="Never">Never / Không bao giờ</option>
        </select>
      </div>

      <div>
        <FieldLabel
          en="13. AI tool you use most"
          vi="13. Công cụ AI bạn dùng nhiều nhất"
        />
        <select
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          value={sectionA.aiToolPrimary}
          onChange={(e) => setA('aiToolPrimary', e.target.value)}
        >
          <option value="">{t('pretest.select')}</option>
          <option value="None">None / Không dùng</option>
          <option value="ChatGPT">ChatGPT</option>
          <option value="Gemini">Gemini</option>
          <option value="Copilot">Copilot</option>
          <option value="Claude">Claude</option>
          <option value="Other">Other / Khác</option>
        </select>
      </div>

      <div>
        <FieldLabel
          en="14. Primary purpose of using AI in your studies (short text)"
          vi="14. Mục đích chính khi dùng AI trong học tập (trả lời ngắn — ưu tiên tiếng Anh)"
        />
        <textarea
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 min-h-[80px]"
          value={sectionA.aiStudyPurpose}
          onChange={(e) => setA('aiStudyPurpose', e.target.value)}
          placeholder="e.g. solving exercises, explaining concepts…"
        />
      </div>

      <div>
        <FieldLabel
          en="15. Attended a course or workshop on using AI effectively?"
          vi="15. Đã tham gia khóa học/workshop về sử dụng AI hiệu quả?"
        />
        <select
          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
          value={sectionA.attendedAiTraining}
          onChange={(e) => setA('attendedAiTraining', e.target.value)}
        >
          <option value="">{t('pretest.select')}</option>
          <option value="Yes">Yes / Có</option>
          <option value="No">No / Không</option>
        </select>
      </div>
    </div>
  )

  const renderSectionB = (topicId, qs) => (
    <div className="space-y-8 max-w-3xl">
      <h3 className="text-lg font-semibold text-primary">
        {t('pretest.sectionB.title')}: {topicTitle(topicId)}
      </h3>
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
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
              {q.bloom.en} · {q.bloom.vi}
            </p>
            <FieldLabel en={q.prompt.en} vi={q.prompt.vi} />
            {q.type === 'mcq' ? (
              <div className="mt-2 space-y-2">
                {q.choices.map((ch) => (
                  <label
                    key={ch.key}
                    className="flex items-start gap-2 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-600 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  >
                    <input
                      type="radio"
                      name={`${topicId}-${qn}`}
                      checked={val === ch.key}
                      onChange={() => setVal(ch.key)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-mono font-semibold">{ch.key}.</span>{' '}
                      <span className="text-slate-900 dark:text-white">{ch.en}</span>
                      {ch.vi && ch.vi !== ch.en ? (
                        <span className="block text-sm text-slate-600 dark:text-slate-400">{ch.vi}</span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-slate-500 mb-1">{q.hint.en}</p>
                {q.hint.vi ? <p className="text-sm text-slate-500 mb-2">{q.hint.vi}</p> : null}
                <textarea
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 min-h-[100px]"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  const renderSectionC = () => (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-semibold text-primary mb-1">{t('pretest.sectionC.title')}</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">{t('pretest.sectionC.instructions')}</p>
        <p className="text-slate-500 dark:text-slate-500 text-sm">{t('pretest.sectionC.instructionsVi')}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-400 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n}>
            {n}: {t(`pretest.likert.${n}`)}
          </span>
        ))}
      </div>
      {SECTION_C_ITEMS.map((item, idx) => {
        const key = `c${idx + 1}`
        return (
          <div key={key}>
            <FieldLabel en={`${idx + 1}. ${item.en}`} vi={item.vi} />
            <select
              className="mt-1 w-full max-w-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2"
              value={sectionC[key]}
              onChange={(e) => setSectionC((p) => ({ ...p, [key]: e.target.value }))}
            >
              <option value="">{t('pretest.select')}</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={String(n)}>
                  {n} — {t(`pretest.likert.${n}`)}
                </option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-white dark:bg-slate-900">
      <header className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('pretest.title')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('pretest.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="text-sm text-slate-600 hover:text-primary dark:text-slate-400"
        >
          {t('common.logout')}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {error ? (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        {step === 0 && (
          <div className="max-w-2xl space-y-4">
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{t('pretest.intro.en')}</p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{t('pretest.intro.vi')}</p>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('pretest.blocker')}</p>
          </div>
        )}
        {step === 1 && renderSectionA()}
        {step === 2 && t1 && renderSectionB(t1, qs1)}
        {step === 3 && t2 && renderSectionB(t2, qs2)}
        {step === 4 && renderSectionC()}
      </div>

      <footer className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-slate-500">
          {t('pretest.step')} {step + 1} / 5
        </span>
        <div className="flex gap-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {t('common.back')}
            </button>
          ) : null}
          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              className="px-4 py-2 rounded-xl bg-primary text-white font-medium hover:opacity-90"
            >
              {t('pretest.next')}
            </button>
          ) : (
            <button
              type="button"
              disabled={sending}
              onClick={submit}
              className="px-4 py-2 rounded-xl bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50"
            >
              {sending ? t('common.loading') : t('pretest.submit')}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
