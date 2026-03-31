/** user_id DB (VarChar 10) từ object user UI ({ id, backendUserId }). */
export function uiIdToBackendUserId(userLike) {
  if (!userLike || typeof userLike !== 'object') return null
  if (userLike.backendUserId != null && String(userLike.backendUserId).trim() !== '') {
    return String(userLike.backendUserId).trim().slice(0, 10)
  }
  const id = userLike.id
  if (typeof id === 'string' && id.startsWith('api-')) {
    return id.slice(4).slice(0, 10)
  }
  return null
}
