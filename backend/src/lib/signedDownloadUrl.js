import crypto from 'crypto'

/**
 * Link tải file journal dạng shared (không cần đăng nhập).
 * Chữ ký HMAC-SHA256 để chống giả mạo; có thể thu hồi bằng cách thêm key
 * vào bảng journal_download_revocations (kiểm tra ở route shared).
 *
 * Mặc định link VĨNH VIỄN (không exp). Nếu set DOWNLOAD_LINK_TTL_DAYS > 0 thì
 * chữ ký kèm thời hạn exp (ms).
 */

function secretValue() {
  const secret = process.env.DOWNLOAD_LINK_SECRET || process.env.JWT_SECRET || ''
  if (!secret) {
    throw new Error('DOWNLOAD_LINK_SECRET / JWT_SECRET is not set')
  }
  return secret
}

function ttlDays() {
  const n = Number(process.env.DOWNLOAD_LINK_TTL_DAYS || '0')
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Khóa định danh 1 file journal để ký / thu hồi. */
export function downloadKey(learnerId, uploadId) {
  return `journal:${String(learnerId)}:${String(uploadId)}`
}

function payloadFor(learnerId, uploadId, exp) {
  const key = downloadKey(learnerId, uploadId)
  return exp == null ? key : `${key}:${exp}`
}

export function signFileDownload({ learnerId, uploadId }) {
  const days = ttlDays()
  const exp = days > 0 ? Date.now() + days * 24 * 60 * 60 * 1000 : null
  const sig = crypto
    .createHmac('sha256', secretValue())
    .update(payloadFor(learnerId, uploadId, exp))
    .digest('hex')
  return { sig, exp }
}

export function verifyFileDownload({ learnerId, uploadId, sig, exp }) {
  if (!sig || typeof sig !== 'string') return false
  if (exp != null) {
    const expNum = Number(exp)
    if (!Number.isFinite(expNum) || expNum <= Date.now()) return false
  }
  const expected = crypto
    .createHmac('sha256', secretValue())
    .update(payloadFor(learnerId, uploadId, exp))
    .digest('hex')
  const a = Buffer.from(String(sig))
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/** Path đầy đủ (relative) tới route shared để nhúng vào CSV. */
export function buildSharedDownloadPath({ learnerId, uploadId }) {
  const { sig, exp } = signFileDownload({ learnerId, uploadId })
  const q = new URLSearchParams()
  q.set('sig', sig)
  if (exp) q.set('exp', String(exp))
  return `/api/journal/shared/${encodeURIComponent(String(learnerId))}/${encodeURIComponent(
    String(uploadId)
  )}?${q.toString()}`
}