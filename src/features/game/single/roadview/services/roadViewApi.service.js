/**
 * RoadView Game API Service
 * 백엔드 Spring Boot API와의 통신을 담당하는 서비스 레이어
 * 랭크 모드와 연습 모드의 게임 시작/종료 API 호출을 처리합니다.
 */
import { apiClient } from 'src/core/api/apiClient.js';
import CryptoJS from 'crypto-js';

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
    SHARE: '/roadView/practice/share',
    SHARED_START: '/roadView/practice/shared/start',
    SHARED_END: '/roadView/practice/shared/end',
  },
  // 공통 (연습/랭크 공통 사용)
  REISSUE: '/roadView/{gameId}/reissue-coordinate',
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
 * @property {string} result.fullAddress - 전체 주소 (시도, 시군구, 동 포함)
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
 * @property {string} result.nickname - 플레이어 닉네임
 * @property {number} result.answerDistance - 정답과의 거리 (km)
 * @property {number} result.baseScore - 기본 점수
 * @property {number} result.bonusScore - 시간 보너스 점수
 * @property {number} result.score - 게임 점수
 * @property {number} result.previousRatingScore - 게임 전 랭크 점수
 * @property {number} result.currentRatingScore - 게임 후 랭크 점수
 * @property {number} result.ratingScoreChange - 랭킹 점수 변화 (양수: 상승, 음수: 하락)
 * @property {string} result.previousRankTier - 게임 전 티어 (BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER)
 * @property {string} result.previousRankLevel - 게임 전 레벨 (ONE, TWO, THREE, FOUR, FIVE)
 * @property {string} result.currentRankTier - 게임 후 티어
 * @property {string} result.currentRankLevel - 게임 후 레벨
 * @property {string} result.poiName - 정답 위치의 POI 이름
 * @property {string} result.fullAddress - 전체 주소 (시도, 시군구, 동 포함)
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
 * @property {string} [result.practiceToken] - 익명 사용자용 연습 토큰
 * @property {string} result.targetLat - 목표 위도
 * @property {string} result.targetLng - 목표 경도
 * @property {string} result.markerImageUrl - 마커 이미지 URL
 * @property {string} result.poiName - 정답 위치의 POI 이름
 * @property {string} result.fullAddress - 전체 주소 (시도, 시군구, 동 포함)
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
 * @property {string} result.poiName - 정답 위치의 POI 이름
 * @property {string} result.fullAddress - 전체 주소 (시도, 시군구, 동 포함)
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
      const response = await apiClient.post(ROADVIEW_ENDPOINTS.RANK.START);
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
      
      const response = await apiClient.post(ROADVIEW_ENDPOINTS.RANK.END, endData);
      return response.data;
    } catch (error) {
      console.error('❌ 랭크 게임 종료 실패:', error);
      this._handleApiError(error, '랭크 게임 종료에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 연습 게임 시작
   * 최대 5번까지 재시도합니다.
   * @param {string} sido - 시도 (지역명)
   * @param {number} maxRetries - 최대 재시도 횟수 (기본값: 5)
   * @returns {Promise<PracticeStartResponse>} API 응답 데이터
   */
  async startPracticeGame(sido, maxRetries = 5) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 연습 게임 시작 요청 (시도 ${attempt}/${maxRetries}):`, { sido });
        
        const response = await apiClient.post(ROADVIEW_ENDPOINTS.PRACTICE.START, null, {
          params: { sido }
        });
        
        if (response.data && response.data.isSuccess && response.data.result) {
          console.log(`✅ 연습 게임 시작 성공 (시도 ${attempt}/${maxRetries}):`, response.data);
          
          const { gameId, practiceToken } = response.data.result;
          if (practiceToken) {
            sessionStorage.setItem('practiceToken', practiceToken);
            sessionStorage.setItem('practiceGameId', gameId);
          }
          
          return response.data;
        } else {
          throw new Error(response.data?.message || '연습 게임 시작 응답이 유효하지 않습니다.');
        }
      } catch (error) {
        lastError = error;
        console.error(`❌ 연습 게임 시작 실패 (시도 ${attempt}/${maxRetries}):`, error);
        
        // 마지막 시도가 아니면 잠시 대기 후 재시도
        if (attempt < maxRetries) {
          const waitTime = attempt * 500; // 점진적 대기 (500ms, 1000ms, 1500ms, 2000ms)
          console.log(`⏳ ${waitTime}ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // 모든 시도 실패
    console.error(`❌ 연습 게임 시작 최종 실패 (${maxRetries}회 시도):`, lastError);
    this._handleApiError(lastError, `연습 게임 시작에 실패했습니다. (${maxRetries}회 시도)`);
    throw lastError;
  }

  /**
   * 연습 게임 종료
   * @param {PracticeEndRequest} endData - 게임 종료 데이터
   * @returns {Promise<PracticeEndResponse>} API 응답 데이터
   */
  async endPracticeGame(endData) {
    try {
      console.log('📤 연습 게임 종료 요청:', endData);
      
      const practiceToken = sessionStorage.getItem('practiceToken');
      const config = practiceToken ? {
        headers: {
          'X-Practice-Token': practiceToken
        }
      } : {};
      
      const response = await apiClient.post(ROADVIEW_ENDPOINTS.PRACTICE.END, endData, config);
      
      if (practiceToken) {
        sessionStorage.removeItem('practiceToken');
        sessionStorage.removeItem('practiceGameId');
      }

      console.log('✅ 연습 게임 종료 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 연습 게임 종료 실패:', error);
      this._handleApiError(error, '연습 게임 종료에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 연습 게임 공유 링크 생성
   * @param {Object} payload - 공유 생성 데이터
   * @returns {Promise<Object|null>} API 응답 데이터
   */
  async createPracticeShareLink(payload) {
    try {
      const response = await apiClient.post(ROADVIEW_ENDPOINTS.PRACTICE.SHARE, payload);
      return response.data;
    } catch (error) {
      // 공유 API 미구현 환경에서는 프론트 fallback 토큰을 사용하기 위해 null 반환
      console.warn('연습 게임 공유 링크 API 호출 실패, fallback 사용:', error?.message || error);
      return null;
    }
  }

  /**
   * 공유 링크로 연습 게임 시작
   * @param {string} shareToken - 공유 토큰
   * @returns {Promise<Object>} API 응답 데이터
   */
  async startSharedPracticeGame(shareToken) {
    try {
      const response = await apiClient.post(ROADVIEW_ENDPOINTS.PRACTICE.SHARED_START, { shareToken });
      return response.data;
    } catch (error) {
      console.error('❌ 공유 연습 게임 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 공유 연습 게임 종료 및 비교 결과 조회
   * @param {Object} payload - 공유 결과 제출 데이터
   * @returns {Promise<Object|null>} API 응답 데이터
   */
  async endSharedPracticeGame(payload) {
    try {
      const response = await apiClient.post(ROADVIEW_ENDPOINTS.PRACTICE.SHARED_END, payload);
      return response.data;
    } catch (error) {
      console.warn('공유 연습 결과 API 호출 실패, 로컬 비교 사용:', error?.message || error);
      return null;
    }
  }

  /**
   * 좌표 재발급 (연습/랭크 공통)
   * 최대 5번까지 재시도합니다.
   * @param {number} gameId - 게임 ID
   * @param {number} maxRetries - 최대 재시도 횟수 (기본값: 5)
   * @returns {Promise<{isSuccess: boolean, result: {targetLat: string, targetLng: string}}>} API 응답 데이터
   */
  async reissueCoordinate(gameId, maxRetries = 5) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 좌표 재발급 요청 (시도 ${attempt}/${maxRetries}):`, { gameId });
        
        const endpoint = ROADVIEW_ENDPOINTS.REISSUE.replace('{gameId}', gameId);
        
        const practiceToken = sessionStorage.getItem('practiceToken');
        const config = practiceToken ? {
          headers: {
            'X-Practice-Token': practiceToken
          }
        } : {};
        
        const response = await apiClient.post(endpoint, null, config);
        
        if (response.data && response.data.isSuccess && response.data.result) {
          console.log(`✅ 좌표 재발급 성공 (시도 ${attempt}/${maxRetries}):`, response.data);
          return response.data;
        } else {
          throw new Error(response.data?.message || '좌표 재발급 응답이 유효하지 않습니다.');
        }
      } catch (error) {
        lastError = error;
        console.error(`❌ 좌표 재발급 실패 (시도 ${attempt}/${maxRetries}):`, error);
        
        // 마지막 시도가 아니면 잠시 대기 후 재시도
        if (attempt < maxRetries) {
          const waitTime = attempt * 500; // 점진적 대기 (500ms, 1000ms, 1500ms, 2000ms)
          console.log(`⏳ ${waitTime}ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // 모든 시도 실패
    console.error(`❌ 좌표 재발급 최종 실패 (${maxRetries}회 시도):`, lastError);
    throw new Error(`좌표 재발급에 실패했습니다. (${maxRetries}회 시도)`);
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

  /**
   * 암호화된 좌표를 복호화
   * @param {string} encryptedCoordinate - 암호화된 좌표 (Base64 문자열)
   * @returns {number} 복호화된 좌표 (숫자)
   */
  decryptCoordinate(encryptedCoordinate) {
    try {
      // 환경변수에서 암호화 키 가져오기
      // 로컬 테스트 시에는 "1234567890123456" 사용, 배포 시에는 env에서 가져오기
      const isDevelopment = process.env.NODE_ENV === 'development';
      const encryptKey = isDevelopment 
        ? (process.env.VUE_APP_AES_SECRET_KEY || '1234567890123456')
        : process.env.VUE_APP_AES_SECRET_KEY;
      
      if (!encryptKey) {
        console.warn('⚠️ VUE_APP_ENCRYPT_KEY가 설정되지 않았습니다. 암호화된 좌표를 복호화할 수 없습니다.');
        // 키가 없으면 원본 값을 숫자로 변환하여 반환
        return typeof encryptedCoordinate === 'string' ? parseFloat(encryptedCoordinate) : encryptedCoordinate;
      }

      if (!encryptedCoordinate || typeof encryptedCoordinate !== 'string') {
        console.warn('⚠️ 암호화된 좌표가 유효하지 않습니다:', encryptedCoordinate);
        return typeof encryptedCoordinate === 'string' ? parseFloat(encryptedCoordinate) : encryptedCoordinate;
      }

      // 암호화 키 로그 출력 (로컬 테스트 시에만)
      if (isDevelopment) {
        console.log('🔑 사용 중인 암호화 키:', encryptKey === '1234567890123456' ? '1234567890123456 (로컬 테스트용)' : 'env에서 가져온 키');
      }

      // 1. Base64 디코딩
      const encryptedWords = CryptoJS.enc.Base64.parse(encryptedCoordinate);

      // 2. 키를 WordArray로 변환
      const keyWords = CryptoJS.enc.Utf8.parse(encryptKey);

      // 3. 복호화 수행
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: encryptedWords },
        keyWords,
        {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      // 4. 복호화된 문자열을 숫자로 변환
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      const decryptedNumber = parseFloat(decryptedString);

      if (isNaN(decryptedNumber)) {
        console.error('❌ 복호화된 좌표를 숫자로 변환할 수 없습니다:', decryptedString);
        throw new Error('좌표 복호화 실패: 숫자 변환 불가');
      }


      return decryptedNumber;
    } catch (error) {
      console.error('❌ 좌표 복호화 실패:', error);
      // 복호화 실패 시 원본 값을 숫자로 변환하여 반환 (폴백)
      return typeof encryptedCoordinate === 'string' ? parseFloat(encryptedCoordinate) : encryptedCoordinate;
    }
  }
}

// 싱글톤 인스턴스 생성 및 export
export const roadViewApiService = new RoadViewApiService();
export default roadViewApiService;
