/**
 * User Profile API Service
 * 사용자 프로필 조회 및 관리를 위한 백엔드 API 연동 서비스
 */
import { apiClient } from '@/core/api/apiClient.js';

/**
 * 사용자 프로필 응답 데이터 인터페이스
 * @typedef {Object} UserProfileResponse
 * @property {string} nickname - 사용자 닉네임
 * @property {string} email - 이메일
 * @property {string} profileImageUrl - 프로필 이미지 URL
 * @property {number} currentPoint - 현재 포인트
 * @property {string} joinedAt - 가입일 (ISO 8601)
 * @property {string} lastPlayedAt - 마지막 플레이 일시 (ISO 8601)
 * @property {number} currentStreak - 연속 플레이 일수
 * @property {Statistics} statistics - 게임 통계
 * @property {RankInfo} rankInfo - 랭크 정보
 */

/**
 * 게임 통계 인터페이스
 * @typedef {Object} Statistics
 * @property {SingleGame} singleGame - 싱글 게임 통계
 * @property {MultiGame} multiGame - 멀티 게임 통계
 * @property {number} bestScore - 최고 점수
 */

/**
 * 랭크 정보 인터페이스
 * @typedef {Object} RankInfo
 * @property {string} rankTier - 랭크 티어 (BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER)
 * @property {string} rankLevel - 랭크 레벨 (ONE, TWO, THREE, FOUR)
 * @property {number} ratingScore - 레이팅 점수
 * @property {number} rankPercentage - 상위 퍼센트
 */

/**
 * User Service Class
 */
class UserService {
  /**
   * 사용자 프로필 조회
   * @returns {Promise<ApiResponse<UserProfileResponse>>} API 응답
   */
  async getProfile() {
    try {
      console.log('📤 프로필 조회 요청');
      
      const response = await apiClient.get('/user/profile');
      
      console.log('✅ 프로필 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 프로필 조회 실패:', error);
      this._handleApiError(error, '프로필 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 사용자 프로필 업데이트
   * @param {Object} profileData - 프로필 데이터
   * @returns {Promise<ApiResponse>} API 응답
   */
  async updateProfile(profileData) {
    try {
      console.log('📤 프로필 업데이트 요청:', profileData);
      
      const response = await apiClient.put('/user/profile', profileData);
      
      console.log('✅ 프로필 업데이트 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 프로필 업데이트 실패:', error);
      this._handleApiError(error, '프로필 업데이트에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 랭크 티어 정보 가져오기
   * @param {string} rankTier - 랭크 티어 (BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER)
   * @returns {Object} 랭크 티어 정보 (이름, 색상, 아이콘)
   */
  getRankTierInfo(rankTier) {
    const rankTiers = {
      BRONZE: {
        name: '브론즈',
        icon: '🥉'
      },
      SILVER: {
        name: '실버',
        icon: '🥈'
      },
      GOLD: {
        name: '골드',
        icon: '🥇'
      },
      PLATINUM: {
        name: '플래티넘',
        icon: '💎'
      },
      DIAMOND: {
        name: '다이아몬드',
        icon: '💠'
      },
      MASTER: {
        name: '마스터',
        icon: '👑'
      }
    };

    return rankTiers[rankTier] || rankTiers.BRONZE;
  }

  /**
   * 랭크 레벨 변환
   * @param {string} rankLevel - 랭크 레벨 (ONE, TWO, THREE, FOUR)
   * @returns {number} 숫자 레벨
   */
  getRankLevelNumber(rankLevel) {
    const levels = {
      ONE: 1,
      TWO: 2,
      THREE: 3,
      FOUR: 4
    };
    return levels[rankLevel] || 1;
  }

  /**
   * 날짜 포맷팅
   * @param {string} dateString - ISO 8601 형식의 날짜 문자열
   * @returns {string} 포맷된 날짜 문자열 (YYYY.MM.DD)
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '-';
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}.${month}.${day}`;
    } catch (error) {
      console.error('날짜 포맷팅 실패:', error);
      return '-';
    }
  }

  /**
   * 숫자 포맷팅 (천 단위 구분)
   * @param {number} num - 숫자
   * @returns {string} 포맷된 숫자 문자열
   */
  formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) {
      return '0';
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
      
      if (data?.message) {
        throw new Error(data.message);
      }
    } else if (error.request) {
      console.error('네트워크 에러:', error.request);
      throw new Error('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
    }
    
    throw new Error(defaultMessage);
  }
}

// 싱글톤 인스턴스 생성 및 export
export const userService = new UserService();
export default userService;
