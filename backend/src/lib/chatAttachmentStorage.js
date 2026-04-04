import path from 'path'
import { mkdir, writeFile, unlink, readFile } from 'fs/promises'
import { Storage } from '@google-cloud/storage'

const GCS_KEY_PREFIX = 'gcs:'

let storageClient = null

function getBucketName() {
  return String(process.env.GCS_BUCKET_NAME || '').trim()
}

export function chatAttachmentUsesGcs() {
  return getBucketName().length > 0
}

function getStorage() {
  if (!storageClient) storageClient = new Storage()
  return storageClient
}

function chatUploadRootDir() {
  const rel = (process.env.CHAT_UPLOAD_DIR || 'uploads/chat_attachments').replace(/^\/+/, '')
  return path.resolve(process.cwd(), rel)
}

function safeConvSegment(conversationId) {
  return String(conversationId ?? '')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .slice(0, 24)
}

export function buildGcsChatObjectName(conversationId, storedName) {
  const seg = safeConvSegment(conversationId)
  return `chat-attachments/${seg}/${storedName}`
}

function safeBaseName(name) {
  return String(name || 'file').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 200)
}

/**
 * @param {object} opts
 * @param {Buffer} opts.buffer
 * @param {string} [opts.contentType]
 * @param {string|bigint} opts.conversationId
 * @param {string} opts.storedName
 * @returns {Promise<{ storageKey: string }>}
 */
export async function saveChatAttachment(opts) {
  const { buffer, contentType, conversationId, storedName } = opts
  if (chatAttachmentUsesGcs()) {
    const bucketName = getBucketName()
    const objectName = buildGcsChatObjectName(conversationId, storedName)
    const file = getStorage().bucket(bucketName).file(objectName)
    await file.save(buffer, {
      contentType: (contentType && String(contentType).slice(0, 255)) || 'application/octet-stream',
      resumable: false,
      metadata: { cacheControl: 'private, max-age=0' },
    })
    return { storageKey: `${GCS_KEY_PREFIX}${objectName}` }
  }

  const root = chatUploadRootDir()
  const dir = path.join(root, safeConvSegment(conversationId))
  await mkdir(dir, { recursive: true })
  const fullPath = path.join(dir, storedName)
  await writeFile(fullPath, buffer)
  const storageKey = path.relative(process.cwd(), fullPath).split(path.sep).join('/')
  return { storageKey }
}

/**
 * @param {string | null | undefined} storageKey
 * @returns {Promise<{ buffer: Buffer, contentType: string }>}
 */
export async function readChatAttachment(storageKey) {
  if (!storageKey || typeof storageKey !== 'string') {
    throw new Error('missing storage key')
  }

  if (storageKey.startsWith(GCS_KEY_PREFIX)) {
    if (!chatAttachmentUsesGcs()) {
      throw new Error('GCS not configured for this key')
    }
    const objectName = storageKey.slice(GCS_KEY_PREFIX.length)
    if (!objectName || objectName.includes('..')) {
      throw new Error('invalid GCS object name')
    }
    const file = getStorage().bucket(getBucketName()).file(objectName)
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
  const root = chatUploadRootDir()
  if (!abs.startsWith(root)) {
    throw new Error('path outside chat upload root')
  }
  const buffer = await readFile(abs)
  return { buffer, contentType: 'application/octet-stream' }
}

export async function removeChatAttachment(storageKey) {
  if (!storageKey || typeof storageKey !== 'string') return

  if (storageKey.startsWith(GCS_KEY_PREFIX)) {
    if (!chatAttachmentUsesGcs()) return
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
  const root = chatUploadRootDir()
  if (!abs.startsWith(root)) return
  try {
    await unlink(abs)
  } catch {
    /* ignore */
  }
}
