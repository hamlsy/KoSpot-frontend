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
          <!-- 새로고침 버튼 -->
          <button 
            class="action-btn refresh-btn" 
            :class="{ 'is-loading': isRefreshing }"
            :disabled="isRefreshing"
            @click="refreshFriends" 
            title="새로고침"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
          <button class="action-btn add-friend-btn" @click="openUserSearch" title="친구 추가">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
            </svg>
          </button>
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
          <!-- 요청자 아바타 -->
          <div class="avatar-wrap">
            <img
              v-if="req.avatarColor && req.avatarColor.startsWith('http')"
              :src="req.avatarColor"
              class="avatar avatar-img"
              :alt="req.nickname"
              @error="onImgError($event)"
            />
            <div v-else class="avatar avatar-initial" :style="{ background: generateColor(req.nickname) }">
              {{ req.nickname[0].toUpperCase() }}
            </div>
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
            @click="handleFriendClick(friend)"
          >
            <!-- 아바타 -->
            <div class="friend-avatar-wrap">
              <img
                v-if="friend.markerImageUrl"
                :src="friend.markerImageUrl"
                class="avatar avatar-img"
                :alt="friend.nickname"
                @error="onImgError($event)"
              />
              <div v-else class="avatar avatar-initial" :style="{ background: generateColor(friend.nickname) }">
                {{ friend.nickname[0].toUpperCase() }}
              </div>
              <span class="online-indicator" :class="{ online: friend.isOnline }"></span>
            </div>

            <!-- 정보 -->
            <div class="friend-info">
              <div class="friend-name-row">
                <span class="friend-nickname">{{ friend.nickname }}</span>
                <span
                  v-if="friend.rankTier"
                  class="rank-badge"
                  :class="`rank-${friend.rankTier.toLowerCase()}`"
                >{{ friend.ratingScore }} RP</span>
              </div>
              <span v-if="friend.lastMessage" class="friend-last-msg">{{ friend.lastMessage }}</span>
              <span v-else class="friend-status">{{ friend.isOnline ? '온라인' : '오프라인' }}</span>
            </div>

            <!-- 안읽은 채팅 뱃지 -->
            <div v-if="friend.unreadCount > 0 && confirmDeleteId !== friend.id" class="unread-badge">
              {{ friend.unreadCount > 99 ? '99+' : friend.unreadCount }}
            </div>

            <!-- 삭제 확인 UI -->
            <div v-if="confirmDeleteId === friend.id" class="delete-confirm" @click.stop>
              <span class="delete-confirm-text">삭제</span>
              <button class="confirm-yes-btn" @click.stop="confirmDelete(friend)" title="삭제 확인">
                <svg viewBox="0 0 24 24" fill="none"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
              </button>
              <button class="confirm-no-btn" @click.stop="cancelDelete" title="취소">
                <svg viewBox="0 0 24 24" fill="none"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
              </button>
            </div>

            <!-- 삭제 버튼 (호버 시) -->
            <button
              v-else
              class="delete-btn"
              :title="`${friend.nickname} 삭제`"
              @click.stop="requestDelete(friend)"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </Transition>
</template>

<script>
import { useFriendStore } from '@/features/friend/stores/friend.store.js';

const RANK_LABELS = {
  BRONZE: '브론즈',
  SILVER: '실버',
  GOLD: '골드',
  PLATINUM: '플래티넘',
  DIAMOND: '다이아',
  MASTER: '마스터',
  GRANDMASTER: '그랜드마스터',
  CHALLENGER: '챌린저',
};

export default {
  name: 'FriendPanel',
  props: {
    isOpen: { type: Boolean, default: false },
    friends: { type: Array, default: () => [] },
    pendingRequests: { type: Array, default: () => [] },
  },
  emits: ['close', 'open-chat', 'open-user-search', 'accept-request', 'decline-request', 'delete-friend'],
  data() {
    return {
      searchQuery: '',
      confirmDeleteId: null,
      RANK_LABELS,
      isRefreshing: false,
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
    generateColor(nickname) {
      const palette = [
        '#33fbe8', '#f59e0b', '#10b981', '#8b5cf6',
        '#ef4444', '#3b82f6', '#ec4899', '#14b8a6',
      ]
      let hash = 0
      for (let i = 0; i < (nickname?.length ?? 0); i++) {
        hash = (hash * 31 + nickname.charCodeAt(i)) % palette.length
      }
      return palette[Math.abs(hash)]
    },
    onImgError(event) {
      // 이미지 로드 실패 시 img를 숨기고 부모가 폴백을 표시하도록
      event.target.style.display = 'none'
      const wrap = event.target.closest('.friend-avatar-wrap, .avatar-wrap')
      if (wrap) {
        const fallback = wrap.querySelector('.avatar-fallback')
        if (fallback) fallback.style.display = 'flex'
      }
    },
    handleFriendClick(friend) {
      if (this.confirmDeleteId === friend.id) return
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
    requestDelete(friend) {
      this.confirmDeleteId = friend.id
    },
    cancelDelete() {
      this.confirmDeleteId = null
    },
    confirmDelete(friend) {
      this.$emit('delete-friend', friend)
      this.confirmDeleteId = null
    },
    onClickOutside(event) {
      if (!this.isOpen) return;
      
      // 패널 내부 클릭 방어 (템플릿에 @click.stop이 있지만 안전장치)
      if (event.target.closest('.friend-panel')) return;
      // 친구 토글 버튼 클릭 방어
      if (event.target.closest('.friend-toggle-btn') || event.target.closest('.friend-toggle-button')) return;
      // 친구 채팅창 내부 클릭 방어
      if (event.target.closest('.chat-window')) return;
      // 유저 검색 모달 클릭 방어
      if (event.target.closest('.user-search-modal') || event.target.closest('.modal-overlay')) return;

      this.$emit('close');
    },
    async refreshFriends() {
      if (this.isRefreshing) return;
      
      this.isRefreshing = true;
      try {
        const store = useFriendStore();
        await store.loadInitialData();
      } catch (error) {
        console.error('친구 리스트 새로고침에 실패했습니다', error);
      } finally {
        setTimeout(() => {
          this.isRefreshing = false;
        }, 1000);
      }
    },
  },
  mounted() {
    document.addEventListener('click', this.onClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onClickOutside);
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

.action-btn svg { width: 18px; height: 18px; }

.refresh-btn:hover {
  color: var(--color-primary);
  background: var(--color-surface-hover);
}

.refresh-btn.is-loading svg {
  animation: rotate-cw 1s linear infinite;
  opacity: 0.6;
}

@keyframes rotate-cw {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

.search-input::placeholder { color: var(--color-text-tertiary); }
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

.req-accept-btn { background: var(--color-background); color: var(--color-success); }
.req-accept-btn:hover { background: var(--color-surface-hover); transform: scale(1.05); }
.req-decline-btn { background: var(--color-background); color: var(--color-error); }
.req-decline-btn:hover { background: var(--color-surface-hover); transform: scale(1.05); }
.req-accept-btn svg, .req-decline-btn svg { width: 14px; height: 14px; }

/* 아바타 공통 */
.avatar-wrap,
.friend-avatar-wrap {
  position: relative;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.avatar-img {
  object-fit: cover;
  border: 1.5px solid var(--color-border);
  background: var(--color-background);
}

.avatar-initial {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Rajdhani', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
}

/* 온라인 인디케이터 */
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

.online-indicator.online { background: var(--color-success); }

/* 친구 목록 */
.friends-section {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8px;
}

.friends-section::-webkit-scrollbar { width: 3px; }
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
  padding: 8px 8px;
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

.friend-item:hover .delete-btn {
  opacity: 1;
}

/* 친구 정보 */
.friend-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.friend-name-row {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
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

.friend-item.is-online .friend-nickname {
  color: var(--color-text-primary);
}

/* 랭크 배지 */
.rank-badge {
  flex-shrink: 0;
  font-family: 'Rajdhani', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 1px 5px;
  border-radius: 4px;
  text-transform: uppercase;
  border: 1px solid currentColor;
  opacity: 0.85;
}

.rank-bronze  { color: #cd7f32; background: rgba(205, 127, 50, 0.1); }
.rank-silver  { color: #a8a9ad; background: rgba(168, 169, 173, 0.1); }
.rank-gold    { color: #ffd700; background: rgba(255, 215, 0, 0.1); }
.rank-platinum { color: #13c8b6; background: rgba(19, 200, 182, 0.1); }
.rank-diamond { color: #5eb7f5; background: rgba(94, 183, 245, 0.1); }
.rank-master  { color: #c084fc; background: rgba(192, 132, 252, 0.1); }
.rank-grandmaster { color: #f87171; background: rgba(248, 113, 113, 0.1); }
.rank-challenger { color: #33fbe8; background: rgba(51, 251, 232, 0.1); }

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

/* 삭제 버튼 */
.delete-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-tertiary);
  opacity: 0;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
}

.delete-btn svg { width: 14px; height: 14px; }

.delete-btn:hover {
  color: var(--color-error);
  background: var(--color-surface-hover);
}

/* 삭제 확인 UI */
.delete-confirm {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  animation: confirm-appear 0.15s ease;
}

@keyframes confirm-appear {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.delete-confirm-text {
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-error);
  letter-spacing: 0.5px;
}

.confirm-yes-btn, .confirm-no-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.confirm-yes-btn {
  background: rgba(239, 68, 68, 0.15);
  color: var(--color-error);
}

.confirm-yes-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  transform: scale(1.05);
}

.confirm-no-btn {
  background: var(--color-background);
  color: var(--color-text-tertiary);
}

.confirm-no-btn:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.confirm-yes-btn svg,
.confirm-no-btn svg { width: 12px; height: 12px; }

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
  from { opacity: 0; transform: translateY(-12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes panel-out {
  to { opacity: 0; transform: translateY(-8px) scale(0.97); }
}

/* 친구 목록 트랜지션 */
.friend-list-enter-active { transition: all 0.2s ease; }
.friend-list-enter-from { opacity: 0; transform: translateX(-8px); }
.friend-list-leave-active { transition: all 0.15s ease; }
.friend-list-leave-to { opacity: 0; transform: translateX(8px); }
</style>
