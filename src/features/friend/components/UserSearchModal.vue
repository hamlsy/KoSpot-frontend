<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
        <div class="user-search-modal" @click.stop>
          <!-- 헤더 -->
          <div class="modal-header">
            <div class="modal-title">
              <span class="title-bracket">[</span>
              사용자 검색
              <span class="title-bracket">]</span>
            </div>
            <button class="modal-close" @click="$emit('close')">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
              </svg>
            </button>
          </div>

          <!-- 검색 인풋 -->
          <div class="modal-search">
            <div class="input-wrapper">
              <span class="input-prefix">@</span>
              <input
                ref="searchInput"
                v-model="query"
                class="modal-input"
                placeholder="닉네임을 입력하세요"
                type="text"
                @input="onInput"
                @keyup.enter="search"
              />
              <button
                class="search-execute-btn"
                :class="{ loading: isSearching }"
                @click="search"
                :disabled="!query.trim() || isSearching"
              >
                <svg v-if="!isSearching" viewBox="0 0 24 24" fill="none">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
                </svg>
                <span v-else class="spinner"></span>
              </button>
            </div>
          </div>

          <!-- 결과 영역 -->
          <div class="results-area">
            <!-- 초기 상태 -->
            <div v-if="!hasSearched && !isSearching" class="hint-state">
              <div class="hint-grid">
                <span class="grid-char">◈</span>
                <span class="grid-char">◉</span>
                <span class="grid-char">◈</span>
              </div>
              <p>닉네임으로 친구를 찾아보세요</p>
            </div>

            <!-- 로딩 -->
            <div v-else-if="isSearching" class="loading-state">
              <div class="scan-line"></div>
              <p>검색 중...</p>
            </div>

            <!-- 결과 없음 -->
            <div v-else-if="searchResults.length === 0" class="no-result-state">
              <div class="no-result-icon">◌</div>
              <p><strong>{{ lastQuery }}</strong>을(를) 찾을 수 없어요</p>
            </div>

            <!-- 검색 결과 -->
            <TransitionGroup v-else name="result-list" tag="div" class="results-list">
              <div
                v-for="user in searchResults"
                :key="user.id"
                class="result-item"
              >
                <!-- 아바타 -->
                <div class="result-avatar" :style="{ background: user.avatarColor }">
                  {{ user.nickname[0].toUpperCase() }}
                </div>

                <!-- 유저 정보 -->
                <div class="result-info">
                  <span class="result-nickname">{{ user.nickname }}</span>
                  <span class="result-id">#{{ user.userId }}</span>
                </div>

                <!-- 친구 추가 버튼 -->
                <button
                  class="add-btn"
                  :class="{
                    sent: user.requestSent,
                    'already-friend': user.isFriend,
                  }"
                  :disabled="user.requestSent || user.isFriend"
                  @click="sendRequest(user)"
                >
                  <template v-if="user.isFriend">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                    </svg>
                    <span>친구</span>
                  </template>
                  <template v-else-if="user.requestSent">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="currentColor"/>
                    </svg>
                    <span>요청됨</span>
                  </template>
                  <template v-else>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                    </svg>
                    <span>추가</span>
                  </template>
                </button>
              </div>
            </TransitionGroup>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { apiClient } from '@/core/api/apiClient.js';
import friendService from '../services/friend.service.js';

export default {
  name: 'UserSearchModal',
  props: {
    isOpen: { type: Boolean, default: false },
  },
  emits: ['close'],
  data() {
    return {
      query: '',
      isSearching: false,
      hasSearched: false,
      lastQuery: '',
      searchResults: [],
      searchTimer: null,
    }
  },
  watch: {
    isOpen(val) {
      if (val) {
        this.$nextTick(() => {
          this.$refs.searchInput?.focus()
        })
        this.reset()
      }
    },
  },
  methods: {
    reset() {
      this.query = ''
      this.searchResults = []
      this.hasSearched = false
      this.isSearching = false
      clearTimeout(this.searchTimer)
    },
    onInput() {
      clearTimeout(this.searchTimer)
      if (this.query.trim().length >= 2) {
        this.searchTimer = setTimeout(() => this.search(), 500)
      }
    },
    async search() {
      if (!this.query.trim() || this.isSearching) return
      this.isSearching = true
      this.lastQuery = this.query.trim()

      try {
        // 닉네임으로 회원 검색 API 호출
        const response = await apiClient.get('/members/search', {
          params: { nickname: this.lastQuery },
        })
        const rawResults = response.data?.data ?? response.data ?? []
        this.searchResults = rawResults.map((u) => ({
          id: u.memberId ?? u.id,
          nickname: u.nickname,
          userId: u.loginId ?? String(u.memberId ?? u.id),
          avatarColor: u.profileImageUrl ?? this._colorFromNickname(u.nickname),
          isFriend: u.isFriend ?? false,
          requestSent: u.requestSent ?? false,
        }))
      } catch (error) {
        console.error('❌ 회원 검색 실패:', error)
        this.searchResults = []
      } finally {
        this.isSearching = false
        this.hasSearched = true
      }
    },
    async sendRequest(user) {
      if (user.requestSent || user.isFriend) return
      try {
        await friendService.sendFriendRequest(user.id)
        user.requestSent = true
      } catch (error) {
        console.error('❌ 친구 요청 전송 실패:', error)
      }
    },
    _colorFromNickname(nickname) {
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
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');

/* 오버레이 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 모달 */
.user-search-modal {
  width: 380px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  font-family: 'Noto Sans KR', sans-serif;
}

/* 헤더 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 14px;
}

.modal-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: 2px;
  text-transform: uppercase;
  display: flex;
  gap: 4px;
  align-items: center;
}

.title-bracket {
  color: var(--color-primary);
  opacity: 0.6;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.2s, background 0.2s;
}

.modal-close:hover { color: var(--color-error); background: var(--color-surface-hover); }
.modal-close svg { width: 16px; height: 16px; }

/* 검색 인풋 */
.modal-search {
  padding: 6px 16px 16px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
}

.input-prefix {
  padding: 0 6px 0 14px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  opacity: 0.6;
  pointer-events: none;
}

.modal-input {
  flex: 1;
  padding: 12px 8px;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  outline: none;
}

.modal-input::placeholder { color: var(--color-text-tertiary); }

.search-execute-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--color-background);
  border: none;
  border-left: 1px solid var(--color-border);
  cursor: pointer;
  color: var(--color-primary);
  transition: background 0.2s;
}

.search-execute-btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.search-execute-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.search-execute-btn svg { width: 18px; height: 18px; }

/* 스피너 */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* 결과 영역 */
.results-area {
  min-height: 140px;
  max-height: 280px;
  overflow-y: auto;
  padding: 0 10px 14px;
}

.results-area::-webkit-scrollbar { width: 3px; }
.results-area::-webkit-scrollbar-thumb {
  background: var(--color-border-dark);
  border-radius: 2px;
}

/* 힌트/로딩/빈 상태 */
.hint-state, .loading-state, .no-result-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 20px;
  gap: 10px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.hint-state p, .no-result-state p { margin: 0; }
.no-result-state strong { color: var(--color-text-primary); }

.hint-grid {
  display: flex;
  gap: 8px;
  font-size: 20px;
  color: var(--color-border-dark);
}

.no-result-icon { font-size: 28px; color: var(--color-border-dark); }

/* 스캔 라인 애니메이션 */
.scan-line {
  width: 120px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
  border-radius: 1px;
  animation: scan 1.2s ease-in-out infinite;
}

@keyframes scan {
  0% { transform: scaleX(0.2); opacity: 0.4; }
  50% { transform: scaleX(1); opacity: 1; }
  100% { transform: scaleX(0.2); opacity: 0.4; }
}

/* 검색 결과 */
.results-list { display: flex; flex-direction: column; gap: 4px; }

.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  transition: border-color 0.2s, background 0.2s;
}

.result-item:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-hover);
}

.result-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Rajdhani', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-nickname {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.result-id {
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  color: var(--color-text-tertiary);
  letter-spacing: 0.5px;
}

/* 추가 버튼 */
.add-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-primary);
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.2s, transform 0.15s;
  flex-shrink: 0;
}

.add-btn svg { width: 14px; height: 14px; }

.add-btn:hover:not(:disabled) {
  background: var(--color-surface-hover);
  transform: scale(1.02);
}

.add-btn.sent {
  background: var(--color-background);
  border-color: var(--color-warning);
  color: var(--color-warning);
  cursor: default;
}

.add-btn.already-friend {
  background: var(--color-background);
  border-color: var(--color-success);
  color: var(--color-success);
  cursor: default;
}

/* 결과 리스트 트랜지션 */
.result-list-enter-active { transition: all 0.2s ease; }
.result-list-enter-from { opacity: 0; transform: translateY(6px); }

/* 모달 트랜지션 */
.modal-fade-enter-active { animation: modal-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-fade-leave-active { animation: modal-out 0.18s ease forwards; }

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.94); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes modal-out {
  to { opacity: 0; transform: scale(0.96); }
}
</style>
