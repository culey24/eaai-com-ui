import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { normalizeViSearch } from '../../lib/viSearch'

/**
 * Chọn supporter: mở panel, gõ lọc theo tên/username/id (không dấu, không phân biệt hoa thường).
 */
export default function SupporterPicker({
  supporters,
  value,
  onChange,
  noSupporterLabel,
  searchPlaceholder,
  noResultsLabel,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const qn = normalizeViSearch(query)
  const filtered = !qn
    ? supporters
    : supporters.filter((s) => {
        const blob = [s.fullName, s.username, s.id].filter(Boolean).join(' ')
        return normalizeViSearch(blob).includes(qn)
      })

  const selected = supporters.find((s) => s.id === value)
  const display =
    selected?.fullName?.trim() || selected?.username || noSupporterLabel

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => {
            const next = !o
            if (next) setQuery('')
            return next
          })
        }}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm text-left min-w-[140px]"
      >
        <span className="truncate">{display}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="absolute z-[100] mt-1.5 left-0 right-0 min-w-[min(100%,320px)] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full px-3 py-2 text-sm border-b border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-400"
            onMouseDown={(e) => e.stopPropagation()}
          />
          <ul className="max-h-52 overflow-y-auto py-1" role="listbox">
            <li role="option">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
              >
                {noSupporterLabel}
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                {noResultsLabel}
              </li>
            ) : (
              filtered.map((s) => {
                const label = s.fullName?.trim() || s.username
                return (
                  <li key={s.id} role="option">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white"
                      onClick={() => {
                        onChange(s.id)
                        setOpen(false)
                      }}
                    >
                      {label}
                      {s.username && label !== s.username ? (
                        <span className="block text-xs text-slate-500 dark:text-slate-400 font-normal">
                          {s.username}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
