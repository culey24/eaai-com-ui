/**
 * Bọc window.fetch: nếu response 401 từ API backend và body có code TOKEN_EXPIRED,
 * gọi onSessionInvalid (logout + điều hướng do caller đảm nhiệm).
 * Bỏ qua /api/auth/login và /api/auth/register để không đá user khi nhập sai mật khẩu.
 */

function resolveRequestUrl(input) {
  if (typeof input === 'string') {
    return input.startsWith('http') ? input : new URL(input, window.location.origin).href
  }
  if (typeof Request !== 'undefined' && input instanceof Request) {
    return input.url
  }
  return ''
}

function isOurApiUrl(urlHref, apiBase) {
  const base = String(apiBase || '').replace(/\/$/, '')
  if (!base || !urlHref) return false
  return urlHref.startsWith(`${base}/`) || urlHref === base
}

function isAuthLoginOrRegister(urlHref) {
  try {
    const p = new URL(urlHref).pathname
    return p.includes('/api/auth/login') || p.includes('/api/auth/register')
  } catch {
    return false
  }
}

function isTokenExpiredPayload(data) {
  if (!data || typeof data !== 'object') return false
  if (data.code === 'TOKEN_EXPIRED') return true
  if (data.error === 'Token đã hết hạn') return true
  return false
}

/**
 * @param {{ apiBase: string, onSessionInvalid: () => void }} opts
 * @returns {() => void} gỡ bọc fetch
 */
export function installAuthFetchGuard(opts) {
  const { apiBase, onSessionInvalid } = opts
  const originalFetch = window.fetch.bind(window)
  let fired = false

  window.fetch = async function guardedFetch(input, init) {
    const res = await originalFetch(input, init)

    if (res.status !== 401) return res

    const urlHref = resolveRequestUrl(input)
    if (!isOurApiUrl(urlHref, apiBase) || isAuthLoginOrRegister(urlHref)) {
      return res
    }

    let data = null
    try {
      data = await res.clone().json()
    } catch {
      return res
    }

    if (!isTokenExpiredPayload(data)) return res

    if (!fired) {
      fired = true
      queueMicrotask(() => {
        try {
          onSessionInvalid()
        } finally {
          setTimeout(() => {
            fired = false
          }, 500)
        }
      })
    }

    return res
  }

  return () => {
    window.fetch = originalFetch
  }
}
