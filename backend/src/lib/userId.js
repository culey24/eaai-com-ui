import { randomBytes } from 'crypto'
import { prisma } from './prisma.js'

/** user_id VARCHAR(10) — tiền tố S + hex ngẫu nhiên */
export async function allocateStudentUserId() {
  for (let i = 0; i < 24; i++) {
    const id = `S${randomBytes(5).toString('hex').slice(0, 9)}`
    if (id.length > 10) continue
    const existing = await prisma.user.findUnique({ where: { userId: id } })
    if (!existing) return id
  }
  throw new Error('Không tạo được user_id duy nhất')
}
