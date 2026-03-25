import { UserClass } from '@prisma/client'

const MAP = {
  'IS-1': UserClass.IS_1,
  'IS-2': UserClass.IS_2,
  'IS-3': UserClass.IS_3,
}

export function parseUserClass(code) {
  if (!code || typeof code !== 'string') return null
  const k = code.trim().toUpperCase().replace(/_/g, '-')
  const normalized =
    k === 'IS-1' || k === 'IS1'
      ? 'IS-1'
      : k === 'IS-2' || k === 'IS2'
        ? 'IS-2'
        : k === 'IS-3' || k === 'IS3'
          ? 'IS-3'
          : null
  if (!normalized) return null
  return MAP[normalized]
}
