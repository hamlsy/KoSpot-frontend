/* eslint-disable */
/**
 * Friend Chat WebSocket STOMP 서비스
 *
 * 이 서비스는 1:1 친구 채팅 전용 실시간 웹소켓 통신을 담당합니다.
 * (친구 요청 등 일반 알림은 notificationWebSocket.service.js 에서 담당)
 *
 * 발송 채널 (MessageMapping):
 *   - /app/chat-rooms.{roomId}.chat
 *     payload: { content: string }
 *
 * 구독 채널:
 *   - /topic/friends/chat-rooms/{roomId}
 *     응답: { messageId, senderMemberId, content, createdAt }
 */
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { resolveSockJsUrl } from '@/core/platform/websocketUrl.js';
import { authStorage } from '@/core/auth/authStorage.service.js';

let stompClient = null;
const subscriptions = new Map(); // roomId → STOMP subscription
let currentRoomId = null;
let _connectingPromise = null; // 연결 중(connecting) 상태 추적 — Race Condition 방지용

// roomId는 destination에 포함: /app/chat-rooms.{roomId}.chat
const SEND_ENDPOINT_TEMPLATE = (roomId) => `/app/chat-rooms.${roomId}.chat`;
// 서버의 FriendChatChannelConstants: /topic/friends/chat-rooms/{roomId}
const SUBSCRIBE_TOPIC_PREFIX = '/topic/friend/chat-rooms/';

/**
 * STOMP 연결 설정
 * 앱 로드 또는 사용자 로그인 시 호출할 수 있으며, 또는 특정 채팅방 입장 시 호출해도 무방합니다.
 */
export const connectFriendSocket = () => {
    const token = authStorage.getAccessToken();
    if (!token) {
        return Promise.reject(new Error('토큰 없음'));
    }

    // Guard 1: 이미 연결 완료된 상태
    if (stompClient && stompClient.connected) {
        return Promise.resolve();
    }

    // Guard 2: 현재 연결 시도 중 — 동일한 Promise를 반환해 호출자도 await 가능
    // stompClient.connected는 activate() 후 수백ms 동안 false를 반환하므로
    // 이 구간을 _connectingPromise로 명시적으로 추적해 중복 연결을 차단합니다.
    if (_connectingPromise) {
        console.log('💬 친구 채팅 WebSocket: 연결 시도 진행 중, 기존 Promise 재사용');
        return _connectingPromise;
    }

    // Guard 3: stompClient가 존재하면 reconnectDelay로 자동 재연결 대기 중
    // disconnectFriendSocket()에서만 stompClient = null을 설정하므로
    // 정상 disconnect 없이는 절대 새 클라이언트가 만들어지지 않습니다.
    if (stompClient) {
        console.log('💬 친구 채팅 WebSocket: 클라이언트 존재 (연결 중 또는 재연결 대기), 건너뜀');
        return Promise.resolve();
    }

    _connectingPromise = new Promise((resolve, reject) => {
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
                    _connectingPromise = null; // 연결 완료 → 진행 중 플래그 해제
                    console.log('💬 친구 채팅 WebSocket: STOMP 연결 성공');
                    resolve();
                },

                onDisconnect: () => {
                    // reconnectDelay가 설정되어 있어 STOMP가 자동 재연결합니다.
                    // 채팅방 구독(subscriptions)은 openChatRoom 시점에 다시 등록되므로
                    // 여기서는 상태 초기화 없이 플래그만 해제합니다.
                    console.log('💬 친구 채팅 WebSocket: 연결 해제 (자동 재연결 대기 중)');
                    _connectingPromise = null;
                },

                onStompError: (frame) => {
                    const msg = frame.headers?.message || '알 수 없는 오류';
                    console.error('💬 친구 채팅 WebSocket STOMP 오류:', msg);
                    _connectingPromise = null;

                    // ❗ STOMP ERROR → 즉시 deactivate해서 재연결 루프 차단
                    if (stompClient) {
                        try {
                            stompClient.deactivate();
                        } catch (_) { /* 무시 */ }
                        stompClient = null;
                        subscriptions.clear();
                        currentRoomId = null;
                        console.warn('💬 친구 채팅 WebSocket: STOMP 오류로 인해 연결 종료.');
                    }
                    reject(new Error(msg));
                },

                onWebSocketError: () => {
                    console.warn('💬 친구 채팅 WebSocket: 연결 실패');
                    _connectingPromise = null; // 연결 실패 → 플래그 해제
                },
            });

            stompClient.activate();
        } catch (error) {
            console.warn('💬 친구 채팅 WebSocket 초기화 실패:', error.message);
            _connectingPromise = null;
            reject(error);
        }
    });

    return _connectingPromise;
};

/**
 * 특정 친구 채팅방을 구독 (입장 시)
 * @param {number|string} roomId - 구독할 채팅방 ID
 * @param {Function} onMessageReceived - 메시지 수신 시 호출될 콜백 (메시지 객체 전달)
 */
export const subscribeToChatRoom = (roomId, onMessageReceived) => {
    if (!stompClient?.connected) {
        console.warn('💬 STOMP 연결 안됨. 구독 요청 대기 혹은 무시됨.');
        return;
    }

    // 이미 구독 중이면 중복 구독 방지 (다중 채팅창 동시 지원)
    if (subscriptions.has(roomId)) {
        return;
    }

    const channel = `${SUBSCRIBE_TOPIC_PREFIX}${roomId}`;

    try {
        const sub = stompClient.subscribe(channel, (message) => {
            try {
                const chatMessage = JSON.parse(message.body);

                if (typeof onMessageReceived === 'function') {
                    onMessageReceived(chatMessage);
                }
            } catch (err) {
                console.error(`💬 친구 채팅 파싱 실패 [Room ${roomId}]:`, err);
            }
        });

        subscriptions.set(roomId, sub);
        currentRoomId = roomId;
    } catch (error) {
        console.error(`💬 친구 채팅방 구독 실패 [Room ${roomId}]:`, error.message);
    }
};

/**
 * 특정 친구 채팅방을 구독 해제 (퇴장 시)
 * @param {number|string} roomId - 구독 해제할 채팅방 ID
 */
export const unsubscribeFromChatRoom = (roomId) => {
    if (subscriptions.has(roomId)) {
        try {
            const sub = subscriptions.get(roomId);
            sub.unsubscribe();
            subscriptions.delete(roomId);
            if (currentRoomId === roomId) {
                currentRoomId = null;
            }
        } catch (error) {
            console.error(`💬 친구 채팅방 구독 해제 실패 [Room ${roomId}]:`, error.message);
        }
    }
};

/**
 * 실시간 채팅 메시지 발송
 * @param {number|string} roomId - 발송할 채팅방 ID
 * @param {string} content - 메시지 전문
 */
export const sendChatMessage = (roomId, content) => {
    if (!stompClient?.connected) {
        console.error('💬 메시지 전송 실패: STOMP 연결 안됨');
        throw new Error('채팅 서버와 연결이 끊어졌습니다.');
    }

    if (!roomId) {
        throw new Error('채팅방 ID가 필요합니다.');
    }

    if (!content || !content.trim()) {
        throw new Error('메시지 내용을 입력해주세요.');
    }

    // roomId는 destination에 포함 → body에는 content만 전송
    // 백엔드: @MessageMapping("/chat-rooms.{roomId}.chat")
    // 백엔드 payload: ChatMessageDto.Friend { content }
    const payload = {
        content: content.trim(),
    };

    const destination = SEND_ENDPOINT_TEMPLATE(Number(roomId));

    try {
        stompClient.publish({
            destination,
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error(`💬 채팅 메시지 발송 실패 [Room ${roomId}]:`, error);
        throw error;
    }
};

/**
 * WebSocket 연결 해제 (로그아웃 혹은 앱 종료 시 호출)
 */
export const disconnectFriendSocket = () => {
    // 연결 중 플래그 초기화 (재연결 시 막히지 않도록)
    _connectingPromise = null;

    subscriptions.forEach((sub, roomId) => {
        try {
            sub.unsubscribe();
        } catch (_) {
            // Ignore error
        }
    });
    subscriptions.clear();
    currentRoomId = null;

    if (stompClient) {
        try {
            stompClient.deactivate();
        } catch (_) {
            // Ignore error
        }
        stompClient = null;
    }
};

/**
 * 현재 연결 상태 확인
 * @returns {boolean} 상태 여부
 */
export const isFriendSocketConnected = () => {
    return !!(stompClient && stompClient.connected);
};

export default {
    connectFriendSocket,
    disconnectFriendSocket,
    isFriendSocketConnected,
    subscribeToChatRoom,
    unsubscribeFromChatRoom,
    sendChatMessage,
};
