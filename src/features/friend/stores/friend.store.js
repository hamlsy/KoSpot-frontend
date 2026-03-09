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
    subscribeToChatRoom,
    unsubscribeFromChatRoom,
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

    /** z-index 포커스 카운터 (창 클릭 시 해당 창을 최상단으로 올리기 위한 단조 증가 카운터) */
    const zIndexCounter = ref(1100);

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
            markerImageUrl: raw.equippedMarkerImageUrl ?? raw.markerImageUrl ?? null,
            isOnline: raw.online ?? raw.isOnline ?? false,
            lastMessage: raw.lastMessage ?? null,
            unreadCount: raw.unreadCount ?? 0,
            rankTier: raw.roadViewRankTier ?? null,
            rankLevel: raw.roadViewRankLevel ?? null,
            ratingScore: raw.roadViewRatingScore ?? raw.roadViewRankScore ?? raw.ratingScore ?? raw.score ?? raw.rankInfo?.roadView?.ratingScore ?? 0,
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
            isMine: String(raw.senderMemberId) === String(myMemberId) || raw.isMine === true,
            // 필드명: 서버는 createdAt 사용. sentAt이 없으면 createdAt 시도, 그도 없으면 Date.now()
            timestamp: raw.createdAt
                ? new Date(raw.createdAt).getTime()
                : raw.sentAt
                    ? new Date(raw.sentAt).getTime()
                    : Date.now(),
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
                let rawFriends = friendsRes.value;
                if (rawFriends && !Array.isArray(rawFriends) && rawFriends.result) {
                    rawFriends = rawFriends.result;
                } else if (rawFriends && !Array.isArray(rawFriends) && rawFriends.data) {
                    rawFriends = rawFriends.data;
                }
                const resultArr = Array.isArray(rawFriends) ? rawFriends : [];
                friends.value = resultArr.map(_mapFriend);
            } else {
                console.error('❌ 친구 목록 로드 실패:', friendsRes.reason);
            }

            if (requestsRes.status === 'fulfilled') {
                let rawRequests = requestsRes.value;
                if (rawRequests && !Array.isArray(rawRequests) && rawRequests.result) {
                    rawRequests = rawRequests.result;
                } else if (rawRequests && !Array.isArray(rawRequests) && rawRequests.data) {
                    rawRequests = rawRequests.data;
                }
                const resultArr = Array.isArray(rawRequests) ? rawRequests : [];
                pendingRequests.value = resultArr.map((r) => ({
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
     * 친구 요청 거절
     * @param {{ id: number, senderMemberId: number }} req
     */
    async function declineFriendRequest(req) {
        try {
            await friendService.rejectFriendRequest(req.id);
            pendingRequests.value = pendingRequests.value.filter((r) => r.id !== req.id);
        } catch (error) {
            console.error('❌ 친구 요청 거절 실패:', error);
            // 실패해도 UI에서만 제거
            pendingRequests.value = pendingRequests.value.filter((r) => r.id !== req.id);
        }
    }

    /**
     * 친구 삭제
     * @param {number} friendId - 삭제할 친구의 memberId
     */
    async function deleteFriend(friendId) {
        try {
            await friendService.deleteFriend(friendId);
        } catch (error) {
            console.error('❌ 친구 삭제 실패:', error);
        } finally {
            // 성공/실패 무관하게 로컬 상태에서 제거
            friends.value = friends.value.filter((f) => f.id !== friendId);
            closeChatRoom(friendId);
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
            zIndex: ++zIndexCounter.value,
        };
        openChats.value.push(chatEntry);

        try {
            // 1. 채팅방 조회 또는 생성
            const roomRes = await friendService.getOrCreateChatRoom(friend.id);
            let roomId = null;
            if (roomRes?.result?.roomId) roomId = roomRes.result.roomId;
            else if (roomRes?.roomId) roomId = roomRes.roomId;
            else if (roomRes?.result?.chatRoomId) roomId = roomRes.result.chatRoomId;
            else roomId = roomRes?.data?.chatRoomId ?? roomRes?.chatRoomId;

            // 2. 기존 메시지 로드
            let loadedMessages = [];
            if (roomId) {
                const msgRes = await friendService.getChatMessages(roomId);
                let rawMessages = msgRes;
                if (rawMessages && !Array.isArray(rawMessages) && rawMessages.result) {
                    rawMessages = rawMessages.result;
                } else if (rawMessages && !Array.isArray(rawMessages) && rawMessages.data) {
                    rawMessages = rawMessages.data;
                }
                const msgArr = Array.isArray(rawMessages) ? rawMessages : [];

                // 서버는 최신순으로 줄 수 있으므로 오래된 순 정렬
                loadedMessages = msgArr
                    .map((m) => _mapMessage(m, myMemberId))
                    .sort((a, b) => a.timestamp - b.timestamp);
            }

            // Pinia 반응형 보장: 인덱스로 찾아서 직접 할당
            const idx = openChats.value.findIndex((c) => c.friend.id === friend.id);
            if (idx !== -1) {
                if (roomId) openChats.value[idx].roomId = roomId;
                openChats.value[idx].messages = loadedMessages;
                openChats.value[idx].isLoading = false;
            }

            // 3. STOMP 채팅방 구독
            if (roomId) {
                let resolvedMyId = myMemberId;
                if (!resolvedMyId) {
                    try {
                        const directMemberId = localStorage.getItem('memberId');
                        if (directMemberId) {
                            resolvedMyId = directMemberId;
                        } else {
                            const raw = localStorage.getItem('memberInfo');
                            if (raw) {
                                const parsed = JSON.parse(raw);
                                resolvedMyId = parsed.memberId ?? parsed.id ?? null;
                            }
                        }
                    } catch (_) { /* Ignore */ }
                }
                subscribeToChatRoom(roomId, (rawMsg) => {
                    onMessageReceived(roomId, rawMsg, resolvedMyId);
                });
            }
        } catch (error) {
            console.error('❌ 채팅방 열기 실패:', error);
            // 실패 시에도 isLoading 해제
            const idx = openChats.value.findIndex((c) => c.friend.id === friend.id);
            if (idx !== -1) openChats.value[idx].isLoading = false;
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
        const chat = openChats.value.find((c) => c.friend.id === friendId);
        // 🔑 채팅창을 닫을 때 해당 채팅방의 STOMP 구독 해제
        if (chat?.roomId) {
            unsubscribeFromChatRoom(chat.roomId);
        }
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

    /**
     * 채팅창 포커스 (클릭한 창을 z-index 최상단으로)
     * @param {number} friendId
     */
    function bringToFront(friendId) {
        const chat = openChats.value.find((c) => c.friend.id === friendId);
        if (chat) {
            chat.zIndex = ++zIndexCounter.value;
        }
    }

    function togglePanel() {
        isPanelOpen.value = !isPanelOpen.value;
    }

    function openPanel() {
        isPanelOpen.value = true;
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
        deleteFriend,
        openChatRoom,
        closeChatRoom,
        bringToFront,
        // WebSocket Actions
        initSocket,
        destroySocket,
        sendMessage,
        onMessageReceived,
        // Panel / Modal
        togglePanel,
        openPanel,
        closePanel,
        openSearch,
        closeSearch,
        // Reset
        reset,
    };
});
