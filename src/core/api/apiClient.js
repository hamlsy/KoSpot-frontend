// core/api/client.js
import axios from 'axios'

// API 클라이언트 인스턴스 생성
// 개발환경: /api prefix를 사용하여 proxy로 요청
// 프로덕션: VUE_APP_API_BASE_URL 환경변수 사용 (예: https://api.kospot.com/api)
export const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// 요청 인터셉터 - JWT 토큰 자동 첨부
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 토큰 만료 처리
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post('/auth/refresh', { // todo 여기에 refresh api
            refreshToken: refreshToken
          })
          
          const { accessToken } = response.data
          localStorage.setItem('accessToken', accessToken)
          
          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // 리프레시 토큰도 만료된 경우 로그아웃 처리
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
