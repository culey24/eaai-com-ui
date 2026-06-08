/**
 * Mapping các đợt nộp bài final (nộp chính thức vs nộp trễ)
 * Admin có thể tự chỉnh sửa các ID này cho đúng với dữ liệu trên DB.
 */
export const FINAL_SUBMISSION_MAPPING = {
  mainPeriodId: 'final-main', // ID của đợt nộp chính
  latePeriodId: 'final-late', // ID của đợt nộp trễ
}
