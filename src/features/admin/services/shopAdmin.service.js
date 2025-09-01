/**
 * Shop Admin API Service
 * 관리자용 상점 아이템 관리 API를 담당하는 서비스 레이어
 * 아이템 CRUD, 상점 등록/삭제 등의 관리 기능을 제공합니다.
 */
import { apiClient } from 'src/core/api/apiClient.js';

/**
 * 상점 관리 관련 API 엔드포인트
 */
const SHOP_ADMIN_ENDPOINTS = {
  // 아이템 관리
  GET_ITEMS_BY_TYPE: (itemTypeKey) => `/item/${itemTypeKey}`,
  CREATE_ITEM: '/item/',
  UPDATE_ITEM: '/item/info',
  DELETE_ITEM: (id) => `/item/${id}`,
  
  // 상점 등록/삭제
  RESTORE_SHOP: (id) => `/item/${id}/restoreShop`,
  DELETE_FROM_SHOP: (id) => `/item/${id}/deleteShop`,
};

/**
 * 아이템 생성 요청 데이터 인터페이스
 * @typedef {Object} CreateItemRequest
 * @property {string} title - 아이템 제목
 * @property {string} content - 아이템 설명
 * @property {string[]} images - 이미지 URL 배열
 */

/**
 * 아이템 업데이트 요청 데이터 인터페이스
 * @typedef {Object} UpdateItemRequest
 * @property {number} itemId - 아이템 ID
 * @property {string} name - 아이템 이름
 * @property {string} description - 아이템 설명
 * @property {number} price - 아이템 가격
 * @property {string} itemTypeKey - 아이템 타입 키
 * @property {number} quantity - 수량
 */

/**
 * 아이템 응답 데이터 인터페이스
 * @typedef {Object} ItemResponse
 * @property {number} itemId - 아이템 ID
 * @property {string} name - 아이템 이름
 * @property {string} description - 아이템 설명
 * @property {number} price - 아이템 가격
 * @property {number} stock - 재고 수량
 * @property {string} imageUrl - 이미지 URL
 * @property {boolean} owned - 보유 여부
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
 * Shop Admin API Service Class
 */
class ShopAdminService {
  /**
   * 아이템 타입별 조회
   * @param {string} itemTypeKey - 아이템 타입 키 (MARKER, NICKNAME, ITEM 등)
   * @returns {Promise<ApiResponse<ItemResponse[]>>} API 응답 데이터
   */
  async getItemsByType(itemTypeKey) {
    try {
      console.log('📤 아이템 타입별 조회 요청:', itemTypeKey);
      
      const response = await apiClient.get(SHOP_ADMIN_ENDPOINTS.GET_ITEMS_BY_TYPE(itemTypeKey));
      
      console.log('✅ 아이템 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 아이템 조회 실패:', error);
      this._handleApiError(error, '아이템 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 새 아이템 생성
   * @param {CreateItemRequest} itemData - 생성할 아이템 데이터
   * @returns {Promise<ApiResponse>} API 응답 데이터
   */
  async createItem(itemData) {
    try {
      console.log('📤 아이템 생성 요청:', itemData);
      
      const response = await apiClient.post(SHOP_ADMIN_ENDPOINTS.CREATE_ITEM, itemData);
      
      console.log('✅ 아이템 생성 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 아이템 생성 실패:', error);
      this._handleApiError(error, '아이템 생성에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 아이템 정보 업데이트
   * @param {UpdateItemRequest} itemData - 업데이트할 아이템 데이터
   * @returns {Promise<ApiResponse>} API 응답 데이터
   */
  async updateItem(itemData) {
    try {
      console.log('📤 아이템 업데이트 요청:', itemData);
      
      const response = await apiClient.put(SHOP_ADMIN_ENDPOINTS.UPDATE_ITEM, itemData);
      
      console.log('✅ 아이템 업데이트 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 아이템 업데이트 실패:', error);
      this._handleApiError(error, '아이템 업데이트에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 아이템 삭제
   * @param {number} itemId - 삭제할 아이템 ID
   * @returns {Promise<ApiResponse>} API 응답 데이터
   */
  async deleteItem(itemId) {
    try {
      console.log('📤 아이템 삭제 요청:', itemId);
      
      const response = await apiClient.delete(SHOP_ADMIN_ENDPOINTS.DELETE_ITEM(itemId));
      
      console.log('✅ 아이템 삭제 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 아이템 삭제 실패:', error);
      this._handleApiError(error, '아이템 삭제에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 아이템 상점 재등록
   * @param {number} itemId - 재등록할 아이템 ID
   * @returns {Promise<ApiResponse>} API 응답 데이터
   */
  async restoreItemToShop(itemId) {
    try {
      console.log('📤 아이템 상점 재등록 요청:', itemId);
      
      const response = await apiClient.put(SHOP_ADMIN_ENDPOINTS.RESTORE_SHOP(itemId));
      
      console.log('✅ 아이템 상점 재등록 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 아이템 상점 재등록 실패:', error);
      this._handleApiError(error, '아이템 상점 재등록에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 아이템 상점에서 삭제
   * @param {number} itemId - 상점에서 삭제할 아이템 ID
   * @returns {Promise<ApiResponse>} API 응답 데이터
   */
  async removeItemFromShop(itemId) {
    try {
      console.log('📤 아이템 상점 삭제 요청:', itemId);
      
      const response = await apiClient.put(SHOP_ADMIN_ENDPOINTS.DELETE_FROM_SHOP(itemId));
      
      console.log('✅ 아이템 상점 삭제 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 아이템 상점 삭제 실패:', error);
      this._handleApiError(error, '아이템 상점 삭제에 실패했습니다.');
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
   * 아이템 타입 키 목록 가져오기
   * @returns {Array<{key: string, name: string, icon: string}>} 아이템 타입 목록
   */
  getItemTypes() {
    return [
      { key: 'MARKER', name: '마커', icon: 'fas fa-map-marker-alt' },
      { key: 'NICKNAME', name: '닉네임 꾸미기', icon: 'fas fa-font' },
      { key: 'ITEM', name: '아이템', icon: 'fas fa-gift' },
      { key: 'PROFILE', name: '프로필', icon: 'fas fa-user-circle' },
      { key: 'BACKGROUND', name: '배경', icon: 'fas fa-image' }
    ];
  }

  /**
   * 아이템 데이터 유효성 검사
   * @param {Object} itemData - 검사할 아이템 데이터
   * @returns {boolean} 유효성 여부
   * @private
   */
  _validateItemData(itemData) {
    const { name, description, price, itemTypeKey } = itemData;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      console.error('유효하지 않은 아이템 이름:', name);
      return false;
    }
    
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      console.error('유효하지 않은 아이템 설명:', description);
      return false;
    }
    
    if (typeof price !== 'number' || price < 0) {
      console.error('유효하지 않은 가격:', price);
      return false;
    }
    
    if (!itemTypeKey || typeof itemTypeKey !== 'string') {
      console.error('유효하지 않은 아이템 타입:', itemTypeKey);
      return false;
    }
    
    return true;
  }

  /**
   * 가격 포맷팅
   * @param {number} price - 가격
   * @returns {string} 포맷된 가격 문자열
   */
  formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

// 싱글톤 인스턴스 생성 및 export
export const shopAdminService = new ShopAdminService();
export default shopAdminService;
