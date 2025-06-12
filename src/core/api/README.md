# API Client 사용 가이드

## 기본 사용법
// 다른 서비스에서 API 클라이언트 사용
import { apiClient } from '@/core/api/client.js'
import { API_ENDPOINTS } from '@/core/api/endpoints.js'

// GET 요청
const getUsers = async () => {
try {
const response = await apiClient.get(API_ENDPOINTS.USER.PROFILE)
return response.data
} catch (error) {
console.error('사용자 정보 조회 실패:', error)
throw error
}
}

// POST 요청 (자동으로 JWT 토큰 첨부됨)
const updateProfile = async (userData) => {
const response = await apiClient.post(API_ENDPOINTS.USER.UPDATE_PROFILE, userData)
return response.data
}