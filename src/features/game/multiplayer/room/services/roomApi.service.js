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
  UPDATE_ROOM: (roomId) => `/gameRoom/${roomId}`,
  LEAVE_ROOM: (roomId) => `/gameRoom/${roomId}/leave`,
  KICK_PLAYER: (roomId) => `/gameRoom/${roomId}/kick`,
  GET_ROOM_PLAYERS: (roomId) => `/gameRoom/${roomId}/players`, // 실시간 플레이어 목록 (Redis)
  GET_ROOM_DETAIL: (roomId) => `/gameRoom/${roomId}`,          // 방 상세 정보 (초기 로딩용)
};

/**
 * Game Room API Service Class
 */
class RoomApiService {
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
      return response.data;
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
      
      const response = await apiClient.post(ROOM_ENDPOINTS.LEAVE_ROOM(roomId));
      
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
      
      const response = await apiClient.post(ROOM_ENDPOINTS.KICK_PLAYER(roomId), requestData);
      
      console.log('✅ 플레이어 강퇴 성공:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ 플레이어 강퇴 실패:', error);
      this._handleApiError(error, '플레이어 강퇴에 실패했습니다.');
      throw error;
    }
  }

  // getRoomPlayers() 메서드 제거 - WebSocket으로 실시간 플레이어 목록 수신

  /**
   * 게임 방 상세 정보 조회 (초기 로딩용)
   * 방 생성 후 최초 1회 또는 새로고침 시 호출
   * @param {number} roomId - 게임 방 ID
   * @returns {Promise<Object>} 게임 방 상세 정보 (방 정보 + 초기 플레이어 목록)
   */
  async getRoomDetail(roomId) {
    try {
      console.log('📤 게임 방 상세 정보 조회 요청:', { roomId });
      
      const response = await apiClient.get(ROOM_ENDPOINTS.GET_ROOM_DETAIL(roomId));
      
      console.log('✅ 게임 방 상세 정보 조회 성공:', response.data);
      
      const roomDetail = response.data.result;
      
      // 방 정보와 플레이어 목록을 분리하여 반환
      return {
        roomInfo: this._transformRoomDetailData(roomDetail),
        players: this._transformPlayersData(roomDetail.connectedPlayers || [])
      };
    } catch (error) {
      console.error('❌ 게임 방 상세 정보 조회 실패:', error);
      this._handleApiError(error, '게임 방 정보 조회에 실패했습니다.');
      throw error;
    }
  }

  /**
   * 백엔드 플레이어 데이터를 프론트엔드 형식으로 변환
   * GameRoomPlayerResponse -> Vue 컴포넌트 형식
   * @param {Array} backendPlayers - 백엔드 플레이어 데이터
   * @returns {Array} 변환된 플레이어 데이터
   * @private
   */
  _transformPlayersData(backendPlayers) {
    if (!Array.isArray(backendPlayers)) {
      console.warn('⚠️ 잘못된 플레이어 데이터 형식:', backendPlayers);
      return [];
    }

    return backendPlayers.map(player => ({
      id: player.memberId?.toString() || player.id,
      nickname: player.nickname || '알 수 없는 플레이어',
      profileImage: player.markerImageUrl || '',
      isHost: player.isHost || false,
      teamId: player.teamId || null, // 팀 정보는 별도로 관리될 수 있음
      isOnline: true, // Redis에 있는 플레이어는 온라인으로 간주
      joinedAt: new Date(), // 실시간 조회이므로 현재 시간 사용
      
      // 랭킹 정보 (새로 추가된 필드)
      rankTier: player.rankTier || null,
      rankLevel: player.rankLevel || 0,
      ratingScore: player.ratingScore || 0,
      
      // 추후 통계 정보가 구현되면 여기에 추가
      statistics: player.statistics || null
    }));
  }

  /**
   * 백엔드 방 상세 정보를 프론트엔드 형식으로 변환
   * GameRoomDetailResponse -> Vue 컴포넌트 형식
   * @param {Object} backendRoomDetail - 백엔드 방 상세 데이터
   * @returns {Object} 변환된 방 데이터
   * @private
   */
  _transformRoomDetailData(backendRoomDetail) {
    if (!backendRoomDetail) {
      console.warn('⚠️ 잘못된 방 상세 데이터 형식:', backendRoomDetail);
      return null;
    }

    return {
      id: backendRoomDetail.id,
      title: backendRoomDetail.title || '제목 없음',
      gameMode: backendRoomDetail.gameMode || 'roadview',
      gameType: backendRoomDetail.gameType || 'solo',
      isTeamMode: backendRoomDetail.gameType === 'team',
      maxPlayers: backendRoomDetail.maxPlayers || 8,
      isPrivate: backendRoomDetail.privateRoom || false,
      password: backendRoomDetail.password || '',
      hostId: backendRoomDetail.hostId,
      
      // 초기 로딩 시 현재 플레이어 수 설정
      currentPlayerCount: backendRoomDetail.connectedPlayers?.length || 0,
      
      // 기본 게임 설정 (백엔드에서 제공되지 않는 경우 기본값)
      rounds: backendRoomDetail.rounds || 5,
      timeLimit: backendRoomDetail.timeLimit || 60,
      teamCount: backendRoomDetail.teamCount || 2,
      
      createdAt: backendRoomDetail.createdAt ? new Date(backendRoomDetail.createdAt).toISOString() : new Date().toISOString(),
    };
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
