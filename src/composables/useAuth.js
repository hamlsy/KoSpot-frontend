import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import authService from '@/api/services/auth.service';

/**
 * 인증 관련 기능을 제공하는 컴포저블
 * @returns {Object} - 인증 관련 상태 및 메서드
 */
export default function useAuth() {
  const router = useRouter();
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || null);
  const isLoading = ref(false);
  const error = ref(null);

  // 로그인 상태 확인
  const isLoggedIn = computed(() => !!token.value);

  // 로그인
  const login = async (credentials) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await authService.login(credentials);
      token.value = response.data.token;
      user.value = response.data.user;
      
      // 토큰 저장
      localStorage.setItem('token', token.value);
      
      isLoading.value = false;
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || '로그인에 실패했습니다.';
      isLoading.value = false;
      return false;
    }
  };

  // 소셜 로그인
  const socialLogin = async (provider, code) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await authService.socialLogin(provider, code);
      token.value = response.data.token;
      user.value = response.data.user;
      
      // 토큰 저장
      localStorage.setItem('token', token.value);
      
      isLoading.value = false;
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || '소셜 로그인에 실패했습니다.';
      isLoading.value = false;
      return false;
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      isLoading.value = true;
      
      // 서버에 로그아웃 요청
      if (token.value) {
        await authService.logout();
      }
      
      // 로컬 상태 초기화
      token.value = null;
      user.value = null;
      localStorage.removeItem('token');
      
      isLoading.value = false;
      
      // 로그인 페이지로 이동
      router.push('/login');
      
      return true;
    } catch (err) {
      console.error('로그아웃 오류:', err);
      
      // 오류가 발생해도 로컬 상태는 초기화
      token.value = null;
      user.value = null;
      localStorage.removeItem('token');
      
      isLoading.value = false;
      return false;
    }
  };

  // 사용자 정보 로드
  const loadUser = async () => {
    if (!token.value) return null;
    
    try {
      isLoading.value = true;
      
      // 사용자 프로필 API 호출
      const response = await userService.getProfile();
      user.value = response.data;
      
      isLoading.value = false;
      return user.value;
    } catch (err) {
      error.value = err.response?.data?.message || '사용자 정보를 불러오는데 실패했습니다.';
      
      // 인증 오류인 경우 로그아웃
      if (err.response?.status === 401) {
        logout();
      }
      
      isLoading.value = false;
      return null;
    }
  };

  // 토큰 갱신
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return false;
      
      const response = await authService.refreshToken(refreshToken);
      token.value = response.data.token;
      localStorage.setItem('token', token.value);
      
      return true;
    } catch (err) {
      console.error('토큰 갱신 오류:', err);
      return false;
    }
  };

  return {
    user,
    token,
    isLoggedIn,
    isLoading,
    error,
    login,
    socialLogin,
    logout,
    loadUser,
    refreshToken
  };
}
