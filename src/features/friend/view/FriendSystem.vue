<template>
  <div>
    <!-- 친구 토글 버튼은 NavigationBar 등 외부에서 직접 렌더링 -->

    <!-- 친구 패널 -->
    <FriendPanel
      :is-open="friendStore.isPanelOpen"
      :friends="friendStore.friends"
      :pending-requests="friendStore.pendingRequests"
      @close="friendStore.closePanel"
      @open-chat="handleOpenChat"
      @open-user-search="friendStore.openSearch"
      @accept-request="friendStore.acceptFriendRequest"
      @decline-request="friendStore.declineFriendRequest"
    />

    <!-- 사용자 검색 모달 -->
    <UserSearchModal
      :is-open="friendStore.isSearchOpen"
      @close="friendStore.closeSearch"
    />

    <!-- 채팅 창들 (최대 3개) -->
    <FriendChatWindow
      v-for="(chat, index) in friendStore.openChats"
      :key="chat.friend.id"
      :is-open="true"
      :friend="chat.friend"
      :messages="chat.messages"
      :is-loading="chat.isLoading"
      :style="{ right: (20 + index * 320) + 'px' }"
      @close="friendStore.closeChatRoom(chat.friend.id)"
      @send-message="handleSendMessage"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useFriendStore } from '../stores/friend.store.js';
import FriendPanel from '../components/FriendPanel.vue';
import UserSearchModal from '../components/UserSearchModal.vue';
import FriendChatWindow from '../components/FriendChatWindow.vue';

const friendStore = useFriendStore();

/**
 * 내 memberId를 가져오는 헬퍼
 * (로그인 정보 저장 방식에 따라 필요 시 수정)
 */
function getMyMemberId() {
  try {
    const raw = localStorage.getItem('memberInfo');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.memberId ?? parsed.id ?? null;
    }
  } catch {
    // Ignore
  }
  return null;
}

/**
 * FriendPanel의 @open-chat 이벤트 처리
 */
async function handleOpenChat(friend) {
  const myId = getMyMemberId();
  await friendStore.openChatRoom(friend, myId);
}

/**
 * FriendChatWindow의 @send-message 이벤트 처리
 * payload: { friendId, text }
 */
function handleSendMessage({ friendId, text }) {
  friendStore.sendMessage(friendId, text);
}

onMounted(async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return;

  // 초기 데이터 로드 (친구 목록 + 받은 요청)
  await friendStore.loadInitialData();

  // 채팅 WebSocket 연결
  await friendStore.initSocket();
});
</script>
