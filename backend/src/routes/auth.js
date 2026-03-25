import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { signToken } from '../lib/jwt.js'
import { prismaRoleToApi } from '../lib/roles.js'
import { allocateStudentUserId } from '../lib/userId.js'
import { parseUserClass } from '../lib/classCode.js'
import { Gender, UserRole } from '@prisma/client'

const router = Router()

const DEFAULT_MAJOR = '0000000'

/**
 * POST /api/auth/register
 * Đăng ký learner (student) — khớp form: username, password, classCode, fullName
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, classCode, fullName } = req.body || {}
    const u = typeof username === 'string' ? username.trim() : ''
    const p = typeof password === 'string' ? password : ''
    const fn = typeof fullName === 'string' ? fullName.trim() : ''
    const cc = typeof classCode === 'string' ? classCode.trim() : ''

    if (!u || !p || !cc) {
      return res.status(400).json({ error: 'Thiếu username, password hoặc classCode' })
    }
    if (p.length < 4) {
      return res.status(400).json({ error: 'Mật khẩu tối thiểu 4 ký tự' })
    }

    const userClass = parseUserClass(cc)
    if (!userClass) {
      return res.status(400).json({ error: 'Mã lớp không hợp lệ (IS-1, IS-2, IS-3)' })
    }

    const exists = await prisma.user.findUnique({ where: { username: u } })
    if (exists) {
      return res.status(409).json({ error: 'Tài khoản đã tồn tại' })
    }

    const major = await prisma.major.findUnique({ where: { majorCode: DEFAULT_MAJOR } })
    if (!major) {
      return res.status(500).json({ error: 'Chưa có ngành mặc định trong DB (majors)' })
    }

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
      },
    })
  } catch (err) {
    console.error('[auth/register]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {}
    const u = typeof username === 'string' ? username.trim() : ''
    const p = typeof password === 'string' ? password : ''
    if (!u || !p) {
      return res.status(400).json({ error: 'Thiếu username hoặc password' })
    }

    const user = await prisma.user.findUnique({ where: { username: u } })
    if (!user) {
      return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' })
    }

    const ok = await verifyPassword(p, user.pwd, user.userId)
    if (!ok) {
      return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' })
    }

    const token = signToken({
      sub: user.userId,
      username: user.username,
      userRole: user.userRole,
    })

    return res.status(200).json({
      token,
      user: {
        userId: user.userId,
        username: user.username,
        role: prismaRoleToApi(user.userRole),
        fullname: user.fullname,
        classCode: user.userClass,
      },
    })
  } catch (err) {
    console.error('[auth/login]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
