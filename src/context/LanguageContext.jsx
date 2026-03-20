import { createContext, useContext, useState, useEffect } from 'react'
import en from '../locales/en.json'
import vi from '../locales/vi.json'

const LANG_STORAGE_KEY = 'eeai_chatbot_lang'

const translations = { en, vi }

const LanguageContext = createContext(null)

function getStoredLang() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY)
    return stored === 'vi' ? 'vi' : 'en'
  } catch {
    return 'en'
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getStoredLang)

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang)
    } catch {}
  }, [lang])

  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations[lang]
    for (const k of keys) {
      value = value?.[k]
    }
    if (typeof value !== 'string') return key
    return Object.entries(params).reduce(
      (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
      value
    )
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
