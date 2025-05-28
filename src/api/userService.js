import apiClient from './apiClient';

/**
 * 사용자 관련 API 서비스
 */
const userService = {
  /**
   * 사용자 프로필 조회
   * @param {String} userId - 사용자 ID
   * @returns {Promise} - 사용자 프로필 응답
   */
  getUserProfile(userId) {
    return apiClient.get(`/users/${userId}/profile`);
  },

  /**
   * 사용자 프로필 업데이트
   * @param {String} userId - 사용자 ID
   * @param {Object} profileData - 프로필 데이터
   * @returns {Promise} - 프로필 업데이트 응답
   */
  updateUserProfile(userId, profileData) {
    return apiClient.put(`/users/${userId}/profile`, profileData);
  },

  /**
   * 사용자 인벤토리 조회
   * @param {String} userId - 사용자 ID
   * @param {Object} params - 조회 파라미터 (type, limit, offset)
   * @returns {Promise} - 인벤토리 응답
   */
  getUserInventory(userId, params) {
    return apiClient.get(`/users/${userId}/inventory`, { params });
  },

  /**
   * 아이템 사용
   * @param {String} userId - 사용자 ID
   * @param {String} itemId - 아이템 ID
   * @returns {Promise} - 아이템 사용 응답
   */
  useItem(userId, itemId) {
    return apiClient.post(`/users/${userId}/inventory/${itemId}/use`);
  },

  /**
   * 친구 목록 조회
   * @param {String} userId - 사용자 ID
   * @returns {Promise} - 친구 목록 응답
   */
  getFriendsList(userId) {
    return apiClient.get(`/users/${userId}/friends`);
  },

  /**
   * 친구 요청 보내기
   * @param {String} userId - 사용자 ID
   * @param {String} targetUserId - 대상 사용자 ID
   * @returns {Promise} - 친구 요청 응답
   */
  sendFriendRequest(userId, targetUserId) {
    return apiClient.post(`/users/${userId}/friends/request`, { targetUserId });
  },

  /**
   * 친구 요청 응답 (수락/거절)
   * @param {String} userId - 사용자 ID
   * @param {String} requestId - 요청 ID
   * @param {Boolean} accept - 수락 여부
   * @returns {Promise} - 친구 요청 응답 결과
   */
  respondToFriendRequest(userId, requestId, accept) {
    return apiClient.put(`/users/${userId}/friends/request/${requestId}`, { accept });
  },

  /**
   * 친구 삭제
   * @param {String} userId - 사용자 ID
   * @param {String} friendId - 친구 ID
   * @returns {Promise} - 친구 삭제 응답
   */
  removeFriend(userId, friendId) {
    return apiClient.delete(`/users/${userId}/friends/${friendId}`);
  }
};

export default userService;
