import { Link } from 'react-router-dom'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { exportJournalSubmissionsMatrixCsv } from '../../lib/journalMatrixCsvExport'

export default function SupporterJournalExportPage() {
  const { t } = useLanguage()
  const { apiToken } = useAuth()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!apiToken) return
    setExporting(true)
    try {
      await exportJournalSubmissionsMatrixCsv({ apiToken, t })
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto">
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4">
        <Link
          to="/"
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t('supporter.journalExport.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('supporter.journalExport.desc')}</p>
        </div>
      </div>
      <div className="p-8 max-w-xl">
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={exporting || !apiToken}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 text-sm font-medium disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {exporting ? t('admin.submissions.exportCsvLoading') : t('admin.submissions.exportCsv')}
        </button>
      </div>
    </div>
  )
}
