/**
 * Ánh xạ mã lỗi API / chuỗi cố định → key i18n (auth.errors.*).
 */

export const AuthErrorCode = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  LOGIN_MISSING_FIELDS: 'LOGIN_MISSING_FIELDS',
  REGISTER_MISSING_FIELDS: 'REGISTER_MISSING_FIELDS',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  ACCOUNT_EXISTS: 'ACCOUNT_EXISTS',
  SERVER_MISCONFIG_JWT: 'SERVER_MISCONFIG_JWT',
  SERVER_ERROR: 'SERVER_ERROR',
  REGISTER_OFFLINE_ONLY: 'REGISTER_OFFLINE_ONLY',
  CLASS_CODE_INVALID_LOCAL: 'CLASS_CODE_INVALID_LOCAL',
  NOT_LOGGED_IN: 'NOT_LOGGED_IN',
  NETWORK: 'NETWORK',
  LOGIN_FAILED_STATUS: 'LOGIN_FAILED_STATUS',
  REGISTER_FAILED_STATUS: 'REGISTER_FAILED_STATUS',
  PROFILE_SAVE_FAILED: 'PROFILE_SAVE_FAILED',
}

/** Mã trả về từ backend (auth, me/profile, …) */
const API_CODE_TO_I18N = {
  INVALID_CREDENTIALS: 'auth.errors.invalidCredentials',
  LOGIN_MISSING_FIELDS: 'auth.errors.loginMissingFields',
  REGISTER_MISSING_FIELDS: 'auth.errors.registerMissingFields',
  PASSWORD_TOO_SHORT: 'auth.errors.passwordTooShort',
  INVALID_CLASS_CODE: 'auth.errors.invalidClassCodeApi',
  ACCOUNT_EXISTS: 'auth.errors.accountExists',
  SERVER_MISCONFIG_JWT: 'auth.errors.serverMisconfigJwt',
  SERVER_ERROR: 'auth.errors.serverError',
  PROFILE_LEARNER_ONLY: 'auth.errors.profileLearnerOnly',
  PROFILE_NO_VALID_FIELDS: 'auth.errors.profileNoValidFields',
  PROFILE_DUPLICATE: 'auth.errors.profileDuplicate',
}

const LOCAL_CODE_TO_I18N = {
  [AuthErrorCode.INVALID_CREDENTIALS]: 'auth.errors.invalidCredentials',
  [AuthErrorCode.REGISTER_OFFLINE_ONLY]: 'auth.errors.registerOfflineOnly',
  [AuthErrorCode.CLASS_CODE_INVALID_LOCAL]: 'auth.errors.classCodeInvalid',
  [AuthErrorCode.NOT_LOGGED_IN]: 'auth.errors.notLoggedIn',
  [AuthErrorCode.NETWORK]: 'auth.errors.network',
  [AuthErrorCode.ACCOUNT_EXISTS]: 'auth.errors.accountExists',
}

/** Chuỗi error từ API (tiếng Việt) → key i18n — tương thích bản backend chưa có `code` */
const VI_ERROR_TO_I18N = {
  'Sai tài khoản hoặc mật khẩu': 'auth.errors.invalidCredentials',
  'Thiếu username hoặc password': 'auth.errors.loginMissingFields',
  'Thiếu username, password hoặc classCode': 'auth.errors.registerMissingFields',
  'Mật khẩu tối thiểu 4 ký tự': 'auth.errors.passwordTooShort',
  'Mã lớp không hợp lệ (IS-1, IS-2, IS-3)': 'auth.errors.invalidClassCodeApi',
  'Tài khoản đã tồn tại': 'auth.errors.accountExists',
  'Cấu hình máy chủ thiếu JWT_SECRET': 'auth.errors.serverMisconfigJwt',
  'Lỗi máy chủ': 'auth.errors.serverError',
  'Không kết nối được máy chủ. Kiểm tra VITE_API_URL và backend.': 'auth.errors.network',
  'Không kết nối được máy chủ': 'auth.errors.network',
  'Chưa đăng nhập': 'auth.errors.notLoggedIn',
  'Mã lớp không hợp lệ': 'auth.errors.classCodeInvalid',
  'Tài khoản này đã tồn tại': 'auth.errors.accountExists',
  'Đăng ký chỉ qua API. Bật VITE_ENABLE_MOCK_AUTH=true nếu cần chế độ demo offline.':
    'auth.errors.registerOfflineOnly',
  'Chỉ tài khoản learner cập nhật hồ sơ này': 'auth.errors.profileLearnerOnly',
  'Không có trường hợp lệ để cập nhật': 'auth.errors.profileNoValidFields',
  'Email hoặc trường unique bị trùng': 'auth.errors.profileDuplicate',
}

/**
 * @param {{ ok?: boolean, code?: string, error?: string, status?: number } | null | undefined} result
 * @param {(key: string, params?: Record<string, string>) => string} t
 * @param {string} [fallbackKey] — khi không map được (vd. auth.invalidCredentials)
 */
export function formatAuthResultError(result, t, fallbackKey = 'auth.invalidCredentials') {
  if (!result || result.ok) return ''
  if (result.code && API_CODE_TO_I18N[result.code]) {
    return t(API_CODE_TO_I18N[result.code])
  }
  if (result.code && LOCAL_CODE_TO_I18N[result.code]) {
    return t(LOCAL_CODE_TO_I18N[result.code])
  }
  if (result.code === AuthErrorCode.LOGIN_FAILED_STATUS && result.status != null) {
    return t('auth.errors.loginFailedStatus', { status: String(result.status) })
  }
  if (result.code === AuthErrorCode.REGISTER_FAILED_STATUS && result.status != null) {
    return t('auth.errors.registerFailedStatus', { status: String(result.status) })
  }
  if (result.code === AuthErrorCode.PROFILE_SAVE_FAILED) {
    if (result.status != null) {
      return t('auth.errors.profileSaveFailed', { status: String(result.status) })
    }
    return t('auth.errors.profileSaveFailedGeneric')
  }
  const raw = result.error != null ? String(result.error).trim() : ''
  if (raw && VI_ERROR_TO_I18N[raw]) {
    return t(VI_ERROR_TO_I18N[raw])
  }
  if (raw) return raw
  return t(fallbackKey)
}
