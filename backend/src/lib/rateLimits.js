import rateLimit from 'express-rate-limit'

function rateLimitDisabled() {
  const v = process.env.RATE_LIMIT_DISABLED
  return v === '1' || v === 'true' || v === 'yes'
}

function num(envKey, fallback) {
  const n = Number(process.env[envKey])
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function ms(envKey, fallback) {
  const n = Number(process.env[envKey])
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const json429 = (_req, res) => {
  res.status(429).json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' })
}

/** Toàn bộ /api — theo IP (sau trust proxy). */
export const apiGeneralLimiter = rateLimit({
  windowMs: ms('RATE_LIMIT_API_WINDOW_MS', 60_000),
  limit: num('RATE_LIMIT_API_MAX', 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: false,
  skip: () => rateLimitDisabled(),
  handler: json429,
})

/** Đăng nhập / đăng ký — chống brute-force. */
export const authRouteLimiter = rateLimit({
  windowMs: ms('RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60_000),
  limit: num('RATE_LIMIT_AUTH_MAX', 40),
  standardHeaders: true,
  legacyHeaders: false,
  message: false,
  skip: () => rateLimitDisabled(),
  handler: json429,
})

/** POST /api/messages — chat tối giản không JWT, theo IP. */
export const minimalMessagePostLimiter = rateLimit({
  windowMs: ms('RATE_LIMIT_MSG_MINIMAL_WINDOW_MS', 60_000),
  limit: num('RATE_LIMIT_MSG_MINIMAL_MAX', 45),
  standardHeaders: true,
  legacyHeaders: false,
  message: false,
  skip: () => rateLimitDisabled(),
  handler: json429,
})

/**
 * POST /api/messages — learner có JWT: theo userId (hạn chế spam + gọi LLM).
 */
export const jwtMessagePostLimiter = rateLimit({
  windowMs: ms('RATE_LIMIT_MSG_USER_WINDOW_MS', 60_000),
  limit: num('RATE_LIMIT_MSG_USER_MAX', 24),
  standardHeaders: true,
  legacyHeaders: false,
  message: false,
  skip: () => rateLimitDisabled(),
  keyGenerator: (req) => {
    const id = req.auth?.userId
    return id ? `jwt-msg:${id}` : `jwt-msg-ip:${req.ip}`
  },
  handler: json429,
})

/** POST /api/journal/upload — theo user. */
export const journalUploadLimiter = rateLimit({
  windowMs: ms('RATE_LIMIT_JOURNAL_WINDOW_MS', 60 * 60_000),
  limit: num('RATE_LIMIT_JOURNAL_MAX', 40),
  standardHeaders: true,
  legacyHeaders: false,
  message: false,
  skip: () => rateLimitDisabled(),
  keyGenerator: (req) => {
    const id = req.auth?.userId
    return id ? `journal:${id}` : `journal-ip:${req.ip}`
  },
  handler: json429,
})

/** POST /api/reports — theo user. */
export const reportPostLimiter = rateLimit({
  windowMs: ms('RATE_LIMIT_REPORT_WINDOW_MS', 15 * 60_000),
  limit: num('RATE_LIMIT_REPORT_MAX', 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: false,
  skip: () => rateLimitDisabled(),
  keyGenerator: (req) => {
    const id = req.auth?.userId
    return id ? `report:${id}` : `report-ip:${req.ip}`
  },
  handler: json429,
})
