import apiClient from '@/core/api/apiClient';

/**
 * 로드뷰 메인 페이지 관련 API 서비스
 */
const roadViewMainService = {
  /**
   * 로드뷰 메인 페이지 데이터 조회 (최근 3개 기록 + 랭크 정보)
   * @returns {Promise} - API 응답
   */
  getMainPageData() {
    return apiClient.get('/roadView/history/recent');
  },

  /**
   * 전체 기록 조회 (페이지네이션)
   * @param {number} page - 페이지 번호 (0부터 시작)
   * @param {number} size - 페이지 크기
   * @returns {Promise} - API 응답
   */
  getHistory(page = 0, size = 10) {
    return apiClient.get('/roadView/history', {
      params: { page, size }
    });
  }
};

export default roadViewMainService;

