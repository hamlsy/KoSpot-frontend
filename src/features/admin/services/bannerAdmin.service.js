/**
 * Banner Admin Service
 * 관리자 배너 관리 API 통신을 담당하는 서비스 레이어
 */
import { apiClient } from 'src/core/api/apiClient.js';

/**
 * 배너 관련 API 엔드포인트
 * 기본 경로: /admin/banners
 */
const BANNER_ENDPOINTS = {
  GET_BANNERS: '/admin/banners',
  CREATE_BANNER: '/admin/banners',
  UPDATE_BANNER: (bannerId) => `/admin/banners/${bannerId}`,
  DELETE_BANNER: (bannerId) => `/admin/banners/${bannerId}`,
  ACTIVATE_BANNER: (bannerId) => `/admin/banners/${bannerId}/activate`,
  DEACTIVATE_BANNER: (bannerId) => `/admin/banners/${bannerId}/deactivate`,
};

/**
 * Banner Admin Service Class
 */
class BannerAdminService {
  /**
   * 배너 목록 조회
   * @returns {Promise<Array>} 배너 목록
   */
  async getBanners() {
    try {
      console.log('📤 배너 목록 조회 요청');
      
      const response = await apiClient.get(BANNER_ENDPOINTS.GET_BANNERS);
      
      console.log('✅ 배너 목록 조회 성공:', response.data);
      return this._transformBannersData(response.data.result || []);
    } catch (error) {
      console.error('❌ 배너 목록 조회 실패:', error);
      this._handleApiError(error, '배너 목록 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 배너 생성
   * @param {FormData} formData - 배너 데이터 (title, image, linkUrl, description, displayOrder)
   * @returns {Promise<number>} 생성된 배너 ID
   */
  async createBanner(formData) {
    try {
      console.log('📤 배너 생성 요청');
      
      const response = await apiClient.post(BANNER_ENDPOINTS.CREATE_BANNER, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ 배너 생성 성공:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ 배너 생성 실패:', error);
      this._handleApiError(error, '배너 생성에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 배너 수정
   * @param {number} bannerId - 배너 ID
   * @param {FormData} formData - 수정할 배너 데이터
   * @returns {Promise<Object>} API 응답
   */
  async updateBanner(bannerId, formData) {
    try {
      console.log('📤 배너 수정 요청:', { bannerId });
      
      const response = await apiClient.put(
        BANNER_ENDPOINTS.UPDATE_BANNER(bannerId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('✅ 배너 수정 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 배너 수정 실패:', error);
      this._handleApiError(error, '배너 수정에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 배너 삭제
   * @param {number} bannerId - 배너 ID
   * @returns {Promise<Object>} API 응답
   */
  async deleteBanner(bannerId) {
    try {
      console.log('📤 배너 삭제 요청:', { bannerId });
      
      const response = await apiClient.delete(BANNER_ENDPOINTS.DELETE_BANNER(bannerId));
      
      console.log('✅ 배너 삭제 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 배너 삭제 실패:', error);
      this._handleApiError(error, '배너 삭제에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 배너 활성화
   * @param {number} bannerId - 배너 ID
   * @returns {Promise<Object>} API 응답
   */
  async activateBanner(bannerId) {
    try {
      console.log('📤 배너 활성화 요청:', { bannerId });
      
      const response = await apiClient.put(BANNER_ENDPOINTS.ACTIVATE_BANNER(bannerId));
      
      console.log('✅ 배너 활성화 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 배너 활성화 실패:', error);
      this._handleApiError(error, '배너 활성화에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 배너 비활성화
   * @param {number} bannerId - 배너 ID
   * @returns {Promise<Object>} API 응답
   */
  async deactivateBanner(bannerId) {
    try {
      console.log('📤 배너 비활성화 요청:', { bannerId });
      
      const response = await apiClient.put(BANNER_ENDPOINTS.DEACTIVATE_BANNER(bannerId));
      
      console.log('✅ 배너 비활성화 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 배너 비활성화 실패:', error);
      this._handleApiError(error, '배너 비활성화에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 백엔드 배너 데이터를 프론트엔드 형식으로 변환
   * @param {Array} backendBanners - 백엔드 배너 데이터
   * @returns {Array} 변환된 배너 데이터
   * @private
   */
  _transformBannersData(backendBanners) {
    if (!Array.isArray(backendBanners)) {
      console.warn('⚠️ 잘못된 배너 데이터 형식:', backendBanners);
      return [];
    }

    return backendBanners.map(banner => ({
      id: banner.bannerId,
      title: banner.title || '제목 없음',
      imageUrl: banner.imageUrl || '',
      linkUrl: banner.linkUrl || '',
      description: banner.description || '',
      displayOrder: banner.displayOrder || 0,
      isActive: banner.isActive ?? true,
      createdAt: banner.createdAt || null,
      updatedAt: banner.updatedAt || null
    }));
  }

  /**
   * 날짜 포맷팅 (YYYY.MM.DD HH:mm)
   * @param {string} dateString - ISO 8601 형식의 날짜 문자열
   * @returns {string} 포맷된 날짜 문자열
   */
  formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}.${month}.${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error('날짜 포맷팅 실패:', error);
      return dateString;
    }
  }

  /**
   * API 에러 처리
   * @param {Error} error - API 에러 객체
   * @param {string} defaultMessage - 기본 에러 메시지
   * @private
   */
  _handleApiError(error, defaultMessage) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('📛 잘못된 요청:', data.message || defaultMessage);
          break;
        case 401:
          console.error('📛 인증 실패: 관리자 로그인이 필요합니다.');
          break;
        case 403:
          console.error('📛 권한 없음: 관리자 권한이 필요합니다.');
          break;
        case 404:
          console.error('📛 리소스를 찾을 수 없음:', data.message || '배너를 찾을 수 없습니다.');
          break;
        case 500:
          console.error('📛 서버 내부 오류:', data.message || '서버에서 오류가 발생했습니다.');
          break;
        default:
          console.error('📛 알 수 없는 오류:', data.message || defaultMessage);
      }
    } else if (error.request) {
      console.error('📛 네트워크 오류: 서버에 연결할 수 없습니다.');
    } else {
      console.error('📛 요청 설정 오류:', error.message);
    }
  }
}

// 싱글톤 인스턴스 생성 및 export
export const bannerAdminService = new BannerAdminService();
export default bannerAdminService;

