import apiClient from './apiClient';

/**
 * 멀티플레이어 관련 API 서비스
 */
const multiplayerService = {
  /**
   * 멀티플레이어 방 목록 조회
   * @param {Object} params - 조회 파라미터 (gameMode, status, limit, offset)
   * @returns {Promise} - 방 목록 응답
   */
  getRooms(params) {
    return apiClient.get('/multiplayer/rooms', { params });
  },

  /**
   * 멀티플레이어 방 생성
   * @param {Object} roomData - 방 생성 데이터
   * @returns {Promise} - 방 생성 응답
   */
  createRoom(roomData) {
    return apiClient.post('/multiplayer/rooms', roomData);
  },

  /**
   * 멀티플레이어 방 정보 조회
   * @param {String} roomId - 방 ID
   * @returns {Promise} - 방 정보 응답
   */
  getRoomDetails(roomId) {
    return apiClient.get(`/multiplayer/rooms/${roomId}`);
  },

  /**
   * 멀티플레이어 방 참가
   * @param {String} roomId - 방 ID
   * @param {Object} joinData - 참가 데이터 (password 등)
   * @returns {Promise} - 방 참가 응답
   */
  joinRoom(roomId, joinData = {}) {
    return apiClient.post(`/multiplayer/rooms/${roomId}/join`, joinData);
  },

  /**
   * 멀티플레이어 방 나가기
   * @param {String} roomId - 방 ID
   * @returns {Promise} - 방 나가기 응답
   */
  leaveRoom(roomId) {
    return apiClient.post(`/multiplayer/rooms/${roomId}/leave`);
  },

  /**
   * 멀티플레이어 게임 시작
   * @param {String} roomId - 방 ID
   * @returns {Promise} - 게임 시작 응답
   */
  startGame(roomId) {
    return apiClient.post(`/multiplayer/rooms/${roomId}/start`);
  },

  /**
   * 멀티플레이어 채팅 메시지 전송
   * @param {String} roomId - 방 ID
   * @param {Object} message - 메시지 데이터
   * @returns {Promise} - 메시지 전송 응답
   */
  sendChatMessage(roomId, message) {
    return apiClient.post(`/multiplayer/rooms/${roomId}/chat`, message);
  },

  /**
   * 멀티플레이어 게임 결과 제출
   * @param {String} roomId - 방 ID
   * @param {Object} result - 게임 결과 데이터
   * @returns {Promise} - 게임 결과 제출 응답
   */
  submitMultiplayerResult(roomId, result) {
    return apiClient.post(`/multiplayer/rooms/${roomId}/result`, result);
  }
};

export default multiplayerService;
