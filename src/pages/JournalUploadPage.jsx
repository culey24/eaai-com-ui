import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Upload, CheckCircle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useJournal } from '../context/JournalContext'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function JournalUploadPage() {
  const { t } = useLanguage()
  const { getJournalsForUser, addJournal } = useJournal()
  const { user } = useAuth()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const versions = getJournalsForUser(user?.id) || []

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    setUploadSuccess(false)
    setTimeout(() => {
      addJournal(user.id, file)
      setUploading(false)
      setUploadSuccess(true)
      e.target.value = ''
      setTimeout(() => setUploadSuccess(false), 3000)
    }, 500)
  }

  const formatDate = (ts) =>
    new Date(ts).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

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
          {/* Upload zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
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
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-12 h-12 text-slate-400" />
                <p className="font-medium text-slate-800 dark:text-white">{t('journal.upload')}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('journal.dragDrop')}</p>
                <p className="text-xs text-slate-400">PDF, DOC, DOCX</p>
              </div>
            )}
          </div>

          {/* Versions list */}
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4">{t('journal.versions')}</h2>
            {versions.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">{t('journal.noVersions')}</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{t('journal.noVersionsHint')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{v.fileName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t('journal.uploadedAt')}: {formatDate(v.uploadedAt)} • {formatSize(v.fileSize)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
