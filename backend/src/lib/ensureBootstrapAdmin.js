import { Gender, UserRole } from '@prisma/client'
import { prisma } from './prisma.js'
import { hashPassword } from './password.js'

const DEFAULT_MAJOR = '0000000'

/**
 * Tùy chọn khi deploy (Railway/Docker): tạo một tài khoản admin nếu chưa tồn tại.
 * Không ghi đè mật khẩu / vai trò nếu username đã có — tránh reset sau mỗi deploy.
 *
 * Bật: ENSURE_DEFAULT_ADMIN=1
 * Khuyến nghị đặt: ADMIN_BOOTSTRAP_PASSWORD (production: chuỗi mạnh).
 * Nếu thiếu mật khẩu trên production → bỏ qua (log cảnh báo).
 */
export async function ensureBootstrapAdmin() {
  if (process.env.ENSURE_DEFAULT_ADMIN !== '1') return

  const username = (process.env.ADMIN_BOOTSTRAP_USERNAME || 'admin').trim().slice(0, 50)
  const userId = (process.env.ADMIN_BOOTSTRAP_USER_ID || 'A00001').trim().slice(0, 10)
  const fullname = (process.env.ADMIN_BOOTSTRAP_FULLNAME || 'Quản trị hệ thống').trim().slice(0, 100)

  let password = typeof process.env.ADMIN_BOOTSTRAP_PASSWORD === 'string'
    ? process.env.ADMIN_BOOTSTRAP_PASSWORD.trim()
    : ''
  if (!password) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[bootstrap-admin] ENSURE_DEFAULT_ADMIN=1 nhưng thiếu ADMIN_BOOTSTRAP_PASSWORD — bỏ qua tạo admin'
      )
      return
    }
    password = 'admin123'
    console.warn('[bootstrap-admin] dùng mật khẩu mặc định dev (admin123) — không dùng trên production')
  }

  try {
    const byName = await prisma.user.findUnique({
      where: { username },
      select: { userId: true, username: true },
    })
    if (byName) {
      console.info(
        '[bootstrap-admin] username %s đã tồn tại (%s) — không tạo / không đổi mật khẩu',
        byName.username,
        byName.userId
      )
      return
    }
    const byId = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true, username: true },
    })
    if (byId) {
      console.info(
        '[bootstrap-admin] userId %s đã dùng bởi %s — bỏ qua (đổi ADMIN_BOOTSTRAP_USER_ID hoặc tạo tay)',
        byId.userId,
        byId.username
      )
      return
    }

    await prisma.major.upsert({
      where: { majorCode: DEFAULT_MAJOR },
      create: { majorCode: DEFAULT_MAJOR, majorName: 'Mặc định' },
      update: {},
    })

    const pwd = await hashPassword(password)
    await prisma.user.create({
      data: {
        userId,
        username,
        pwd,
        fullname,
        userRole: UserRole.admin,
        dateOfBirth: new Date('1990-01-01'),
        gender: Gender.Other,
        majorCode: DEFAULT_MAJOR,
        trainingProgramType: 'Chính quy',
        citizenIdentification: `009000000001-${userId}`.slice(0, 20),
        dateOfIssue: new Date('2015-01-01'),
        placeOfIssue: 'TP.HCM',
        ethnicity: 'Kinh',
        religion: 'Không',
        permanentAddress: '—',
        contactAddress: '—',
        phoneNumber: '0900000001',
        email: `${username}@bootstrap.local`.slice(0, 100),
        userClass: null,
      },
    })

    console.info('[bootstrap-admin] đã tạo admin username=%s userId=%s', username, userId)
  } catch (err) {
    console.warn(
      '[bootstrap-admin]',
      err instanceof Error ? err.message : String(err)
    )
  }
}
