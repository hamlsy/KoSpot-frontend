/**
 * Game Room API Service
 * 백엔드 Spring Boot API와의 통신을 담당하는 서비스 레이어
 * Redis 기반 실시간 플레이어 정보 관리와 게임 방 관련 API 호출을 처리합니다.
 */
import { apiClient } from 'src/core/api/apiClient.js';

/**
 * 게임 방 관련 API 엔드포인트
 */
const ROOM_ENDPOINTS = {
  GET_ROOMS: '/rooms/',                                    // 게임 방 전체 조회
  CREATE_ROOM: '/rooms/',                                  // 게임 방 생성
  GET_ROOM_DETAIL: (roomId) => `/rooms/${roomId}`,       // 방 상세 정보
  UPDATE_ROOM: (roomId) => `/rooms/${roomId}`,           // 게임 방 수정
  JOIN_ROOM: (roomId) => `/rooms/${roomId}/join`,     // 게임 방 참여
  LEAVE_ROOM: (roomId) => `/rooms/${roomId}/leave`,    // 게임 방 퇴장
  KICK_PLAYER: (roomId) => `/rooms/${roomId}/kick`, // 플레이어 강퇴
  START_GAME: (roomId) => `/rooms/${roomId}/start`, // 게임 시작
  CHECK_ACCESS: (roomId) => `/rooms/${roomId}/access`, // 게임 방 접근 권한 확인
};

/**
 * Game Room API Service Class
 */
class RoomApiService {
  /**
   * 게임 방 전체 조회
   * @param {number} page - 페이지 번호 (0부터 시작)
   * @returns {Promise<Array>} 게임 방 목록
   */
  async getRoomList(page = 0) {
    try {
      console.log('📤 게임 방 목록 조회 요청:', { page });
      
      const response = await apiClient.get(ROOM_ENDPOINTS.GET_ROOMS, {
        params: { page }
      });
      
      console.log('✅ 게임 방 목록 조회 성공:', response.data);
      return this._transformRoomListData(response.data.data || []);
    } catch (error) {
      console.error('❌ 게임 방 목록 조회 실패:', error);
      this._handleApiError(error, '게임 방 목록 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 게임 방 생성
   * @param {Object} roomData - 생성할 방 정보
   * @param {string} roomData.title - 방 제목
   * @param {string} roomData.password - 방 비밀번호 (선택)
   * @param {string} roomData.gameModeKey - 게임 모드 (ROADVIEW, PHOTO)
   * @param {string} roomData.playerMatchTypeKey - 매치 타입 (SOLO, TEAM)
   * @param {number} roomData.maxPlayers - 최대 플레이어 수 (2~8)
   * @param {number} roomData.timeLimit - 시간 제한 (초 단위)
   * @param {boolean} roomData.privateRoom - 비공개 방 여부
   * @returns {Promise<Object>} 생성된 게임 방 정보
   */
  async createGameRoom(roomData) {
    try {
      console.log('📤 게임 방 생성 요청:', roomData);
      
      const response = await apiClient.post(ROOM_ENDPOINTS.CREATE_ROOM, roomData);
      
      console.log('✅ 게임 방 생성 성공:', response.data);
      // response.data.result에서 방 정보 반환
      return response.data.result;
    } catch (error) {
      console.error('❌ 게임 방 생성 실패:', error);
      this._handleApiError(error, '게임 방 생성에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 게임 방 참여
   * @param {number} roomId - 게임 방 ID
   * @param {string} password - 비밀번호 (비공개 방인 경우)
   * @returns {Promise<Object>} API 응답 데이터
   */
  async joinGameRoom(roomId, password = '') {
    try {
      console.log('📤 게임 방 참여 요청:', { roomId, hasPassword: !!password });
      
      const requestData = password ? { password } : {};
      const response = await apiClient.post(ROOM_ENDPOINTS.JOIN_ROOM(roomId), requestData);
      
      console.log('✅ 게임 방 참여 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 게임 방 참여 실패:', error);
      this._handleApiError(error, '게임 방 참여에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 게임 방 정보 수정
   * @param {number} roomId - 게임 방 ID
   * @param {Object} updateData - 수정할 방 정보
   * @param {string} updateData.title - 방 제목
   * @param {string} updateData.password - 방 비밀번호
   * @param {string} updateData.gameModeKey - 게임 모드 키
   * @param {string} updateData.playerMatchTypeKey - 플레이어 매치 타입 키
   * @param {boolean} updateData.privateRoom - 비공개 방 여부
   * @param {number} updateData.teamCount - 팀 수
   * @returns {Promise<Object>} API 응답 데이터
   */
  async updateGameRoom(roomId, updateData) {
    try {
      console.log('📤 게임 방 수정 요청:', { roomId, updateData });
      
      const response = await apiClient.put(ROOM_ENDPOINTS.UPDATE_ROOM(roomId), updateData);
      
      console.log('✅ 게임 방 수정 성공:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ 게임 방 수정 실패:', error);
      this._handleApiError(error, '게임 방 수정에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 게임 방 퇴장
   * @param {number} roomId - 게임 방 ID
   * @returns {Promise<Object>} API 응답 데이터
   */
  async leaveGameRoom(roomId) {
    try {
      console.log('📤 게임 방 퇴장 요청:', { roomId });
      
      const response = await apiClient.delete(ROOM_ENDPOINTS.LEAVE_ROOM(roomId));
      
      console.log('✅ 게임 방 퇴장 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 게임 방 퇴장 실패:', error);
      this._handleApiError(error, '게임 방 퇴장에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 플레이어 강퇴
   * @param {number} roomId - 게임 방 ID
   * @param {number} targetPlayerId - 강퇴할 플레이어 ID
   * @returns {Promise<Object>} API 응답 데이터
   */
  async kickPlayer(roomId, targetPlayerId) {
    try {
      console.log('📤 플레이어 강퇴 요청:', { roomId, targetPlayerId });
      
      const requestData = {
        targetPlayerId: targetPlayerId
      };
      
      const response = await apiClient.delete(ROOM_ENDPOINTS.KICK_PLAYER(roomId), {
        data: requestData
      });
      
      console.log('✅ 플레이어 강퇴 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 플레이어 강퇴 실패:', error);
      this._handleApiError(error, '플레이어 강퇴에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 게임 시작 요청
   * @param {number|string} roomId - 게임 방 ID
   * @returns {Promise<Object>} API 응답 데이터
   */
  async startGame(roomId, startPayload = {}) {
    try {

      if (!startPayload.gameModeKey || !startPayload.playerMatchTypeKey || typeof startPayload.totalRounds !== 'number') {
        throw new Error('startGame 요청에 필요한 필드가 누락되었습니다.');
      }

      const response = await apiClient.post(
        ROOM_ENDPOINTS.START_GAME(roomId),
        {
          gameModeKey: startPayload.gameModeKey,
          playerMatchTypeKey: startPayload.playerMatchTypeKey,
          totalRounds: startPayload.totalRounds,
          timeLimit: startPayload.timeLimit ?? null
        }
      );

      console.log('✅ 게임 시작 요청 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 게임 시작 요청 실패:', error);
      this._handleApiError(error, '게임 시작 요청에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 게임 방 접근 권한 확인
   * URL로 강제 접근하는 것을 막기 위한 API
   * @param {number|string} roomId - 게임 방 ID
   * @returns {Promise<Object>} 접근 권한 확인 결과
   * @returns {boolean} allowed - 접근 가능 여부
   * @returns {string} message - 접근 불가 시 메시지
   * @returns {Object} gameRoomDetailResponse - 접근 가능 시 방 상세 정보
   */
  async checkGameAccess(roomId) {
    try {
      console.log('📤 게임 방 접근 권한 확인 요청:', { roomId });
      
      const response = await apiClient.get(ROOM_ENDPOINTS.CHECK_ACCESS(roomId));
      
      console.log('✅ 게임 방 접근 권한 확인 성공:', response.data);
      return response.data.result;
    } catch (error) {
      console.error('❌ 게임 방 접근 권한 확인 실패:', error);
      this._handleApiError(error, '게임 방 접근 권한 확인에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 게임 방 상세 정보 조회 (초기 로딩용)
   * 방 생성 후 최초 1회 또는 새로고침 시 호출
   * @param {number} roomId - 게임 방 ID
   * @returns {Promise<Object>} 게임 방 상세 정보
   */
  async getRoomDetail(roomId) {
    try {
      console.log('📤 게임 방 상세 정보 조회 요청:', { roomId });
      
      const response = await apiClient.get(ROOM_ENDPOINTS.GET_ROOM_DETAIL(roomId));
      
      console.log('✅ 게임 방 상세 정보 조회 성공:', response.data);
      return response.data.result;
    } catch (error) {
      console.error('❌ 게임 방 상세 정보 조회 실패:', error);
      this._handleApiError(error, '게임 방 정보 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 백엔드 게임 방 목록 데이터를 프론트엔드 형식으로 변환
   * @param {Array} backendRooms - 백엔드 방 목록 데이터
   * @returns {Array} 변환된 방 목록
   * @private
   */
  _transformRoomListData(backendRooms) {
    if (!Array.isArray(backendRooms)) {
      console.warn('⚠️ 잘못된 방 목록 데이터 형식:', backendRooms);
      return [];
    }

    return backendRooms.map(room => ({
      id: room.gameRoomId,
      title: room.title || '제목 없음',
      gameMode: room.gameMode || 'ROADVIEW',
      gameType: room.gameType || 'SOLO',
      maxPlayers: room.maxPlayers || 8,
      timeLimit: room.timeLimit || 60,
      currentPlayerCount: room.currentPlayerCount || 0,
      hostNickname: room.hostNickname || '알 수 없음',
      isPrivate: room.privateRoom || false,
      status: room.gameRoomStatus || 'WAITING'
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
      // 서버에서 응답을 받았지만 에러 상태 코드
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('📛 잘못된 요청:', data.message || defaultMessage);
          break;
        case 401:
          console.error('📛 인증 실패: 로그인이 필요합니다.');
          break;
        case 403:
          console.error('📛 권한 없음:', data.message || '작업을 수행할 권한이 없습니다.');
          break;
        case 404:
          console.error('📛 리소스를 찾을 수 없음:', data.message || '요청한 게임 방을 찾을 수 없습니다.');
          break;
        case 409:
          console.error('📛 충돌:', data.message || '이미 처리된 요청입니다.');
          break;
        case 500:
          console.error('📛 서버 내부 오류:', data.message || '서버에서 오류가 발생했습니다.');
          break;
        default:
          console.error('📛 알 수 없는 오류:', data.message || defaultMessage);
      }
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못함
      console.error('📛 네트워크 오류: 서버에 연결할 수 없습니다.');
    } else {
      // 요청 설정 중에 오류 발생
      console.error('📛 요청 설정 오류:', error.message);
    }
  }

  // 폴링 관련 메서드 제거 - WebSocket 실시간 알림으로 대체
}

// 싱글톤 인스턴스 생성 및 export
export const roomApiService = new RoomApiService();
export default roomApiService;
