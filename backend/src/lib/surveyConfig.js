/**
 * Đăng ký khảo sát học viên (PRETEST / POSTTEST).
 * PRETEST: mặc định bật; PRETEST_ENABLED=0 để tắt gate + từ chối POST.
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

function parseEnvOnOff(raw, defaultOn = true) {
  if (raw == null || String(raw).trim() === '') return defaultOn
  const s = String(raw).trim().toLowerCase()
  if (['0', 'false', 'no', 'off', 'disabled'].includes(s)) return false
  if (['1', 'true', 'yes', 'on', 'enabled'].includes(s)) return true
  return defaultOn
}

/** Gate PRETEST + POST /api/me/pretest. Mặc định bật khi biến không đặt. */
export function isPretestEnabled() {
  return parseEnvOnOff(process.env.PRETEST_ENABLED, true)
}

/** Học viên có được POST /api/me/... nộp bài cho loại này chưa */
export function isLearnerSurveySubmissionEnabled(kind) {
  if (kind === SURVEY_KIND_PRETEST) return isPretestEnabled()
  if (kind === SURVEY_KIND_POSTTEST) {
    const v = process.env.SURVEY_POSTTEST_ENABLED
    return v === '1' || v === 'true' || v === 'yes'
  }
  return false
}
