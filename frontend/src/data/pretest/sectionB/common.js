const BLOOM_VI = {
  Remembering: 'Ghi nhớ',
  Understanding: 'Hiểu',
  Applying: 'Áp dụng',
  Analyzing: 'Phân tích',
  Evaluating: 'Đánh giá',
  Creating: 'Sáng tạo',
}

/** @param {'Remembering'|'Understanding'|'Applying'|'Analyzing'|'Evaluating'|'Creating'} bloomEn */
export function mcq(bloomEn, promptEn, promptVi, choices) {
  return {
    type: 'mcq',
    bloom: { en: bloomEn, vi: BLOOM_VI[bloomEn] || bloomEn },
    prompt: { en: promptEn, vi: promptVi },
    choices,
  }
}

/** choices: [{ key:'A', en, vi }, ...] */
export function mcq3(bloomEn, promptEn, promptVi, a, b, c) {
  return mcq(bloomEn, promptEn, promptVi, [
    { key: 'A', en: a.en, vi: a.vi },
    { key: 'B', en: b.en, vi: b.vi },
    { key: 'C', en: c.en, vi: c.vi },
  ])
}

export function txt(bloomEn, promptEn, promptVi, hintEn, hintVi) {
  return {
    type: 'text',
    bloom: { en: bloomEn, vi: BLOOM_VI[bloomEn] || bloomEn },
    prompt: { en: promptEn, vi: promptVi },
    hint: { en: hintEn, vi: hintVi },
  }
}
