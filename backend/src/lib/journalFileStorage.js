import path from 'path'
import { mkdir, writeFile, unlink } from 'fs/promises'
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
