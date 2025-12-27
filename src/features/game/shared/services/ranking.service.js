/**
 * Game Ranking API Service
 * 게임 모드에 상관없이 공통으로 사용 가능한 랭킹 조회 서비스
 * ROADVIEW, PHOTO 등 다양한 게임 모드의 랭킹 정보를 조회합니다.
 */
import { apiClient } from '@/core/api/apiClient.js';

/**
 * 랭킹 조회 응답 데이터 인터페이스
 * @typedef {Object} RankingResponse
 * @property {MyRankInfo} myRank - 내 랭크 정보
 * @property {Array<PlayerSummary>} players - 플레이어 리스트
 */

/**
 * 내 랭크 정보 인터페이스
 * @typedef {Object} MyRankInfo
 * @property {string} nickname - 닉네임
 * @property {string} rankTier - 랭크 티어 (BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER)
 * @property {string} rankLevel - 랭크 레벨 (ONE, TWO, THREE, FOUR, FIVE)
 * @property {number} ratingScore - 레이팅 점수
 */

/**
 * 플레이어 요약 정보 인터페이스
 * @typedef {Object} PlayerSummary
 * @property {number} memberId - 멤버 ID
 * @property {string} nickname - 닉네임
 * @property {string} rankTier - 랭크 티어
 * @property {string} rankLevel - 랭크 레벨
 * @property {number} ratingScore - 레이팅 점수
 */

/**
 * Ranking API Service Class
 */
class RankingService {
  /**
   * 랭킹 조회
   * @param {string} gameMode - 게임 모드 ("ROADVIEW", "PHOTO" 등)
   * @param {string} rankTier - 랭크 티어 (BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER)
   * @param {number} page - 페이지 번호 (1부터 시작)
   * @returns {Promise<RankingResponse>} 랭킹 응답 데이터
   */
  async getRanking(gameMode, rankTier, page = 0) {
    try {
    

      const response = await apiClient.get('/ranks', {
        params: {
          gameMode,
          rankTier,
          page
        }
      });

    

      if (response.data.isSuccess) {
        return response.data.result;
      } else {
        throw new Error(response.data.message || '랭킹 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 랭킹 조회 실패:', error);
      this._handleApiError(error, '랭킹 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * API 오류 처리
   * @param {Error} error - 오류 객체
   * @param {string} defaultMessage - 기본 오류 메시지
   * @private
   */
  _handleApiError(error, defaultMessage) {
    if (error.response) {
      // 서버 응답이 있는 경우
      const status = error.response.status;
      const message = error.response.data?.message || defaultMessage;

      switch (status) {
        case 401:
          console.error('인증 실패:', message);
          break;
        case 403:
          console.error('권한 없음:', message);
          break;
        case 404:
          console.error('랭킹 정보를 찾을 수 없습니다:', message);
          break;
        case 500:
          console.error('서버 오류:', message);
          break;
        default:
          console.error(`오류 발생 (${status}):`, message);
      }
    } else if (error.request) {
      // 요청은 전송되었지만 응답을 받지 못한 경우
      console.error('서버 응답 없음:', defaultMessage);
    } else {
      // 요청 설정 중 오류가 발생한 경우
      console.error('요청 설정 오류:', error.message);
    }
  }
}

// 싱글톤 인스턴스 생성 및 export
const rankingService = new RankingService();
export default rankingService;

