import bcrypt from 'bcrypt'
import { prisma } from './prisma.js'

const ROUNDS = 12

export async function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS)
}

/**
 * So khớp bcrypt (đăng ký qua API) hoặc crypt() của pgcrypto (seed Docker cũ).
 */
export async function verifyPassword(plain, hash, userId) {
  if (!plain || !hash) return false
  try {
    if (await bcrypt.compare(plain, hash)) return true
  } catch {
    /* hash không phải bcrypt */
  }
  try {
    const rows = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM users u
        WHERE u.user_id = ${userId} AND u.pwd = crypt(${plain}, u.pwd)
      ) AS ok
    `
    return rows[0]?.ok === true
  } catch {
    return false
  }
}
