/**
 * Game Config Admin Service
 * 관리자 게임 설정 관리 API 통신을 담당하는 서비스 레이어
 */
import { apiClient } from 'src/core/api/apiClient.js';

/**
 * 게임 설정 관련 API 엔드포인트
 */
const GAME_CONFIG_ENDPOINTS = {
  GET_CONFIGS: '/admin/game-configs',
  CREATE_CONFIG: '/admin/game-configs',
  INITIALIZE_CONFIGS: '/admin/game-configs/initialize',
  ACTIVATE_CONFIG: (configId) => `/admin/game-configs/${configId}/activate`,
  DEACTIVATE_CONFIG: (configId) => `/admin/game-configs/${configId}/deactivate`,
  DELETE_CONFIG: (configId) => `/admin/game-configs/${configId}`,
};

/**
 * Game Config Admin Service Class
 */
class GameConfigAdminService {
  /**
   * 게임 설정 목록 조회
   * @returns {Promise<Array>} 게임 설정 목록
   */
  async getConfigs() {
    try {
      console.log('📤 게임 설정 목록 조회 요청');
      
      const response = await apiClient.get(GAME_CONFIG_ENDPOINTS.GET_CONFIGS);
      
      console.log('✅ 게임 설정 목록 조회 성공:', response.data);
      return this._transformConfigsData(response.data.data || []);
    } catch (error) {
      console.error('❌ 게임 설정 목록 조회 실패:', error);
      this._handleApiError(error, '게임 설정 목록 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 게임 설정 생성
   * @param {Object} configData - 게임 설정 데이터
   * @param {string} configData.gameModeKey - 게임 모드 (ROADVIEW, PHOTO)
   * @param {string} configData.playerMatchTypeKey - 매치 타입 (SOLO, TEAM) - 멀티플레이 전용
   * @param {boolean} configData.isSingleMode - 싱글/멀티 모드 구분
   * @returns {Promise<number>} 생성된 게임 설정 ID
   */
  async createConfig(configData) {
    try {
      console.log('📤 게임 설정 생성 요청:', configData);
      
      const response = await apiClient.post(GAME_CONFIG_ENDPOINTS.CREATE_CONFIG, configData);
      
      console.log('✅ 게임 설정 생성 성공:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ 게임 설정 생성 실패:', error);
      this._handleApiError(error, '게임 설정 생성에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 모든 기본 게임 설정 초기화
   * 총 6개 설정: 싱글 로드뷰/포토, 멀티 로드뷰/포토 개인전/팀전
   * @returns {Promise<Array>} 생성된 게임 설정 목록
   */
  async initializeConfigs() {
    try {
      console.log('📤 게임 설정 초기화 요청');
      
      const response = await apiClient.post(GAME_CONFIG_ENDPOINTS.INITIALIZE_CONFIGS);
      
      console.log('✅ 게임 설정 초기화 성공:', response.data);
      return this._transformConfigsData(response.data.data || []);
    } catch (error) {
      console.error('❌ 게임 설정 초기화 실패:', error);
      this._handleApiError(error, '게임 설정 초기화에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 게임 설정 활성화
   * @param {number} configId - 게임 설정 ID
   * @returns {Promise<Object>} API 응답
   */
  async activateConfig(configId) {
    try {
      console.log('📤 게임 설정 활성화 요청:', { configId });
      
      const response = await apiClient.put(GAME_CONFIG_ENDPOINTS.ACTIVATE_CONFIG(configId));
      
      console.log('✅ 게임 설정 활성화 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 게임 설정 활성화 실패:', error);
      this._handleApiError(error, '게임 설정 활성화에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 게임 설정 비활성화
   * @param {number} configId - 게임 설정 ID
   * @returns {Promise<Object>} API 응답
   */
  async deactivateConfig(configId) {
    try {
      console.log('📤 게임 설정 비활성화 요청:', { configId });
      
      const response = await apiClient.put(GAME_CONFIG_ENDPOINTS.DEACTIVATE_CONFIG(configId));
      
      console.log('✅ 게임 설정 비활성화 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 게임 설정 비활성화 실패:', error);
      this._handleApiError(error, '게임 설정 비활성화에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 게임 설정 삭제
   * @param {number} configId - 게임 설정 ID
   * @returns {Promise<Object>} API 응답
   */
  async deleteConfig(configId) {
    try {
      console.log('📤 게임 설정 삭제 요청:', { configId });
      
      const response = await apiClient.delete(GAME_CONFIG_ENDPOINTS.DELETE_CONFIG(configId));
      
      console.log('✅ 게임 설정 삭제 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 게임 설정 삭제 실패:', error);
      this._handleApiError(error, '게임 설정 삭제에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 백엔드 게임 설정 데이터를 프론트엔드 형식으로 변환
   * @param {Array} backendConfigs - 백엔드 게임 설정 데이터
   * @returns {Array} 변환된 게임 설정 데이터
   * @private
   */
  _transformConfigsData(backendConfigs) {
    if (!Array.isArray(backendConfigs)) {
      console.warn('⚠️ 잘못된 게임 설정 데이터 형식:', backendConfigs);
      return [];
    }

    return backendConfigs.map(config => ({
      id: config.configId,
      gameMode: config.gameMode || 'ROADVIEW',
      playerMatchType: config.playerMatchType || null,
      isSingleMode: config.isSingleMode ?? true,
      isActive: config.isActive ?? true,
      description: config.description || '',
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    }));
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
          console.error('📛 리소스를 찾을 수 없음:', data.message || '게임 설정을 찾을 수 없습니다.');
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
export const gameConfigAdminService = new GameConfigAdminService();
export default gameConfigAdminService;

