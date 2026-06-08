import { useState, useEffect, useRef } from 'react'
import { renderAsync } from 'docx-preview'
import {
  FileText, Download, Sparkles, RefreshCw,
  AlertCircle, FileQuestion, CheckCircle2,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { API_BASE } from '../../config/api'

export default function FilePreviewer({ learnerId, submission, apiToken, activeTab }) {
  const { t } = useLanguage()
  const [fileBlob, setFileBlob] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState(null)
  const [txtContent, setTxtContent] = useState('')
  const docxContainerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl)
    }
  }, [fileUrl])

  useEffect(() => {
    if (activeTab !== 'sub1' && activeTab !== 'sub2' && activeTab !== 'sub3' && activeTab !== 'sub4') {
      setFileBlob(null); setTxtContent(''); setFileUrl(null); return
    }
    if (!submission) {
      setFileBlob(null); setTxtContent(''); setFileUrl(null); return
    }

    const ext = submission.originalFileName
      ? submission.originalFileName.split('.').pop().toLowerCase() : ''
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'txt') {
      setFileBlob(null); setTxtContent(''); setFileUrl(null); return
    }

    let active = true
    setFileLoading(true)
    setFileError(null); setTxtContent(''); setFileBlob(null); setFileUrl(null)

    fetch(`${API_BASE}/api/journal/learner/${encodeURIComponent(learnerId)}/file/${encodeURIComponent(submission.id)}`, {
      headers: { Authorization: `Bearer ${apiToken}` }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then(async blob => {
        if (!active) return
        let mimeType = blob.type
        if (ext === 'pdf') mimeType = 'application/pdf'
        else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        else if (ext === 'txt') mimeType = 'text/plain;charset=utf-8'
        const typedBlob = new Blob([blob], { type: mimeType })
        const url = URL.createObjectURL(typedBlob)
        if (active) {
          setFileBlob(typedBlob)
          setFileUrl(url)
        } else {
          URL.revokeObjectURL(url); return
        }
        if (ext === 'txt') {
          try {
            const text = await typedBlob.text()
            if (active) setTxtContent(text)
          } catch { if (active) setTxtContent('') }
        }
        if (active) setFileLoading(false)
      })
      .catch(err => {
        if (!active) return
        setFileError(err.message)
        setFileLoading(false)
      })

    return () => { active = false }
  }, [activeTab, learnerId, submission, apiToken])

  useEffect(() => {
    if (!fileBlob || !docxContainerRef.current) return
    if (!submission) return
    const ext = submission.originalFileName?.split('.').pop().toLowerCase()
    if (ext !== 'docx') return

    let active = true
    const renderDocx = async () => {
      try {
        docxContainerRef.current.innerHTML =
          `<div class="text-slate-400 p-4">${t('supporter.file.preparingDocx')}</div>`
        const arrayBuffer = await fileBlob.arrayBuffer()
        if (!active) return
        docxContainerRef.current.innerHTML = ''
        await renderAsync(arrayBuffer, docxContainerRef.current, null, {
          className: "docx-preview-wrap",
          inWrapper: true,
          ignoreWidth: true
        })
      } catch (err) {
        if (active) {
          docxContainerRef.current.innerHTML =
            `<div class="text-red-500 p-4">${err.message || ''}</div>`
        }
      }
    }
    renderDocx()
    return () => { active = false }
  }, [fileBlob, submission, activeTab, t])

  const ext = submission?.originalFileName?.split('.').pop().toLowerCase()

  if (activeTab === 'final') {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm space-y-6">
        <div className="p-5 bg-primary/10 dark:bg-primary/20 text-primary rounded-full shadow-inner animate-bounce">
          <Download className="w-12 h-12" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            {submission?.originalFileName || t('supporter.file.finalTitle')}
          </h3>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 space-y-2">
            <div>
              {t('supporter.file.submittedAt', {
                time: submission?.submittedAt
                  ? new Date(submission.submittedAt).toLocaleString()
                  : '-'
              })}
            </div>
            {submission?.isLate ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-full border border-rose-300 dark:border-rose-800 animate-pulse shadow-sm">
                <AlertCircle className="w-4 h-4" />
                {t('supporter.file.lateWithPenalty')}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('supporter.file.onTime')}
              </div>
            )}
          </div>
        </div>
        <a
          href={`/journal-file-download?learnerId=${learnerId}&uploadId=${submission?.id}`}
          target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-105"
        >
          <Download className="w-5 h-5" />
          <span>{t('supporter.file.downloadFinal')}</span>
        </a>
      </div>
    )
  }

  if (!submission) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-100 dark:bg-slate-900/60 rounded-xl">
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="w-6 h-6 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-sm text-slate-800 dark:text-white truncate max-w-md">
              {submission.originalFileName || 'Văn bản nộp'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 truncate">
              <span>
                {t('supporter.file.submittedAt', {
                  time: new Date(submission.submittedAt).toLocaleString()
                })}
              </span>
              {submission.isSupplementary && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-semibold text-xs rounded-full border border-blue-200 dark:border-blue-800">
                  {t('supporter.file.supplementary')}
                </span>
              )}
              {submission.isLate && !submission.isSupplementary && (
                <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 font-semibold text-xs rounded-full border border-rose-200 dark:border-rose-800">
                  {t('supporter.file.late')}
                </span>
              )}
            </div>
          </div>
        </div>
        <a
          href={`/journal-file-download?learnerId=${learnerId}&uploadId=${submission.id}`}
          target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 text-primary font-semibold text-xs rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{t('supporter.file.downloadOriginal')}</span>
        </a>
      </div>

      {submission.aiEvaluation && (
        <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-600" /> {t('supporter.file.aiEvaluation')}
          </div>
          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {submission.aiEvaluation}
          </div>
        </div>
      )}

      {fileLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-medium">{t('supporter.file.loading')}</span>
        </div>
      ) : fileError ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl text-rose-600 dark:text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0 text-rose-500" />
          <div>
            <span className="font-semibold">{t('supporter.file.error')}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('supporter.file.errorHint', { error: fileError })}
            </p>
          </div>
        </div>
      ) : ext === 'pdf' && fileUrl ? (
        <div className="bg-slate-100 dark:bg-slate-950 p-4 md:p-6 rounded-2xl overflow-auto max-h-[70vh] flex justify-center shadow-inner border border-slate-200 dark:border-slate-800">
          <iframe
            src={fileUrl}
            className="w-full h-[65vh] border-0 rounded-xl shadow-lg max-w-[900px] bg-white"
            title="PDF Preview"
          />
        </div>
      ) : ext === 'docx' && fileBlob ? (
        <div className="bg-slate-100 dark:bg-slate-950 p-4 md:p-6 rounded-2xl overflow-auto max-h-[70vh] flex justify-center shadow-inner border border-slate-200 dark:border-slate-800">
          <div ref={docxContainerRef} className="docx-viewer w-full max-w-[850px] bg-white rounded-xl overflow-x-auto" />
        </div>
      ) : ext === 'txt' && txtContent ? (
        <div className="bg-slate-100 dark:bg-slate-950 p-4 md:p-6 rounded-2xl overflow-auto max-h-[70vh] flex justify-center shadow-inner border border-slate-200 dark:border-slate-800">
          <pre className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 font-mono text-sm whitespace-pre-wrap overflow-x-auto leading-relaxed max-w-[900px] text-left">
            {txtContent}
          </pre>
        </div>
      ) : (
        <div className="p-8 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-amber-800 dark:text-amber-300 text-sm flex flex-col items-center justify-center text-center space-y-3">
          <FileQuestion className="w-10 h-10 text-amber-500 opacity-80" />
          <div>
            <p className="font-bold text-base">{t('supporter.file.noPreview')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('supporter.file.noPreviewHint')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
