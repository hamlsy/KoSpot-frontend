// core/composables/useAuth.js
import { ref, computed, reactive } from 'vue'
import apiClient from 'src/core/api/apiClient.js'
import { API_ENDPOINTS } from '@/core/api/endPoint.js'
import { useRouter } from 'vue-router'
import { tokenRefreshService } from '@/core/services/tokenRefresh.service.js'
import { authStorage } from '@/core/auth/authStorage.service.js'
import { registerPushIfPermitted, deletePushToken } from '@/core/platform/push.service.js'

// JWT payload 디코딩 헬퍼 (OAuthCallbackView 동일 패턴)
const decodeJwtPayload = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (_) {
    return null
  }
}

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

// JWT payload 디코딩 헬퍼 (OAuthCallbackView 동일 패턴)
const decodeJwtPayload = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (_) {
    return null
  }
}

export function useAuth() {
  const router = useRouter()

  // 상태 반응형 참조
  const user = computed(() => authState.user)
  const isAuthenticated = computed(() => {
    if (isBot()) return true
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

      // 방어적 필드 접근: 신규 스펙(data) 우선, 기존 패턴(result) 폴백
      const tokenData = response.data?.data ?? response.data?.result
      const { accessToken, refreshToken } = tokenData

      // login 응답에 memberId 없음 → JWT payload 디코딩으로 추출
      const payload = decodeJwtPayload(accessToken)
      const memberId = payload?.memberId ?? null

      authStorage.setTokens({ accessToken, refreshToken, memberId })
      authState.user = { id: memberId }
      authState.isAuthenticated = true

      tokenRefreshService.restart()

      try {
        await registerPushIfPermitted()
      } catch (_) {}

      return { success: true }
    } catch (error) {
      const code    = String(error.response?.data?.code ?? '')
      const message = error.response?.data?.message || '로그인에 실패했습니다.'
      authState.error = message
      return { success: false, code, message }
    } finally {
      authState.loading = false
    }
  }

  // 이메일 회원가입 (가입 즉시 자동 로그인)
  const signup = async (userData) => {
    try {
      authState.loading = true
      authState.error = null

      const response = await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, userData)

      const tokenData = response.data?.data ?? response.data?.result
      const { memberId, accessToken, refreshToken } = tokenData

      authStorage.setTokens({ accessToken, refreshToken, memberId })
      authState.user = { id: memberId }
      authState.isAuthenticated = true

      tokenRefreshService.restart()

      // connectAll()은 router afterEach에서 from.path === '/signup' 조건으로 처리
      try {
        await registerPushIfPermitted()
      } catch (_) {}

      return { success: true }
    } catch (error) {
      const code    = String(error.response?.data?.code ?? '')
      const message = error.response?.data?.message || '회원가입에 실패했습니다.'
      authState.error = message
      return { success: false, code, message }
    } finally {
      authState.loading = false
    }
  }

  // 봇 로그인 처리 (쿠키 기반)
  const loginAsBot = () => {
    localStorage.setItem('isBot', 'true')
    authState.user = { id: 'adsense_bot', isBot: true }
    authState.isAuthenticated = true
    console.log('🤖 봇 로그인 완료')
  }

  // 로그아웃
  const logout = async () => {
    const fcmToken = localStorage.getItem('fcmToken')
    if (fcmToken) {
      try {
        await deletePushToken(fcmToken)
      } catch (e) {
        console.warn('[push] 로그아웃 시 토큰 삭제 실패 (무시):', e)
      }
      localStorage.removeItem('fcmToken')
    }

    try {
      const refreshToken = localStorage.getItem('refreshToken')
      const isBotUser = isBot()

      if (refreshToken && !isBotUser) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken })
      }
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error)
    } finally {
      authStorage.clearAuth()
      localStorage.removeItem('isBot')
      authState.user = null
      authState.isAuthenticated = false

      tokenRefreshService.stop()
      router.push('/')
    }
  }

  // 토큰 검증 및 사용자 정보 로드
  const checkAuth = async () => {
    if (isBot()) {
      authState.user = { id: 'adsense_bot', isBot: true }
      authState.isAuthenticated = true
      return true
    }

    const token = authStorage.getAccessToken()
    if (!token) return false

    try {
      const response = await apiClient.get(API_ENDPOINTS.MEMBER.PROFILE)
      authState.user = response.data
      authState.isAuthenticated = true
      return true
    } catch (error) {
      authStorage.clearAuth()
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
    signup,
    loginAsBot,
    logout,
    checkAuth,
    isBot,
  }
}
