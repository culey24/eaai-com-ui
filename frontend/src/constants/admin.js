/** Chế độ nhận dạy theo lớp */
export const TEACHING_MODES = {
  AGENT: 'AGENT', // IS-1 — kênh ai-chat
  LLM: 'LLM', // IS-3 — human-chat + Gemini
  MANUAL: 'MANUAL', // IS-2 — internal-chat + supporter
}

export const TEACHING_MODE_LABELS = {
  AGENT: 'AGENT',
  LLM: 'LLM',
  MANUAL: 'MANUAL',
}

/** Mapping lớp → chế độ */
export const CLASS_TO_MODE = {
  'IS-1': TEACHING_MODES.AGENT,
  'IS-2': TEACHING_MODES.MANUAL,
  'IS-3': TEACHING_MODES.LLM,
}

/** Lớp có supporter: IS-2. IS-1 AGENT; IS-3 LLM (Gemini). */
export const hasSupporterMode = (classCode) =>
  (CLASS_TO_MODE[classCode] || TEACHING_MODES.MANUAL) === TEACHING_MODES.MANUAL
