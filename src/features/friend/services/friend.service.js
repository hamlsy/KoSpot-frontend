/**
 * Friend API Service
 * 친구 관련 기능을 위한 백엔드 API 연동 서비스
 * 친구 목록 조회, 친구 요청 관리, 친구 삭제, 채팅방 관리 등의 기능을 제공합니다.
 */
import { apiClient } from '@/core/api/apiClient.js';

/**
 * 친구 관련 API 엔드포인트
 */
const FRIEND_ENDPOINTS = {
    // 친구 기본 기능
    GET_ALL_FRIENDS: '/friends',
    SEND_REQUEST: '/friends/requests',
    APPROVE_REQUEST: (requestId) => `/friends/requests/${requestId}/approve`,
    REJECT_REQUEST: (requestId) => `/friends/requests/${requestId}/reject`,
    GET_INCOMING_REQUESTS: '/friends/requests/incoming',
    DELETE_FRIEND: (friendMemberId) => `/friends/${friendMemberId}`,

    // 친구 채팅 기능 (REST)
    GET_OR_CREATE_CHAT_ROOM: (friendMemberId) => `/friends/${friendMemberId}/chat-room`,
    SEND_CHAT_MESSAGE: (roomId) => `/friends/chat-rooms/${roomId}/messages`,
    GET_CHAT_MESSAGES: (roomId) => `/friends/chat-rooms/${roomId}/messages`,
};

/**
 * Friend API Service Class
 */
class FriendService {
    /**
     * 내 친구 목록 조회
     * @returns {Promise<ApiResponse<FriendListResponse[]>>} API 응답 데이터
     */
    async getAllFriends() {
        try {
            const response = await apiClient.get(FRIEND_ENDPOINTS.GET_ALL_FRIENDS);
            return response.data;
        } catch (error) {
            console.error('❌ 내 친구 목록 조회 실패:', error);
            this._handleApiError(error, '친구 목록을 불러오는데 실패했습니다.');
            throw error;
        }
    }

    /**
     * 친구 요청 보내기
     * @param {number} receiverMemberId - 요청을 받을 회원 ID
     * @returns {Promise<ApiResponse<FriendRequestActionResponse>>} API 응답 데이터
     */
    async sendFriendRequest(receiverMemberId) {
        try {
            if (!receiverMemberId) {
                throw new Error('요청을 보낼 회원 ID가 필요합니다.');
            }

            const requestData = { receiverMemberId };
            const response = await apiClient.post(FRIEND_ENDPOINTS.SEND_REQUEST, requestData);

            return response.data;
        } catch (error) {
            console.error('❌ 친구 요청 보내기 실패:', error);
            this._handleApiError(error, '친구 요청을 보내는데 실패했습니다.');
            throw error;
        }
    }

    /**
     * 친구 요청 승인
     * @param {number} requestId - 승인할 친구 요청 ID
     * @returns {Promise<ApiResponse<FriendRequestActionResponse>>} API 응답 데이터
     */
    async approveFriendRequest(requestId) {
        try {
            if (!requestId) {
                throw new Error('승인할 요청 ID가 필요합니다.');
            }

            const response = await apiClient.patch(FRIEND_ENDPOINTS.APPROVE_REQUEST(requestId));

            return response.data;
        } catch (error) {
            console.error('❌ 친구 요청 승인 실패:', error);
            this._handleApiError(error, '친구 요청을 승인하는데 실패했습니다.');
            throw error;
        }
    }

    /**
     * 친구 요청 거절
     * @param {number} requestId - 거절할 친구 요청 ID
     * @returns {Promise<ApiResponse<FriendRequestActionResponse>>} API 응답 데이터
     */
    async rejectFriendRequest(requestId) {
        try {
            if (!requestId) {
                throw new Error('거절할 요청 ID가 필요합니다.');
            }

            const response = await apiClient.patch(FRIEND_ENDPOINTS.REJECT_REQUEST(requestId));

            return response.data;
        } catch (error) {
            console.error('❌ 친구 요청 거절 실패:', error);
            this._handleApiError(error, '친구 요청을 거절하는데 실패했습니다.');
            throw error;
        }
    }

    /**
     * 받은 친구 요청 목록 조회
     * @param {number} page - 페이지 번호 (기본값: 0)
     * @param {number} size - 페이지 크기 (기본값: 20)
     * @returns {Promise<ApiResponse<IncomingFriendRequestResponse[]>>} API 응답 데이터
     */
    async getIncomingRequests(page = 0, size = 20) {
        try {
            const response = await apiClient.get(FRIEND_ENDPOINTS.GET_INCOMING_REQUESTS, {
                params: { page, size }
            });

            return response.data;
        } catch (error) {
            console.error('❌ 받은 친구 요청 목록 조회 실패:', error);
            this._handleApiError(error, '받은 친구 요청 목록을 불러오는데 실패했습니다.');
            throw error;
        }
    }

    /**
     * 친구 삭제
     * @param {number} friendMemberId - 삭제할 친구의 회원 ID
     * @returns {Promise<ApiResponse>} API 응답 데이터
     */
    async deleteFriend(friendMemberId) {
        try {
            if (!friendMemberId) {
                throw new Error('삭제할 친구의 회원 ID가 필요합니다.');
            }

            const response = await apiClient.delete(FRIEND_ENDPOINTS.DELETE_FRIEND(friendMemberId));

            return response.data;
        } catch (error) {
            console.error('❌ 친구 삭제 실패:', error);
            this._handleApiError(error, '친구를 삭제하는데 실패했습니다.');
            throw error;
        }
    }

    /**
     * 친구 채팅방 조회/생성
     * @param {number} friendMemberId - 채팅할 친구의 회원 ID
     * @returns {Promise<ApiResponse<FriendChatRoomResponse>>} API 응답 데이터
     */
    async getOrCreateChatRoom(friendMemberId) {
        try {
            if (!friendMemberId) {
                throw new Error('채팅할 친구의 회원 ID가 필요합니다.');
            }

            const response = await apiClient.get(FRIEND_ENDPOINTS.GET_OR_CREATE_CHAT_ROOM(friendMemberId));

            return response.data;
        } catch (error) {
            console.error('❌ 친구 채팅방 조회/생성 실패:', error);
            this._handleApiError(error, '채팅방을 불러오는데 실패했습니다.');
            throw error;
        }
    }

    /**
     * 친구 채팅 메시지 전송 (REST)
     * 참고: 실시간 전송은 WebSocket을 권장하며, 이는 DB 저장용 API
     * @param {number} roomId - 채팅방 ID
     * @param {string} content - 전송할 메시지 내용
     * @returns {Promise<ApiResponse<FriendChatMessageResponse>>} API 응답 데이터
     */
    async sendChatMessage(roomId, content) {
        try {
            if (!roomId) throw new Error('채팅방 ID가 필요합니다.');
            if (!content || !content.trim()) throw new Error('메시지 내용을 입력해주세요.');

            const requestData = { content: content.trim() };
            const response = await apiClient.post(FRIEND_ENDPOINTS.SEND_CHAT_MESSAGE(roomId), requestData);

            return response.data;
        } catch (error) {
            console.error('❌ 친구 채팅 메시지 전송 실패:', error);
            this._handleApiError(error, '메시지를 전송하는데 실패했습니다.');
            throw error;
        }
    }

    /**
     * 친구 채팅 메시지 목록 조회
     * @param {number} roomId - 채팅방 ID
     * @param {number} page - 페이지 번호 (기본값: 0)
     * @param {number} size - 페이지 크기 (기본값: 30)
     * @returns {Promise<ApiResponse<FriendChatMessageResponse[]>>} API 응답 데이터
     */
    async getChatMessages(roomId, page = 0, size = 30) {
        try {
            if (!roomId) {
                throw new Error('채팅방 ID가 필요합니다.');
            }

            const response = await apiClient.get(FRIEND_ENDPOINTS.GET_CHAT_MESSAGES(roomId), {
                params: { page, size }
            });

            return response.data;
        } catch (error) {
            console.error('❌ 친구 채팅 메시지 목록 조회 실패:', error);
            this._handleApiError(error, '채팅 메시지를 불러오는데 실패했습니다.');
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
            const { status, data } = error.response;
            console.error(`HTTP ${status} 에러:`, data);
            if (data?.message) {
                throw new Error(data.message);
            }
        } else if (error.request) {
            console.error('네트워크 에러:', error.request);
            throw new Error('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
        }
        throw new Error(defaultMessage);
    }
}

// 싱글톤 인스턴스 생성 및 export
export const friendService = new FriendService();
export default friendService;
