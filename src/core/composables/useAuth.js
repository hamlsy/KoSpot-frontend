// core/composables/useAuth.js
import { ref, computed, reactive } from 'vue'
import apiClient from 'src/core/api/apiClient.js'
import { API_ENDPOINTS } from '@/core/api/endPoint.js'
import { useRouter } from 'vue-router'

// 전역 상태 관리
const authState = reactive({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
})

export function useAuth() {
  const router = useRouter()
  
  // 상태 반응형 참조
  const user = computed(() => authState.user)
  const isAuthenticated = computed(() => authState.isAuthenticated)
  const loading = computed(() => authState.loading)
  const error = computed(() => authState.error)
  
  // 로그인
  const login = async (credentials) => {
    try {
      authState.loading = true
      authState.error = null
      
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
      const { user, accessToken, refreshToken } = response.data
      
      // 토큰 저장
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      
      // 사용자 정보 저장
      authState.user = user
      authState.isAuthenticated = true
      
      return { success: true, user }
    } catch (error) {
      authState.error = error.response?.data?.message || '로그인에 실패했습니다.'
      return { success: false, error: authState.error }
    } finally {
      authState.loading = false
    }
  }
  
  // 로그아웃
  const logout = async () => {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error)
    } finally {
      // 로컬 상태 정리
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      authState.user = null
      authState.isAuthenticated = false
      
      router.push('/login')
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
      return false
    }
  }
  
  // 비밀번호 변경
  const changePassword = async (passwordData) => {
    try {
      authState.loading = true
      const response = await apiClient.post(API_ENDPOINTS.USER.CHANGE_PASSWORD, passwordData)
      return { success: true, message: response.data.message }
    } catch (error) {
      return { success: false, error: error.response?.data?.message }
    } finally {
      authState.loading = false
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
    logout,
    register,
    checkAuth,
    changePassword
  }
}
