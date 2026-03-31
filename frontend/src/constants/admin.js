/** Chế độ nhận dạy theo lớp */
export const TEACHING_MODES = {
  AGENT: 'AGENT', // IS-1
  LLM: 'LLM', // IS-3 (human-chat / Gemini sau khi hoán vai với IS-2)
  MANUAL: 'MANUAL', // IS-2 (internal-chat / supporter)
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

/** Lớp có supporter (MANUAL = IS-2 sau khi hoán). IS-1, IS-3: AGENT / LLM */
export const hasSupporterMode = (classCode) =>
  (CLASS_TO_MODE[classCode] || TEACHING_MODES.MANUAL) === TEACHING_MODES.MANUAL
