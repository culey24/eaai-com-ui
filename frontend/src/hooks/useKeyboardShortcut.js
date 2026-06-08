import { useEffect } from 'react'

const KEY_MAP = {
  CONTROL: 'ctrlKey',
  META: 'metaKey',
  ALT: 'altKey',
  SHIFT: 'shiftKey',
}

export default function useKeyboardShortcut(keyDef, handler) {
  useEffect(() => {
    const { key, ctrl, meta, alt, shift } = keyDef

    const listener = (e) => {
      if (e.repeat) return

      const target = e.target
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (ctrl || meta) {
          if (key === 's' || key === 'S') {
            e.preventDefault()
            handler(e)
            return
          }
        }
        return
      }

      if (e.key === key || e.key === key.toUpperCase() || e.key === key.toLowerCase()) {
        const modsOk =
          (!ctrl || (e[KEY_MAP.CONTROL] || e[KEY_MAP.META])) &&
          (!meta || e[KEY_MAP.META]) &&
          (!alt || e[KEY_MAP.ALT]) &&
          (!shift || e[KEY_MAP.SHIFT])

        if (modsOk) {
          e.preventDefault()
          handler(e)
        }
      }
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [keyDef, handler])
}
