import authService from 'src/features/auth/services/auth.service.js'
import router from '@/router';

// 인증 상태 관리 스토어 모듈
export default {
  namespaced: true,
  
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,
    isLoading: false,
    error: null
  }),
  
  mutations: {
    // 토큰 설정
    SET_TOKEN(state, token) {
      state.token = token;
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    },
    
    // 사용자 정보 설정
    SET_USER(state, user) {
      state.user = user;
    },
    
    // 로딩 상태 설정
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    
    // 오류 설정
    SET_ERROR(state, error) {
      state.error = error;
    }
  },
  
  actions: {
    // 로그인
    async login({ commit }, credentials) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await authService.login(credentials);
        commit('SET_TOKEN', response.data.token);
        commit('SET_USER', response.data.user);
        return true;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || '로그인에 실패했습니다.');
        return false;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // 소셜 로그인
    async socialLogin({ commit }, { provider, code }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await authService.socialLogin(provider, code);
        commit('SET_TOKEN', response.data.token);
        commit('SET_USER', response.data.user);
        return true;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || '소셜 로그인에 실패했습니다.');
        return false;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // 로그아웃
    async logout({ commit }) {
      commit('SET_LOADING', true);
      
      try {
        await authService.logout();
        commit('SET_TOKEN', null);
        commit('SET_USER', null);
        router.push('/login');
        return true;
      } catch (error) {
        console.error('로그아웃 오류:', error);
        // 오류가 발생해도 로컬 상태는 초기화
        commit('SET_TOKEN', null);
        commit('SET_USER', null);
        router.push('/login');
        return false;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // 토큰 갱신
    async refreshToken({ commit, state }) {
      if (!state.token) return false;
      
      try {
        const response = await authService.refreshToken();
        commit('SET_TOKEN', response.data.token);
        return true;
      } catch (error) {
        console.error('토큰 갱신 오류:', error);
        return false;
      }
    },
    
    // 현재 사용자 정보 로드
    async loadUser({ commit, state, dispatch }) {
      if (!state.token) return null;
      
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await authService.getUser();
        commit('SET_USER', response.data);
        return response.data;
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || '사용자 정보를 불러오는데 실패했습니다.');
        
        // 인증 오류인 경우 로그아웃
        if (error.response?.status === 401) {
          dispatch('logout');
        }
        
        return null;
      } finally {
        commit('SET_LOADING', false);
      }
    }
  },
  
  getters: {
    // 로그인 여부
    isLoggedIn: state => !!state.token,
    
    // 현재 사용자
    currentUser: state => state.user,
    
    // 사용자 역할
    userRole: state => state.user?.role || 'guest',
    
    // 관리자 여부
    isAdmin: state => state.user?.role === 'admin',
    
    // 인증 헤더
    authHeader: state => state.token ? `Bearer ${state.token}` : ''
  }
};
