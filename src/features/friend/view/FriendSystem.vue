<template>
  <div class="friend-system-demo">
    <!-- 샘플 네비게이션 바 -->
    <nav class="demo-navbar">
      <div class="navbar-brand">
        <span class="brand-name">KoSpot</span>
      </div>
      <div class="navbar-actions">
        <!-- 친구 토글 버튼 -->
        <FriendToggleButton
          :is-open="isPanelOpen"
          :has-notification="hasAnyNotification"
          :notification-count="totalNotificationCount"
          @toggle="togglePanel"
        />
      </div>
    </nav>

    <!-- 친구 패널 -->
    <FriendPanel
      :is-open="isPanelOpen"
      :friends="friends"
      :pending-requests="pendingRequests"
      @close="isPanelOpen = false"
      @open-chat="openChat"
      @open-user-search="isSearchOpen = true"
      @accept-request="acceptRequest"
      @decline-request="declineRequest"
    />

    <!-- 사용자 검색 모달 -->
    <UserSearchModal
      :is-open="isSearchOpen"
      @close="isSearchOpen = false"
      @send-request="handleSendRequest"
    />

    <!-- 채팅 창들 -->
    <FriendChatWindow
      v-for="(chat, index) in openChats"
      :key="chat.friend.id"
      :is-open="true"
      :friend="chat.friend"
      :messages="chat.messages"
      :style="{ right: (20 + index * 320) + 'px' }"
      @close="closeChat(chat.friend.id)"
      @send-message="sendMessage"
    />

    <!-- 데모 컨트롤 (실제 앱에서는 제거) -->
    <div class="demo-controls">
      <h3>// 데모 컨트롤</h3>
      <button @click="simulateNewMessage">📨 새 메시지 시뮬레이션</button>
      <button @click="simulateFriendRequest">👤 친구 요청 시뮬레이션</button>
      <button @click="toggleFriendOnline">🔄 친구 온라인 토글</button>
    </div>
  </div>
</template>

<script>
import FriendToggleButton from '../components/FriendToggleButton.vue';
import FriendPanel from '../components/FriendPanel.vue';
import UserSearchModal from '../components/UserSearchModal.vue';
import FriendChatWindow from '../components/FriendChatWindow.vue';

export default {
  name: 'FriendSystem',
  components: { FriendToggleButton, FriendPanel, UserSearchModal, FriendChatWindow },
  data() {
    return {
      isPanelOpen: false,
      isSearchOpen: false,
      openChats: [], // { friend, messages }

      // 샘플 데이터
      friends: [
        {
          id: 1,
          nickname: '별빛여우',
          avatarColor: '#33fbe8',
          isOnline: true,
          lastMessage: '어디야? 같이 게임하자!',
          unreadCount: 3,
        },
        {
          id: 2,
          nickname: 'MapMaster',
          avatarColor: '#f59e0b',
          isOnline: true,
          lastMessage: null,
          unreadCount: 0,
        },
        {
          id: 3,
          nickname: '코스팟킹',
          avatarColor: '#10b981',
          isOnline: false,
          lastMessage: '나중에 다시 하자',
          unreadCount: 0,
        },
        {
          id: 4,
          nickname: 'SeoulWalker',
          avatarColor: '#8b5cf6',
          isOnline: false,
          lastMessage: null,
          unreadCount: 0,
        },
      ],

      pendingRequests: [
        {
          id: 101,
          nickname: '지도탐험가',
          avatarColor: '#ef4444',
        },
      ],

      messageCounter: 100,
    }
  },
  computed: {
    hasAnyNotification() {
      const hasUnread = this.friends.some(f => f.unreadCount > 0)
      const hasPending = this.pendingRequests.length > 0
      return hasUnread || hasPending
    },
    totalNotificationCount() {
      const unread = this.friends.reduce((sum, f) => sum + (f.unreadCount || 0), 0)
      const pending = this.pendingRequests.length
      return unread + pending
    },
  },
  methods: {
    togglePanel() {
      this.isPanelOpen = !this.isPanelOpen
    },

    openChat(friend) {
      const exists = this.openChats.find(c => c.friend.id === friend.id)
      if (!exists) {
        // 최대 3개 채팅창
        if (this.openChats.length >= 3) this.openChats.shift()
        this.openChats.push({
          friend,
          messages: [
            {
              id: this.messageCounter++,
              text: '안녕! 반가워 😊',
              isMine: false,
              timestamp: Date.now() - 300000,
            },
          ],
        })
      }
      // 읽음 처리
      const f = this.friends.find(f => f.id === friend.id)
      if (f) f.unreadCount = 0
    },

    closeChat(friendId) {
      this.openChats = this.openChats.filter(c => c.friend.id !== friendId)
    },

    sendMessage({ friendId, text }) {
      const chat = this.openChats.find(c => c.friend.id === friendId)
      if (!chat) return
      chat.messages.push({
        id: this.messageCounter++,
        text,
        isMine: true,
        timestamp: Date.now(),
      })
      // 샘플 자동 답장
      setTimeout(() => {
        chat.messages.push({
          id: this.messageCounter++,
          text: '응! 알겠어~',
          isMine: false,
          timestamp: Date.now(),
        })
      }, 1200)
    },

    acceptRequest(req) {
      this.pendingRequests = this.pendingRequests.filter(r => r.id !== req.id)
      this.friends.unshift({
        id: req.id,
        nickname: req.nickname,
        avatarColor: req.avatarColor,
        isOnline: true,
        lastMessage: null,
        unreadCount: 0,
      })
    },

    declineRequest(req) {
      this.pendingRequests = this.pendingRequests.filter(r => r.id !== req.id)
    },

    handleSendRequest(user) {
      console.log('친구 요청 전송:', user)
    },

    // 데모 시뮬레이션
    simulateNewMessage() {
      const onlineFriends = this.friends.filter(f => f.isOnline)
      if (onlineFriends.length === 0) return
      const friend = onlineFriends[Math.floor(Math.random() * onlineFriends.length)]
      friend.lastMessage = '야! 지금 어디야?'
      friend.unreadCount = (friend.unreadCount || 0) + 1

      // 열려있는 채팅에 추가
      const chat = this.openChats.find(c => c.friend.id === friend.id)
      if (chat) {
        chat.messages.push({
          id: this.messageCounter++,
          text: '야! 지금 어디야?',
          isMine: false,
          timestamp: Date.now(),
        })
        friend.unreadCount = 0
      }
    },

    simulateFriendRequest() {
      const names = ['코스팟팬', '맵마스터99', '서울여행자']
      const colors = ['#3b82f6', '#ec4899', '#14b8a6']
      const i = this.pendingRequests.length % 3
      this.pendingRequests.push({
        id: Date.now(),
        nickname: names[i],
        avatarColor: colors[i],
      })
    },

    toggleFriendOnline() {
      const friend = this.friends[Math.floor(Math.random() * this.friends.length)]
      friend.isOnline = !friend.isOnline
    },
  },
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--color-background);
  min-height: 100vh;
  font-family: 'Noto Sans KR', sans-serif;
}
</style>

<style scoped>
.friend-system-demo {
  min-height: 100vh;
  background: var(--color-background);
}

/* 데모 네비게이션 바 */
.demo-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 900;
}

.navbar-brand {
  display: flex;
  align-items: center;
}

.brand-name {
  font-family: 'Rajdhani', sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--color-primary);
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 데모 컨트롤 */
.demo-controls {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 500;
  box-shadow: var(--shadow-md);
}

.demo-controls h3 {
  margin: 0 0 4px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  letter-spacing: 1px;
}

.demo-controls button {
  padding: 7px 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.demo-controls button:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-primary);
  color: var(--color-text-primary);
}
</style>
