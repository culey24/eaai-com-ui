import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { API_BASE } from '../../config/api'
import { ROLES } from '../../constants/roles'

function parseFilenameFromContentDisposition(header) {
  if (!header) return null
  const h = String(header)
  const star = /filename\*=UTF-8''([^;\s]+)/i.exec(h)
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].replace(/"/g, ''))
    } catch {
      return star[1]
    }
  }
  const q = /filename="([^"]+)"/i.exec(h)
  if (q?.[1]) return q[1]
  const u = /filename=([^;\s]+)/i.exec(h)
  if (u?.[1]) return u[1].replace(/^["']|["']$/g, '')
  return null
}

function canStaffDownloadJournal(role) {
  return role === ROLES.ADMIN || role === ROLES.ASSISTANT
}

export default function AdminJournalFileDownloadPage() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const { apiToken, user, isLoading } = useAuth()
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const learnerId = (searchParams.get('learnerId') || '').trim()
  const uploadId = (searchParams.get('uploadId') || '').trim()
  const backTo = user?.role === ROLES.ADMIN ? '/admin/submissions' : '/supporter/journal-export'
  const backLabel =
    user?.role === ROLES.ADMIN ? t('admin.submissions.title') : t('supporter.journalExport.title')

  useEffect(() => {
    if (!learnerId || !uploadId || !/^\d+$/.test(uploadId)) {
      setStatus('badparams')
      setMessage('')
      return
    }
    if (isLoading) {
      setStatus('hydrating')
      setMessage('')
      return
    }
    if (!apiToken || !canStaffDownloadJournal(user?.role)) {
      setStatus('auth')
      setMessage('')
      return
    }

    let cancelled = false
    setStatus('loading')
    setMessage('')

    ;(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/journal/learner/${encodeURIComponent(learnerId)}/file/${encodeURIComponent(uploadId)}`,
          { headers: { Authorization: `Bearer ${apiToken}` } }
        )
        const cd = res.headers.get('content-disposition')
        const fromHeader = parseFilenameFromContentDisposition(cd)
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          const errText =
            errBody?.error || errBody?.message || `HTTP ${res.status}`
          if (!cancelled) {
            setStatus('error')
            setMessage(String(errText))
          }
          return
        }
        const blob = await res.blob()
        const fname = (fromHeader && fromHeader.trim()) || 'journal'
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fname.slice(0, 200)
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        if (!cancelled) {
          setStatus('done')
          setMessage(fname)
        }
      } catch (e) {
        if (!cancelled) {
          setStatus('error')
          setMessage(e instanceof Error ? e.message : String(e))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [apiToken, user?.role, learnerId, uploadId, isLoading])

  return (
    <div className="flex flex-col min-h-0 flex-1 bg-white dark:bg-slate-900 p-8">
      <Link
        to={backTo}
        className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </Link>
      <div className="max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 p-6">
        {(status === 'hydrating' || status === 'loading') && (
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>
              {status === 'hydrating'
                ? t('admin.submissions.journalDownloadHydrating')
                : t('admin.submissions.journalDownloadLoading')}
            </span>
          </div>
        )}
        {status === 'done' && (
          <div className="flex items-start gap-3 text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{t('admin.submissions.journalDownloadDone')}</p>
              {message && <p className="text-sm mt-1 break-all opacity-90">{message}</p>}
            </div>
          </div>
        )}
        {(status === 'error' || status === 'badparams' || status === 'auth') && (
          <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                {status === 'badparams' && t('admin.submissions.journalDownloadBadParams')}
                {status === 'auth' && t('admin.submissions.journalDownloadNeedStaff')}
                {status === 'error' && t('admin.submissions.journalDownloadFailed')}
              </p>
              {message && status === 'error' && (
                <p className="text-sm mt-1 break-words opacity-90">{message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
