/* eslint-disable */
/**
 * 앱 전역 WebSocket 연결 오케스트레이터
 *
 * App.vue와 router 양쪽에서 호출할 수 있도록 별도 서비스로 분리했습니다.
 * (App.vue ↔ router 순환 참조 방지)
 *
 * 연결 시점:
 *  1. 앱 최초 마운트 (새로고침, 직접 URL 접근) — App.vue onMounted
 *  2. 다른 탭에서 로그인 감지 — App.vue storage 이벤트
 *  3. 동일 탭 로그인 직후 — router afterEach 가드
 *
 * 자동 재연결: STOMP 라이브러리 내장 reconnectDelay(5초)가 담당합니다.
 */
import {
    connectNotificationSocket,
    disconnectNotificationSocket,
    isNotificationSocketConnected,
} from './notificationWebSocket.service.js';
import { NOTIFICATION_TYPE } from '@/core/constants/notificationTypes.js';
import { isFriendSocketConnected } from '@/features/friend/services/friendWebSocket.service.js';
import { useNotificationStore } from '@/store/modules/notificationStore.js';
import { useFriendStore } from '@/features/friend/stores/friend.store.js';

/**
 * 로그인 상태일 때 모든 WebSocket을 연결하고 초기 데이터를 로드합니다.
 */
export const connectAll = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const notificationStore = useNotificationStore();
    const friendStore = useFriendStore();

    // 1. 알림 WebSocket — 미연결 상태일 때만
    if (!isNotificationSocketConnected()) {
        connectNotificationSocket((notification) => {
            notificationStore.addNotification(notification);

            if (notification.type === NOTIFICATION_TYPE.FRIEND_REQUEST) {
                friendStore.loadInitialData();
            }
        });
        notificationStore.fetchUnreadCount();
    }

    // 2. 친구 WebSocket — 미연결 상태일 때만
    if (!isFriendSocketConnected()) {
        await friendStore.initSocket();
    }

    // 3. 친구 초기 데이터 — 없을 때만 로드
    if (friendStore.friends.length === 0 && !friendStore.isLoading) {
        await friendStore.loadInitialData();
    }
};

/**
 * 로그아웃 / 앱 종료 시 모든 WebSocket을 해제합니다.
 */
export const disconnectAll = () => {
    const notificationStore = useNotificationStore();
    const friendStore = useFriendStore();

    disconnectNotificationSocket();
    notificationStore.reset();

    friendStore.destroySocket();
    friendStore.reset();
};
