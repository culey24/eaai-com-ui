import crypto from 'node:crypto'

/**
 * Bảo vệ tùy chọn cho route tích hợp agent (server-to-server).
 * AGENT_INTEGRATION_SECRET chỉ bật khi giá trị sau trim không rỗng; chỉ spaces → coi như tắt.
 * Client gửi header x-agent-integration-secret (so khớp constant-time khi cùng độ dài buffer).
 */
export function agentIntegrationAuth(req, res, next) {
  const raw = process.env.AGENT_INTEGRATION_SECRET
  const secret = raw == null ? '' : String(raw).trim()
  if (!secret) {
    return next()
  }

  const got = req.headers['x-agent-integration-secret']
  if (typeof got !== 'string') {
    console.warn('[agentIntegration] integration secret rejected', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      reason: 'header missing or not a string',
    })
    return res.status(401).json({ error: 'Unauthorized' })
  }

  let ok = false
  try {
    const a = Buffer.from(secret, 'utf8')
    const b = Buffer.from(got, 'utf8')
    ok = crypto.timingSafeEqual(a, b)
  } catch {
    ok = false
  }

  if (!ok) {
    console.warn('[agentIntegration] integration secret rejected', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      reason: 'mismatch',
    })
    return res.status(401).json({ error: 'Unauthorized' })
  }

  return next()
}
