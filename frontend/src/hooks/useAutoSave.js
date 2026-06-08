import { useEffect, useRef, useState, useCallback } from 'react'

export default function useAutoSave(data, saveFn, delayMs = 5000) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)
  const dataRef = useRef(data)
  const isSavingRef = useRef(false)

  dataRef.current = data

  const triggerSave = useCallback(async () => {
    if (isSavingRef.current) return
    isSavingRef.current = true
    setIsSaving(true)
    setError(null)
    try {
      await saveFn()
      setLastSaved(new Date())
    } catch (err) {
      setError(err.message || 'Auto-save failed')
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, [saveFn])

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      triggerSave()
    }, delayMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [data, delayMs, triggerSave])

  return { isSaving, lastSaved, error }
}
