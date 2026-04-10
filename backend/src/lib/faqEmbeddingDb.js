import { prisma } from './prisma.js'

/**
 * Xóa vector đã lưu khi admin sửa nội dung FAQ — Python sẽ embed lại ở lần sync sau.
 * Bỏ qua lỗi nếu migration pgvector chưa chạy (cột chưa tồn tại).
 */
export async function clearFaqEmbeddingById(id) {
  let bid
  try {
    bid = typeof id === 'bigint' ? id : BigInt(String(id))
  } catch {
    return
  }
  try {
    await prisma.$executeRaw`
      UPDATE faq_entries
      SET embedding = NULL, embedding_model = NULL
      WHERE faq_id = ${bid}
    `
  } catch (err) {
    const code = err?.code
    const msg = String(err?.message || '')
    if (code === '42703' || msg.includes('embedding') || msg.includes('does not exist')) {
      return
    }
    throw err
  }
}
