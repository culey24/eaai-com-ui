/**
 * OpenRouter — API tương thích OpenAI chat/completions.
 * @see https://openrouter.ai/docs
 */

const DEFAULT_BASE = 'https://openrouter.ai/api/v1'
const DEFAULT_MODEL = 'google/gemini-2.0-flash-001'

/**
 * @param {{ role: string, content: string }[]} messages
 * @returns {Promise<string>}
 */
export async function openRouterChatCompletion(messages) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey?.trim()) {
    throw new Error('Thiếu OPENROUTER_API_KEY')
  }
  const base = (process.env.OPENROUTER_API_BASE || DEFAULT_BASE).replace(/\/$/, '')
  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL
  const referer = process.env.OPENROUTER_HTTP_REFERER || 'https://localhost'
  const title = process.env.OPENROUTER_APP_TITLE || 'eaai-com-backend'

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
      'HTTP-Referer': referer,
      'X-Title': title,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: Math.min(Number(process.env.OPENROUTER_MAX_TOKENS) || 1024, 4096),
      temperature: Math.min(Math.max(Number(process.env.OPENROUTER_TEMPERATURE) || 0.6, 0), 2),
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('[OpenRouter Error Response]', JSON.stringify(data, null, 2))
    const msg = data?.error?.message || data?.message || res.statusText || 'OpenRouter lỗi'
    throw new Error(msg)
  }
  const text = data?.choices?.[0]?.message?.content
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('OpenRouter trả về nội dung rỗng')
  }
  return text.trim()
}
