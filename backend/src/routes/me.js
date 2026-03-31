import { Router } from 'express'
import { Gender } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { authMiddleware } from '../middleware/auth.js'
import { prismaRoleToApi } from '../lib/roles.js'
import { jsonSafe } from '../lib/json.js'
import { validatePretestBody } from '../lib/pretestValidate.js'

const router = Router()
router.use(authMiddleware)

/** GET /api/me — giữ tương thích: payload từ JWT */
router.get('/', (req, res) => {
  res.status(200).json({ user: req.auth })
})

/**
 * GET /api/me/support-assignment
 * Học viên IS-3: đã có bản ghi learner_supporter_assignments hay chưa (mở kênh AGENT).
 */
router.get('/support-assignment', async (req, res) => {
  try {
    if (req.auth.userRole !== 'student') {
      return res.status(200).json(jsonSafe({ assigned: true, applicable: false }))
    }
    const row = await prisma.learnerSupporterAssignment.findUnique({
      where: { learnerId: req.auth.userId },
      select: { learnerId: true },
    })
    return res.status(200).json(jsonSafe({ assigned: !!row, applicable: true }))
  } catch (err) {
    console.error('[me/support-assignment]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

function genderToUi(g) {
  if (g === Gender.Male) return 'male'
  if (g === Gender.Female) return 'female'
  return 'other'
}

function parseGenderFromBody(raw) {
  if (raw == null || raw === '') return undefined
  const s = String(raw).trim().toLowerCase()
  if (s === 'male' || s === 'nam') return Gender.Male
  if (s === 'female' || s === 'nữ' || s === 'nu') return Gender.Female
  return Gender.Other
}

function formatDob(d) {
  if (!d) return ''
  try {
    const x = d instanceof Date ? d : new Date(d)
    if (Number.isNaN(x.getTime())) return ''
    return x.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

/** Prisma UserClass enum → mã lớp UI (IS-1, …) */
function userClassToUi(uc) {
  if (uc == null || uc === '') return 'Chưa cập nhật'
  const m = { IS_1: 'IS-1', IS_2: 'IS-2', IS_3: 'IS-3' }
  return m[uc] || String(uc)
}

/**
 * GET /api/me/profile
 * Hồ sơ đầy đủ từ DB (đồng bộ UI Cài đặt).
 */
router.get('/profile', async (req, res) => {
  try {
    const row = await prisma.user.findUnique({
      where: { userId: req.auth.userId },
      select: {
        userId: true,
        username: true,
        fullname: true,
        userRole: true,
        userClass: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        trainingProgramType: true,
        studentSchoolId: true,
        faculty: true,
        majorDisplay: true,
        subjectNote: true,
      },
    })
    if (!row) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' })
    }
    const profile = {
      userId: row.userId,
      username: row.username,
      fullname: row.fullname,
      role: prismaRoleToApi(row.userRole),
      classCode: userClassToUi(row.userClass),
      email: row.email ?? '',
      dateOfBirth: formatDob(row.dateOfBirth),
      gender: genderToUi(row.gender),
      trainingProgramType: row.trainingProgramType ?? '',
      studentId: row.studentSchoolId ?? '',
      faculty: row.faculty ?? '',
      major: row.majorDisplay ?? '',
      subject: row.subjectNote ?? '',
    }
    return res.status(200).json(jsonSafe({ profile }))
  } catch (err) {
    console.error('[me/profile GET]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * PATCH /api/me/profile
 * Chỉ learner (student) — cập nhật các trường Cài đặt.
 */
router.patch('/profile', async (req, res) => {
  try {
    if (req.auth.userRole !== 'student') {
      return res.status(403).json({
        code: 'PROFILE_LEARNER_ONLY',
        error: 'Chỉ tài khoản learner cập nhật hồ sơ này',
      })
    }

    const body = req.body || {}
    const data = {}

    if (body.email !== undefined) {
      const e = body.email != null ? String(body.email).trim().slice(0, 100) : ''
      data.email = e === '' ? null : e
    }
    if (body.studentId !== undefined) {
      const s = body.studentId != null ? String(body.studentId).trim().slice(0, 32) : ''
      data.studentSchoolId = s === '' || s === 'Chưa cập nhật' ? null : s
    }
    if (body.faculty !== undefined) {
      const s = body.faculty != null ? String(body.faculty).trim().slice(0, 200) : ''
      data.faculty = s === '' || s === 'Chưa cập nhật' ? null : s
    }
    if (body.major !== undefined) {
      const s = body.major != null ? String(body.major).trim().slice(0, 200) : ''
      data.majorDisplay = s === '' || s === 'Chưa cập nhật' ? null : s
    }
    if (body.subject !== undefined) {
      const s = body.subject != null ? String(body.subject).trim().slice(0, 255) : ''
      data.subjectNote = s === '' || s === 'Chưa cập nhật' ? null : s
    }
    if (body.trainingProgramType !== undefined) {
      data.trainingProgramType =
        body.trainingProgramType != null
          ? String(body.trainingProgramType).trim().slice(0, 100) || 'Chính quy'
          : 'Chính quy'
    }
    if (body.dateOfBirth !== undefined) {
      const raw = body.dateOfBirth != null ? String(body.dateOfBirth).trim() : ''
      if (raw === '') {
        /* NOT NULL trong schema — giữ nguyên nếu không gửi; nếu gửi rỗng thì không đổi */
      } else {
        const d = new Date(raw)
        if (!Number.isNaN(d.getTime())) {
          data.dateOfBirth = d
        }
      }
    }
    if (body.gender !== undefined) {
      const g = parseGenderFromBody(body.gender)
      if (g !== undefined) data.gender = g
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        code: 'PROFILE_NO_VALID_FIELDS',
        error: 'Không có trường hợp lệ để cập nhật',
      })
    }

    const updated = await prisma.user.update({
      where: { userId: req.auth.userId },
      data,
      select: {
        userId: true,
        username: true,
        fullname: true,
        userRole: true,
        userClass: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        trainingProgramType: true,
        studentSchoolId: true,
        faculty: true,
        majorDisplay: true,
        subjectNote: true,
      },
    })

    const profile = {
      userId: updated.userId,
      username: updated.username,
      fullname: updated.fullname,
      role: prismaRoleToApi(updated.userRole),
      classCode: userClassToUi(updated.userClass),
      email: updated.email ?? '',
      dateOfBirth: formatDob(updated.dateOfBirth),
      gender: genderToUi(updated.gender),
      trainingProgramType: updated.trainingProgramType ?? '',
      studentId: updated.studentSchoolId ?? '',
      faculty: updated.faculty ?? '',
      major: updated.majorDisplay ?? '',
      subject: updated.subjectNote ?? '',
    }
    return res.status(200).json(jsonSafe({ profile }))
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(409).json({
        code: 'PROFILE_DUPLICATE',
        error: 'Email hoặc trường unique bị trùng',
      })
    }
    console.error('[me/profile PATCH]', err)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * GET /api/me/pretest
 * Học viên: đã nộp PRETEST hay chưa. Vai khác: không áp dụng → completed.
 */
router.get('/pretest', async (req, res) => {
  try {
    if (req.auth.userRole !== 'student') {
      return res.status(200).json(jsonSafe({ applicable: false, completed: true }))
    }
    const row = await prisma.pretestResponse.findUnique({
      where: { userId: req.auth.userId },
      select: { createdAt: true },
    })
    return res.status(200).json(
      jsonSafe({
        applicable: true,
        completed: !!row,
        submittedAt: row?.createdAt ? row.createdAt.toISOString() : null,
      })
    )
  } catch (err) {
    console.error('[me/pretest GET]', err)
    return res.status(500).json({
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

/**
 * POST /api/me/pretest
 * Lưu khảo sát PRETEST (Section A, B, C) — học viên, một lần (ghi đè nếu gửi lại).
 */
router.post('/pretest', async (req, res) => {
  try {
    if (req.auth.userRole !== 'student') {
      return res.status(403).json({
        code: 'PRETEST_LEARNER_ONLY',
        error: 'Only learners submit the PRETEST',
      })
    }

    const errCode = validatePretestBody(req.body)
    if (errCode) {
      return res.status(400).json({
        code: 'PRETEST_VALIDATION',
        error: 'Invalid PRETEST payload',
        detail: errCode,
      })
    }

    const { sectionA, sectionB, sectionC } = req.body

    await prisma.pretestResponse.upsert({
      where: { userId: req.auth.userId },
      create: {
        userId: req.auth.userId,
        sectionA,
        sectionB,
        sectionC,
      },
      update: {
        sectionA,
        sectionB,
        sectionC,
      },
    })

    return res.status(201).json(jsonSafe({ ok: true }))
  } catch (err) {
    console.error('[me/pretest POST]', err)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      error: 'Lỗi máy chủ',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

export default router
