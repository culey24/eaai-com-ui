/**
 * Đăng ký khảo sát học viên (PRETEST / POSTTEST).
 * POSTTEST: bật nộp bằng SURVEY_POSTTEST_ENABLED=1 trên server (và bổ sung validate + UI sau).
 */

export const SURVEY_KIND_PRETEST = 'PRETEST'
export const SURVEY_KIND_POSTTEST = 'POSTTEST'

/** Các loại hiển thị trên trang admin (POSTTEST luôn có tab để theo dõi sau này). */
export const ADMIN_SURVEY_KINDS = [SURVEY_KIND_PRETEST, SURVEY_KIND_POSTTEST]

export function normalizeSurveyKind(raw) {
  if (raw == null) return null
  const s = String(raw).trim().toUpperCase()
  if (s === 'PRETEST') return SURVEY_KIND_PRETEST
  if (s === 'POSTTEST' || s === 'POST-TEST') return SURVEY_KIND_POSTTEST
  return null
}

/** Học viên có được POST /api/me/... nộp bài cho loại này chưa */
export function isLearnerSurveySubmissionEnabled(kind) {
  if (kind === SURVEY_KIND_PRETEST) return true
  if (kind === SURVEY_KIND_POSTTEST) {
    const v = process.env.SURVEY_POSTTEST_ENABLED
    return v === '1' || v === 'true' || v === 'yes'
  }
  return false
}
