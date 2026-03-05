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

let stompClient = null;
const subscriptions = new Map(); // roomId → STOMP subscription
let currentRoomId = null;

const WS_ENDPOINT = '/ws';
// roomId는 destination에 포함: /app/chat-rooms.{roomId}.chat
const SEND_ENDPOINT_TEMPLATE = (roomId) => `/app/chat-rooms.${roomId}.chat`;
// 서버의 FriendChatChannelConstants: /topic/friends/chat-rooms/{roomId}
const SUBSCRIBE_TOPIC_PREFIX = '/topic/friend/chat-rooms/';

/**
 * STOMP 연결 설정
 * 앱 로드 또는 사용자 로그인 시 호출할 수 있으며, 또는 특정 채팅방 입장 시 호출해도 무방합니다.
 */
export const connectFriendSocket = () => {
    return new Promise((resolve, reject) => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            reject(new Error('토큰 없음'));
            return;
        }

        if (stompClient && stompClient.connected) {
            resolve();
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
                    resolve();
                },

                onDisconnect: () => {
                    subscriptions.clear();
                    currentRoomId = null;
                },

                onStompError: (frame) => {
                    console.error('💬 친구 채팅 WebSocket STOMP 오류:', frame.headers?.message);
                    reject(new Error(frame.headers?.message));
                },

                onWebSocketError: () => {
                    console.warn('💬 친구 채팅 WebSocket: 연결 실패');
                },
            });

            stompClient.activate();
        } catch (error) {
            console.warn('💬 친구 채팅 WebSocket 초기화 실패:', error.message);
            reject(error);
        }
    });
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
