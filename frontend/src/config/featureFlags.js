/** Env Vite — chỉ biến VITE_* (build-time). Sync với backend PRETEST_ENABLED khi cần tắt gate ở local. */
export function isPretestDisabledViaVite() {
  const v = import.meta.env.VITE_PRETEST_ENABLED
  if (v == null || String(v).trim() === '') return false
  const s = String(v).trim().toLowerCase()
  return ['0', 'false', 'no', 'off', 'disabled'].includes(s)
}
