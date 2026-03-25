/** Chuỗi hóa JSON an toàn với BigInt (id Prisma) */
export function jsonSafe(data) {
  return JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
  )
}
