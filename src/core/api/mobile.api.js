import apiClient from '@/core/api/apiClient.js'
import { API_ENDPOINTS } from '@/core/api/endPoint.js'

export const mobileApi = {
  upsertPushToken(payload) {
    return apiClient.put(API_ENDPOINTS.MOBILE.PUSH_TOKENS, payload)
  },

  updatePushPreference(enabled) {
    return apiClient.patch(API_ENDPOINTS.MOBILE.PUSH_PREFERENCE, { enabled })
  },

  deletePushToken(token) {
    return apiClient.delete(`${API_ENDPOINTS.MOBILE.PUSH_TOKENS}/${encodeURIComponent(token)}`)
  }
}

export default mobileApi
