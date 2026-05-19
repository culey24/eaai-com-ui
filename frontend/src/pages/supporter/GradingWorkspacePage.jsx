import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { renderAsync } from 'docx-preview'
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Sparkles,
  RefreshCw,
  Plus,
  Minus,
  MessageSquare,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { API_BASE } from '../../config/api'

// Imports cho dữ liệu Pretest & Posttest
import { getSectionBQuestions as getPretestB } from '../../data/pretest/sectionB'
import { getSectionBQuestions as getPosttestB } from '../../data/posttest/sectionB'
import { SECTION_C_ITEMS as PRETEST_SEC_C } from '../../data/pretest/sectionCItems'
import { SECTION_C_ITEMS as POSTTEST_SEC_C } from '../../data/posttest/sectionCItems'
import { PRETEST_TOPICS } from '../../data/pretest/pretestTopics'

const TABS = [
  { id: 'sub1', label: 'Submission 1', type: 'doc' },
  { id: 'sub2', label: 'Submission 2', type: 'doc' },
  { id: 'sub3', label: 'Submission 3', type: 'doc' },
  { id: 'sub4', label: 'Submission 4', type: 'doc' },
  { id: 'final', label: 'Final Submission', type: 'zip' },
  { id: 'pretest', label: 'Pre-test', type: 'survey' },
  { id: 'posttest', label: 'Post-test', type: 'survey' },
]

const SECTION_A_LABELS = {
  yearOfStudy: { en: '1. Current year of study', vi: '1. Bạn đang học năm thứ mấy?' },
  gender: { en: '2. Gender', vi: '2. Giới tính' },
  studentStatus: { en: '3. Current status', vi: '3. Tình trạng học tập' },
  selfLearningScale: { en: '4. Self-learning ability (1–5)', vi: '4. Khả năng tự học (thang 1–5)' },
  topicFirst: { en: '5. First topic for knowledge assessment', vi: '5. Chủ đề thứ nhất đánh giá kiến thức' },
  topicSecond: { en: '6. Second topic for knowledge assessment', vi: '6. Chủ đề thứ hai đánh giá kiến thức' },
  studiedTopic1: { en: '7. Studied Topic 1 before?', vi: '7. Đã từng học Chủ đề 1 chưa?' },
  studiedTopic2: { en: '8. Studied Topic 2 before?', vi: '8. Đã từng học Chủ đề 2 chưa?' },
  familiarityTopic1Scale: { en: '9. Familiarity with Topic 1 (1–5)', vi: '9. Mức quen thuộc với Chủ đề 1 (1–5)' },
  familiarityTopic2Scale: { en: '10. Familiarity with Topic 2 (1–5)', vi: '10. Mức quen thuộc với Chủ đề 2 (1–5)' },
  usedGenAi: { en: '11. Used GenAI tools for learning?', vi: '11. Đã dùng công cụ GenAI để học chưa?' },
  aiLearningFrequency: { en: '12. Frequency of using AI for learning', vi: '12. Tần suất dùng AI trong học tập' },
  aiToolPrimary: { en: '13. AI tool used most', vi: '13. Công cụ AI dùng nhiều nhất' },
  aiStudyPurpose: { en: '14. Primary purpose of using AI', vi: '14. Mục đích chính khi dùng AI' },
  attendedAiTraining: { en: '15. Attended AI course or workshop?', vi: '15. Đã tham gia khóa học/workshop AI?' },
}

export default function GradingWorkspacePage() {
  const { learnerId } = useParams()
  const navigate = useNavigate()
  const { apiToken } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('sub1')
  const [surveyIndex, setSurveyIndex] = useState(0)

  const [learner, setLearner] = useState(null)
  const [submissions, setSubmissions] = useState({})
  const [pretest, setPretest] = useState(null)
  const [posttest, setPosttest] = useState(null)
  const [gradingInfo, setGradingInfo] = useState(null)

  const [scores, setScores] = useState({})
  const [comments, setComments] = useState({})
  const [pretestQScores, setPretestQScores] = useState({})
  const [posttestQScores, setPosttestQScores] = useState({})

  // States for previewing files
  const [fileBlob, setFileBlob] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState(null)
  const [txtContent, setTxtContent] = useState('')
  const docxContainerRef = useRef(null)

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
      .finally(() => setLoading(false))
  }, [apiToken, learnerId])

  // Revoke Blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl)
      }
    }
  }, [fileUrl])

  // Fetch submission file blob when activeTab or submissions changes
  useEffect(() => {
    // If not an individual submission tab, clear everything
    if (!activeTab.startsWith('sub')) {
      setFileBlob(null)
      setTxtContent('')
      setFileUrl(null)
      return
    }

    const sub = submissions[activeTab]
    if (!sub) {
      setFileBlob(null)
      setTxtContent('')
      setFileUrl(null)
      return
    }

    const ext = sub.originalFileName ? sub.originalFileName.split('.').pop().toLowerCase() : ''
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'txt') {
      setFileBlob(null)
      setTxtContent('')
      setFileUrl(null)
      return
    }

    let active = true
    setFileLoading(true)
    setFileError(null)
    setTxtContent('')
    setFileBlob(null)
    setFileUrl(null)

    fetch(`${API_BASE}/api/journal/learner/${encodeURIComponent(learnerId)}/file/${encodeURIComponent(sub.id)}`, {
      headers: { Authorization: `Bearer ${apiToken}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Không thể tải file từ server: HTTP ${res.status}`)
        }
        return res.blob()
      })
      .then(async blob => {
        if (!active) return

        let mimeType = blob.type
        if (ext === 'pdf') mimeType = 'application/pdf'
        else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        else if (ext === 'txt') mimeType = 'text/plain;charset=utf-8'

        const typedBlob = new Blob([blob], { type: mimeType })
        const url = URL.createObjectURL(typedBlob)
        
        if (active) {
          setFileBlob(typedBlob)
          setFileUrl(url)
        } else {
          URL.revokeObjectURL(url)
          return
        }

        if (ext === 'txt') {
          try {
            const text = await typedBlob.text()
            if (active) setTxtContent(text)
          } catch (textErr) {
            console.error("Error reading text:", textErr)
            if (active) setTxtContent('Không thể đọc nội dung file văn bản.')
          }
        }
        if (active) setFileLoading(false)
      })
      .catch(err => {
        if (!active) return
        console.error(err)
        setFileError(err.message)
        setFileLoading(false)
      })

    return () => {
      active = false
    }
  }, [activeTab, learnerId, submissions, apiToken])

  // Render DOCX file client-side when fileBlob or container is ready
  useEffect(() => {
    if (!fileBlob || !docxContainerRef.current) return
    const sub = submissions[activeTab]
    if (!sub) return
    const ext = sub.originalFileName ? sub.originalFileName.split('.').pop().toLowerCase() : ''
    if (ext !== 'docx') return

    let active = true
    const renderDocx = async () => {
      try {
        // Clear previous content
        docxContainerRef.current.innerHTML = '<div class="text-slate-400 p-4">Đang chuẩn bị xem trước tài liệu DOCX...</div>'
        const arrayBuffer = await fileBlob.arrayBuffer()
        if (!active) return
        docxContainerRef.current.innerHTML = ''
        await renderAsync(arrayBuffer, docxContainerRef.current, null, {
          className: "docx-preview-wrap",
          inWrapper: true,
          ignoreWidth: true
        })
      } catch (err) {
        console.error("Error rendering docx:", err)
        if (active) {
          docxContainerRef.current.innerHTML = `<div class="text-red-500 p-4">Không thể hiển thị bản xem trước DOCX: ${err.message || err}</div>`
        }
      }
    }
    renderDocx()

    return () => {
      active = false
    }
  }, [fileBlob, activeTab, submissions])

  const totalScore = useMemo(() => {
    const keys = ['sub1', 'sub2', 'sub3', 'sub4', 'final', 'pretest', 'posttest']
    let sum = 0
    let count = 0
    for (const k of keys) {
      const s = parseFloat(scores[k])
      if (!isNaN(s)) {
        sum += s
        count++
      }
    }
    return count > 0 ? parseFloat((sum / count).toFixed(2)) : 0
  }, [scores])

  const handleSave = async () => {
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
        setMessage({ type: 'success', text: 'Đã lưu toàn bộ kết quả chấm bài thành công!' })
        setTimeout(() => setMessage(null), 4000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra khi lưu bảng điểm.' })
      }
    } catch (err) {
      console.error('[handleSave error]', err)
      setMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ.' })
    } finally {
      setSaving(false)
    }
  }

  const adjustScore = (key, delta) => {
    const current = parseFloat(scores[key]) || 0
    let next = parseFloat((current + delta).toFixed(2))
    if (next < 0) next = 0
    if (next > 10) next = 10
    setScores({ ...scores, [key]: next })
  }

  // Danh sách các mục khảo sát để hiển thị theo từng câu chuẩn LMS
  const surveyItems = useMemo(() => {
    if (activeTab !== 'pretest' && activeTab !== 'posttest') return []
    const s = activeTab === 'pretest' ? pretest : posttest
    if (!s) return []

    const isPretest = activeTab === 'pretest'
    const items = []

    // 1. Section A
    const secA = s.sectionA || {}
    const aKeys = Object.keys(SECTION_A_LABELS)
    aKeys.forEach((k, idx) => {
      let val = secA[k]
      if (k === 'topicFirst' || k === 'topicSecond') {
        const tObj = PRETEST_TOPICS.find((t) => t.id === val)
        if (tObj) val = `${tObj.title.vi} (${tObj.title.en})`
      }
      items.push({
        section: 'A',
        sectionTitle: 'Phần A: Thông tin chung & Nền tảng',
        index: idx + 1,
        id: `A-${idx + 1}`,
        questionEn: SECTION_A_LABELS[k].en,
        questionVi: SECTION_A_LABELS[k].vi,
        type: 'info',
        answer: val !== undefined && val !== null && val !== '' ? String(val) : 'Chưa trả lời',
      })
    })

    // 2. Section B - Topic 1
    const t1 = secA.topicFirst
    if (t1) {
      const tObj = PRETEST_TOPICS.find((t) => t.id === t1)
      const tName = tObj ? tObj.title.vi : t1
      const qs1 = isPretest ? getPretestB(t1) : getPosttestB(t1)
      const answersB = s.sectionB?.[t1] || {}

      qs1.forEach((q, qIdx) => {
        const qKey = `q${qIdx + 1}`
        const ans = answersB[qKey]
        items.push({
          section: 'B1',
          sectionTitle: `Phần B (Chủ đề 1): ${tName}`,
          index: qIdx + 1,
          id: `B1-${qIdx + 1}`,
          bloom: q.bloom,
          questionEn: q.prompt?.en || '',
          questionVi: q.prompt?.vi || '',
          type: q.type,
          choices: q.choices,
          correctAnswer: q.answer || q.correctAnswer,
          hintEn: q.hint?.en,
          hintVi: q.hint?.vi,
          answer: ans !== undefined && ans !== null && ans !== '' ? ans : 'Không trả lời',
        })
      })
    }

    // 3. Section B - Topic 2
    const t2 = secA.topicSecond
    if (t2) {
      const tObj = PRETEST_TOPICS.find((t) => t.id === t2)
      const tName = tObj ? tObj.title.vi : t2
      const qs2 = isPretest ? getPretestB(t2) : getPosttestB(t2)
      const answersB = s.sectionB?.[t2] || {}

      qs2.forEach((q, qIdx) => {
        const qKey = `q${qIdx + 1}`
        const ans = answersB[qKey]
        items.push({
          section: 'B2',
          sectionTitle: `Phần B (Chủ đề 2): ${tName}`,
          index: qIdx + 1,
          id: `B2-${qIdx + 1}`,
          bloom: q.bloom,
          questionEn: q.prompt?.en || '',
          questionVi: q.prompt?.vi || '',
          type: q.type,
          choices: q.choices,
          correctAnswer: q.answer || q.correctAnswer,
          hintEn: q.hint?.en,
          hintVi: q.hint?.vi,
          answer: ans !== undefined && ans !== null && ans !== '' ? ans : 'Không trả lời',
        })
      })
    }

    // 4. Section C
    const secC = s.sectionC || {}
    const cList = isPretest ? PRETEST_SEC_C : POSTTEST_SEC_C
    cList.forEach((ci, idx) => {
      const cKey = `c${idx + 1}`
      const val = secC[cKey]
      const likertMap = {
        1: '1 - Hoàn toàn không đồng ý',
        2: '2 - Không đồng ý',
        3: '3 - Trung lập',
        4: '4 - Đồng ý',
        5: '5 - Hoàn toàn đồng ý',
      }
      items.push({
        section: 'C',
        sectionTitle: 'Phần C: Thái độ & Sẵn sàng với AI',
        index: idx + 1,
        id: `C-${idx + 1}`,
        questionEn: ci.en,
        questionVi: ci.vi,
        type: 'likert',
        answer: val ? likertMap[val] || String(val) : 'Chưa chọn',
      })
    })

    return items
  }, [activeTab, pretest, posttest])

  const handleQuestionScoreChange = (tabId, qId, scoreVal) => {
    const isPre = tabId === 'pretest'
    const currentQ = isPre ? pretestQScores : posttestQScores
    const nextQ = { ...currentQ, [qId]: parseFloat(scoreVal) || 0 }

    if (isPre) {
      setPretestQScores(nextQ)
    } else {
      setPosttestQScores(nextQ)
    }

    let sum = 0
    Object.entries(nextQ).forEach(([k, v]) => {
      if (k.startsWith('B')) {
        sum += v
      }
    })
    const totalSurveyScore = parseFloat(Math.min(10, sum).toFixed(2))
    setScores((prev) => ({ ...prev, [tabId]: totalSurveyScore }))
  }

  const autoGradeMCQ = (tabId) => {
    const isPre = tabId === 'pretest'
    const items = surveyItems
    const currentQ = isPre ? pretestQScores : posttestQScores
    const nextQ = { ...currentQ }

    let sum = 0
    items.forEach((item) => {
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
      if (k.startsWith('B')) {
        sum += v
      }
    })

    if (isPre) {
      setPretestQScores(nextQ)
    } else {
      setPosttestQScores(nextQ)
    }

    const totalSurveyScore = parseFloat(Math.min(10, sum).toFixed(2))
    setScores((prev) => ({ ...prev, [tabId]: totalSurveyScore }))
    setMessage({
      type: 'success',
      text: `⚡ Đã tự động chấm 0.5đ cho các câu trắc nghiệm đúng trong ${tabId === 'pretest' ? 'Pre-test' : 'Post-test'}!`,
    })
    setTimeout(() => setMessage(null), 3000)
  }

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
              <FileQuestion className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Không có submission</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                Học viên chưa nộp bài cho giai đoạn này. Điểm số mặc định được hệ thống tự động gán là 0.
              </p>
            </div>

            {/* Vẫn hiển thị box nhận xét / chỉnh điểm nếu cần */}
            <div className="w-full max-w-xl mt-8 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg space-y-4 text-left">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-white">Ghi nhận điểm số (Mặc định 0):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.25"
                    value={scores[activeTab] ?? ''}
                    onChange={(e) => setScores({ ...scores, [activeTab]: parseFloat(e.target.value) || 0 })}
                    className="w-20 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-center font-black text-lg text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <span className="text-sm font-bold text-slate-400">/ 10</span>
                </div>
              </div>
              <textarea
                rows={2}
                value={comments[activeTab] || ''}
                onChange={(e) => setComments({ ...comments, [activeTab]: e.target.value })}
                placeholder="Ghi nhận xét cho việc không nộp bài..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Lưu điểm bài này
              </button>
            </div>
          </div>
        )
      }

      return (
        <div className="space-y-6">
          {activeTab === 'final' ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm space-y-6">
              <div className="p-5 bg-primary/10 dark:bg-primary/20 text-primary rounded-full shadow-inner animate-bounce">
                <Download className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{sub.originalFileName || 'Final_Submission.zip'}</h3>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 space-y-2">
                  <div>Đã nộp vào lúc: <span className="font-semibold text-slate-700 dark:text-slate-200">{new Date(sub.submittedAt).toLocaleString('vi-VN')}</span></div>
                  {sub.isLate ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-full border border-rose-300 dark:border-rose-800 animate-pulse shadow-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>⚠️ Bài nộp muộn (Áp dụng trừ điểm penalty theo quy định)</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Nộp bài đúng hạn</span>
                    </div>
                  )}
                </div>
              </div>
              <a
                href={`/journal-file-download?learnerId=${learnerId}&uploadId=${sub.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-105"
              >
                <Download className="w-5 h-5" />
                <span>Tải về file nộp cuối khóa (.zip)</span>
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-100 dark:bg-slate-900/60 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-6 h-6 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-800 dark:text-white truncate max-w-md">
                      {sub.originalFileName || 'Văn bản nộp'}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 truncate">
                      <span>Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')}</span>
                      {sub.isSupplementary && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-semibold text-xs rounded-full border border-blue-200 dark:border-blue-800 flex-shrink-0">
                          Bản nộp đợt bổ sung
                        </span>
                      )}
                      {sub.isLate && !sub.isSupplementary && (
                        <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-semibold text-xs rounded-full border border-rose-200 dark:border-rose-800 flex-shrink-0">
                          Bản nộp muộn
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <a
                  href={`/journal-file-download?learnerId=${learnerId}&uploadId=${sub.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 text-primary font-semibold text-xs rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải file gốc</span>
                </a>
              </div>

              {sub.aiEvaluation && (
                <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Nhận xét tự động từ AI:
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {sub.aiEvaluation}
                  </div>
                </div>
              )}

              {/* File Preview Container */}
              {fileLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-[400px]">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-sm font-medium">Đang tải bản xem trước tệp...</span>
                </div>
              ) : fileError ? (
                <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400 text-sm flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 shrink-0 text-rose-500" />
                  <div>
                    <span className="font-semibold">Không thể tải file để hiển thị trực tiếp.</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Lỗi: {fileError}. Bạn có thể tải file gốc bằng nút bấm ở trên để xem đầy đủ.</p>
                  </div>
                </div>
              ) : (() => {
                const ext = sub.originalFileName ? sub.originalFileName.split('.').pop().toLowerCase() : ''
                if (ext === 'pdf' && fileUrl) {
                  return (
                    <div className="bg-slate-100 dark:bg-slate-950 p-4 md:p-6 rounded-2xl overflow-auto max-h-[70vh] flex justify-center shadow-inner border border-slate-200 dark:border-slate-800">
                      <iframe src={fileUrl} className="w-full h-[65vh] border-0 rounded-xl shadow-lg max-w-[900px] bg-white" title="PDF Preview" />
                    </div>
                  )
                }
                if (ext === 'docx' && fileBlob) {
                  return (
                    <div className="bg-slate-100 dark:bg-slate-950 p-4 md:p-6 rounded-2xl overflow-auto max-h-[70vh] flex justify-center shadow-inner border border-slate-200 dark:border-slate-800">
                      <div ref={docxContainerRef} className="docx-viewer w-full max-w-[850px] bg-white rounded-xl overflow-x-auto" />
                    </div>
                  )
                }
                if (ext === 'txt' && txtContent) {
                  return (
                    <div className="bg-slate-100 dark:bg-slate-950 p-4 md:p-6 rounded-2xl overflow-auto max-h-[70vh] flex justify-center shadow-inner border border-slate-200 dark:border-slate-800">
                      <pre className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 font-mono text-sm whitespace-pre-wrap overflow-x-auto leading-relaxed max-w-[900px] text-left">
                        {txtContent}
                      </pre>
                    </div>
                  )
                }
                return (
                  <div className="p-8 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-amber-800 dark:text-amber-300 text-sm flex flex-col items-center justify-center text-center space-y-3">
                    <FileQuestion className="w-10 h-10 text-amber-500 opacity-80" />
                    <div>
                      <p className="font-bold text-base">Không hỗ trợ xem trước định dạng này</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hệ thống chỉ hỗ trợ xem trước trực tuyến tệp PDF, DOCX và TXT. Vui lòng tải file gốc bằng nút tải ở trên để chấm bài.</p>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Box chấm điểm trực tiếp tại bài nộp */}
          <div className="mt-8 p-6 bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900/60 rounded-3xl shadow-xl space-y-4 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg flex-shrink-0">
                  📝
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Chấm điểm bài nộp: {TABS.find((t) => t.id === activeTab)?.label}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Nhập điểm tổng quát (0 - 10) và nhận xét chi tiết cho hạng mục này.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={() => adjustScore(activeTab, -0.5)}
                  className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all"
                  title="Giảm 0.5 điểm"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.25"
                  value={scores[activeTab] ?? ''}
                  onChange={(e) => setScores({ ...scores, [activeTab]: parseFloat(e.target.value) || 0 })}
                  className="w-20 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-center font-black text-lg text-indigo-600 dark:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
                <span className="text-sm font-bold text-slate-400">/ 10</span>
                <button
                  onClick={() => adjustScore(activeTab, 0.5)}
                  className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all"
                  title="Tăng 0.5 điểm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 block">
                Nhận xét chi tiết cho học viên:
              </label>
              <textarea
                rows={3}
                value={comments[activeTab] || ''}
                onChange={(e) => setComments({ ...comments, [activeTab]: e.target.value })}
                placeholder={`Nhập đánh giá, nhận xét chi tiết cho bài làm ${TABS.find((t) => t.id === activeTab)?.label}...`}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 hover:scale-105 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Lưu kết quả bài nộp này</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (activeTab === 'pretest' || activeTab === 'posttest') {
      const s = activeTab === 'pretest' ? pretest : posttest

      if (!s || surveyItems.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-96 text-center p-8 space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-full">
              <FileQuestion className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Không có dữ liệu khảo sát</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                Học viên chưa hoàn thành bài khảo sát {activeTab === 'pretest' ? 'Pre-test' : 'Post-test'}.
              </p>
            </div>
          </div>
        )
      }

      const activeItem = surveyItems[surveyIndex] || surveyItems[0]

      return (
        <div className="space-y-6">
          {/* Banner Tổng kết điểm khảo sát & Auto grade */}
          <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="px-3.5 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-200 border border-white/10">
                ⚡ Bảng điểm Khảo sát ({activeTab === 'pretest' ? 'Pre-test' : 'Post-test'})
              </span>
              <h3 className="text-xl font-extrabold text-white">
                Tổng điểm bài khảo sát: <span className="text-amber-400 text-2xl font-black">{scores[activeTab] ?? 0}</span> <span className="text-indigo-200 text-base font-medium">/ 10.0</span>
              </h3>
              <p className="text-xs text-indigo-200 max-w-md leading-relaxed">
                Điểm tổng kết được cộng dồn từ 20 câu hỏi kiến thức chuyên môn (Phần B1 & B2). Mỗi câu tối đa 0.5 điểm. Nút tự động chấm bên phải sẽ tự động chấm điểm cho toàn bộ các câu trắc nghiệm (MCQ) dựa trên đáp án chuẩn có sẵn.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-end w-full md:w-auto">
              <button
                onClick={() => autoGradeMCQ(activeTab)}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/30 transition-all flex items-center gap-2 hover:scale-105"
                title="Tự động chấm 0.5 điểm cho các câu trắc nghiệm đúng"
              >
                <Sparkles className="w-4 h-4 text-slate-950 flex-shrink-0 animate-spin" />
                <span>⚡ Tự động chấm Trắc nghiệm</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-white hover:bg-slate-100 text-indigo-950 font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 hover:scale-105 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Lưu điểm Khảo sát</span>
              </button>
            </div>
          </div>

          {/* Nhận xét chung bài khảo sát */}
          <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 block">
              Nhận xét chung bài khảo sát {activeTab === 'pretest' ? 'Pre-test' : 'Post-test'}:
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <textarea
                rows={2}
                value={comments[activeTab] || ''}
                onChange={(e) => setComments({ ...comments, [activeTab]: e.target.value })}
                placeholder="Nhập nhận xét chung về bài làm khảo sát của học viên..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none font-sans"
              />
            </div>
          </div>

          {/* Lưới điều hướng nhanh (LMS Navigator) */}
          <div className="p-4 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lưới câu hỏi (Bấm để nhảy nhanh):</div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {surveyItems.map((item, idx) => {
                let badgeColor = 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                if (surveyIndex === idx) {
                  badgeColor = 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-500/30 scale-105 border-indigo-600'
                } else if (item.answer !== 'Không trả lời' && item.answer !== 'Chưa chọn' && item.answer !== 'Chưa trả lời') {
                  badgeColor = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                }
                return (
                  <button
                    key={item.id}
                    onClick={() => setSurveyIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${badgeColor}`}
                    title={item.questionVi || item.questionEn}
                  >
                    {item.section}-{item.index}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Khung nội dung câu hỏi */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold text-xs rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-800/80">
                {activeItem.sectionTitle}
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Câu hỏi {activeItem.index} / {surveyItems.filter((i) => i.section === activeItem.section).length}
              </div>
            </div>

            {activeItem.bloom && (
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Mức độ nhận thức (Bloom's Taxonomy): {activeItem.bloom.en} ({activeItem.bloom.vi})
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

            {/* Phần Lựa chọn / Câu trả lời */}
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
                          <Check className="w-3.5 h-3.5" /> Học viên chọn
                        </span>
                      )}
                      {isCorrect && (
                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-full flex-shrink-0">
                          Đáp án đúng
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : activeItem.type === 'likert' || activeItem.type === 'info' ? (
              <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-1.5">
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Câu trả lời của học viên:
                </div>
                <div className="text-base font-bold text-indigo-950 dark:text-indigo-100">
                  {activeItem.answer}
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {activeItem.hintVi || activeItem.hintEn ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-xl text-xs space-y-1">
                    <div className="font-bold uppercase">Gợi ý từ hệ thống (Hint):</div>
                    <div>{activeItem.hintVi || activeItem.hintEn}</div>
                  </div>
                ) : null}
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl whitespace-pre-wrap font-mono text-sm text-slate-800 dark:text-slate-200 min-h-32 leading-relaxed">
                  {activeItem.answer && activeItem.answer !== 'Không trả lời' ? activeItem.answer : <span className="italic text-slate-400">Học viên bỏ trống / Không trả lời</span>}
                </div>
              </div>
            )}

            {/* Thanh chấm điểm câu hỏi (chỉ cho Phần B kiến thức chuyên môn) */}
            {activeItem.section.startsWith('B') && (
              <div className="mt-6 p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md shadow-indigo-500/20">
                    ✨
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-indigo-800 dark:text-indigo-200 uppercase tracking-wider">
                      Đánh giá câu hỏi này (Tối đa 0.5đ):
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate font-sans">
                      {activeItem.type === 'mcq'
                        ? activeItem.answer === activeItem.correctAnswer
                          ? '✅ Hệ thống nhận diện: Chọn ĐÚNG đáp án'
                          : '❌ Hệ thống nhận diện: Chọn SAI đáp án'
                        : '✍️ Câu hỏi tự luận ngắn (Cần chấm thủ công)'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { label: '❌ Sai (0đ)', value: 0, activeClass: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/30' },
                    { label: '⚠️ Một phần (0.25đ)', value: 0.25, activeClass: 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/30 font-extrabold' },
                    { label: '✅ Đúng (0.5đ)', value: 0.5, activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30' },
                  ].map((opt) => {
                    const currentQScore = (activeTab === 'pretest' ? pretestQScores : posttestQScores)[activeItem.id] ?? 0
                    const isSelected = currentQScore === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleQuestionScoreChange(activeTab, activeItem.id, opt.value)}
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

            {/* Buttons điều hướng */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <button
                onClick={() => setSurveyIndex((prev) => Math.max(0, prev - 1))}
                disabled={surveyIndex === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-all disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <div className="text-xs font-bold text-slate-400 font-mono">
                {surveyIndex + 1} / {surveyItems.length}
              </div>

              <button
                onClick={() => setSurveyIndex((prev) => Math.min(surveyItems.length - 1, prev + 1))}
                disabled={surveyIndex === surveyItems.length - 1}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-40"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/supporter/grading')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                {learner ? learner.fullname : 'Đang tải thông tin...'}
              </h1>
              {learner?.username && (
                <span className="text-xs px-2.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-full font-mono font-medium">
                  @{learner.username}
                </span>
              )}
            </div>
            {learner && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
                <span>Lớp: <span className="font-semibold text-slate-700 dark:text-slate-200">{learner.userClass}</span></span>
                {learner.studentSchoolId && <span>MSSV: <span className="font-semibold text-slate-700 dark:text-slate-200">{learner.studentSchoolId}</span></span>}
                {gradingInfo?.gradedAt && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã chấm lúc {new Date(gradingInfo.gradedAt).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
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
            <span>Lưu bảng điểm</span>
          </button>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Cột Trái (Main Content & Grading Input): 70% */}
        <div className="flex-1 lg:w-[70%] flex flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 min-h-0">
          {/* Tabs bar */}
          <div className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 overflow-x-auto flex-shrink-0 scrollbar-none backdrop-blur-xl shadow-sm">
            {TABS.map((t) => {
              const hasSub =
                t.id.startsWith('sub') || t.id === 'final'
                  ? !!submissions[t.id]
                  : t.id === 'pretest'
                  ? !!pretest
                  : !!posttest

              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id)
                    setSurveyIndex(0)
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === t.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-105'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasSub ? (activeTab === t.id ? 'bg-white' : 'bg-emerald-500') : 'bg-rose-400'
                    }`}
                  />
                </button>
              )
            })}
          </div>

          {/* Viewer Box */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto">{renderViewerContent()}</div>
          </div>
        </div>

        {/* Cột Phải (Tổng quan tiến độ & Tình trạng bảng điểm): 30% */}
        <div className="w-full lg:w-[30%] flex flex-col bg-white dark:bg-slate-800 min-h-0 overflow-y-auto border-t lg:border-t-0 border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-2xl">
          <div className="p-6 space-y-6">
            {/* Tiêu đề & Điểm số tổng quát */}
            <div className="pb-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">
                  Tổng quan Bảng Điểm
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Trạng thái chấm bài các hạng mục.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">Điểm tổng kết</div>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{totalScore} <span className="text-sm font-bold text-slate-400">/10</span></div>
              </div>
            </div>

            {/* Danh sách 7 mục tóm tắt */}
            <div className="space-y-3">
              {TABS.map((tab) => {
                const isCurrentTab = activeTab === tab.id
                const hasSub = tab.id.startsWith('sub') || tab.id === 'final'
                  ? !!submissions[tab.id]
                  : tab.id === 'pretest' ? !!pretest : !!posttest

                const sub = submissions[tab.id]
                const score = scores[tab.id] ?? 0
                const comment = comments[tab.id] || ''

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setSurveyIndex(0)
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isCurrentTab
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${hasSub ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <div className="min-w-0">
                        <div className={`font-bold text-sm truncate ${isCurrentTab ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-800 dark:text-white'}`}>
                          {tab.label}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 truncate font-sans">
                          <span className="font-medium">{hasSub ? (sub?.isLate && !sub?.isSupplementary ? '⚠️ Nộp muộn' : sub?.isSupplementary ? '🔄 Bổ sung' : '✅ Đã nộp') : '❌ Không có bài'}</span>
                          {comment && <span className="text-slate-400 truncate italic">· "{comment}"</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 font-mono">
                      <span className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                        score > 0
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

            {/* Nút Lưu Tổng */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="w-full py-4 bg-gradient-to-r from-primary via-indigo-600 to-purple-600 hover:from-primary/90 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 uppercase tracking-wider"
              >
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>💾 LƯU TOÀN BỘ BẢNG ĐIỂM</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
