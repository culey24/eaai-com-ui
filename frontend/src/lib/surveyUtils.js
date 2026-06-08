import { getSectionBQuestions as getPretestB } from '../data/pretest/sectionB'
import { getSectionBQuestions as getPosttestB } from '../data/posttest/sectionB'
import { SECTION_C_ITEMS as PRETEST_SEC_C } from '../data/pretest/sectionCItems'
import { SECTION_C_ITEMS as POSTTEST_SEC_C } from '../data/posttest/sectionCItems'
import { PRETEST_TOPICS } from '../data/pretest/pretestTopics'

export const TABS = [
  { id: 'sub1', label: 'Submission 1', type: 'doc' },
  { id: 'sub2', label: 'Submission 2', type: 'doc' },
  { id: 'sub3', label: 'Submission 3', type: 'doc' },
  { id: 'sub4', label: 'Submission 4', type: 'doc' },
  { id: 'final', label: 'Final Submission', type: 'zip' },
  { id: 'pretest', label: 'Pre-test', type: 'survey' },
  { id: 'posttest', label: 'Post-test', type: 'survey' },
]

export const SECTION_A_LABELS = {
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

export function computeTotalScore(scores) {
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
}

export function buildSurveyItems({ activeTab, pretest, posttest }) {
  if (activeTab !== 'pretest' && activeTab !== 'posttest') return []
  const s = activeTab === 'pretest' ? pretest : posttest
  if (!s) return []

  const isPretest = activeTab === 'pretest'
  const items = []

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

  const secC = s.sectionC || {}
  const cList = isPretest ? PRETEST_SEC_C : POSTTEST_SEC_C
  const likertMap = {
    1: '1 - Hoàn toàn không đồng ý',
    2: '2 - Không đồng ý',
    3: '3 - Trung lập',
    4: '4 - Đồng ý',
    5: '5 - Hoàn toàn đồng ý',
  }
  cList.forEach((ci, idx) => {
    const cKey = `c${idx + 1}`
    const val = secC[cKey]
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
}
