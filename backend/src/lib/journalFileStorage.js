import path from 'path'
import { mkdir, writeFile, unlink, readFile, readdir, stat } from 'fs/promises'
import { Storage } from '@google-cloud/storage'

const GCS_KEY_PREFIX = 'gcs:'

let storageClient = null

function getBucketName() {
  return String(process.env.GCS_BUCKET_NAME || '').trim()
}

export function journalUsesGcs() {
  return getBucketName().length > 0
}

function getStorage() {
  if (!storageClient) storageClient = new Storage()
  return storageClient
}

function uploadRootDir() {
  const rel = (process.env.JOURNAL_UPLOAD_DIR || 'uploads/journals').replace(/^\/+/, '')
  return path.resolve(process.cwd(), rel)
}

export function safeJournalPathParts(userId, periodId) {
  const safeUser = String(userId || '').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 32)
  const safePeriod = String(periodId || '').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 64)
  return { safeUser, safePeriod }
}

/**
 * @param {string} userId
 * @param {string} periodId
 * @param {string} storedName
 */
export function buildGcsObjectName(userId, periodId, storedName) {
  const { safeUser, safePeriod } = safeJournalPathParts(userId, periodId)
  return `journals/${safeUser}/${safePeriod}/${storedName}`
}

/**
 * @param {object} opts
 * @param {Buffer} opts.buffer
 * @param {string} [opts.contentType]
 * @param {string} opts.userId
 * @param {string} opts.periodId
 * @param {string} opts.storedName
 * @returns {Promise<{ storageKey: string }>}
 */
export async function saveJournalUpload(opts) {
  const { buffer, contentType, userId, periodId, storedName } = opts
  if (journalUsesGcs()) {
    const bucketName = getBucketName()
    const objectName = buildGcsObjectName(userId, periodId, storedName)
    const bucket = getStorage().bucket(bucketName)
    const file = bucket.file(objectName)
    await file.save(buffer, {
      contentType: contentType && String(contentType).slice(0, 255) || 'application/octet-stream',
      resumable: false,
      metadata: {
        cacheControl: 'private, max-age=0',
      },
    })
    return { storageKey: `${GCS_KEY_PREFIX}${objectName}` }
  }

  const root = uploadRootDir()
  const { safeUser, safePeriod } = safeJournalPathParts(userId, periodId)
  const userPeriodDir = path.join(root, safeUser, safePeriod)
  await mkdir(userPeriodDir, { recursive: true })
  const fullPath = path.join(userPeriodDir, storedName)
  await writeFile(fullPath, buffer)
  const storageKey = path.relative(process.cwd(), fullPath).split(path.sep).join('/')
  return { storageKey }
}

/**
 * @param {string | null | undefined} storageKey
 */
/**
 * Đọc nội dung file journal (đĩa hoặc GCS). Lỗi path/key → throw.
 * @returns {Promise<{ buffer: Buffer, contentType: string }>}
 */
export async function readJournalUpload(storageKey) {
  if (!storageKey || typeof storageKey !== 'string') {
    throw new Error('missing storage key')
  }

  if (storageKey.startsWith(GCS_KEY_PREFIX)) {
    if (!journalUsesGcs()) {
      throw new Error('GCS not configured for this key')
    }
    const objectName = storageKey.slice(GCS_KEY_PREFIX.length)
    if (!objectName || objectName.includes('..')) {
      throw new Error('invalid GCS object name')
    }
    const bucket = getStorage().bucket(getBucketName())
    const file = bucket.file(objectName)
    const [buffer] = await file.download()
    const [metadata] = await file.getMetadata()
    const contentType =
      (metadata?.contentType && String(metadata.contentType).slice(0, 200)) ||
      'application/octet-stream'
    return { buffer, contentType }
  }

  if (storageKey.includes('..')) {
    throw new Error('invalid path')
  }
  const abs = path.resolve(process.cwd(), storageKey)
  const root = uploadRootDir()
  if (!abs.startsWith(root)) {
    throw new Error('path outside journal root')
  }
  const buffer = await readFile(abs)
  return { buffer, contentType: 'application/octet-stream' }
}

/**
 * Đọc file journal; nếu path trong DB là bản cũ (thiếu thư mục period do path.join bỏ segment rỗng),
 * thử thêm `userId/periodId/basename` dưới JOURNAL_UPLOAD_DIR.
 * @param {string} storageKey
 * @param {{ userId?: string, periodId?: string }} [opts]
 */
export async function readJournalUploadWithFallback(storageKey, opts = {}) {
  const { userId, periodId } = opts
  try {
    return await readJournalUpload(storageKey)
  } catch (err) {
    if (
      err?.code !== 'ENOENT' ||
      !userId ||
      periodId == null ||
      String(periodId).trim() === '' ||
      (typeof storageKey === 'string' && storageKey.startsWith(GCS_KEY_PREFIX))
    ) {
      throw err
    }
    const base = path.basename(String(storageKey).replace(/\\/g, '/'))
    if (!base || base === '.' || base === '..') {
      throw err
    }
    const root = uploadRootDir()
    const { safeUser, safePeriod } = safeJournalPathParts(userId, periodId)
    const altFull = path.join(root, safeUser, safePeriod, base)
    const altKey = path.relative(process.cwd(), altFull).split(path.sep).join('/')
    if (altKey === String(storageKey).replace(/\\/g, '/')) {
      throw err
    }
    return await readJournalUpload(altKey)
  }
}

/**
 * Liệt kê các storage_key tương ứng mọi file journal dưới prefix user+period (tên object giảm dần — thường mới nhất trước).
 */
export async function listJournalStorageKeysInPeriod(userId, periodId) {
  const { safeUser, safePeriod } = safeJournalPathParts(userId, periodId)
  const rootResolved = path.resolve(uploadRootDir())

  if (journalUsesGcs()) {
    const prefix = `journals/${safeUser}/${safePeriod}/`
    try {
      const bucket = getStorage().bucket(getBucketName())
      const [files] = await bucket.getFiles({ prefix })
      return files
        .map((f) => `${GCS_KEY_PREFIX}${f.name}`)
        .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    } catch (err) {
      console.error('[journalFileStorage] listJournalStorageKeysInPeriod (GCS)', err)
      return []
    }
  }

  const dir = path.join(uploadRootDir(), safeUser, safePeriod)
  try {
    const names = await readdir(dir)
    const keys = []
    for (const name of names) {
      const abs = path.resolve(dir, name)
      if (!abs.startsWith(rootResolved)) continue
      try {
        const st = await stat(abs)
        if (!st.isFile()) continue
      } catch {
        continue
      }
      keys.push(path.relative(process.cwd(), abs).split(path.sep).join('/'))
    }
    return keys.sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
  } catch {
    return []
  }
}

/**
 * Xóa toàn bộ object journal trong prefix journals/{user}/{period}/ (GCS hoặc thư mục đĩa).
 * Dùng trước khi nộp lại / sau khi học viên xóa bài, để gom về 0 file trước khi ghi bản mới.
 */
export async function removeAllJournalObjectsInPeriod(userId, periodId) {
  const { safeUser, safePeriod } = safeJournalPathParts(userId, periodId)
  const rootResolved = path.resolve(uploadRootDir())

  if (journalUsesGcs()) {
    const prefix = `journals/${safeUser}/${safePeriod}/`
    try {
      const bucket = getStorage().bucket(getBucketName())
      const [files] = await bucket.getFiles({ prefix })
      for (const f of files) {
        try {
          await f.delete({ ignoreNotFound: true })
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      console.error('[journalFileStorage] removeAllJournalObjectsInPeriod (GCS)', err)
    }
    return
  }

  const dir = path.join(uploadRootDir(), safeUser, safePeriod)
  try {
    const names = await readdir(dir)
    for (const name of names) {
      const abs = path.resolve(dir, name)
      if (!abs.startsWith(rootResolved)) continue
      try {
        await unlink(abs)
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* thư mục chưa có */
  }
}

export async function removeJournalUpload(storageKey) {
  if (!storageKey || typeof storageKey !== 'string') return

  if (storageKey.startsWith(GCS_KEY_PREFIX)) {
    if (!journalUsesGcs()) {
      return
    }
    const objectName = storageKey.slice(GCS_KEY_PREFIX.length)
    if (!objectName || objectName.includes('..')) return
    try {
      await getStorage().bucket(getBucketName()).file(objectName).delete({ ignoreNotFound: true })
    } catch {
      /* ignore */
    }
    return
  }

  if (storageKey.includes('..')) return
  const abs = path.resolve(process.cwd(), storageKey)
  const root = uploadRootDir()
  if (!abs.startsWith(root)) return
  try {
    await unlink(abs)
  } catch {
    /* ignore */
  }
}
