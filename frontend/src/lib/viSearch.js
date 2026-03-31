/**
 * Chuỗi so khớp tìm kiếm: không phân biệt hoa thường, bỏ dấu (tiếng Việt).
 */
export function normalizeViSearch(str) {
  if (str == null || str === '') return ''
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
}

/** `needle` đã normalize hoặc chuỗi thô — so khớp `haystack` (thô) chứa needle. */
export function viSearchIncludes(haystack, needleRaw) {
  const h = normalizeViSearch(haystack)
  const n = normalizeViSearch(needleRaw)
  if (!n) return true
  return h.includes(n)
}
