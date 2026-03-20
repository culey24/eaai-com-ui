import { useState } from 'react'
import { X, Flag, CheckCircle } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const REPORT_TYPE_KEYS = ['inappropriate', 'spam', 'technical', 'wrong_info', 'other']

export default function ReportModal({ isOpen, onClose, channel, onSubmit }) {
  const { t } = useLanguage()
  const channelLabel = channel?.labelKey ? t(channel.labelKey, { code: channel.code }) : channel?.label
  const [type, setType] = useState('')
  const [detail, setDetail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!type.trim()) return

    onSubmit?.({
      channelId: channel?.id,
      channelLabel,
      type: type,
      typeLabel: t(`report.types.${type}`) || type,
      detail: detail.trim() || null,
      timestamp: Date.now(),
    })
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setType('')
      setDetail('')
      onClose?.()
    }, 1500)
  }

  const handleClose = () => {
    if (!submitted) {
      setType('')
      setDetail('')
      onClose?.()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 id="report-title" className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-amber-500" />
            {t('report.title')}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitted}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="font-semibold text-slate-800 dark:text-white">{t('report.success')}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('report.successDesc')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {channel && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('report.about')}: <span className="font-medium text-slate-700 dark:text-slate-300">{channelLabel}</span>
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('report.reason')} <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {REPORT_TYPE_KEYS.map((id) => (
                  <label
                    key={id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      type === id
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      value={id}
                      checked={type === id}
                      onChange={(e) => setType(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t(`report.types.${id}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('report.detail')}
              </label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Mô tả thêm về vấn đề..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none resize-none text-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={!type}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('report.submitReport')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
