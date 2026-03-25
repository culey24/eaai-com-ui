import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Plus, Pencil, Trash2, Calendar } from 'lucide-react'
import { useJournal } from '../../context/JournalContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAllUsers } from '../../hooks/useAllUsers'
import { VALID_CLASS_CODES } from '../../constants/roles'

export default function AdminSubmissionsPage() {
  const { t } = useLanguage()
  const { getSubmissions, addSubmission, updateSubmission, deleteSubmission, getSubmissionStats } = useJournal()
  const { getByClass } = useAllUsers()
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDeadline, setFormDeadline] = useState('')

  const submissions = getSubmissions()

  const getStatsByClass = (submissionId) =>
    VALID_CLASS_CODES.map((classCode) => {
      const learners = getByClass(classCode)
      const userIds = learners.map((l) => l.id)
      const stats = getSubmissionStats(userIds, submissionId)
      return { classCode, ...stats }
    }).filter((s) => s.total > 0)

  const formatDeadline = (ts) =>
    new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

  const isActive = (sub) => sub.deadline > Date.now()

  const handleCreate = () => {
    if (!formTitle.trim() || !formDeadline) return
    addSubmission(formTitle.trim(), formDescription.trim(), formDeadline)
    setFormTitle('')
    setFormDescription('')
    setFormDeadline('')
    setShowForm(false)
  }

  const handleUpdate = () => {
    if (!editingId || !formTitle.trim() || !formDeadline) return
    updateSubmission(editingId, {
      title: formTitle.trim(),
      description: formDescription.trim(),
      deadline: new Date(formDeadline).getTime(),
    })
    setEditingId(null)
    setFormTitle('')
    setFormDescription('')
    setFormDeadline('')
  }

  const handleDelete = (id) => {
    if (window.confirm(t('admin.submissions.confirmDelete'))) deleteSubmission(id)
  }

  const startEdit = (sub) => {
    setEditingId(sub.id)
    setFormTitle(sub.title)
    setFormDescription(sub.description || '')
    setFormDeadline(new Date(sub.deadline).toISOString().slice(0, 16))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormTitle('')
    setFormDescription('')
    setFormDeadline('')
    setShowForm(false)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex-shrink-0 px-8 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-slate-800 dark:text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t('admin.submissions.title')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t('admin.submissions.desc')}
            </p>
          </div>
        </div>
        {!showForm && !editingId && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('admin.submissions.create')}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {showForm && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
                {t('admin.submissions.create')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.submissions.titleLabel')}
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={t('admin.submissions.titlePlaceholder')}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.submissions.descriptionLabel')}
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder={t('admin.submissions.descriptionPlaceholder')}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {t('admin.submissions.deadlineLabel')}
                  </label>
                  <input
                    type="datetime-local"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
                  >
                    {t('common.save')}
                  </button>
                  <button onClick={cancelEdit} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm">
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {submissions.length === 0 && !showForm ? (
            <div className="text-center py-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">{t('admin.submissions.noSubmissions')}</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
              >
                {t('admin.submissions.create')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => {
                const statsByClass = getStatsByClass(sub.id)
                const active = isActive(sub)
                const isEditing = editingId === sub.id

                return (
                  <div
                    key={sub.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
                  >
                    {isEditing ? (
                      <div className="p-6 space-y-4">
                        <input
                          type="text"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          placeholder={t('admin.submissions.titlePlaceholder')}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                        <textarea
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          placeholder={t('admin.submissions.descriptionPlaceholder')}
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white resize-none"
                        />
                        <input
                          type="datetime-local"
                          value={formDeadline}
                          onChange={(e) => setFormDeadline(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdate}
                            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
                          >
                            {t('common.save')}
                          </button>
                          <button onClick={cancelEdit} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm">
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-6 h-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-800 dark:text-white truncate">{sub.title}</h3>
                            {sub.description && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {sub.description}
                              </p>
                            )}
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                              {t('journal.deadline')}: {formatDeadline(sub.deadline)}
                            </p>
                            <span
                              className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                                active
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {active ? t('admin.submissions.active') : t('admin.submissions.ended')}
                            </span>
                            <div className="mt-2 space-y-1">
                              {statsByClass.map(({ classCode, submitted, total }) => (
                                <p key={classCode} className="text-sm text-slate-500 dark:text-slate-400">
                                  {t('admin.classLabel', { code: classCode })}: {t('admin.journalSubmitted', { submitted, total })}
                                </p>
                              ))}
                              {statsByClass.length === 0 && (
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.noMembers')}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => startEdit(sub)}
                            title={t('admin.submissions.edit')}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id)}
                            title={t('admin.submissions.delete')}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
