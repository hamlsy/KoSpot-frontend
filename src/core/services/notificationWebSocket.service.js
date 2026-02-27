/* eslint-disable */
/**
 * 알림(Notification) WebSocket STOMP 서비스
 *
 * 구독 채널:
 *   - /topic/notification/global  : 전역 알림 (공지사항, 시스템 브로드캐스트)
 *   - /user/queue/notification    : 개인 알림 (관리자 메시지, 친구 요청 등)
 *
 * 백엔드 채널이 변경되면 notificationTypes.js 의 NOTIFICATION_WS_CHANNELS 상수만 수정하면 됩니다.
 */
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { NOTIFICATION_WS_CHANNELS } from '@/core/constants/notificationTypes.js';

let stompClient = null;
const subscriptions = new Map(); // channelKey → STOMP subscription
let onNotificationCallback = null;

const WS_ENDPOINT = '/ws';

/**
 * STOMP 연결 및 알림 채널 구독
 * @param {Function} onNotification - 알림 수신 시 호출될 콜백 (notification 객체 전달)
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
        const baseUrl =
            typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
                ? import.meta.env.VITE_API_BASE_URL
                : process.env.VUE_APP_API_BASE_URL || '';

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
                console.log('🔔 알림 WebSocket: STOMP 연결 성공');
                _subscribeAll();
            },

            onDisconnect: () => {
                console.log('🔔 알림 WebSocket: 연결 해제');
                subscriptions.clear();
            },

            onStompError: (frame) => {
                console.error('🔔 알림 WebSocket STOMP 오류:', frame.headers?.message);
            },

            onWebSocketError: () => {
                // 백엔드 미연결 시 조용히 실패 (개발 환경에서 정상)
                console.warn('🔔 알림 WebSocket: 연결 실패 (백엔드 미연결 시 무시 가능)');
            },
        });

        stompClient.activate();
    } catch (error) {
        console.warn('🔔 알림 WebSocket 초기화 실패:', error.message);
    }
};

/**
 * 두 채널 모두 구독
 * @private
 */
const _subscribeAll = () => {
    _subscribe('global', NOTIFICATION_WS_CHANNELS.GLOBAL);
    _subscribe('personal', NOTIFICATION_WS_CHANNELS.PERSONAL);
};

/**
 * 특정 채널 구독
 * @param {string} key - 구독 식별 키
 * @param {string} channel - STOMP 채널 경로
 * @private
 */
const _subscribe = (key, channel) => {
    if (!stompClient?.connected) return;
    if (subscriptions.has(key)) return; // 중복 방지

    try {
        const sub = stompClient.subscribe(channel, (message) => {
            try {
                const notification = JSON.parse(message.body);
                console.log(`🔔 알림 수신 [${key}]:`, notification?.type, notification?.title);

                if (typeof onNotificationCallback === 'function') {
                    onNotificationCallback(notification);
                }
            } catch (err) {
                console.error(`🔔 알림 파싱 실패 [${key}]:`, err);
            }
        });

        subscriptions.set(key, sub);
        console.log(`🔔 채널 구독 완료 [${key}]: ${channel}`);
    } catch (error) {
        console.error(`🔔 채널 구독 실패 [${key}]:`, error.message);
    }
};

/**
 * WebSocket 연결 해제 (로그아웃 시 호출)
 */
export const disconnectNotificationSocket = () => {
    subscriptions.forEach((sub, key) => {
        try {
            sub.unsubscribe();
            console.log(`🔔 구독 해제: ${key}`);
        } catch (_) {
            // Ignore error during unsubscription
        }
    });
    subscriptions.clear();

    if (stompClient) {
        try {
            stompClient.deactivate();
        } catch (_) {
            // Ignore error during deactivation
        }
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
