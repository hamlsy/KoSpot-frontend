import apiClient from '../apiClient';

/**
 * 게임 관련 API 서비스
 */
const gameService = {
  /**
   * 게임 모드 목록 조회
   * @returns {Promise} - API 응답
   */
  getGameModes() {
    return apiClient.get('/game/modes');
  },

  /**
   * 포토 모드 이미지 조회
   * @param {Object} params - 조회 파라미터 (지역, 테마 등)
   * @returns {Promise} - API 응답
   */
  getPhotoModeImages(params) {
    return apiClient.get('/game/photo/images', { params });
  },

  /**
   * 로드뷰 모드 데이터 조회
   * @param {Object} params - 조회 파라미터 (지역, 테마 등)
   * @returns {Promise} - API 응답
   */
  getRoadViewData(params) {
    return apiClient.get('/game/roadview/data', { params });
  },

  /**
   * 게임 결과 저장
   * @param {Object} result - 게임 결과 데이터
   * @returns {Promise} - API 응답
   */
  saveGameResult(result) {
    return apiClient.post('/game/result', result);
  },

  /**
   * 랭킹 조회
   * @param {string} mode - 게임 모드
   * @param {Object} params - 조회 파라미터 (기간, 지역 등)
   * @returns {Promise} - API 응답
   */
  getRankings(mode, params) {
    return apiClient.get(`/game/rankings/${mode}`, { params });
  },

  /**
   * 포토 모드 게임 데이터 가져오기
   * @param {Object} params - 게임 파라미터 (region, theme, totalRounds)
   * @returns {Promise} - 게임 데이터 응답
   */
  getPhotoGameData(params) {
    return apiClient.get('/games/photo', { params });
  },

  /**
   * 로드뷰 모드 게임 데이터 가져오기
   * @param {Object} params - 게임 파라미터 (region, totalRounds)
   * @returns {Promise} - 게임 데이터 응답
   */
  getRoadViewGameData(params) {
    return apiClient.get('/games/roadview', { params });
  },

  /**
   * 게임 결과 제출
   * @param {String} gameId - 게임 ID
   * @param {Object} result - 게임 결과 데이터
   * @returns {Promise} - 게임 결과 제출 응답
   */
  submitGameResult(gameId, result) {
    return apiClient.post(`/games/${gameId}/result`, result);
  },

  /**
   * 게임 랭킹 조회
   * @param {String} gameMode - 게임 모드 (photo, roadview)
   * @param {Object} params - 조회 파라미터 (period, limit)
   * @returns {Promise} - 랭킹 데이터 응답
   */
  getGameRanking(gameMode, params) {
    return apiClient.get(`/games/${gameMode}/ranking`, { params });
  },

  /**
   * 사용자 게임 기록 조회
   * @param {String} userId - 사용자 ID
   * @param {Object} params - 조회 파라미터 (gameMode, limit, offset)
   * @returns {Promise} - 게임 기록 응답
   */
  getUserGameHistory(userId, params) {
    return apiClient.get(`/users/${userId}/games`, { params });
  },

  /**
   * 게임 통계 조회
   * @param {String} userId - 사용자 ID
   * @returns {Promise} - 게임 통계 응답
   */
  getUserGameStats(userId) {
    return apiClient.get(`/users/${userId}/stats`);
  }
};

export default gameService;
