/** Chế độ nhận dạy theo lớp */
export const TEACHING_MODES = {
  AGENT: 'AGENT',   // IS-1
  LLM: 'LLM',      // IS-2
  MANUAL: 'MANUAL', // IS-3
}

export const TEACHING_MODE_LABELS = {
  AGENT: 'AGENT',
  LLM: 'LLM',
  MANUAL: 'MANUAL',
}

/** Mapping lớp → chế độ */
export const CLASS_TO_MODE = {
  'IS-1': TEACHING_MODES.AGENT,
  'IS-2': TEACHING_MODES.LLM,
  'IS-3': TEACHING_MODES.MANUAL,
}

/** Lớp có supporter (chỉ MANUAL). IS-1, IS-2 dùng AGENT/LLM nên không có supporter */
export const hasSupporterMode = (classCode) =>
  (CLASS_TO_MODE[classCode] || TEACHING_MODES.MANUAL) === TEACHING_MODES.MANUAL
