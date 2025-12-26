// core/composables/useAuth.js
import { ref, computed, reactive } from 'vue'
import apiClient from 'src/core/api/apiClient.js'
import { API_ENDPOINTS } from '@/core/api/endPoint.js'
import { useRouter } from 'vue-router'
import { tokenRefreshService } from '@/core/services/tokenRefresh.service.js'

// 전역 상태 관리
const authState = reactive({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
})

// 봇 여부 확인 헬퍼 함수
const isBot = () => {
  return localStorage.getItem('isBot') === 'true'
}

export function useAuth() {
  const router = useRouter()
  
  // 상태 반응형 참조
  const user = computed(() => authState.user)
  const isAuthenticated = computed(() => {
    // 봇인 경우 항상 true 반환
    if (isBot()) {
      return true
    }
    return authState.isAuthenticated
  })
  const loading = computed(() => authState.loading)
  const error = computed(() => authState.error)
  
  // 로그인
  const login = async (credentials) => {
    try {
      authState.loading = true
      authState.error = null
      
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
      const { memberId, accessToken, refreshToken } = response.data
      
      // 토큰 저장
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      
      // memberId 저장 (채팅 메시지 소유권 판단용) - String으로 변환하여 저장
      const memberIdString = String(memberId);
      localStorage.setItem('memberId', memberIdString);
      
      // 최소한의 사용자 정보 저장 (memberId만으로 구성)
      authState.user = {
        id: memberId,
      }
      authState.isAuthenticated = true
      
      // 토큰 갱신 서비스 시작 (로그인 후 자동 갱신 시작)
      tokenRefreshService.restart()
      
      return { success: true, memberId }
    } catch (error) {
      authState.error = error.response?.data?.message || '로그인에 실패했습니다.'
      return { success: false, error: authState.error }
    } finally {
      authState.loading = false
    }
  }
  
  // 봇 로그인 처리 (쿠키 기반)
  const loginAsBot = () => {
    // 봇 정보 저장
    localStorage.setItem('isBot', 'true')
    authState.user = {
      id: 'adsense_bot',
      isBot: true
    }
    authState.isAuthenticated = true
    console.log('🤖 봇 로그인 완료')
  }

  // 로그아웃
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      const isBotUser = isBot()
      
      // refreshToken이 있고 봇이 아닌 경우에만 서버에 로그아웃 요청
      if (refreshToken && !isBotUser) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
          refreshToken: refreshToken
        })
      }
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error)
      // API 호출 실패해도 로컬 상태는 정리
    } finally {
      // 로컬 상태 정리
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('memberId')
      localStorage.removeItem('isBot') // 봇 정보도 삭제
      authState.user = null
      authState.isAuthenticated = false
      
      // 토큰 갱신 서비스 중지
      tokenRefreshService.stop()
      
      // 메인 페이지로 리다이렉션
      router.push('/')
    }
  }
  
  // 회원가입
  const register = async (userData) => {
    try {
      authState.loading = true
      authState.error = null
      
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData)
      return { success: true, data: response.data }
    } catch (error) {
      authState.error = error.response?.data?.message || '회원가입에 실패했습니다.'
      return { success: false, error: authState.error }
    } finally {
      authState.loading = false
    }
  }
  
  // 토큰 검증 및 사용자 정보 로드
  const checkAuth = async () => {
    // 봇인 경우 항상 true 반환
    if (isBot()) {
      authState.user = {
        id: 'adsense_bot',
        isBot: true
      }
      authState.isAuthenticated = true
      return true
    }
    
    const token = localStorage.getItem('accessToken')
    if (!token) return false
    
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER.PROFILE)
      authState.user = response.data
      authState.isAuthenticated = true
      return true
    } catch (error) {
      // 토큰이 유효하지 않은 경우
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('memberId') // memberId도 삭제
      return false
    }
  }
  
  return {
    // 상태
    user,
    isAuthenticated,
    loading,
    error,
    
    // 메서드
    login,
    loginAsBot,
    logout,
    register,
    checkAuth,
    isBot,
  }
}
