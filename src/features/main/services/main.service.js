/**
 * Main Page API Service
 * 메인 페이지 데이터 조회를 위한 백엔드 API 연동 서비스
 * 관리자 여부, 게임 모드 상태, 최근 공지사항, 배너 정보를 제공합니다.
 */
import { apiClient } from 'src/core/api/apiClient.js';
import { API_ENDPOINTS } from 'src/core/api/endPoint.js';

/**
 * 메인 페이지 응답 데이터 인터페이스
 * @typedef {Object} MainPageResponse
 * @property {boolean} isAdmin - 현재 사용자가 관리자인지 여부
 * @property {GameModeStatus} gameModeStatus - 게임 모드별 활성화 상태
 * @property {NoticeItem[]} recentNotices - 최근 공지사항 3개
 * @property {BannerItem[]} banners - 활성화된 배너 목록
 */

/**
 * 게임 모드 상태 인터페이스
 * @typedef {Object} GameModeStatus
 * @property {boolean} roadviewEnabled - 로드뷰 모드 활성화 여부
 * @property {boolean} photoEnabled - 포토 모드 활성화 여부
 * @property {boolean} multiplayEnabled - 멀티플레이 모드 활성화 여부
 */

/**
 * 공지사항 아이템 인터페이스
 * @typedef {Object} NoticeItem
 * @property {number} noticeId - 공지사항 ID
 * @property {string} title - 공지사항 제목
 * @property {string} createdDate - 생성일시 (ISO 8601)
 */

/**
 * 배너 아이템 인터페이스
 * @typedef {Object} BannerItem
 * @property {number} bannerId - 배너 ID
 * @property {string} title - 배너 제목
 * @property {string} imageUrl - 배너 이미지 S3 URL
 * @property {string} linkUrl - 배너 클릭 시 이동할 URL
 * @property {string} description - 배너 설명
 * @property {number} displayOrder - 배너 노출 순서
 */

/**
 * API 응답 형식
 * @typedef {Object} ApiResponse
 * @property {boolean} isSuccess - 성공 여부
 * @property {number} code - 응답 코드
 * @property {string} message - 응답 메시지
 * @property {*} result - 결과 데이터
 */

/**
 * Main Page API Service Class
 */
class MainService {
  /**
   * 메인 페이지 데이터 조회
   * 로그인 여부와 관계없이 호출 가능 (선택적 인증)
   * @returns {Promise<ApiResponse<MainPageResponse>>} API 응답 데이터
   */
  async getMainPageData() {
    try {
      console.log('📤 메인 페이지 데이터 조회 요청');
      
      const response = await apiClient.get(API_ENDPOINTS.MAIN);
      
      console.log('✅ 메인 페이지 데이터 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 메인 페이지 데이터 조회 실패:', error);
      this._handleApiError(error, '메인 페이지 데이터를 불러오는데 실패했습니다.');
      throw error;
    }
  }

  /**
   * 배너 데이터를 displayOrder 순으로 정렬
   * @param {BannerItem[]} banners - 배너 목록
   * @returns {BannerItem[]} 정렬된 배너 목록
   */
  sortBanners(banners) {
    if (!Array.isArray(banners)) {
      return [];
    }
    
    return [...banners].sort((a, b) => {
      const orderA = a.displayOrder || 0;
      const orderB = b.displayOrder || 0;
      return orderA - orderB;
    });
  }

  /**
   * 배너 데이터를 UI 형식으로 변환
   * @param {BannerItem[]} banners - 배너 목록
   * @returns {Object[]} UI용 배너 데이터
   */
  transformBannersForUI(banners) {
    if (!Array.isArray(banners) || banners.length === 0) {
      return [];
    }

    return this.sortBanners(banners).map(banner => ({
      id: banner.bannerId,
      badge: this._extractBadgeFromTitle(banner.title),
      title: banner.title,
      description: banner.description || '',
      image: banner.imageUrl,
      link: banner.linkUrl
    }));
  }

  /**
   * 공지사항 데이터를 UI 형식으로 변환
   * @param {NoticeItem[]} notices - 공지사항 목록
   * @returns {Object[]} UI용 공지사항 데이터
   */
  transformNoticesForUI(notices) {
    if (!Array.isArray(notices) || notices.length === 0) {
      return [];
    }

    return notices.map(notice => ({
      id: notice.noticeId,
      category: this._getNoticeCategory(notice.title),
      title: notice.title,
      date: this.formatDate(notice.createdDate)
    }));
  }

  /**
   * 배너 제목에서 뱃지 추출
   * @param {string} title - 배너 제목
   * @returns {string} 뱃지 텍스트
   * @private
   */
  _extractBadgeFromTitle(title) {
    if (!title || typeof title !== 'string') {
      return '공지';
    }

    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('이벤트') || titleLower.includes('event')) {
      return '이벤트';
    } else if (titleLower.includes('신규') || titleLower.includes('new')) {
      return '신규';
    } else if (titleLower.includes('업데이트') || titleLower.includes('update')) {
      return '업데이트';
    } else {
      return '공지';
    }
  }

  /**
   * 공지사항 카테고리 분류
   * @param {string} title - 공지사항 제목
   * @returns {string} 카테고리 ('공지', '이벤트', '업데이트', '일반')
   * @private
   */
  _getNoticeCategory(title) {
    if (!title || typeof title !== 'string') {
      return '일반';
    }
    
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('이벤트') || titleLower.includes('event')) {
      return '이벤트';
    } else if (titleLower.includes('업데이트') || titleLower.includes('update')) {
      return '업데이트';
    } else if (titleLower.includes('공지') || titleLower.includes('notice')) {
      return '공지';
    } else {
      return '일반';
    }
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
        return dateString; // 잘못된 날짜 형식인 경우 원본 반환
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}.${month}.${day}`;
    } catch (error) {
      console.error('날짜 포맷팅 실패:', error);
      return dateString;
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
   * 폴백 데이터 생성 (에러 발생 시 사용)
   * @returns {MainPageResponse} 기본 데이터
   */
  getFallbackData() {
    return {
      isAdmin: false,
      gameModeStatus: {
        roadviewEnabled: true,
        photoEnabled: false,
        multiplayEnabled: true
      },
      recentNotices: [
        {
          noticeId: 0,
          title: '공지사항을 불러올 수 없습니다',
          createdDate: new Date().toISOString()
        }
      ],
      banners: []
    };
  }
}

// 싱글톤 인스턴스 생성 및 export
export const mainService = new MainService();
export default mainService;

