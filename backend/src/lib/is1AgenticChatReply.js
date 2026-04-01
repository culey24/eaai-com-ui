import { prisma } from './prisma.js'
import { AgentSessionStatus } from '@prisma/client'
import { GoogleAuth } from 'google-auth-library'

function chatbotBaseUrl() {
  const raw = process.env.AGENTIC_CHATBOT_BASE_URL ?? ''
  const u = String(raw).trim().replace(/\/$/, '')
  return u || null
}

/**
 * Cloud Run (private): cần Identity Token với audience = URL gốc của service.
 * - AGENTIC_CHATBOT_BEARER_TOKEN: token tĩnh / CI (vd. output của gcloud auth print-identity-token)
 * - AGENTIC_CHATBOT_GOOGLE_AUDIENCE: audience; lấy token qua Application Default Credentials
 * - AGENTIC_CHATBOT_USE_GCP_ID_TOKEN=1: dùng AGENTIC_CHATBOT_BASE_URL làm audience (tiện khi trùng URL Cloud Run)
 */
async function getChatbotAuthorizationHeader() {
  const bearer = String(process.env.AGENTIC_CHATBOT_BEARER_TOKEN ?? '').trim()
  if (bearer) {
    return { header: `Bearer ${bearer}` }
  }

  let audience = String(process.env.AGENTIC_CHATBOT_GOOGLE_AUDIENCE ?? '').trim().replace(/\/$/, '')
  const useBase =
    process.env.AGENTIC_CHATBOT_USE_GCP_ID_TOKEN === '1' ||
    process.env.AGENTIC_CHATBOT_USE_GCP_ID_TOKEN === 'true'
  if (!audience && useBase) {
    audience = chatbotBaseUrl() || ''
  }
  if (!audience) {
    return { header: null }
  }

  const auth = new GoogleAuth()
  const client = await auth.getIdTokenClient(audience)
  const token = await client.fetchIdToken(audience)
  return { header: `Bearer ${token}` }
}

function summarizeChatbotFailure(status, data, hadAuth) {
  const raw = typeof data?.raw === 'string' ? data.raw : ''
  const looksLikeGoogle403Html =
    status === 403 &&
    (raw.includes('403 Forbidden') ||
      raw.includes('does not have permission') ||
      (raw.includes('<html') && raw.includes('Forbidden')))

  let msg =
    typeof data?.error === 'string'
      ? data.error
      : data?.error != null
        ? JSON.stringify(data.error)
        : raw
          ? raw.slice(0, 800)
          : `HTTP ${status}`

  if (looksLikeGoogle403Html && !hadAuth) {
    msg =
      'HTTP 403 (Cloud Run / IAP: service yêu cầu xác thực). Đặt AGENTIC_CHATBOT_GOOGLE_AUDIENCE=https://<service-host> (cùng URL gốc Cloud Run) và cấp ADC hoặc service account có run.invoker; hoặc AGENTIC_CHATBOT_BEARER_TOKEN; hoặc bật "Allow unauthenticated invocations" trên Cloud Run.'
  } else if (looksLikeGoogle403Html && hadAuth) {
    msg =
      'HTTP 403 dù đã gửi Bearer — kiểm tra audience đúng URL Cloud Run, service account có quyền Invoker, hoặc token còn hạn.'
  }

  return msg
}

/** ADK /run hoặc proxy trả {"detail":"Session not found"} khi RAM agent mất session nhưng DB eaai vẫn giữ UUID. */
function isAdkSessionNotFound(data) {
  const d = data?.detail
  if (typeof d === 'string' && d.toLowerCase().includes('session not found')) return true
  const raw = typeof data?.raw === 'string' ? data.raw : ''
  if (raw.includes('Session not found')) return true
  const errStr = typeof data?.error === 'string' ? data.error : ''
  if (errStr.includes('Session not found')) return true
  return false
}

async function fetchChatbot(path, { method, body, timeoutMs }) {
  const base = chatbotBaseUrl()
  if (!base) return { ok: false, status: 0, data: {}, hadAuth: false }

  const { header: authz } = await getChatbotAuthorizationHeader().catch((e) => {
    throw new Error(
      `Không lấy được token gọi chatbot (GCP/ADC): ${e instanceof Error ? e.message : String(e)}. ` +
        'Local: thử `gcloud auth application-default login` hoặc đặt GOOGLE_APPLICATION_CREDENTIALS.'
    )
  })
  const hadAuth = Boolean(authz)
  const headers = { 'Content-Type': 'application/json' }
  if (authz) headers.Authorization = authz

  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    method,
    headers,
    body: body != null ? body : method === 'POST' ? '{}' : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  })
  const text = await res.text()
  let data = {}
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }
  }
  return { ok: res.ok, status: res.status, data, hadAuth }
}

/**
 * Đảm bảo có phiên agent (bảng agent_sessions) và ADK đã nhận session.
 * Chatbot agentic_assistant: POST /users/:userId/sessions tạo bản ghi BE + gọi Agent Server.
 */
async function ensureAgenticChatSession(userId) {
  const base = chatbotBaseUrl()
  if (!base) return null

  const existing = await prisma.agentSession.findFirst({
    where: { userId, status: AgentSessionStatus.active },
    orderBy: { createdAt: 'desc' },
    select: { sessionId: true },
  })
  if (existing) return existing.sessionId

  const created = await fetchChatbot(`/users/${encodeURIComponent(userId)}/sessions`, {
    method: 'POST',
    body: '{}',
    timeoutMs: 120_000,
  })
  if (!created.ok) {
    const err = summarizeChatbotFailure(created.status, created.data, created.hadAuth)
    throw new Error(`Không tạo được phiên agent: ${err}`)
  }

  const row = await prisma.agentSession.findFirst({
    where: { userId, status: AgentSessionStatus.active },
    orderBy: { createdAt: 'desc' },
    select: { sessionId: true },
  })
  if (!row) {
    throw new Error('Phiên agent không xuất hiện trong DB sau khi tạo')
  }
  return row.sessionId
}

/**
 * Học viên IS-1 — phản hồi từ chatbot agentic_assistant (Google Cloud).
 * @returns {Promise<string|null>} Nội dung trợ lý; null nếu chưa cấu hình AGENTIC_CHATBOT_BASE_URL.
 */
export async function generateIs1AgenticReply(userId, userMessageText) {
  const base = chatbotBaseUrl()
  if (!base) return null

  const chatBody = (sid) =>
    JSON.stringify({
      user_id: userId,
      session_id: sid,
      message: userMessageText ?? '',
    })

  let sessionId = await ensureAgenticChatSession(userId)
  let reply = await fetchChatbot('/chat-with-agent', {
    method: 'POST',
    body: chatBody(sessionId),
    timeoutMs: 300_000,
  })

  if (!reply.ok && isAdkSessionNotFound(reply.data)) {
    await prisma.agentSession.deleteMany({ where: { userId } })
    sessionId = await ensureAgenticChatSession(userId)
    reply = await fetchChatbot('/chat-with-agent', {
      method: 'POST',
      body: chatBody(sessionId),
      timeoutMs: 300_000,
    })
  }

  if (!reply.ok) {
    const err = summarizeChatbotFailure(reply.status, reply.data, reply.hadAuth)
    throw new Error(typeof err === 'string' ? err : JSON.stringify(err))
  }
  const text = reply.data?.text
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Agent trả về nội dung rỗng')
  }
  return text.trim()
}
