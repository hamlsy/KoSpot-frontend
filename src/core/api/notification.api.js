/**
 * 알림 API 서비스
 * 백엔드 연동 전까지 더미 데이터로 동작
 */
import axios from 'axios';
import { NOTIFICATION_TYPE } from '@/core/constants/notificationTypes.js';

// 더미 알림 데이터 (백엔드 연동 전 개발용)
const DUMMY_NOTIFICATIONS = [
    {
        id: 1,
        type: NOTIFICATION_TYPE.NOTICE,
        title: '2026년 2월 업데이트 안내',
        message: '새로운 게임 모드와 다양한 기능이 추가되었습니다.',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        link: '/noticeList',
    },
    {
        id: 2,
        type: NOTIFICATION_TYPE.FRIEND_REQUEST,
        title: '친구 요청',
        message: '코스팟유저님이 친구 요청을 보냈습니다.',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        link: null,
    },
    {
        id: 3,
        type: NOTIFICATION_TYPE.SYSTEM,
        title: '시스템 점검 예정',
        message: '내일 오전 2시~4시 서버 점검이 예정되어 있습니다.',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        link: null,
    },
    {
        id: 4,
        type: NOTIFICATION_TYPE.NOTICE,
        title: '베타 서비스 오픈!',
        message: 'KoSpot 베타 서비스에 오신 것을 환영합니다.',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        link: '/noticeList',
    },
];

// 더미 데이터 내부 상태
let dummyNotifications = [...DUMMY_NOTIFICATIONS];

/**
 * 더미 모드 여부 판단 (토큰 없거나 API 실패 시)
 */
const isDummyMode = () => {
    return !localStorage.getItem('accessToken');
};

/**
 * 알림 목록 조회
 * @param {Object} params - 조회 파라미터 (page, size, isRead 등)
 * @returns {Promise<Object>} { notifications, total, unreadCount }
 */
export const getNotifications = async (params = {}) => {
    if (isDummyMode()) {
        return {
            notifications: [...dummyNotifications],
            total: dummyNotifications.length,
        };
    }

    try {
        const response = await axios.get('/api/notifications', { params });
        return response.data;
    } catch (error) {
        console.warn('알림 목록 조회 실패, 더미 데이터 사용:', error.message);
        return {
            notifications: [...dummyNotifications],
            total: dummyNotifications.length,
        };
    }
};

/**
 * 미읽은 알림 수 조회
 * @returns {Promise<number>}
 */
export const getUnreadCount = async () => {
    if (isDummyMode()) {
        return dummyNotifications.filter((n) => !n.isRead).length;
    }

    try {
        const response = await axios.get('/api/notifications/unread-count');
        return response.data?.count ?? response.data ?? 0;
    } catch (error) {
        console.warn('미읽은 알림 수 조회 실패:', error.message);
        return dummyNotifications.filter((n) => !n.isRead).length;
    }
};

/**
 * 알림 개별 읽기
 * @param {number} notificationId
 * @returns {Promise<void>}
 */
export const markAsRead = async (notificationId) => {
    if (isDummyMode()) {
        const notification = dummyNotifications.find((n) => n.id === notificationId);
        if (notification) notification.isRead = true;
        return;
    }

    try {
        await axios.patch(`/api/notifications/${notificationId}/read`);
    } catch (error) {
        console.warn('알림 읽기 실패:', error.message);
        // 로컬 상태는 스토어에서 업데이트
    }
};

/**
 * 전체 알림 읽기
 * @returns {Promise<void>}
 */
export const markAllAsRead = async () => {
    if (isDummyMode()) {
        dummyNotifications = dummyNotifications.map((n) => ({ ...n, isRead: true }));
        return;
    }

    try {
        await axios.patch('/api/notifications/read-all');
    } catch (error) {
        console.warn('전체 읽기 실패:', error.message);
    }
};

export default {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
