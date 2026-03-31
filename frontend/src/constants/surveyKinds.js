/** Khớp backend/src/lib/surveyConfig.js — dùng tab admin & mở rộng POSTTEST */
export const SURVEY_KIND_PRETEST = 'PRETEST'
export const SURVEY_KIND_POSTTEST = 'POSTTEST'

export const ADMIN_SURVEY_TABS = [
  { kind: SURVEY_KIND_PRETEST, labelKey: 'admin.surveys.tabPretest' },
  { kind: SURVEY_KIND_POSTTEST, labelKey: 'admin.surveys.tabPosttest' },
]
