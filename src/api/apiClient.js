import axios from 'axios';
import store from '@/store';

// API 기본 설정
const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 요청 인터셉터 - 토큰 추가
apiClient.interceptors.request.use(
  config => {
    const token = store.state.auth.token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리 및 토큰 만료 처리
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // 401 에러 (인증 실패) 처리
    if (error.response && error.response.status === 401) {
      // 토큰 만료 시 로그아웃 처리
      store.dispatch('auth/logout');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
