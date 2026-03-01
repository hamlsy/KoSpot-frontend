<template>
  <Transition name="panel-slide">
    <div v-if="isOpen" class="friend-panel" @click.stop>
      <!-- 헤더 -->
      <div class="panel-header">
        <div class="header-title">
          <span class="title-accent">//</span>
          <span class="title-text">친구</span>
          <span class="friend-count">{{ friends.length }}</span>
        </div>
        <div class="header-actions">
          <!-- 친구 추가 버튼 -->
          <button class="action-btn add-friend-btn" @click="openUserSearch" title="친구 추가">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
            </svg>
          </button>
          <!-- 닫기 버튼 -->
          <button class="action-btn close-btn" @click="$emit('close')" title="닫기">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 친구 검색 인풋 -->
      <div class="search-section">
        <div class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
          </svg>
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="친구 검색..."
            type="text"
          />
          <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 친구 요청 알림 -->
      <div v-if="pendingRequests.length > 0" class="requests-section">
        <div class="section-label">
          <span class="label-dot request-dot"></span>
          친구 요청
          <span class="request-badge">{{ pendingRequests.length }}</span>
        </div>
        <div
          v-for="req in pendingRequests"
          :key="req.id"
          class="request-item"
        >
          <div class="avatar" :style="{ background: req.avatarColor }">
            {{ req.nickname[0].toUpperCase() }}
          </div>
          <div class="request-info">
            <span class="req-nickname">{{ req.nickname }}</span>
          </div>
          <div class="request-actions">
            <button class="req-accept-btn" @click="acceptRequest(req)" title="수락">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
              </svg>
            </button>
            <button class="req-decline-btn" @click="declineRequest(req)" title="거절">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 친구 목록 -->
      <div class="friends-section">
        <div v-if="filteredFriends.length > 0" class="section-label">
          <span class="label-dot online-dot"></span>
          친구 목록
        </div>

        <div v-if="filteredFriends.length === 0" class="empty-state">
          <div class="empty-icon">◈</div>
          <p>{{ searchQuery ? '검색 결과가 없어요' : '아직 친구가 없어요' }}</p>
        </div>

        <TransitionGroup name="friend-list" tag="div" class="friends-list">
          <div
            v-for="friend in filteredFriends"
            :key="friend.id"
            class="friend-item"
            :class="{ 'is-online': friend.isOnline }"
            @click="openChat(friend)"
          >
            <!-- 아바타 -->
            <div class="friend-avatar-wrap">
              <div class="avatar" :style="{ background: friend.avatarColor }">
                {{ friend.nickname[0].toUpperCase() }}
              </div>
              <span class="online-indicator" :class="{ online: friend.isOnline }"></span>
            </div>

            <!-- 정보 -->
            <div class="friend-info">
              <span class="friend-nickname">{{ friend.nickname }}</span>
              <span v-if="friend.lastMessage" class="friend-last-msg">{{ friend.lastMessage }}</span>
              <span v-else class="friend-status">{{ friend.isOnline ? '온라인' : '오프라인' }}</span>
            </div>

            <!-- 안읽은 채팅 뱃지 -->
            <div v-if="friend.unreadCount > 0" class="unread-badge">
              {{ friend.unreadCount > 99 ? '99+' : friend.unreadCount }}
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </Transition>
</template>

<script>
export default {
  name: 'FriendPanel',
  props: {
    isOpen: { type: Boolean, default: false },
    friends: { type: Array, default: () => [] },
    pendingRequests: { type: Array, default: () => [] },
  },
  emits: ['close', 'open-chat', 'open-user-search', 'accept-request', 'decline-request'],
  data() {
    return {
      searchQuery: '',
    }
  },
  computed: {
    filteredFriends() {
      if (!this.searchQuery.trim()) return this.friends
      const q = this.searchQuery.toLowerCase()
      return this.friends.filter(f => f.nickname.toLowerCase().includes(q))
    },
  },
  methods: {
    openChat(friend) {
      this.$emit('open-chat', friend)
    },
    openUserSearch() {
      this.$emit('open-user-search')
    },
    acceptRequest(req) {
      this.$emit('accept-request', req)
    },
    declineRequest(req) {
      this.$emit('decline-request', req)
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');

/* 패널 컨테이너 */
.friend-panel {
  position: fixed;
  top: 64px;
  right: 16px;
  width: 300px;
  max-height: calc(100vh - 80px);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  font-family: 'Noto Sans KR', sans-serif;
}

/* 헤더 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--color-border);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.title-accent {
  font-family: 'Rajdhani', sans-serif;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 700;
  opacity: 0.7;
  letter-spacing: -1px;
}

.title-text {
  font-family: 'Rajdhani', sans-serif;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.friend-count {
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  padding: 1px 6px;
  border-radius: 10px;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.2s, background 0.2s;
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.add-friend-btn:hover {
  color: var(--color-primary);
  background: var(--color-surface-hover);
}

.close-btn:hover {
  color: var(--color-error);
  background: var(--color-surface-hover);
}

/* 검색 */
.search-section {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-light);
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  width: 14px;
  height: 14px;
  color: var(--color-text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 10px 8px 32px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.search-input:focus {
  border-color: var(--color-primary);
  background: var(--color-surface);
}

.clear-btn {
  position: absolute;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  border-radius: 50%;
}

.clear-btn svg { width: 12px; height: 12px; }
.clear-btn:hover { color: var(--color-text-primary); }

/* 섹션 라벨 */
.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px 6px;
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-secondary);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-family: 'Rajdhani', sans-serif;
}

.label-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.online-dot { background: var(--color-success); box-shadow: 0 0 4px var(--color-success); }
.request-dot { background: var(--color-warning); box-shadow: 0 0 4px var(--color-warning); animation: pulse-dot 2s infinite; }

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.request-badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  color: #ffffff;
  background: var(--color-warning);
  padding: 1px 5px;
  border-radius: 8px;
}

/* 친구 요청 */
.requests-section {
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: 6px;
}

.request-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: var(--color-background);
  border-left: 2px solid var(--color-warning);
  margin: 2px 8px;
  border-radius: 0 6px 6px 0;
}

.request-info {
  flex: 1;
  min-width: 0;
}

.req-nickname {
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.request-actions {
  display: flex;
  gap: 4px;
}

.req-accept-btn, .req-decline-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}

.req-accept-btn {
  background: var(--color-background);
  color: var(--color-success);
}

.req-accept-btn:hover {
  background: var(--color-surface-hover);
  transform: scale(1.05);
}

.req-decline-btn {
  background: var(--color-background);
  color: var(--color-error);
}

.req-decline-btn:hover {
  background: var(--color-surface-hover);
  transform: scale(1.05);
}

.req-accept-btn svg, .req-decline-btn svg {
  width: 14px;
  height: 14px;
}

/* 친구 목록 */
.friends-section {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8px;
}

.friends-section::-webkit-scrollbar {
  width: 3px;
}

.friends-section::-webkit-scrollbar-thumb {
  background: var(--color-border-dark);
  border-radius: 2px;
}

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 8px;
}

/* 친구 아이템 */
.friend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
  position: relative;
}

.friend-item:hover {
  background: var(--color-surface-hover);
}

.friend-item:hover .friend-nickname {
  color: var(--color-primary);
}

.friend-item.is-online .friend-nickname {
  color: var(--color-text-primary);
}

/* 아바타 */
.friend-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Rajdhani', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--color-surface);
  background: var(--color-text-tertiary);
  transition: background 0.3s;
}

.online-indicator.online {
  background: var(--color-success);
}

/* 친구 정보 */
.friend-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.friend-nickname {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-last-msg {
  font-size: 11px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-status {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* 안읽은 메시지 뱃지 */
.unread-badge {
  flex-shrink: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--color-primary);
  color: #ffffff;
  font-family: 'Rajdhani', sans-serif;
  font-size: 10px;
  font-weight: 700;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: badge-appear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes badge-appear {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  gap: 8px;
  color: var(--color-text-tertiary);
}

.empty-icon {
  font-size: 28px;
  color: var(--color-border);
}

.empty-state p {
  font-size: 13px;
  margin: 0;
}

/* 패널 트랜지션 */
.panel-slide-enter-active {
  animation: panel-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.panel-slide-leave-active {
  animation: panel-out 0.2s ease forwards;
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes panel-out {
  to {
    opacity: 0;
    transform: translateY(-8px) scale(0.97);
  }
}

/* 친구 목록 트랜지션 */
.friend-list-enter-active {
  transition: all 0.2s ease;
}

.friend-list-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
