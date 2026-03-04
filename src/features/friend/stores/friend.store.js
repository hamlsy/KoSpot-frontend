/**
 * Friend Pinia Store
 * 친구 목록, 받은 요청, 채팅방 등 친구 기능의 전역 상태를 관리합니다.
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import friendService from '../services/friend.service.js';
import {
    connectFriendSocket,
    disconnectFriendSocket,
    sendChatMessage as wsSendMessage,
    isFriendSocketConnected,
} from '../services/friendWebSocket.service.js';

export const useFriendStore = defineStore('friend', () => {
    // ─── State ───────────────────────────────────────────────

    /** @type {import('vue').Ref<Array>} 내 친구 목록 */
    const friends = ref([]);

    /** @type {import('vue').Ref<Array>} 받은 친구 요청 목록 */
    const pendingRequests = ref([]);

    /**
     * 열려 있는 채팅창 목록
     * 각 항목: { friend: Object, roomId: number|null, messages: Array, isLoading: boolean }
     *
     * messages 내 각 항목:
     *   { id: number, text: string, isMine: boolean, timestamp: number }
     */
    const openChats = ref([]);

    /** Pinia 패널 열림 상태 */
    const isPanelOpen = ref(false);

    /** 유저 검색 모달 열림 상태 */
    const isSearchOpen = ref(false);

    const isLoading = ref(false);
    const messageIdCounter = ref(1000);

    // ─── Getters ─────────────────────────────────────────────

    /** 친구 요청 또는 안읽은 채팅이 있으면 true */
    const hasAnyNotification = computed(() => {
        const hasUnread = friends.value.some((f) => f.unreadCount > 0);
        const hasPending = pendingRequests.value.length > 0;
        return hasUnread || hasPending;
    });

    /** 총 알림 카운트 (친구 요청 + 안읽은 채팅) */
    const totalNotificationCount = computed(() => {
        const unread = friends.value.reduce((sum, f) => sum + (f.unreadCount || 0), 0);
        return unread + pendingRequests.value.length;
    });

    // ─── Helpers ─────────────────────────────────────────────

    /**
     * 서버 친구 객체를 UI용 형식으로 변환
     * - 백엔드 필드명이 확정되면 여기서만 수정하면 됩니다.
     */
    function _mapFriend(raw) {
        return {
            id: raw.friendMemberId ?? raw.memberId ?? raw.id,
            nickname: raw.nickname,
            avatarColor: raw.profileImageUrl ?? _generateAvatarColor(raw.nickname),
            isOnline: raw.isOnline ?? false,
            lastMessage: raw.lastMessage ?? null,
            unreadCount: raw.unreadCount ?? 0,
        };
    }

    /**
     * 닉네임 기반 아바타 색상 생성 (폴백용)
     */
    function _generateAvatarColor(nickname) {
        const palette = [
            '#33fbe8', '#f59e0b', '#10b981', '#8b5cf6',
            '#ef4444', '#3b82f6', '#ec4899', '#14b8a6',
        ];
        let hash = 0;
        for (let i = 0; i < (nickname?.length ?? 0); i++) {
            hash = (hash * 31 + nickname.charCodeAt(i)) % palette.length;
        }
        return palette[Math.abs(hash)];
    }

    /**
     * 서버 메시지 객체를 UI용 형식으로 변환
     * @param {Object} raw 서버 메시지 객체
     * @param {number} myMemberId 내 memberId (isMine 판별용)
     */
    function _mapMessage(raw, myMemberId) {
        return {
            id: raw.messageId ?? raw.id ?? messageIdCounter.value++,
            text: raw.content,
            isMine: raw.senderMemberId === myMemberId || raw.isMine === true,
            timestamp: raw.sentAt ? new Date(raw.sentAt).getTime() : Date.now(),
        };
    }

    // ─── REST Actions ─────────────────────────────────────────

    /**
     * 친구 목록 및 받은 요청을 한번에 로드합니다.
     * 앱/패널 최초 진입 시 호출하세요.
     */
    async function loadInitialData() {
        isLoading.value = true;
        try {
            const [friendsRes, requestsRes] = await Promise.allSettled([
                friendService.getAllFriends(),
                friendService.getIncomingRequests(),
            ]);

            if (friendsRes.status === 'fulfilled') {
                const rawFriends = friendsRes.value?.data ?? friendsRes.value ?? [];
                friends.value = rawFriends.map(_mapFriend);
            } else {
                console.error('❌ 친구 목록 로드 실패:', friendsRes.reason);
            }

            if (requestsRes.status === 'fulfilled') {
                const rawRequests = requestsRes.value?.data ?? requestsRes.value ?? [];
                pendingRequests.value = rawRequests.map((r) => ({
                    id: r.requestId ?? r.id,
                    nickname: r.senderNickname ?? r.nickname,
                    avatarColor: r.senderProfileImageUrl ?? _generateAvatarColor(r.senderNickname ?? r.nickname),
                    senderMemberId: r.senderMemberId,
                }));
            } else {
                console.error('❌ 친구 요청 목록 로드 실패:', requestsRes.reason);
            }
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * 친구 요청 수락
     * @param {{ id: number, senderMemberId: number, nickname: string, avatarColor: string }} req
     */
    async function acceptFriendRequest(req) {
        try {
            await friendService.approveFriendRequest(req.id);

            // 목록에서 제거
            pendingRequests.value = pendingRequests.value.filter((r) => r.id !== req.id);

            // 친구 목록에 추가 (중복 방지)
            const alreadyExists = friends.value.some((f) => f.id === req.senderMemberId);
            if (!alreadyExists) {
                friends.value.unshift({
                    id: req.senderMemberId,
                    nickname: req.nickname,
                    avatarColor: req.avatarColor,
                    isOnline: false,
                    lastMessage: null,
                    unreadCount: 0,
                });
            }
        } catch (error) {
            console.error('❌ 친구 요청 수락 실패:', error);
            throw error;
        }
    }

    /**
     * 친구 요청 거절 (친구 삭제 API로 처리)
     * @param {{ id: number, senderMemberId: number }} req
     */
    async function declineFriendRequest(req) {
        try {
            // 거절은 백엔드 정책에 따름: 현재는 요청 송신자를 친구 삭제 방식으로 처리
            await friendService.deleteFriend(req.senderMemberId);
            pendingRequests.value = pendingRequests.value.filter((r) => r.id !== req.id);
        } catch (error) {
            console.error('❌ 친구 요청 거절 실패:', error);
            // 실패해도 UI에서만 제거
            pendingRequests.value = pendingRequests.value.filter((r) => r.id !== req.id);
        }
    }

    /**
     * 채팅창 열기: 채팅방 조회/생성 + 기존 메시지 로드
     * @param {Object} friend - 내 친구 목록 내 친구 객체
     * @param {number} myMemberId - 현재 로그인 유저의 memberId (isMine 판별용)
     */
    async function openChatRoom(friend, myMemberId) {
        // 이미 열려있으면 스킵
        const existing = openChats.value.find((c) => c.friend.id === friend.id);
        if (existing) {
            // 읽음 처리
            const f = friends.value.find((f) => f.id === friend.id);
            if (f) f.unreadCount = 0;
            return;
        }

        // 최대 3개 제한
        if (openChats.value.length >= 3) {
            openChats.value.shift();
        }

        const chatEntry = {
            friend,
            roomId: null,
            messages: [],
            isLoading: true,
        };
        openChats.value.push(chatEntry);

        try {
            // 1. 채팅방 조회 또는 생성
            const roomRes = await friendService.getOrCreateChatRoom(friend.id);
            const roomId = roomRes?.data?.chatRoomId ?? roomRes?.chatRoomId;
            chatEntry.roomId = roomId;

            // 2. 기존 메시지 로드
            if (roomId) {
                const msgRes = await friendService.getChatMessages(roomId);
                const rawMessages = msgRes?.data ?? msgRes ?? [];
                // 서버는 최신순으로 줄 수 있으므로 오래된 순 정렬
                chatEntry.messages = rawMessages
                    .map((m) => _mapMessage(m, myMemberId))
                    .sort((a, b) => a.timestamp - b.timestamp);
            }
        } catch (error) {
            console.error('❌ 채팅방 열기 실패:', error);
        } finally {
            chatEntry.isLoading = false;
        }

        // 읽음 처리
        const f = friends.value.find((f) => f.id === friend.id);
        if (f) f.unreadCount = 0;
    }

    /**
     * 채팅창 닫기 및 구독 해제
     * @param {number} friendId
     */
    function closeChatRoom(friendId) {
        openChats.value = openChats.value.filter((c) => c.friend.id !== friendId);
    }

    // ─── WebSocket Actions ────────────────────────────────────

    /**
     * 친구 채팅 WebSocket 연결
     * App.vue 의 onMounted (토큰 있을 때) 에서 호출
     */
    async function initSocket() {
        try {
            await connectFriendSocket();
        } catch (error) {
            // 연결 실패는 서비스 내부에서 로깅하므로 여기서는 조용히 처리
        }
    }

    /**
     * 친구 채팅 WebSocket 해제
     * 로그아웃 시 호출
     */
    function destroySocket() {
        disconnectFriendSocket();
    }

    /**
     * 메시지 전송 (WebSocket)
     * @param {number} friendId - 채팅창을 특정할 친구 ID
     * @param {string} text - 전송할 메시지 내용
     */
    function sendMessage(friendId, text) {
        const chat = openChats.value.find((c) => c.friend.id === friendId);
        if (!chat || !chat.roomId) {
            console.error('❌ 메시지 전송 실패: 채팅방 정보 없음');
            return;
        }

        if (!isFriendSocketConnected()) {
            console.error('❌ 메시지 전송 실패: WebSocket 미연결');
            throw new Error('채팅 서버와 연결되지 않았습니다.');
        }

        // WebSocket 발송
        wsSendMessage(chat.roomId, text);

        // 낙관적 UI 업데이트
        chat.messages.push({
            id: messageIdCounter.value++,
            text,
            isMine: true,
            timestamp: Date.now(),
        });

        // 친구 목록의 lastMessage 갱신
        const f = friends.value.find((f) => f.id === friendId);
        if (f) f.lastMessage = text;
    }

    /**
     * WebSocket 구독 콜백에서 호출: 수신된 메시지를 채팅창에 반영
     * STOMP 구독 구현 시 subscribeToChatRoom() 의 콜백으로 사용
     * @param {number} roomId - 수신된 채팅방 ID
     * @param {Object} rawMsg - 서버 메시지 객체
     * @param {number} myMemberId - 현재 로그인 유저 ID
     */
    function onMessageReceived(roomId, rawMsg, myMemberId) {
        const chat = openChats.value.find((c) => c.roomId === roomId);
        const msg = _mapMessage(rawMsg, myMemberId);

        if (chat) {
            // 낙관적 업데이트와 중복 방지
            const isDuplicate = chat.messages.some((m) => m.id === msg.id);
            if (!isDuplicate) {
                chat.messages.push(msg);
            }
        }

        // 채팅창이 열려있지 않으면 unreadCount 증가
        if (!chat) {
            const friend = friends.value.find(
                (f) => f.id === rawMsg.senderMemberId
            );
            if (friend) {
                friend.lastMessage = msg.text;
                friend.unreadCount = (friend.unreadCount || 0) + 1;
            }
        }
    }

    // ─── Panel / Modal State Actions ────────────────────────

    function togglePanel() {
        isPanelOpen.value = !isPanelOpen.value;
    }

    function closePanel() {
        isPanelOpen.value = false;
    }

    function openSearch() {
        isSearchOpen.value = true;
    }

    function closeSearch() {
        isSearchOpen.value = false;
    }

    // ─── Reset ───────────────────────────────────────────────

    function reset() {
        friends.value = [];
        pendingRequests.value = [];
        openChats.value = [];
        isPanelOpen.value = false;
        isSearchOpen.value = false;
        isLoading.value = false;
    }

    return {
        // State
        friends,
        pendingRequests,
        openChats,
        isPanelOpen,
        isSearchOpen,
        isLoading,
        // Getters
        hasAnyNotification,
        totalNotificationCount,
        // REST Actions
        loadInitialData,
        acceptFriendRequest,
        declineFriendRequest,
        openChatRoom,
        closeChatRoom,
        // WebSocket Actions
        initSocket,
        destroySocket,
        sendMessage,
        onMessageReceived,
        // Panel / Modal
        togglePanel,
        closePanel,
        openSearch,
        closeSearch,
        // Reset
        reset,
    };
});
