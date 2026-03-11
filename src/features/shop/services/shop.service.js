/**
 * Shop API Service
 * 사용자용 상점 기능 API를 담당하는 서비스 레이어
 * 아이템 조회, 구매, 장착 등의 기능을 제공합니다.
 */
import { apiClient } from 'src/core/api/apiClient.js';

/**
 * 상점 관련 API 엔드포인트
 */
const SHOP_ENDPOINTS = {
  // 상점 내 정보 (포인트, 보유 아이템, 장착 아이템) 조회
  GET_SHOP_INFO: '/member/shop-info',

  // 아이템 조회
  GET_ITEMS_BY_TYPE: (itemTypeKey) => `/item/${itemTypeKey}`,

  // 아이템 구매
  PURCHASE_ITEM: (itemId) => `/memberItem/${itemId}/purchase`,

  // 아이템 장착
  EQUIP_ITEM: (memberItemId) => `/memberItem/${memberItemId}`,
};

/**
 * 아이템 응답 데이터 인터페이스
 * @typedef {Object} ShopItemResponse
 * @property {number} itemId - 아이템 ID
 * @property {string} name - 아이템 이름
 * @property {string} description - 아이템 설명
 * @property {number} price - 아이템 가격
 * @property {number} stock - 재고 수량
 * @property {string} imageUrl - 이미지 URL
 * @property {boolean} owned - 보유 여부
 * @property {number} [memberItemId] - 사용자 보유 아이템 ID (owned가 true일 때)
 * @property {boolean} [equipped] - 장착 여부 (마커 등에서 사용)
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
 * Shop API Service Class
 */
class ShopService {
  /**
   * 상점 내 정보 조회 (내 포인트, 장착 아이템, 보유 아이템)
   * @returns {Promise<ApiResponse>} API 응답 데이터
   */
  async getShopInfo() {
    try {
      console.log('📤 상점 정보 조회 요청');
      const response = await apiClient.get(SHOP_ENDPOINTS.GET_SHOP_INFO);
      console.log('✅ 상점 정보 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 상점 정보 조회 실패:', error);
      this._handleApiError(error, '상점 정보 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 아이템 타입별 조회
   * @param {string} itemTypeKey - 아이템 타입 키 (MARKER, NICKNAME, ITEM 등)
   * @returns {Promise<ApiResponse<ShopItemResponse[]>>} API 응답 데이터
   */
  async getItemsByType(itemTypeKey) {
    try {
      console.log('📤 상점 아이템 조회 요청:', itemTypeKey);

      const response = await apiClient.get(SHOP_ENDPOINTS.GET_ITEMS_BY_TYPE(itemTypeKey));

      console.log('✅ 상점 아이템 조회 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 상점 아이템 조회 실패:', error);
      this._handleApiError(error, '상점 아이템 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 아이템 구매
   * @param {number} itemId - 구매할 아이템 ID
   * @returns {Promise<ApiResponse>} API 응답 데이터
   */
  async purchaseItem(itemId) {
    try {
      console.log('📤 아이템 구매 요청:', itemId);

      const response = await apiClient.get(SHOP_ENDPOINTS.PURCHASE_ITEM(itemId));

      console.log('✅ 아이템 구매 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 아이템 구매 실패:', error);
      this._handleApiError(error, '아이템 구매에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 아이템 장착
   * @param {number} memberItemId - 장착할 사용자 아이템 ID
   * @returns {Promise<ApiResponse>} API 응답 데이터
   */
  async equipItem(memberItemId) {
    try {
      console.log('📤 아이템 장착 요청:', memberItemId);

      const response = await apiClient.put(SHOP_ENDPOINTS.EQUIP_ITEM(memberItemId));

      console.log('✅ 아이템 장착 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 아이템 장착 실패:', error);
      this._handleApiError(error, '아이템 장착에 실패했습니다.');
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
   * @returns {Array<{key: string, name: string, icon: string, categoryId: string, disabled: boolean}>} 아이템 타입 목록
   */
  getItemTypes() {
    return [
      { key: 'MARKER', name: '마커', icon: 'fas fa-map-marker-alt', categoryId: 'markers', disabled: false },
      { key: 'MARKER_EFFECT', name: '마커 효과', icon: 'fas fa-sparkles', categoryId: 'marker-effects', disabled: true },
      { key: 'ITEM', name: '아이템', icon: 'fas fa-gift', categoryId: 'items', disabled: false }
    ];
  }

  /**
   * 카테고리 ID를 아이템 타입 키로 변환
   * @param {string} categoryId - 카테고리 ID (markers, marker-effects, items 등)
   * @returns {string} 아이템 타입 키 (MARKER, MARKER_EFFECT, ITEM 등)
   */
  getCategoryToItemTypeKey(categoryId) {
    const mapping = {
      'markers': 'MARKER',
      'marker-effects': 'MARKER_EFFECT',
      'items': 'ITEM'
    };
    return mapping[categoryId] || 'ITEM';
  }

  /**
   * 더미 데이터를 API 응답 형식으로 변환
   * @param {Array} dummyItems - 더미 아이템 배열
   * @returns {Array<ShopItemResponse>} API 형식으로 변환된 아이템 배열
   */
  convertDummyToApiFormat(dummyItems) {
    return dummyItems.map(item => ({
      itemId: parseInt(item.id.replace(/\D/g, '')) || Math.floor(Math.random() * 1000),
      name: item.name,
      description: item.description,
      price: item.price,
      stock: 999, // 더미 재고
      imageUrl: item.image,
      owned: item.owned,
      memberItemId: item.owned ? Math.floor(Math.random() * 10000) : null,
      equipped: item.equipped || false,
      rarity: item.rarity,
      isNew: item.isNew,
      currencyType: item.currencyType
    }));
  }

  /**
   * API 형식 아이템을 UI 형식으로 변환
   * @param {ShopItemResponse} apiItem - API 형식 아이템
   * @param {string} categoryId - 카테고리 ID
   * @returns {Object} UI 형식 아이템
   */
  convertApiToUiFormat(apiItem, categoryId) {
    return {
      id: `api_${apiItem.itemId}`,
      name: apiItem.name,
      description: apiItem.description,
      price: apiItem.price,
      currencyType: 'coin', // 기본값
      rarity: apiItem.rarity || '일반',
      image: apiItem.imageUrl,
      category: categoryId,
      isNew: apiItem.isNew || false,
      owned: apiItem.owned,
      memberItemId: apiItem.memberItemId,
      equipped: apiItem.equipped || false,
      stock: apiItem.stock,
      itemId: apiItem.itemId
    };
  }

  /**
   * 가격 포맷팅
   * @param {number} price - 가격
   * @returns {string} 포맷된 가격 문자열
   */
  formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * 아이템이 장착 가능한지 확인
   * @param {string} categoryId - 카테고리 ID
   * @returns {boolean} 장착 가능 여부
   */
  isEquippableCategory(categoryId) {
    return ['markers', 'marker-effects'].includes(categoryId);
  }
}

// 싱글톤 인스턴스 생성 및 export
export const shopService = new ShopService();
export default shopService;
