/**
 * RoadView Game API Service
 * 백엔드 Spring Boot API와의 통신을 담당하는 서비스 레이어
 * 랭크 모드와 연습 모드의 게임 시작/종료 API 호출을 처리합니다.
 */
import { apiClient } from 'src/core/api/apiClient.js';

/**
 * 로드뷰 게임 관련 API 엔드포인트
 */
const ROADVIEW_ENDPOINTS = {
  // 랭크 모드
  RANK: {
    START: '/roadView/rank/start',
    END: '/roadView/rank/end',
  },
  // 연습 모드
  PRACTICE: {
    START: '/roadView/practice/start',
    END: '/roadView/practice/end',
  },
};

/**
 * 랭크 게임 시작 요청 데이터 인터페이스
 * @typedef {Object} RankStartRequest
 * - 파라미터 없음
 */

/**
 * 랭크 게임 시작 응답 데이터 인터페이스
 * @typedef {Object} RankStartResponse
 * @property {boolean} isSuccess - 성공 여부
 * @property {number} code - 응답 코드
 * @property {string} message - 응답 메시지
 * @property {Object} result - 결과 데이터
 * @property {string} result.gameId - 게임 ID
 * @property {string} result.targetLat - 목표 위도
 * @property {string} result.targetLng - 목표 경도
 * @property {string} result.markerImageUrl - 마커 이미지 URL
 * @property {string} result.poiName - 정답 위치의 POI 이름
 */

/**
 * 랭크 게임 종료 요청 데이터 인터페이스
 * @typedef {Object} RankEndRequest
 * @property {number} gameId - 게임 ID (Long)
 * @property {number} submittedLat - 사용자가 선택한 위도
 * @property {number} submittedLng - 사용자가 선택한 경도
 * @property {number} answerTime - 답변 소요 시간 (초)
 */

/**
 * 랭크 게임 종료 응답 데이터 인터페이스
 * @typedef {Object} RankEndResponse
 * @property {boolean} isSuccess - 성공 여부
 * @property {number} code - 응답 코드
 * @property {string} message - 응답 메시지
 * @property {Object} result - 결과 데이터
 * @property {number} result.score - 게임 점수
 * @property {number} result.previousRatingScore - 게임 전 랭크 점수
 * @property {number} result.currentRatingScore - 게임 후 랭크 점수
 * @property {number} result.ratingScoreChange - 랭킹 점수 변화 (양수: 상승, 음수: 하락)
 * @property {string} result.previousRankTier - 게임 전 티어 (BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER)
 * @property {string} result.previousRankLevel - 게임 전 레벨 (ONE, TWO, THREE, FOUR, FIVE)
 * @property {string} result.currentRankTier - 게임 후 티어
 * @property {string} result.currentRankLevel - 게임 후 레벨
 */

/**
 * 연습 게임 시작 요청 데이터 인터페이스
 * @typedef {Object} PracticeStartRequest
 * @property {string} sido - 시도 (지역)
 */

/**
 * 연습 게임 시작 응답 데이터 인터페이스
 * @typedef {Object} PracticeStartResponse
 * @property {boolean} isSuccess - 성공 여부
 * @property {number} code - 응답 코드
 * @property {string} message - 응답 메시지
 * @property {Object} result - 결과 데이터
 * @property {string} result.gameId - 게임 ID
 * @property {string} result.targetLat - 목표 위도
 * @property {string} result.targetLng - 목표 경도
 * @property {string} result.markerImageUrl - 마커 이미지 URL
 */

/**
 * 연습 게임 종료 요청 데이터 인터페이스
 * @typedef {Object} PracticeEndRequest
 * @property {number} gameId - 게임 ID (Long)
 * @property {number} submittedLat - 사용자가 선택한 위도
 * @property {number} submittedLng - 사용자가 선택한 경도
 * @property {number} answerTime - 답변 소요 시간 (초)
 */

/**
 * 연습 게임 종료 응답 데이터 인터페이스
 * @typedef {Object} PracticeEndResponse
 * @property {boolean} isSuccess - 성공 여부
 * @property {number} code - 응답 코드
 * @property {string} message - 응답 메시지
 * @property {Object} result - 결과 데이터
 * @property {number} result.score - 게임 점수
 */

/**
 * RoadView Game API Service Class
 */
class RoadViewApiService {
  /**
   * 랭크 게임 시작
   * @returns {Promise<RankStartResponse>} API 응답 데이터
   */
  async startRankGame() {
    try {
      console.log('📤 랭크 게임 시작 요청');
      
      const response = await apiClient.post(ROADVIEW_ENDPOINTS.RANK.START);
      
      console.log('✅ 랭크 게임 시작 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 랭크 게임 시작 실패:', error);
      this._handleApiError(error, '랭크 게임 시작에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 랭크 게임 종료
   * @param {RankEndRequest} endData - 게임 종료 데이터
   * @returns {Promise<RankEndResponse>} API 응답 데이터
   */
  async endRankGame(endData) {
    try {
      console.log('📤 랭크 게임 종료 요청:', endData);
      
      const response = await apiClient.post(ROADVIEW_ENDPOINTS.RANK.END, endData);
      
      console.log('✅ 랭크 게임 종료 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 랭크 게임 종료 실패:', error);
      this._handleApiError(error, '랭크 게임 종료에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 연습 게임 시작
   * @param {string} sido - 시도 (지역명)
   * @returns {Promise<PracticeStartResponse>} API 응답 데이터
   */
  async startPracticeGame(sido) {
    try {
      console.log('📤 연습 게임 시작 요청:', { sido });
      
      const response = await apiClient.post(ROADVIEW_ENDPOINTS.PRACTICE.START, null, {
        params: { sido }
      });
      
      console.log('✅ 연습 게임 시작 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 연습 게임 시작 실패:', error);
      this._handleApiError(error, '연습 게임 시작에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 연습 게임 종료
   * @param {PracticeEndRequest} endData - 게임 종료 데이터
   * @returns {Promise<PracticeEndResponse>} API 응답 데이터
   */
  async endPracticeGame(endData) {
    try {
      console.log('📤 연습 게임 종료 요청:', endData);
      
      const response = await apiClient.post(ROADVIEW_ENDPOINTS.PRACTICE.END, endData);
      
      console.log('✅ 연습 게임 종료 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 연습 게임 종료 실패:', error);
      this._handleApiError(error, '연습 게임 종료에 실패했습니다.');
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
      // 서버에서 응답을 받았지만 에러 상태코드인 경우
      const { status, data } = error.response;
      console.error(`HTTP ${status} 에러:`, data);
      
      // 서버에서 제공하는 에러 메시지가 있으면 사용
      if (data?.message) {
        throw new Error(data.message);
      }
    } else if (error.request) {
      // 네트워크 에러
      console.error('네트워크 에러:', error.request);
      throw new Error('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
    }
    
    // 기본 에러 메시지
    throw new Error(defaultMessage);
  }

  /**
   * 게임 데이터 유효성 검사
   * @param {Object} gameData - 게임 데이터
   * @returns {boolean} 유효성 여부
   * @private
   */
  _validateGameData(gameData) {
    const { gameId, targetLat, targetLng } = gameData;
    
    if (!gameId || typeof gameId !== 'string') {
      console.error('유효하지 않은 gameId:', gameId);
      return false;
    }
    
    if (!targetLat || typeof targetLat !== 'string') {
      console.error('유효하지 않은 targetLat:', targetLat);
      return false;
    }
    
    if (!targetLng || typeof targetLng !== 'string') {
      console.error('유효하지 않은 targetLng:', targetLng);
      return false;
    }
    
    return true;
  }

  /**
   * 위도/경도 좌표를 문자열로 변환
   * @param {number} coordinate - 숫자 좌표
   * @returns {string} 문자열 좌표
   */
  convertCoordinateToString(coordinate) {
    return typeof coordinate === 'number' ? coordinate.toString() : coordinate;
  }

  /**
   * 문자열 좌표를 숫자로 변환
   * @param {string} coordinate - 문자열 좌표
   * @returns {number} 숫자 좌표
   */
  convertCoordinateToNumber(coordinate) {
    return typeof coordinate === 'string' ? parseFloat(coordinate) : coordinate;
  }

  /**
   * gameId를 숫자로 변환
   * @param {string|number} gameId - 게임 ID
   * @returns {number} 숫자 게임 ID
   */
  convertGameIdToNumber(gameId) {
    if (typeof gameId === 'string') {
      return parseInt(gameId, 10);
    }
    return gameId;
  }
}

// 싱글톤 인스턴스 생성 및 export
export const roadViewApiService = new RoadViewApiService();
export default roadViewApiService;
