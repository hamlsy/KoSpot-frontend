import apiClient from '../apiClient';

/**
 * 인증 관련 API 서비스
 */
const authService = {
  /**
   * 로그인 요청
   * @param {Object} credentials - 로그인 정보 (이메일, 비밀번호)
   * @returns {Promise} - API 응답
   */
  login(credentials) {
    return apiClient.post('/auth/login', credentials);
  },

  /**
   * 소셜 로그인 요청 (네이버, 구글, 카카오)
   * @param {string} provider - 소셜 제공자 (naver, google, kakao)
   * @param {string} code - 인증 코드
   * @returns {Promise} - API 응답
   */
  socialLogin(provider, code) {
    return apiClient.post(`/auth/social/${provider}`, { code });
  },

  /**
   * 로그아웃 요청
   * @returns {Promise} - API 응답
   */
  logout() {
    return apiClient.post('/auth/logout');
  },

  /**
   * 토큰 갱신 요청
   * @param {string} refreshToken - 리프레시 토큰
   * @returns {Promise} - API 응답
   */
  refreshToken(refreshToken) {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  /**
   * 사용자 정보 조회
   * @returns {Promise} - 사용자 정보 응답
   */
  getCurrentUser() {
    return apiClient.get('/auth/me');
  },

  /**
   * 회원가입
   * @param {Object} userData - 사용자 정보
   * @returns {Promise} - 회원가입 응답
   */
  register(userData) {
    return apiClient.post('/auth/register', userData);
  },

  /**
   * 비밀번호 재설정 요청
   * @param {String} email - 이메일
   * @returns {Promise} - 비밀번호 재설정 요청 응답
   */
  requestPasswordReset(email) {
    return apiClient.post('/auth/password-reset-request', { email });
  },

  /**
   * 비밀번호 재설정
   * @param {Object} resetData - 재설정 정보 (token, newPassword)
   * @returns {Promise} - 비밀번호 재설정 응답
   */
  resetPassword(resetData) {
    return apiClient.post('/auth/password-reset', resetData);
  }
};

export default authService;
