/**
 * Member API Service
 * 플레이어 정보 조회를 위한 API 서비스
 */
import { apiClient } from '@/core/api/apiClient.js';

/**
 * 멤버 관련 API 엔드포인트
 */
const MEMBER_ENDPOINTS = {
  GET_PLAYER_SUMMARY: (memberId) => `/member/${memberId}/summary`
};

/**
 * PlayerSummaryResponse 인터페이스
 * @typedef {Object} RoadViewRankInfo
 * @property {number} ratingScore - 레이팅 점수
 * @property {string} rankLevel - 랭크 레벨 (1~5)
 * @property {string} rankTier - 랭크 티어 (BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER)
 * @property {number} rankAvgScore - 평균 점수
 */

/**
 * @typedef {Object} RoadViewMultiStats
 * @property {number} totalGames - 총 멀티플레이 게임 수
 * @property {number} firstPlaceCount - 1위 횟수
 */

/**
 * @typedef {Object} PlayerSummaryResponse
 * @property {string} nickname - 닉네임
 * @property {number} playStreak - 연속 플레이 일수
 * @property {string} equippedMarkerImageUrl - 장착된 마커 이미지 URL
 * @property {string} joinedAt - 가입일 (ISO 8601)
 * @property {Object} rankInfo - 랭크 정보
 * @property {RoadViewRankInfo} rankInfo.roadView - 로드뷰 랭크 정보
 * @property {Object} multiGameStats - 멀티게임 통계
 * @property {RoadViewMultiStats} multiGameStats.roadView - 로드뷰 멀티게임 통계
 */

/**
 * Member API Service Class
 */
class MemberService {
  /**
   * 플레이어 요약 정보 조회
   * @param {string|number} memberId - 멤버 ID
   * @returns {Promise<PlayerSummaryResponse>} 플레이어 요약 정보
   */
  async getPlayerSummary(memberId) {
    try {
      console.log('📤 플레이어 요약 정보 조회 요청:', { memberId });
      
      const response = await apiClient.get(MEMBER_ENDPOINTS.GET_PLAYER_SUMMARY(memberId));
      
      console.log('✅ 플레이어 요약 정보 조회 성공:', response.data);
      
      // API 응답 구조에 따라 데이터 추출
      if (response.data?.isSuccess && response.data?.result) {
        return response.data.result;
      }
      
      // 직접 데이터가 반환되는 경우
      if (response.data?.data) {
        return response.data.data;
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ 플레이어 요약 정보 조회 실패:', error);
      this._handleApiError(error, '플레이어 정보를 불러오는데 실패했습니다.');
      throw error;
    }
  }

  /**
   * API 에러 처리
   * @param {Error} error - 에러 객체
   * @param {string} defaultMessage - 기본 에러 메시지
   * @private
   */
  _handleApiError(error, defaultMessage) {
    if (error.response) {
      const { status, data } = error.response;
      console.error(`HTTP ${status} 에러:`, data);
      
      switch (status) {
        case 400:
          console.error('📛 잘못된 요청:', data.message || defaultMessage);
          break;
        case 401:
          console.error('📛 인증 실패: 로그인이 필요합니다.');
          break;
        case 404:
          console.error('📛 플레이어를 찾을 수 없습니다.');
          break;
        case 500:
          console.error('📛 서버 오류:', data.message || '서버에서 오류가 발생했습니다.');
          break;
        default:
          console.error('📛 알 수 없는 오류:', data.message || defaultMessage);
      }
      
      if (data?.message) {
        throw new Error(data.message);
      }
    } else if (error.request) {
      console.error('📛 네트워크 오류: 서버에 연결할 수 없습니다.');
      throw new Error('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
    }
    
    throw new Error(defaultMessage);
  }
}

// 싱글톤 인스턴스 생성 및 export
export const memberService = new MemberService();
export default memberService;

