import apiClient from './apiClient';

/**
 * 인증 관련 API 서비스
 */
const authService = {
  /**
   * 로그인
   * @param {Object} credentials - 로그인 정보 (email, password)
   * @returns {Promise} - 로그인 응답
   */
  login(credentials) {
    return apiClient.post('/auth/login', credentials);
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
   * 로그아웃
   * @returns {Promise} - 로그아웃 응답
   */
  logout() {
    return apiClient.post('/auth/logout');
  },

  /**
   * 토큰 갱신
   * @param {String} refreshToken - 리프레시 토큰
   * @returns {Promise} - 토큰 갱신 응답
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
