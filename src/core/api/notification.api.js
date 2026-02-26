/**
 * Notification API Service
 * main.service.js 패턴 준수: apiClient 상속 + endPoint.js 엔드포인트 사용
 *
 * 공통 응답 형태: ApiResponseDto<T>
 * { isSuccess: true, code: 2000, message: "성공", result: T }
 */
import { apiClient } from '@/core/api/apiClient.js';
import { API_ENDPOINTS } from '@/core/api/endPoint.js';
import { NOTIFICATION_TYPE } from '@/core/constants/notificationTypes.js';

// ─── 더미 데이터 (백엔드 미연결 개발용) ───────────────────────────────────
const DUMMY_NOTIFICATIONS = [
    {
        notificationId: 1,
        receiverMemberId: null,
        type: NOTIFICATION_TYPE.NOTICE,
        title: '2026년 2월 업데이트 안내',
        content: '새로운 게임 모드와 다양한 기능이 추가되었습니다.',
        payloadJson: JSON.stringify({ noticeId: 1 }),
        sourceId: 1,
        isRead: false,
        readAt: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
        notificationId: 2,
        receiverMemberId: null,
        type: NOTIFICATION_TYPE.FRIEND_REQUEST,
        title: '친구 요청',
        content: '코스팟유저님이 친구 요청을 보냈습니다.',
        payloadJson: JSON.stringify({ friendRequestId: 1, senderMemberId: 42 }),
        sourceId: 1,
        isRead: false,
        readAt: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
        notificationId: 3,
        receiverMemberId: null,
        type: NOTIFICATION_TYPE.ADMIN_MESSAGE,
        title: '서버 점검 안내',
        content: '내일 오전 2~4시 서버 점검이 예정되어 있습니다.',
        payloadJson: JSON.stringify({ adminId: 1 }),
        sourceId: null,
        isRead: true,
        readAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
        notificationId: 4,
        receiverMemberId: null,
        type: NOTIFICATION_TYPE.NOTICE,
        title: 'KoSpot 베타 서비스 오픈!',
        content: 'KoSpot 베타 서비스에 오신 것을 환영합니다.',
        payloadJson: JSON.stringify({ noticeId: 2 }),
        sourceId: 2,
        isRead: true,
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
];

let _dummyNotifications = [...DUMMY_NOTIFICATIONS];

/**
 * Notification API Service Class
 */
class NotificationService {
    /**
     * 내 알림 목록 조회
     * GET /notifications?page=&size=&type=&isRead=
     *
     * @param {{ page?: number, size?: number, type?: string, isRead?: boolean }} params
     * @returns {Promise<Array>} NotificationItem[]
     */
    async getNotifications(params = {}) {
        if (this._isDummyMode()) {
            let result = [..._dummyNotifications];
            if (params.type) result = result.filter((n) => n.type === params.type);
            if (params.isRead !== undefined) result = result.filter((n) => n.isRead === params.isRead);
            return result;
        }

        try {
            const response = await apiClient.get(API_ENDPOINTS.NOTIFICATION.LIST, { params });
            return response.data?.result ?? [];
        } catch (error) {
            console.error('❌ 알림 목록 조회 실패:', error);
            this._handleApiError(error, '알림 목록을 불러오는데 실패했습니다.');
            throw error;
        }
    }

    /**
     * 미읽음 알림 개수 조회
     * GET /notifications/unread-count
     *
     * @returns {Promise<number>}
     */
    async getUnreadCount() {
        if (this._isDummyMode()) {
            return _dummyNotifications.filter((n) => !n.isRead).length;
        }

        try {
            const response = await apiClient.get(API_ENDPOINTS.NOTIFICATION.UNREAD_COUNT);
            return response.data?.result?.unreadCount ?? 0;
        } catch (error) {
            console.error('❌ 미읽음 알림 수 조회 실패:', error);
            return 0;
        }
    }

    /**
     * 단건 읽음 처리
     * PATCH /notifications/{notificationId}/read
     *
     * @param {number} notificationId
     * @returns {Promise<void>}
     */
    async markAsRead(notificationId) {
        if (this._isDummyMode()) {
            const n = _dummyNotifications.find((n) => n.notificationId === notificationId);
            if (n) {
                n.isRead = true;
                n.readAt = new Date().toISOString();
            }
            return;
        }

        try {
            await apiClient.patch(API_ENDPOINTS.NOTIFICATION.READ(notificationId));
        } catch (error) {
            console.error('❌ 알림 읽기 실패:', error);
            this._handleApiError(error, '알림 읽음 처리에 실패했습니다.');
            throw error;
        }
    }

    /**
     * 전체 읽음 처리
     * PATCH /notifications/read-all
     *
     * @returns {Promise<number>} 업데이트된 알림 수
     */
    async markAllAsRead() {
        if (this._isDummyMode()) {
            const now = new Date().toISOString();
            _dummyNotifications = _dummyNotifications.map((n) => ({
                ...n,
                isRead: true,
                readAt: now,
            }));
            return _dummyNotifications.length;
        }

        try {
            const response = await apiClient.patch(API_ENDPOINTS.NOTIFICATION.READ_ALL);
            return response.data?.result?.updatedCount ?? 0;
        } catch (error) {
            console.error('❌ 전체 읽음 처리 실패:', error);
            this._handleApiError(error, '전체 알림 읽음 처리에 실패했습니다.');
            throw error;
        }
    }

    /**
     * 더미 모드 여부: 액세스 토큰이 없으면 더미 데이터 사용
     * @private
     */
    _isDummyMode() {
        return !localStorage.getItem('accessToken');
    }

    /**
     * API 에러 처리 (main.service.js 패턴과 동일)
     * @param {Error} error
     * @param {string} defaultMessage
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
export const notificationService = new NotificationService();
export default notificationService;
