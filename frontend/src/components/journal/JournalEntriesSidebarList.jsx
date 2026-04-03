import { useMemo, useState } from 'react'
import { FileText, Calendar, Download, ExternalLink } from 'lucide-react'
import { useJournal } from '../../context/JournalContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import {
  parseJournalServerUploadId,
  fetchJournalFileBlob,
  journalFileCanOpenInBrowser,
} from '../../lib/journalFileDownload'

export function formatJournalEntryTs(ts) {
  if (ts == null || Number.isNaN(Number(ts))) return '—'
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatJournalFileSizeBytes(n) {
  if (n == null || n === '' || Number(n) <= 0) return null
  const v = Number(n)
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let x = v
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024
    i += 1
  }
  return `${i === 0 ? Math.round(x) : x.toFixed(1)} ${units[i]}`
}

/**
 * Sidebar journal: mỗi bản ghi gồm khối đợt nộp (submission) + file đã nộp.
 * @param {Array<{ id?: string, uploadId?: string, fileName?: string, uploadedAt?: number, fileSize?: number, submissionId?: string, deadlineId?: string }>} journals
 * @param {string | null} [downloadLearnerUserId] — user_id học viên trên backend; có thì hiện nút tải/mở (admin/supporter).
 */
export default function JournalEntriesSidebarList({ journals = [], downloadLearnerUserId = null }) {
  const { t } = useLanguage()
  const { apiToken } = useAuth()
  const [busyKey, setBusyKey] = useState(null)
  const { getSubmissions } = useJournal()
  const submissions = getSubmissions()
  const submissionById = useMemo(
    () => Object.fromEntries(submissions.map((s) => [s.id, s])),
    [submissions]
  )

  const safeList = Array.isArray(journals) ? journals.filter((j) => j && typeof j === 'object') : []

  const runWithFile = async (j, mode) => {
    const uploadId = parseJournalServerUploadId(j)
    if (!downloadLearnerUserId || !apiToken || !uploadId) return
    setBusyKey(uploadId)
    try {
      const blob = await fetchJournalFileBlob(apiToken, downloadLearnerUserId, uploadId)
      const url = URL.createObjectURL(blob)
      if (mode === 'open') {
        window.open(url, '_blank', 'noopener,noreferrer')
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = j.fileName || 'journal'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }
    } catch {
      window.alert(t('journal.downloadFailed'))
    } finally {
      setBusyKey(null)
    }
  }

  if (safeList.length === 0) {
    return (
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{t('journal.noVersions')}</p>
    )
  }

  return (
    <ul className="space-y-3">
      {safeList.map((j, jIdx) => {
        const periodId = j.submissionId || j.deadlineId
        const sub = periodId ? submissionById[periodId] : null
        const sizeLabel = formatJournalFileSizeBytes(j.fileSize)
        const serverUploadId = parseJournalServerUploadId(j)
        const rowBusy = busyKey != null && serverUploadId != null && busyKey === serverUploadId
        return (
          <li
            key={j.id != null ? String(j.id) : `j-${jIdx}`}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 px-3 py-2.5 space-y-2"
          >
            <div className="rounded-md bg-white/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-600/80 px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t('admin.chatJournal.submission')}
              </p>
              {periodId ? (
                <>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-1 break-words">
                    {sub?.title ??
                      t('admin.chatJournal.serverPeriod', {
                        id: String(periodId).slice(0, 8),
                      })}
                  </p>
                  {sub?.description ? (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-3 leading-snug">
                      {sub.description}
                    </p>
                  ) : null}
                  {sub ? (
                    <div className="mt-2 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <p>
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {t('admin.submissions.startsAtLabel')}:
                        </span>{' '}
                        {formatJournalEntryTs(sub.startsAt)}
                      </p>
                      <p>
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {t('admin.submissions.endsAtLabel')}:
                        </span>{' '}
                        {formatJournalEntryTs(sub.endsAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      {t('admin.chatJournal.noSubmissionLink')}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t('admin.chatJournal.noSubmissionLink')}
                </p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {t('admin.chatJournal.submittedFile')}
              </p>
              <p className="text-sm text-slate-800 dark:text-slate-200 break-words mt-1">
                {j.fileName ?? '—'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {[sizeLabel, formatJournalEntryTs(j.uploadedAt)].filter(Boolean).join(' · ')}
              </p>
              {downloadLearnerUserId && apiToken && serverUploadId ? (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  <button
                    type="button"
                    disabled={busyKey !== null && rowBusy}
                    onClick={() => runWithFile(j, 'download')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 flex-shrink-0" />
                    {t('journal.download')}
                  </button>
                  {journalFileCanOpenInBrowser(j.fileName) ? (
                    <button
                      type="button"
                      disabled={busyKey !== null && rowBusy}
                      onClick={() => runWithFile(j, 'open')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      {t('journal.openInTab')}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
