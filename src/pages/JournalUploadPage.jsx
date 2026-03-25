import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Upload, CheckCircle, Pencil, Trash2, Calendar } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useJournal } from '../context/JournalContext'
import { useAuth } from '../context/AuthContext'

export default function JournalUploadPage() {
  const { t } = useLanguage()
  const {
    getActiveSubmission,
    getSubmissions,
    getJournalForUserAndSubmission,
    addJournal,
    updateJournal,
    deleteJournal,
    isSubmissionOpen,
  } = useJournal()
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const editInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const userId = user?.stableId || (user?.name ? `reg-${user.name}` : user?.id)
  const activeSub = getActiveSubmission()
  const submissions = getSubmissions()
  const currentEntry = activeSub ? getJournalForUserAndSubmission(userId, activeSub.id) : null

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !user || !activeSub) return

    setUploading(true)
    setUploadSuccess(false)
    setTimeout(() => {
      if (currentEntry) {
        updateJournal(userId, activeSub.id, file)
      } else {
        addJournal(userId, file, activeSub.id)
      }
      setUploading(false)
      setUploadSuccess(true)
      e.target.value = ''
      setTimeout(() => setUploadSuccess(false), 3000)
    }, 500)
  }

  const handleEditClick = () => editInputRef.current?.click()

  const handleDelete = () => {
    if (!activeSub || !window.confirm(t('journal.confirmDelete'))) return
    deleteJournal(userId, activeSub.id)
  }

  const formatDate = (ts) =>
    new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
        <Link
          to="/"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t('journal.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('journal.desc')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Active submission section */}
          {activeSub ? (
            <>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-primary/5 dark:bg-primary/10 p-4">
                <h2 className="font-semibold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {t('journal.currentSubmission')}
                </h2>
                <p className="text-slate-700 dark:text-slate-300">{activeSub.title}</p>
                {activeSub.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap">
                    {activeSub.description}
                  </p>
                )}
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('journal.deadline')}: {formatDate(activeSub.deadline)}
                </p>
              </div>

              {/* Upload / Edit / Delete zone */}
              <div
                onClick={() => !currentEntry && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                  currentEntry ? 'cursor-default' : 'cursor-pointer'
                } ${
                  uploading
                    ? 'border-primary/50 bg-primary/5 pointer-events-none'
                    : 'border-slate-200 dark:border-slate-600 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={editInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {uploadSuccess ? (
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                    <p className="font-medium text-slate-800 dark:text-white">{t('journal.uploadSuccess')}</p>
                  </div>
                ) : uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-slate-600 dark:text-slate-400">{t('common.loading')}</p>
                  </div>
                ) : currentEntry ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600">
                      <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                      <div className="text-left">
                        <p className="font-medium text-slate-800 dark:text-white">{currentEntry.fileName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t('journal.uploadedAt')}: {formatDate(currentEntry.uploadedAt)} • {formatSize(currentEntry.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleEditClick}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
                      >
                        <Pencil className="w-4 h-4" />
                        {t('journal.editFile')}
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('journal.deleteFile')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-slate-400" />
                    <p className="font-medium text-slate-800 dark:text-white">{t('journal.upload')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('journal.dragDrop')}</p>
                    <p className="text-xs text-slate-400">PDF, DOC, DOCX</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-8 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">{t('journal.noActiveSubmission')}</p>
            </div>
          )}

          {/* Past submissions - user's uploads */}
          {submissions.filter((s) => !isSubmissionOpen(s.id)).length > 0 && (
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-white mb-4">{t('journal.uploadHistory')}</h2>
              <div className="space-y-3">
                {submissions
                  .filter((s) => !isSubmissionOpen(s.id))
                  .map((sub) => {
                    const entry = getJournalForUserAndSubmission(userId, sub.id)
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 dark:text-white truncate">
                              {sub.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {entry ? (
                                <>
                                  {entry.fileName} • {t('journal.uploadedAt')}: {formatDate(entry.uploadedAt)}
                                </>
                              ) : (
                                t('journal.noVersions')
                              )}
                            </p>
                          </div>
                        </div>
                        {entry && (
                          <span className="text-xs text-green-600 dark:text-green-400 flex-shrink-0 ml-2">
                            ✓
                          </span>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
