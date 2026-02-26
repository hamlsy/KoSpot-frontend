/**
 * 알림(Notification) WebSocket STOMP 서비스
 * 메인페이지 진입 시 STOMP 연결을 수립하고 개인 알림 채널을 구독합니다.
 * 백엔드 채널이 확정되면 notificationTypes.js의 NOTIFICATION_WS_CHANNEL 상수만 변경하면 됩니다.
 */
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { NOTIFICATION_WS_CHANNEL } from '@/core/constants/notificationTypes.js';

let stompClient = null;
let subscription = null;
let onNotificationCallback = null;
let reconnectTimer = null;

const WS_ENDPOINT = '/ws'; // 기존 WebSocket 엔드포인트와 동일

/**
 * STOMP 연결 설정 및 알림 채널 구독
 * @param {Function} onNotification - 알림 수신 시 호출될 콜백
 */
export const connectNotificationSocket = (onNotification) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        console.log('🔔 알림 WebSocket: 토큰 없음, 연결 건너뜀');
        return;
    }

    onNotificationCallback = onNotification;

    if (stompClient && stompClient.connected) {
        console.log('🔔 알림 WebSocket: 이미 연결됨');
        return;
    }

    try {
        const baseUrl = import.meta.env?.VITE_API_BASE_URL || process.env.VUE_APP_API_BASE_URL || '';
        const wsUrl = `${baseUrl}${WS_ENDPOINT}`;

        stompClient = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                console.log('🔔 알림 WebSocket: 연결 성공');
                _subscribe();
            },

            onDisconnect: () => {
                console.log('🔔 알림 WebSocket: 연결 해제');
                subscription = null;
            },

            onStompError: (frame) => {
                console.error('🔔 알림 WebSocket STOMP 오류:', frame);
            },

            onWebSocketError: (error) => {
                // 백엔드 미연결 시 조용히 실패 (개발 환경)
                console.warn('🔔 알림 WebSocket 연결 실패 (백엔드 미연결 시 무시):', error?.type || 'unknown');
            },
        });

        stompClient.activate();
    } catch (error) {
        console.warn('🔔 알림 WebSocket 초기화 실패:', error.message);
    }
};

/**
 * 알림 채널 구독
 * @private
 */
const _subscribe = () => {
    if (!stompClient || !stompClient.connected) return;

    try {
        // 추후 백엔드 채널 확정 시 NOTIFICATION_WS_CHANNEL 상수만 변경
        subscription = stompClient.subscribe(NOTIFICATION_WS_CHANNEL, (message) => {
            try {
                const notification = JSON.parse(message.body);
                console.log('🔔 새 알림 수신:', notification);
                if (typeof onNotificationCallback === 'function') {
                    onNotificationCallback(notification);
                }
            } catch (error) {
                console.error('🔔 알림 파싱 실패:', error);
            }
        });

        console.log(`🔔 알림 채널 구독 완료: ${NOTIFICATION_WS_CHANNEL}`);
    } catch (error) {
        console.error('🔔 알림 채널 구독 실패:', error);
    }
};

/**
 * WebSocket 연결 해제 (로그아웃 시 호출)
 */
export const disconnectNotificationSocket = () => {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }

    if (subscription) {
        try {
            subscription.unsubscribe();
        } catch (_) { }
        subscription = null;
    }

    if (stompClient) {
        try {
            stompClient.deactivate();
        } catch (_) { }
        stompClient = null;
    }

    onNotificationCallback = null;
    console.log('🔔 알림 WebSocket: 연결 해제 완료');
};

/**
 * 연결 상태 확인
 * @returns {boolean}
 */
export const isNotificationSocketConnected = () => {
    return !!(stompClient && stompClient.connected);
};

export default {
    connectNotificationSocket,
    disconnectNotificationSocket,
    isNotificationSocketConnected,
};
