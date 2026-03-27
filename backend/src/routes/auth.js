import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { signToken } from '../lib/jwt.js'
import { prismaRoleToApi } from '../lib/roles.js'
import { allocateStudentUserId } from '../lib/userId.js'
import { parseUserClass } from '../lib/classCode.js'
import { Gender, UserRole } from '@prisma/client'
import { authRouteLimiter } from '../lib/rateLimits.js'

const router = Router()

const DEFAULT_MAJOR = '0000000'

function userClassToApiLabel(uc) {
  if (uc == null) return null
  const m = { IS_1: 'IS-1', IS_2: 'IS-2', IS_3: 'IS-3' }
  return m[uc] || String(uc)
}

/**
 * POST /api/auth/register
 * Đăng ký learner (student) — khớp form: username, password, classCode, fullName
 */
router.post('/register', authRouteLimiter, async (req, res) => {
  try {
    const { username, password, classCode, fullName } = req.body || {}
    const u = typeof username === 'string' ? username.trim() : ''
    const p = typeof password === 'string' ? password : ''
    const fn = typeof fullName === 'string' ? fullName.trim() : ''
    const cc = typeof classCode === 'string' ? classCode.trim() : ''

    if (!u || !p || !cc) {
      return res.status(400).json({
        code: 'REGISTER_MISSING_FIELDS',
        error: 'Thiếu username, password hoặc classCode',
      })
    }
    if (p.length < 4) {
      return res.status(400).json({
        code: 'PASSWORD_TOO_SHORT',
        error: 'Mật khẩu tối thiểu 4 ký tự',
      })
    }

    const userClass = parseUserClass(cc)
    if (!userClass) {
      return res.status(400).json({
        code: 'INVALID_CLASS_CODE',
        error: 'Mã lớp không hợp lệ (IS-1, IS-2, IS-3)',
      })
    }

    const exists = await prisma.user.findUnique({ where: { username: u } })
    if (exists) {
      return res.status(409).json({
        code: 'ACCOUNT_EXISTS',
        error: 'Tài khoản đã tồn tại',
      })
    }

    if (!process.env.JWT_SECRET?.trim()) {
      return res.status(500).json({
        code: 'SERVER_MISCONFIG_JWT',
        error: 'Cấu hình máy chủ thiếu JWT_SECRET',
        message: 'Đặt biến JWT_SECRET trên Railway (Variables)',
      })
    }

    /* DB mới / chỉ migrate thường không có seed majors → findUnique null → 500. */
    await prisma.major.upsert({
      where: { majorCode: DEFAULT_MAJOR },
      create: { majorCode: DEFAULT_MAJOR, majorName: 'Mặc định' },
      update: {},
    })

    const userId = await allocateStudentUserId()
    const pwdHash = await hashPassword(p)
    const displayName = fn || u

    const user = await prisma.user.create({
      data: {
        userId,
        username: u,
        pwd: pwdHash,
        fullname: displayName.slice(0, 100),
        userRole: UserRole.student,
        dateOfBirth: new Date('2000-01-01'),
        gender: Gender.Other,
        majorCode: DEFAULT_MAJOR,
        trainingProgramType: 'Chính quy',
        userClass,
      },
    })

    const token = signToken({
      sub: user.userId,
      username: user.username,
      userRole: user.userRole,
    })

    return res.status(201).json({
      token,
      user: {
        userId: user.userId,
        username: user.username,
        role: prismaRoleToApi(user.userRole),
        fullname: user.fullname,
        classCode: user.userClass,
        managedClasses: [],
      },
    })
  } catch (err) {
    console.error('[auth/register]', err)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * POST /api/auth/login
 */
router.post('/login', authRouteLimiter, async (req, res) => {
  try {
    const { username, password } = req.body || {}
    const u = typeof username === 'string' ? username.trim() : ''
    const p = typeof password === 'string' ? password : ''
    if (!u || !p) {
      return res.status(400).json({
        code: 'LOGIN_MISSING_FIELDS',
        error: 'Thiếu username hoặc password',
      })
    }

    const user = await prisma.user.findUnique({ where: { username: u } })
    if (!user) {
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        error: 'Sai tài khoản hoặc mật khẩu',
      })
    }

    const ok = await verifyPassword(p, user.pwd, user.userId)
    if (!ok) {
      return res.status(401).json({
        code: 'INVALID_CREDENTIALS',
        error: 'Sai tài khoản hoặc mật khẩu',
      })
    }

    const token = signToken({
      sub: user.userId,
      username: user.username,
      userRole: user.userRole,
    })

    let managedClasses = []
    if (user.userRole === 'teacher') {
      const rows = await prisma.assistantManagedClass.findMany({
        where: { teacherId: user.userId },
        select: { userClass: true },
      })
      managedClasses = rows.map((r) => userClassToApiLabel(r.userClass)).filter(Boolean)
    }

    return res.status(200).json({
      token,
      user: {
        userId: user.userId,
        username: user.username,
        role: prismaRoleToApi(user.userRole),
        fullname: user.fullname,
        classCode: user.userClass,
        managedClasses,
      },
    })
  } catch (err) {
    console.error('[auth/login]', err)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
