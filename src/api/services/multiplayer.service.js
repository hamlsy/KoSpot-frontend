import apiClient from '../apiClient';

/**
 * 멀티플레이어 관련 API 서비스
 */
const multiplayerService = {
  /**
   * 게임 로비 목록 조회
   * @param {Object} params - 조회 파라미터 (페이지, 필터 등)
   * @returns {Promise} - API 응답
   */
  getLobbyRooms(params) {
    return apiClient.get('/multiplayer/lobby', { params });
  },

  /**
   * 게임방 생성
   * @param {Object} roomData - 방 생성 데이터
   * @returns {Promise} - API 응답
   */
  createRoom(roomData) {
    return apiClient.post('/multiplayer/room', roomData);
  },

  /**
   * 게임방 정보 조회
   * @param {string} roomId - 방 ID
   * @returns {Promise} - API 응답
   */
  getRoomInfo(roomId) {
    return apiClient.get(`/multiplayer/room/${roomId}`);
  },

  /**
   * 게임방 참가
   * @param {string} roomId - 방 ID
   * @param {Object} userData - 사용자 데이터
   * @returns {Promise} - API 응답
   */
  joinRoom(roomId, userData) {
    return apiClient.post(`/multiplayer/room/${roomId}/join`, userData);
  },

  /**
   * 게임방 나가기
   * @param {string} roomId - 방 ID
   * @returns {Promise} - API 응답
   */
  leaveRoom(roomId) {
    return apiClient.post(`/multiplayer/room/${roomId}/leave`);
  },

  /**
   * 채팅 메시지 전송
   * @param {string} roomId - 방 ID
   * @param {Object} message - 메시지 데이터
   * @returns {Promise} - API 응답
   */
  sendChatMessage(roomId, message) {
    return apiClient.post(`/multiplayer/room/${roomId}/chat`, message);
  },

  /**
   * 게임 시작 요청
   * @param {string} roomId - 방 ID
   * @returns {Promise} - API 응답
   */
  startGame(roomId) {
    return apiClient.post(`/multiplayer/room/${roomId}/start`);
  },

  /**
   * 게임 결과 제출
   * @param {string} roomId - 방 ID
   * @param {Object} result - 게임 결과 데이터
   * @returns {Promise} - API 응답
   */
  submitGameResult(roomId, result) {
    return apiClient.post(`/multiplayer/room/${roomId}/result`, result);
  },

  /**
   * 멀티플레이어 방 목록 조회
   * @param {Object} params - 조회 파라미터 (gameMode, status, limit, offset)
   * @returns {Promise} - 방 목록 응답
   */
  getRooms(params) {
    return apiClient.get('/multiplayer/rooms', { params });
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
