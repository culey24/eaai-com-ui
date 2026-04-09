import { Router } from 'express'
import {
  Prisma,
  AgentChatRole,
  AgentSessionStatus,
  UserRole,
  UserClass,
} from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { agentIntegrationAuth } from '../middleware/agentIntegrationAuth.js'
import { jsonSafe } from '../lib/json.js'
import { getJournalContextSummary } from '../lib/journalContext.js'

const router = Router()
router.use(agentIntegrationAuth)

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(s) {
  return typeof s === 'string' && UUID_RE.test(s.trim())
}

function warnBadRequest(req, reason, extra = {}) {
  console.warn('[agentIntegration] bad request', {
    method: req.method,
    path: req.path,
    reason,
    ...extra,
  })
}

/**
 * PostgreSQL undefined_table — DB thiếu bảng học vụ (vd. class_students từ init/02_core_schema.sql).
 * prisma migrate không tạo các bảng đó; cần chạy SQL init hoặc chấp nhận dữ liệu rỗng.
 */
function isMissingRelationError(err) {
  if (!err || typeof err !== 'object') return false
  if (err.code !== 'P2010') return false
  const pg = err.meta?.code
  const msg = String(err.meta?.message || err.message || '')
  return pg === '42P01' || msg.includes('does not exist')
}

/** Body JSON object; tránh Array hoặc primitive làm body. */
function integrationBody(req) {
  const b = req.body
  if (b && typeof b === 'object' && !Array.isArray(b)) return b
  return {}
}

/** Ưu tiên snake_case (contract Python), fallback camelCase. */
function pickStr(body, snakeKey, camelKey) {
  const raw =
    body?.[snakeKey] !== undefined && body?.[snakeKey] !== ''
      ? body[snakeKey]
      : body?.[camelKey]
  if (raw == null || raw === '') return ''
  return String(raw).trim()
}

/**
 * session_id từ payload (string hoặc hiếm: số / object → stringify an toàn cho UUID).
 */
function pickSessionIdStr(body) {
  const raw =
    body?.session_id !== undefined && body?.session_id !== ''
      ? body.session_id
      : body?.sessionId
  if (raw == null || raw === '') return ''
  if (typeof raw === 'string') return raw.trim()
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  if (typeof raw === 'object') {
    try {
      const j = JSON.stringify(raw)
      if (j.length >= 2 && j[0] === '"' && j[j.length - 1] === '"') {
        try {
          return JSON.parse(j)
        } catch {
          return j.slice(1, -1).trim()
        }
      }
      return j.trim()
    } catch {
      return ''
    }
  }
  return String(raw).trim()
}

function agentSessionStatusToApi(status) {
  return status === AgentSessionStatus.active ? 'active' : 'deactive'
}

/** Phản hồi POST session: thêm message cho parity FastAPI; session_status luôn active|deactive. */
function sessionCreatedJson(userId, sessionId, statusEnum) {
  return jsonSafe({
    message: 'session created',
    user_id: userId,
    session_id: sessionId,
    session_status: agentSessionStatusToApi(statusEnum),
  })
}

function mapUserRoleToAgentApi(role) {
  if (role === UserRole.student) return 'student'
  if (role === UserRole.admin) return 'teacher'
  if (role === UserRole.support || role === UserRole.assistant) return 'TA'
  return 'student'
}

function mapUserClassToApi(uc) {
  if (uc == null) return null
  if (uc === UserClass.IS_1) return 'IS-1'
  if (uc === UserClass.IS_2) return 'IS-2'
  if (uc === UserClass.IS_3) return 'IS-3'
  return String(uc)
}

function normalizeOutline(outline) {
  if (outline == null) return null
  const s = String(outline).trim()
  if (!s) return null
  if (
    (s.startsWith('{') && s.endsWith('}')) ||
    (s.startsWith('[') && s.endsWith(']'))
  ) {
    try {
      return JSON.parse(s)
    } catch {
      return s
    }
  }
  return s
}

function parseAgentChatRole(raw) {
  if (raw === 'user') return AgentChatRole.user
  if (raw === 'model') return AgentChatRole.model
  if (raw === 'TA') return AgentChatRole.TA
  return null
}

/**
 * Parse new_status từ API → enum Prisma (ghi DB). Null nếu không hợp lệ.
 * JSON trả client luôn qua agentSessionStatusToApi (chuỗi active|deactive).
 * @returns {import('@prisma/client').AgentSessionStatus | null}
 */
function parseSessionStatus(raw) {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (s === 'active') return AgentSessionStatus.active
  if (s === 'deactive') return AgentSessionStatus.deactive
  return null
}

/**
 * file_ids: null | array | object | JSON string (sau parse → object/array).
 */
function parseFileIds(raw) {
  if (raw === undefined || raw === null) return { ok: true, value: null }
  if (Array.isArray(raw)) return { ok: true, value: raw }
  if (typeof raw === 'object') return { ok: true, value: raw }
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (!t) return { ok: true, value: null }
    try {
      return { ok: true, value: JSON.parse(t) }
    } catch {
      return { ok: false }
    }
  }
  return { ok: false }
}

function pickTokensCount(body) {
  const raw =
    body.tokens_count !== undefined && body.tokens_count !== ''
      ? body.tokens_count
      : body.tokensCount
  if (raw == null || raw === '') return null
  return Number.parseInt(String(raw), 10)
}

function pickDynamicProfile(body) {
  const raw =
    body.dynamic_profile !== undefined ? body.dynamic_profile : body.dynamicProfile
  if (raw == null) return null
  if (typeof raw === 'string') return raw
  return String(raw)
}

/** TEXT: cho phép "" và khoảng trắng; số 0 → "0" (không coi 0 là thiếu content). */
function pickContent(body) {
  const raw = body.content
  if (raw == null) return ''
  if (typeof raw === 'string') return raw
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  return String(raw)
}

function handlePrismaFk(res, err, logLabel) {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
    console.warn(`[agentIntegration] ${logLabel} foreign key`, err.meta)
    return res.status(422).json({
      error: 'Tham chiếu không hợp lệ',
      message: 'user_id hoặc session_id không tồn tại (khóa ngoại)',
    })
  }
  return false
}

/**
 * POST /users/:userId/sessions
 */
router.post('/users/:userId/sessions', async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim()
    const body = integrationBody(req)
    const bodyUserId = pickStr(body, 'user_id', 'userId')
    const sessionIdRaw = pickSessionIdStr(body)

    if (!userId || !bodyUserId || bodyUserId !== userId) {
      warnBadRequest(req, 'user_id path/body không khớp')
      return res.status(400).json({ error: 'user_id path và body phải nhất quán' })
    }
    if (!isUuid(sessionIdRaw)) {
      warnBadRequest(req, 'session_id không phải UUID')
      return res.status(400).json({ error: 'session_id không hợp lệ (UUID)' })
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true },
    })
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' })
    }

    const existing = await prisma.agentSession.findUnique({
      where: { sessionId: sessionIdRaw },
      select: { sessionId: true, userId: true, status: true },
    })
    if (existing) {
      if (existing.userId !== userId) {
        warnBadRequest(req, 'session_id đã thuộc user khác')
        return res.status(409).json({ error: 'session_id đã gắn user khác' })
      }
      return res.status(201).json(sessionCreatedJson(userId, sessionIdRaw, existing.status))
    }

    try {
      await prisma.agentSession.create({
        data: {
          sessionId: sessionIdRaw,
          userId,
          status: AgentSessionStatus.active,
        },
      })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const again = await prisma.agentSession.findUnique({
          where: { sessionId: sessionIdRaw },
          select: { userId: true, status: true },
        })
        if (again && again.userId === userId) {
          return res.status(201).json(sessionCreatedJson(userId, sessionIdRaw, again.status))
        }
        warnBadRequest(req, 'session_id unique race')
        return res.status(409).json({ error: 'session_id đã tồn tại' })
      }
      if (handlePrismaFk(res, e, 'POST sessions')) return
      throw e
    }

    return res.status(201).json(
      sessionCreatedJson(userId, sessionIdRaw, AgentSessionStatus.active)
    )
  } catch (err) {
    console.error('[agentIntegration POST sessions]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * POST /sessions/:sessionId/update
 */
router.post('/sessions/:sessionId/update', async (req, res) => {
  try {
    const sessionIdParam = String(req.params.sessionId || '').trim()
    const body = integrationBody(req)
    const bodySessionId = pickSessionIdStr(body)
    const newStatusStr = pickStr(body, 'new_status', 'newStatus')
    const newStatus = parseSessionStatus(newStatusStr)

    if (!isUuid(sessionIdParam)) {
      warnBadRequest(req, 'session_id path không phải UUID')
      return res.status(400).json({ error: 'session_id path không hợp lệ' })
    }
    if (!bodySessionId || bodySessionId !== sessionIdParam) {
      warnBadRequest(req, 'session_id path/body không khớp')
      return res.status(400).json({ error: 'session_id path và body phải nhất quán' })
    }
    if (!newStatus) {
      warnBadRequest(req, 'new_status phải active|deactive', {
        got: newStatusStr || body.new_status || body.newStatus,
      })
      return res.status(400).json({ error: 'new_status phải là active hoặc deactive' })
    }

    const updated = await prisma.agentSession.updateMany({
      where: { sessionId: sessionIdParam },
      data: { status: newStatus },
    })

    if (updated.count === 0) {
      return res.status(404).json({ error: 'Không tìm thấy session' })
    }

    return res.status(201).json(
      jsonSafe({
        session_id: sessionIdParam,
        session_status: agentSessionStatusToApi(newStatus),
      })
    )
  } catch (err) {
    console.error('[agentIntegration POST session update]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * GET /users/:userId/role
 */
router.get('/users/:userId/role', async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim()
    if (!userId) {
      warnBadRequest(req, 'thiếu user_id path')
      return res.status(400).json({ error: 'Thiếu user_id' })
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true, userRole: true, userClass: true },
    })

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' })
    }

    const user_class = mapUserClassToApi(user.userClass)

    return res.status(200).json(
      jsonSafe({
        user_id: user.userId,
        user_role: mapUserRoleToAgentApi(user.userRole),
        user_class,
      })
    )
  } catch (err) {
    console.error('[agentIntegration GET role]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * POST /sessions/:sessionId/conversations
 */
router.post('/sessions/:sessionId/conversations', async (req, res) => {
  try {
    const sessionIdParam = String(req.params.sessionId || '').trim()
    const body = integrationBody(req)
    const bodySessionId = pickSessionIdStr(body)
    const chatRoleRaw = pickStr(body, 'chat_role', 'chatRole')
    const chatRole = parseAgentChatRole(chatRoleRaw)
    const content = pickContent(body)
    const fileIdsParsed = parseFileIds(body.file_ids !== undefined ? body.file_ids : body.fileIds)
    const dynamicProfile = pickDynamicProfile(body)
    const tokensCount = pickTokensCount(body)

    if (!isUuid(sessionIdParam)) {
      warnBadRequest(req, 'session_id path không phải UUID')
      return res.status(400).json({ error: 'session_id path không hợp lệ' })
    }
    if (!bodySessionId || bodySessionId !== sessionIdParam) {
      warnBadRequest(req, 'session_id path/body không khớp')
      return res.status(400).json({ error: 'session_id path và body phải nhất quán' })
    }
    if (!fileIdsParsed.ok) {
      warnBadRequest(req, 'file_ids không parse được (cần null/array/object/JSON string)')
      return res.status(400).json({ error: 'file_ids phải là null, mảng, object hoặc chuỗi JSON hợp lệ' })
    }
    if (!chatRole) {
      warnBadRequest(req, 'chat_role không hợp lệ', { got: chatRoleRaw })
      return res.status(400).json({ error: 'chat_role phải là user | model | TA' })
    }
    if (
      tokensCount != null &&
      (!Number.isFinite(tokensCount) ||
        Number.isNaN(tokensCount) ||
        tokensCount < 0 ||
        !Number.isInteger(tokensCount))
    ) {
      warnBadRequest(req, 'tokens_count không hợp lệ')
      return res.status(400).json({ error: 'tokens_count không hợp lệ' })
    }

    const session = await prisma.agentSession.findUnique({
      where: { sessionId: sessionIdParam },
      select: { sessionId: true },
    })
    if (!session) {
      return res.status(404).json({ error: 'Không tìm thấy session' })
    }

    let row
    try {
      row = await prisma.agentSessionMessage.create({
        data: {
          sessionId: sessionIdParam,
          chatRole,
          content,
          fileIds: fileIdsParsed.value,
          dynamicProfile,
          tokensCount: tokensCount ?? null,
        },
      })
    } catch (e) {
      if (handlePrismaFk(res, e, 'POST conversations')) return
      throw e
    }

    return res.status(201).json(jsonSafe({ message: row }))
  } catch (err) {
    console.error('[agentIntegration POST conversation]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * GET /sessions/:sessionId/conversations
 * Liệt kê tin đã lưu (agent_session_messages) — nguồn thật khi ADK mất RAM.
 */
router.get('/sessions/:sessionId/conversations', async (req, res) => {
  try {
    const sessionIdParam = String(req.params.sessionId || '').trim()
    if (!isUuid(sessionIdParam)) {
      warnBadRequest(req, 'session_id path không phải UUID')
      return res.status(400).json({ error: 'session_id path không hợp lệ' })
    }

    const session = await prisma.agentSession.findUnique({
      where: { sessionId: sessionIdParam },
      select: { sessionId: true, userId: true },
    })
    if (!session) {
      return res.status(404).json({ error: 'Không tìm thấy session' })
    }

    const rows = await prisma.agentSessionMessage.findMany({
      where: { sessionId: sessionIdParam },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        chatRole: true,
        content: true,
        fileIds: true,
        dynamicProfile: true,
        tokensCount: true,
        createdAt: true,
      },
    })

    const data = rows.map((r) =>
      jsonSafe({
        conversation_id: String(r.id),
        content: r.content,
        chat_role: r.chatRole,
        files: r.fileIds,
        dynamic_profile: r.dynamicProfile,
        tokens_count: r.tokensCount,
        created_at: r.createdAt.toISOString(),
      })
    )

    return res.status(200).json(
      jsonSafe({
        user_id: session.userId,
        session_id: sessionIdParam,
        data,
      })
    )
  } catch (err) {
    console.error('[agentIntegration GET conversations]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * GET /users/:userId/learning_history
 */
router.get('/users/:userId/learning_history', async (req, res) => {
  const userId = String(req.params.userId || '').trim()
  try {
    if (!userId) {
      warnBadRequest(req, 'thiếu user_id path')
      return res.status(400).json({ error: 'Thiếu user_id' })
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true },
    })
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' })
    }

    const rows = await prisma.$queryRaw`
      SELECT s.subject_name AS subject_name, s.outline AS outline
      FROM class_students cs
      INNER JOIN classes c ON c.class_id = cs.class_id
      INNER JOIN subjects s ON s.subject_code = c.subject_code
      WHERE cs.student_id = ${userId}
        AND cs.study_status = 'Completed'::study_status_enum
      ORDER BY s.subject_name
    `

    const list = Array.isArray(rows) ? rows : []
    const learning_history = list.map((r) => ({
      subject_name: r.subject_name,
      outline: normalizeOutline(r.outline),
    }))

    return res.status(200).json(
      jsonSafe({
        user_id: userId,
        learning_history,
      })
    )
  } catch (err) {
    if (isMissingRelationError(err)) {
      console.warn(
        '[agentIntegration GET learning_history] thiếu bảng học vụ (class_students / …). Trả learning_history rỗng. Chạy backend/init/02_core_schema.sql nếu cần đầy đủ.'
      )
      return res.status(200).json(
        jsonSafe({ user_id: userId, learning_history: [] })
      )
    }
    console.error('[agentIntegration GET learning_history]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * GET /users/:userId/schedule
 */
router.get('/users/:userId/schedule', async (req, res) => {
  const userId = String(req.params.userId || '').trim()
  try {
    if (!userId) {
      warnBadRequest(req, 'thiếu user_id path')
      return res.status(400).json({ error: 'Thiếu user_id' })
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true },
    })
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' })
    }

    const rows = await prisma.$queryRaw`
      SELECT
        s.subject_name AS subject_name,
        s.credits AS credits,
        c.class_id AS class_id,
        c.day_of_week::text AS day_of_week,
        c.start_lesson AS start_lesson,
        c.end_lesson AS end_lesson,
        c.room AS room,
        c.semester_id AS semester_id
      FROM class_students cs
      INNER JOIN classes c ON c.class_id = cs.class_id
      INNER JOIN subjects s ON s.subject_code = c.subject_code
      WHERE cs.student_id = ${userId}
        AND cs.study_status = 'Registered'::study_status_enum
      ORDER BY c.day_of_week, c.start_lesson
    `

    const list = Array.isArray(rows) ? rows : []
    const schedule = list.map((r) => ({
      subject_name: r.subject_name,
      credits: r.credits != null ? Number(r.credits) : null,
      class_id: r.class_id,
      day_of_week: r.day_of_week,
      start_lesson: r.start_lesson != null ? Number(r.start_lesson) : null,
      end_lesson: r.end_lesson != null ? Number(r.end_lesson) : null,
      room: r.room,
      semester_id: r.semester_id,
    }))

    return res.status(200).json(
      jsonSafe({
        user_id: userId,
        schedule,
      })
    )
  } catch (err) {
    if (isMissingRelationError(err)) {
      console.warn(
        '[agentIntegration GET schedule] thiếu bảng học vụ (class_students / …). Trả schedule rỗng. Chạy backend/init/02_core_schema.sql nếu cần đầy đủ.'
      )
      return res.status(200).json(
        jsonSafe({ user_id: userId, schedule: [] })
      )
    }
    console.error('[agentIntegration GET schedule]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * POST /users/:userId/reminders — đăng ký nhắc việc (Reminder Agent / tool).
 */
router.post('/users/:userId/reminders', async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim()
    const body = integrationBody(req)
    const bodyUserId = pickStr(body, 'user_id', 'userId')
    const messageRaw =
      body.message !== undefined && body.message !== null ? String(body.message) : ''
    const message = messageRaw.trim()
    const reminderRaw = body.reminder_at ?? body.reminderAt

    if (!userId || !bodyUserId || bodyUserId !== userId) {
      warnBadRequest(req, 'user_id path/body không khớp (reminders)')
      return res.status(400).json({ error: 'user_id path và body phải nhất quán' })
    }
    if (!message) {
      warnBadRequest(req, 'thiếu message reminder')
      return res.status(400).json({ error: 'message không được để trống' })
    }

    const reminderAt =
      reminderRaw instanceof Date ? reminderRaw : new Date(reminderRaw)
    if (Number.isNaN(reminderAt.getTime())) {
      warnBadRequest(req, 'reminder_at không parse được thành ngày giờ', {
        got: reminderRaw,
      })
      return res.status(400).json({
        error: 'reminder_at phải là ISO 8601 hoặc timestamp hợp lệ',
      })
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true },
    })
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' })
    }

    const row = await prisma.agentUserReminder.create({
      data: {
        userId,
        reminderAt,
        message,
      },
    })

    return res.status(201).json(
      jsonSafe({
        reminder_id: String(row.id),
        user_id: userId,
        reminder_at: row.reminderAt.toISOString(),
        message: row.message,
      })
    )
  } catch (err) {
    console.error('[agentIntegration POST reminders]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * GET /users/:userId/reminders — danh sách nhắc việc (sắp xếp theo thời gian).
 */
router.get('/users/:userId/reminders', async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim()
    if (!userId) {
      warnBadRequest(req, 'thiếu user_id path (reminders GET)')
      return res.status(400).json({ error: 'Thiếu user_id' })
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true },
    })
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' })
    }

    const limitRaw = Number.parseInt(String(req.query.limit ?? '50'), 10)
    const limit = Math.min(Number.isFinite(limitRaw) ? limitRaw : 50, 200)

    const rows = await prisma.agentUserReminder.findMany({
      where: { userId },
      orderBy: { reminderAt: 'asc' },
      take: limit,
      select: {
        id: true,
        reminderAt: true,
        message: true,
        createdAt: true,
      },
    })

    const reminders = rows.map((r) =>
      jsonSafe({
        reminder_id: String(r.id),
        reminder_at: r.reminderAt.toISOString(),
        message: r.message,
        created_at: r.createdAt.toISOString(),
      })
    )

    return res.status(200).json(jsonSafe({ user_id: userId, reminders }))
  } catch (err) {
    console.error('[agentIntegration GET reminders]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * GET /users/:userId/journal-status — trạng thái nộp journal của user theo từng đợt đang active.
 * Trả về list period + đã nộp (submitted) hay chưa (not_submitted) cho mỗi đợt.
 */
router.get('/users/:userId/journal-status', async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim()
    if (!userId) {
      warnBadRequest(req, 'thiếu user_id path (journal-status)')
      return res.status(400).json({ error: 'Thiếu user_id' })
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true },
    })
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' })
    }

    const now = new Date()
    const periods = await prisma.journalPeriod.findMany({
      where: { endsAt: { gte: now } },
      orderBy: { endsAt: 'asc' },
    })

    const uploads = await prisma.journalUpload.findMany({
      where: {
        userId,
        periodId: { in: periods.map((p) => p.periodId) },
      },
      select: { periodId: true, submittedAt: true, originalFileName: true, status: true },
    })

    const uploadMap = new Map(uploads.map((u) => [u.periodId, u]))

    const statuses = periods.map((p) => {
      const upload = uploadMap.get(p.periodId)
      return jsonSafe({
        period_id: p.periodId,
        title: p.title,
        description: p.description,
        starts_at: p.startsAt.toISOString(),
        ends_at: p.endsAt.toISOString(),
        submitted: upload != null,
        submitted_at: upload?.submittedAt ? upload.submittedAt.toISOString() : null,
        file_name: upload?.originalFileName ?? null,
        upload_status: upload?.status ?? null,
      })
    })

    return res.status(200).json(jsonSafe({ user_id: userId, journal_status: statuses }))
  } catch (err) {
    console.error('[agentIntegration GET journal-status]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * GET /users/:userId/journal-context — toàn bộ nội dung (extracted_text) journal user đã submit.
 * Dùng cho Agent đọc context bài viết để đưa lời khuyên / trả lời câu hỏi trong ngữ cảnh submission.
 */
router.get('/users/:userId/journal-context', async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim()
    if (!userId) {
      warnBadRequest(req, 'thiếu user_id path (journal-context)')
      return res.status(400).json({ error: 'Thiếu user_id' })
    }
    const context = await getJournalContextSummary(userId)
    return res.status(200).json({ user_id: userId, journal_context: context })
  } catch (err) {
    console.error('[agentIntegration GET journal-context]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * GET /journal-periods — danh sách đợt nộp journal đang diễn ra hoặc sắp tới (Reminder Agent).
 * Không cần userId; trả về các period có ends_at >= now.
 */
router.get('/journal-periods', async (req, res) => {
  try {
    const now = new Date()
    const rows = await prisma.journalPeriod.findMany({
      where: { endsAt: { gte: now } },
      orderBy: { endsAt: 'asc' },
    })
    return res.status(200).json(
      jsonSafe({
        periods: rows.map((p) => ({
          period_id: p.periodId,
          title: p.title,
          description: p.description,
          starts_at: p.startsAt.toISOString(),
          ends_at: p.endsAt.toISOString(),
        })),
      })
    )
  } catch (err) {
    console.error('[agentIntegration GET journal-periods]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
