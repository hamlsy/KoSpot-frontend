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
    
    // 401 Unauthorized 에러이고 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // 토큰 재발급 API 호출은 제외 (무한 루프 방지)
      if (originalRequest.url?.includes('/auth/reIssue')) {
        // 토큰 재발급 실패 시 로그아웃 처리
        console.error('❌ reIssue API 호출 실패 - 로그아웃 처리')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('memberId')
        window.location.href = '/'
        return Promise.reject(error)
      }
      
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          // 토큰 재발급 API 호출
          const response = await apiClient.post('/auth/reIssue', {
            refreshToken: refreshToken
          })
          
          // 응답 형식: ApiResponseDto<JwtToken>
          if (response.data?.isSuccess && response.data?.result) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.result
            
            // 새 토큰 저장
            if (accessToken) {
              localStorage.setItem('accessToken', accessToken)
            }
            
            // 새로운 리프레시 토큰이 있으면 저장
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken)
            }
            
            // 원래 요청 재시도
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return apiClient(originalRequest)
          }
        }
      } catch (refreshError) {
        // reIssue API 에러 발생 시 무조건 모든 토큰 제거 및 메인 페이지로 리다이렉션
        console.error('❌ 토큰 재발급 실패 - 로그아웃 처리:', refreshError)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('memberId')
        window.location.href = '/'
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
