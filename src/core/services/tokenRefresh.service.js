/**
 * Token Refresh Service
 * 주기적으로 토큰을 갱신하고, 만료 시 자동 로그아웃 처리
 */
import { apiClient } from '@/core/api/apiClient.js'
import { API_ENDPOINTS } from '@/core/api/endPoint.js'

class TokenRefreshService {
  constructor() {
    this.refreshInterval = null
    this.isRefreshing = false
    this.refreshTimer = null
    
    // 토큰 만료 전 갱신 시간 (밀리초)
    // 예: 5분 전에 갱신 (5 * 60 * 1000 = 300000ms)
    this.REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000 // 5분
    
    // 토큰 갱신 주기 체크 (밀리초)
    // 예: 1분마다 체크 (1 * 60 * 1000 = 60000ms)
    this.CHECK_INTERVAL = 1 * 60 * 1000 // 1분
  }

  /**
   * JWT 토큰에서 만료 시간 추출
   * @param {string} token - JWT 토큰
   * @returns {number|null} 만료 시간 (밀리초) 또는 null
   */
  getTokenExpiry(token) {
    if (!token) return null
    
    try {
      // JWT 토큰은 base64로 인코딩된 3부분으로 구성: header.payload.signature
      const parts = token.split('.')
      if (parts.length !== 3) return null
      
      // payload 부분을 디코딩
      const payload = JSON.parse(atob(parts[1]))
      
      // exp는 초 단위이므로 밀리초로 변환
      if (payload.exp) {
        return payload.exp * 1000
      }
      
      return null
    } catch (error) {
      console.error('토큰 만료 시간 추출 실패:', error)
      return null
    }
  }

  /**
   * 토큰이 곧 만료되는지 확인 (REFRESH_BEFORE_EXPIRY 시간 이내)
   * @param {string} token - JWT 토큰
   * @returns {boolean} 곧 만료되는지 여부
   */
  isTokenExpiringSoon(token) {
    const expiry = this.getTokenExpiry(token)
    if (!expiry) return true // 만료 시간을 알 수 없으면 갱신
    
    const now = Date.now()
    const timeUntilExpiry = expiry - now
    
    // 만료 시간이 REFRESH_BEFORE_EXPIRY 이내면 곧 만료됨
    return timeUntilExpiry <= this.REFRESH_BEFORE_EXPIRY
  }

  /**
   * 토큰이 만료되었는지 확인
   * @param {string} token - JWT 토큰
   * @returns {boolean} 만료 여부
   */
  isTokenExpired(token) {
    const expiry = this.getTokenExpiry(token)
    if (!expiry) return true // 만료 시간을 알 수 없으면 만료된 것으로 간주
    
    const now = Date.now()
    return now >= expiry
  }

  /**
   * 토큰 재발급 요청
   * @returns {Promise<boolean>} 성공 여부
   */
  async refreshToken() {
    // 이미 갱신 중이면 중복 요청 방지
    if (this.isRefreshing) {
      console.log('⚠️ 토큰 갱신이 이미 진행 중입니다.')
      return false
    }

    const refreshToken = localStorage.getItem('refreshToken')
    
    if (!refreshToken) {
      console.warn('⚠️ 리프레시 토큰이 없습니다.')
      this.handleTokenExpired()
      return false
    }

    // 리프레시 토큰이 만료되었는지 확인
    if (this.isTokenExpired(refreshToken)) {
      console.warn('⚠️ 리프레시 토큰이 만료되었습니다.')
      this.handleTokenExpired()
      return false
    }

    try {
      this.isRefreshing = true
      console.log('🔄 토큰 재발급 요청 중...')
      
      const response = await apiClient.post(API_ENDPOINTS.AUTH.RE_ISSUE, {
        refreshToken: refreshToken
      })

      // 응답 형식 확인: ApiResponseDto<JwtToken>
      if (response.data?.isSuccess && response.data?.result) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.result
        
        // 새 토큰 저장
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken)
          console.log('✅ 액세스 토큰 갱신 완료')
        }
        
        // 새로운 리프레시 토큰이 있으면 저장
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken)
          console.log('✅ 리프레시 토큰 갱신 완료')
        }
        
        return true
      } else {
        throw new Error(response.data?.message || '토큰 재발급 실패')
      }
    } catch (error) {
      console.error('❌ 토큰 재발급 실패:', error)
      
      // 401 Unauthorized 또는 403 Forbidden이면 토큰이 유효하지 않음
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.handleTokenExpired()
      }
      
      return false
    } finally {
      this.isRefreshing = false
    }
  }

  /**
   * 토큰 갱신 체크 및 실행
   */
  async checkAndRefreshToken() {
    const accessToken = localStorage.getItem('accessToken')
    
    if (!accessToken) {
      // 토큰이 없으면 갱신 중지
      this.stop()
      return
    }

    // 토큰이 만료되었거나 곧 만료되면 갱신
    if (this.isTokenExpired(accessToken) || this.isTokenExpiringSoon(accessToken)) {
      console.log('⏰ 토큰 갱신 필요')
      await this.refreshToken()
    }
  }

  /**
   * 토큰 만료 처리 (자동 로그아웃)
   */
  handleTokenExpired() {
    console.log('🔒 토큰이 만료되어 로그아웃 처리합니다.')
    
    // 저장된 토큰 제거
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('memberId')
    
    // 갱신 중지
    this.stop()
    
    // 메인 페이지로 리다이렉션
    // window.location을 사용하여 강제 리다이렉션 (라우터 상태 초기화)
    window.location.href = '/'
  }

  /**
   * 토큰 갱신 서비스 시작
   */
  start() {
    // 이미 실행 중이면 중복 시작 방지
    if (this.refreshInterval) {
      console.warn('⚠️ 토큰 갱신 서비스가 이미 실행 중입니다.')
      return
    }

    console.log('🚀 토큰 갱신 서비스 시작')
    
    // 즉시 한 번 체크
    this.checkAndRefreshToken()
    
    // 주기적으로 체크
    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshToken()
    }, this.CHECK_INTERVAL)
  }

  /**
   * 토큰 갱신 서비스 중지
   */
  stop() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
      console.log('🛑 토큰 갱신 서비스 중지')
    }
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  /**
   * 토큰 갱신 서비스 재시작 (로그인 후 호출)
   */
  restart() {
    this.stop()
    this.start()
  }
}

// 싱글톤 인스턴스 생성
export const tokenRefreshService = new TokenRefreshService()
export default tokenRefreshService

