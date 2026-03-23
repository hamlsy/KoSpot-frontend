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
import { resolveSockJsUrl } from '@/core/platform/websocketUrl.js';
import { authStorage } from '@/core/auth/authStorage.service.js';

let stompClient = null;
const subscriptions = new Map(); // channelKey → STOMP subscription
let onNotificationCallback = null;
let _connectingPromise = null; // 연결 중(connecting) 상태 추적 — Race Condition 방지용

/**
 * STOMP 연결 및 알림 채널 구독
 * @param {Function} onNotification - 알림 수신 시 호출될 콜백 (notification 객체 전달)
 */
export const connectNotificationSocket = (onNotification) => {
    const token = authStorage.getAccessToken();
    if (!token) {
        console.log('🔔 알림 WebSocket: 토큰 없음, 연결 건너뜀');
        return;
    }

    // 콜백은 항상 최신 참조로 갱신 (연결 상태와 무관)
    onNotificationCallback = onNotification;

    // Guard 1: 이미 연결 완료된 상태
    if (stompClient && stompClient.connected) {
        console.log('🔔 알림 WebSocket: 이미 연결됨, 재연결 건너뜀');
        return;
    }

    // Guard 2: 현재 연결 시도 중 (비동기 activate() 진행 중)
    // stompClient.connected는 activate() 후 수백ms 동안 false를 반환하므로
    // 이 구간을 _connectingPromise로 명시적으로 추적해 중복 연결을 차단합니다.
    if (_connectingPromise) {
        console.log('🔔 알림 WebSocket: 연결 시도 진행 중, 중복 요청 무시');
        return;
    }

    // Guard 3: stompClient가 존재하면 연결 중이거나 reconnectDelay로 자동 재연결 대기 중
    // disconnectNotificationSocket()에서만 stompClient = null을 설정하므로
    // 정상 disconnect 없이는 절대 새 클라이언트가 만들어지지 않습니다.
    if (stompClient) {
        console.log('🔔 알림 WebSocket: 클라이언트 존재 (연결 중 또는 재연결 대기), 건너뜀');
        return;
    }

    try {
        const wsUrl = resolveSockJsUrl();

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
                _connectingPromise = null; // 연결 완료 → 진행 중 플래그 해제
                // 재연결 시에도 구독이 정확히 1회 등록되도록 클리어 후 재구독
                subscriptions.clear();
                _subscribeAll();
            },

            onDisconnect: () => {
                // reconnectDelay가 설정되어 있어 STOMP가 자동 재연결합니다.
                // subscriptions는 onConnect에서 정리하므로 여기서는 플래그만 해제합니다.
                console.log('🔔 알림 WebSocket: 연결 해제 (자동 재연결 대기 중)');
                _connectingPromise = null;
            },

            onStompError: (frame) => {
                const msg = frame.headers?.message || '알 수 없는 오류';
                console.error('🔔 알림 WebSocket STOMP 오류:', msg);
                _connectingPromise = null;

                // ❗ STOMP ERROR 프레임은 서버 측 심각 오류 (구독 거부, 채널 과부하 등)
                // reconnectDelay에 의한 자동 재연결이 계속되면 서버를 더 과부하시키는 루프가 됩니다.
                // → 즉시 deactivate()해서 루프를 끊고, stompClient = null로 초기화합니다.
                // → 이후 connectAll()이 호출될 때(라우팅, 사용자 액션 등) 새 연결을 시작합니다.
                if (stompClient) {
                    try {
                        stompClient.deactivate();
                    } catch (_) { /* deactivate 실패는 무시 */ }
                    stompClient = null;
                    subscriptions.clear();
                    console.warn('🔔 알림 WebSocket: STOMP 오류로 인해 연결 종료. 다음 페이지 이동 시 재시도합니다.');
                }
            },

            onWebSocketError: () => {
                // 백엔드 미연결 시 조용히 실패 (개발 환경에서 정상)
                console.warn('🔔 알림 WebSocket: 연결 실패 (백엔드 미연결 시 무시 가능)');
                _connectingPromise = null; // 연결 실패 → 플래그 해제
            },
        });

        // 연결 시도 시작을 플래그로 기록 (onConnect / onStompError / onWebSocketError에서 해제)
        _connectingPromise = true;
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
    // 연결 중 플래그 초기화 (재연결 시 막히지 않도록)
    _connectingPromise = null;

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
