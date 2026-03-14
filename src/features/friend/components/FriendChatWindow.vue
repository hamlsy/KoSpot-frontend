<template>
  <Transition name="chat-slide">
    <div
      v-if="isOpen && friend"
      ref="windowRef"
      class="chat-window"
      :class="{ minimized: isMinimized, 'is-dragging': isDragging }"
      :style="windowStyle"
      @pointerdown.self.stop="onWindowFocus"
    >
      <!-- 헤더 (드래그 핸들) -->
      <div
        class="chat-header"
        v-bind="dragHandleListeners"
        @click="onHeaderClick"
      >
        <div class="chat-header-left">
          <div class="chat-avatar-wrap">
            <img
              v-if="friend.markerImageUrl"
              :src="friend.markerImageUrl"
              class="chat-avatar-img"
              :alt="friend.nickname"
            />
            <div v-else class="chat-avatar" :style="{ background: friend.avatarColor }">
              {{ friend.nickname[0].toUpperCase() }}
            </div>
            <span class="chat-online-dot" :class="{ online: friend.isOnline }"></span>
          </div>
          <div class="chat-friend-info">
            <span class="chat-friend-name">{{ friend.nickname }}</span>
            <span class="chat-friend-status">{{ friend.isOnline ? '온라인' : '오프라인' }}</span>
          </div>
        </div>
        <div class="chat-header-actions" @click.stop @pointerdown.stop>
          <button
            class="chat-action-btn"
            @click="isMinimized = !isMinimized"
            :title="isMinimized ? '펼치기' : '접기'"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path v-if="isMinimized" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" fill="currentColor"/>
              <path v-else d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" fill="currentColor"/>
            </svg>
          </button>
          <button class="chat-action-btn close-chat-btn" @click="$emit('close')" title="닫기">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 채팅 본문 (접힘/펼침) -->
      <div v-show="!isMinimized" class="chat-body">
        <!-- 메시지 목록 -->
        <div ref="messageList" class="messages-list" @scroll="onScroll">
          <!-- 채팅 기록 로딩 중 -->
          <div v-if="isLoading" class="chat-loading">
            <span class="chat-loading-spinner"></span>
            <p>대화 기록을 불러오는 중...</p>
          </div>

          <div v-else-if="messages.length === 0" class="chat-empty">
            <span class="chat-empty-icon">◈</span>
            <p>{{ friend.nickname }}님과 대화를 시작해보세요</p>
          </div>

          <template v-for="(msg, i) in messages" :key="msg.id">
            <!-- 날짜 구분선 -->
            <div v-if="shouldShowDateSeparator(i)" class="chat-date-separator">
              <span>{{ formatDateSeparator(msg.timestamp) }}</span>
            </div>

            <div
              class="message-item"
              :class="{
                'is-mine': msg.isMine,
                'show-avatar': shouldShowAvatar(i),
              }"
            >
            <!-- 상대방 메시지 -->
            <template v-if="!msg.isMine">
              <template v-if="shouldShowAvatar(i)">
                <img
                  v-if="friend.markerImageUrl"
                  :src="friend.markerImageUrl"
                  class="msg-avatar-img"
                  :alt="friend.nickname"
                />
                <div v-else class="msg-avatar" :style="{ background: friend.avatarColor }">
                  {{ friend.nickname[0].toUpperCase() }}
                </div>
              </template>
              <div v-else class="msg-avatar-spacer"></div>
              <div class="msg-bubble other-bubble">
                <p class="msg-text">{{ msg.text }}</p>
                <span v-if="shouldShowTime(i)" class="msg-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
            </template>

            <!-- 내 메시지 -->
            <template v-else>
              <div class="msg-bubble my-bubble">
                <p class="msg-text">{{ msg.text }}</p>
                <span v-if="shouldShowTime(i)" class="msg-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
            </template>
            </div>
          </template>
        </div>

        <!-- 맨 아래로 이동 버튼 -->
        <Transition name="scroll-down-fade">
          <button
            v-if="!isAtBottom"
            class="scroll-to-bottom-btn"
            @click="scrollToBottomManual"
            title="최신 메시지로 이동"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" fill="currentColor"/>
            </svg>
          </button>
        </Transition>

        <!-- 입력창 -->
        <div class="chat-input-area">
          <div class="chat-input-wrapper">
            <textarea
              v-model="inputText"
              class="chat-textarea"
              placeholder="메시지를 입력하세요..."
              rows="1"
              @keydown.enter.prevent="sendMessage"
              @input="autoResize"
              ref="textarea"
            ></textarea>
            <button
              class="send-btn"
              :class="{ active: inputText.trim() }"
              :disabled="!inputText.trim()"
              @click="sendMessage"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useDraggable } from '../composables/useDraggable.js'

export default {
  name: 'FriendChatWindow',
  props: {
    isOpen:    { type: Boolean, default: false },
    friend:    { type: Object,  default: null },
    messages:  { type: Array,   default: () => [] },
    isLoading: { type: Boolean, default: false },
    /** 창의 초기 X 위치 (px, left 기준) */
    initialX:  { type: Number,  default: null },
    /** 창의 초기 Y 위치 (px, top 기준) */
    initialY:  { type: Number,  default: null },
    /** z-index (부모에서 bringToFront 시 갱신됨) */
    zIndex:    { type: Number,  default: 1100 },
  },
  emits: ['close', 'send-message', 'focus'],
  setup(props, { emit }) {
    const windowRef  = ref(null)
    const messageList = ref(null)
    const textarea   = ref(null)
    const isMinimized = ref(false)
    const inputText  = ref('')
    const isAtBottom  = ref(true) // 스크롤이 맨 아래에 있는지 여부

    // ─── 초기 위치 계산 ───────────────────────────────────────
    // initialX/Y 가 null 이면 화면 우하단 기본값
    function resolveInitial() {
      const W = window.innerWidth
      const H = window.innerHeight
      const winW = W <= 480 ? W : 300
      const winH = 440
      return {
        x: props.initialX !== null ? props.initialX : Math.max(0, W - winW - 20),
        y: props.initialY !== null ? props.initialY : Math.max(0, H - winH - 20),
      }
    }

    const init = resolveInitial()
    const { x, y, isDragging, dragHandleListeners } = useDraggable(windowRef, init)

    // 헤더 클릭 핸들러 (드래그와 분리)
    // 드래그 중이 아니었다면 최소화 토글
    let didDrag = false
    watch(isDragging, (val, old) => {
      if (!val && old) didDrag = true
      else didDrag = false
    })
    function onHeaderClick() {
      if (didDrag) {
        didDrag = false
        return
      }
      isMinimized.value = !isMinimized.value
    }

    function onWindowFocus() {
      emit('focus')
    }

    // ─── 인라인 스타일 ────────────────────────────────────────
    const windowStyle = computed(() => ({
      transform: `translate3d(${x.value}px, ${y.value}px, 0)`,
      zIndex: props.zIndex,
    }))

    // ─── 메시지 스크롤 ────────────────────────────────────────
    const SCROLL_THRESHOLD = 60 // px: 이 범위 안에 있으면 '맨 아래'로 간주

    function checkAtBottom() {
      const el = messageList.value
      if (!el) return
      isAtBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD
    }

    function onScroll() {
      checkAtBottom()
    }

    function scrollToBottom() {
      const el = messageList.value
      if (!el) return
      el.scrollTop = el.scrollHeight
      isAtBottom.value = true
    }

    function scrollToBottomManual() {
      scrollToBottom()
    }

    watch(
      () => props.messages,
      () => {
        nextTick(() => {
          if (isAtBottom.value) scrollToBottom()
        })
      },
      { deep: true }  // ← 배열 내부 push()도 감지하려면 deep 필수
    )

    watch(() => props.isOpen, (val) => {
      if (val) {
        isMinimized.value = false
        isAtBottom.value = true
        nextTick(() => scrollToBottom())
      }
    })

    // 접힘 → 펼침 시 스크롤 복구
    watch(isMinimized, (val) => {
      if (!val) {
        nextTick(() => scrollToBottom())
      }
    })

    // ─── 메시지 전송 ─────────────────────────────────────────
    function sendMessage(e) {
      if (e && e.isComposing) return
      if (!inputText.value.trim()) return
      emit('send-message', {
        friendId: props.friend.id,
        text: inputText.value.trim(),
      })
      inputText.value = ''
      if (textarea.value) textarea.value.style.height = 'auto'
      // 내가 메시지를 보낼 때는 항상 맨 아래로
      isAtBottom.value = true
      nextTick(() => scrollToBottom())
    }

    // ─── 유틸 ────────────────────────────────────────────────
    function shouldShowAvatar(index) {
      const msg  = props.messages[index]
      const prev = props.messages[index - 1]
      if (msg.isMine) return false
      // 이전 메시지가 없거나, 이전이 내 메시지이거나, 1분 이상 간격
      return !prev || prev.isMine || (msg.timestamp - prev.timestamp > 60000)
    }

    /**
     * 시간 표시 여부:
     * 같은 발신자의 다음 메시지가 같은 분(minute)에 있으면 현재 메시지의 시간 숨김
     * → 그룹의 마지막 메시지에만 시간 표시
     */
    function shouldShowTime(index) {
      const msg  = props.messages[index]
      const next = props.messages[index + 1]
      if (!next) return true // 마지막 메시지는 항상 표시
      if (next.isMine !== msg.isMine) return true // 발신자가 다르면 표시
      // 같은 발신자: 같은 분이면 숨김 (다음 메시지에서 표시됨)
      const sameMinute = Math.floor(msg.timestamp / 60000) === Math.floor(next.timestamp / 60000)
      return !sameMinute
    }

    // 날짜 구분선
    function shouldShowDateSeparator(index) {
      if (index === 0) return true
      const msg = props.messages[index]
      const prev = props.messages[index - 1]
      const msgDate = new Date(msg.timestamp).toLocaleDateString()
      const prevDate = new Date(prev.timestamp).toLocaleDateString()
      return msgDate !== prevDate
    }

    function formatDateSeparator(timestamp) {
      if (!timestamp) return ''
      return new Date(timestamp).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    function formatTime(timestamp) {
      if (!timestamp) return ''
      return new Date(timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }

    function autoResize(e) {
      e.target.style.height = 'auto'
      e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
    }

    return {
      windowRef, messageList, textarea,
      isMinimized, inputText,
      isDragging, dragHandleListeners,
      windowStyle,
      isAtBottom,
      onHeaderClick, onWindowFocus, onScroll,
      scrollToBottomManual,
      sendMessage, shouldShowAvatar, shouldShowTime, 
      shouldShowDateSeparator, formatDateSeparator, formatTime, autoResize,
    }
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');

/* ── 창 루트 ─────────────────────────────────────────────── */
.chat-window {
  /* 기준점: 뷰포트 왼쪽 상단 */
  position: fixed;
  top: 0;
  left: 0;
  /* 위치는 transform 으로만 제어 → GPU Compositor 처리, reflow Zero */
  will-change: transform;
  /* 드래그 중 text-select 방지는 .is-dragging 클래스가 처리 */

  width: 300px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: 'Noto Sans KR', sans-serif;
  /* 클릭 시 z-index 는 인라인 스타일로 제어 */
}

.chat-window.is-dragging {
  user-select: none;
  cursor: grabbing;
  /* 드래그 중 그림자 강조 */
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
}

/* ── 헤더 ────────────────────────────────────────────────── */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: grab;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.15s;
  touch-action: none; /* 터치 스크롤 억제 (드래그용) */
}

.chat-window.is-dragging .chat-header {
  cursor: grabbing;
}

.chat-header:hover { background: var(--color-surface-hover); }

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  /* 드래그 핸들이므로 pointer-events 직접 처리 */
  pointer-events: none;
}

/* 버튼 영역만 pointer-events 복구 */
.chat-header-actions {
  display: flex;
  gap: 2px;
  pointer-events: auto;
}

.chat-avatar-wrap { position: relative; flex-shrink: 0; }

.chat-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Rajdhani', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

.chat-avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: contain;
  border: 1.5px solid var(--color-border);
  background: var(--color-background);
}

.chat-online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 2px solid var(--color-surface);
  background: var(--color-text-tertiary);
}
.chat-online-dot.online { background: var(--color-success); }

.chat-friend-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.chat-friend-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-friend-status {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.chat-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.2s, background 0.2s;
}

.chat-action-btn:hover { color: var(--color-primary); background: var(--color-surface-hover); }
.close-chat-btn:hover  { color: var(--color-error) !important; background: var(--color-surface-hover) !important; }
.chat-action-btn svg   { width: 16px; height: 16px; }

/* ── 접힌 상태 ───────────────────────────────────────────── */
.minimized .chat-body { display: none; }

/* ── 채팅 바디 ───────────────────────────────────────────── */
.chat-body {
  display: flex;
  flex-direction: column;
  height: 360px;
  position: relative; /* 맨 아래로 버튼 위치의 기준점 */
}

/* ── 맨 아래로 버튼 ──────────────────────────────────────── */
.scroll-to-bottom-btn {
  position: absolute;
  bottom: 56px; /* 입력창 위에 배치 */
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.22);
  z-index: 10;
  transition: transform 0.15s, box-shadow 0.15s;
}
.scroll-to-bottom-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.28);
}
.scroll-to-bottom-btn svg { width: 18px; height: 18px; }

.scroll-down-fade-enter-active { animation: scroll-btn-in 0.2s ease; }
.scroll-down-fade-leave-active { animation: scroll-btn-out 0.18s ease forwards; }
@keyframes scroll-btn-in {
  from { opacity: 0; transform: scale(0.6) translateY(8px); }
  to   { opacity: 1; transform: scale(1)   translateY(0);   }
}
@keyframes scroll-btn-out {
  to { opacity: 0; transform: scale(0.6) translateY(8px); }
}

/* ── 메시지 목록 ─────────────────────────────────────────── */
.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.messages-list::-webkit-scrollbar { width: 3px; }
.messages-list::-webkit-scrollbar-thumb {
  background: var(--color-border-dark);
  border-radius: 2px;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  text-align: center;
  height: 100%;
}

.chat-empty-icon { font-size: 22px; color: var(--color-border-dark); }
.chat-empty p { margin: 0; }

.chat-date-separator {
  text-align: center;
  margin: 16px 0 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  display: flex;
  justify-content: center;
}

.chat-date-separator span {
  background: var(--color-surface-hover);
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

/* ── 메시지 아이템 ───────────────────────────────────────── */
.message-item {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.message-item.is-mine { flex-direction: row-reverse; }

.msg-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Rajdhani', sans-serif;
  font-size: 10px;
  font-weight: 700;
  color: #ffffff;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.msg-avatar-img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: contain;
  border: 1.5px solid var(--color-border);
  background: var(--color-background);
  flex-shrink: 0;
  margin-bottom: 2px;
}

.msg-avatar-spacer {
  width: 24px;
  flex-shrink: 0;
}

.msg-bubble   { max-width: 200px; position: relative; }

.msg-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  padding: 8px 11px;
  border-radius: 12px;
  word-break: break-word;
}

.msg-time {
  display: block;
  font-size: 9px;
  margin-top: 3px;
  color: var(--color-text-tertiary);
}

.other-bubble .msg-text {
  background: var(--color-background);
  color: var(--color-text-primary);
  border-bottom-left-radius: 4px;
}
.other-bubble .msg-time { text-align: left; padding-left: 2px; }

.my-bubble .msg-text {
  background: var(--color-primary);
  color: #ffffff;
  border: 1px solid var(--color-primary);
  border-bottom-right-radius: 4px;
}
.my-bubble .msg-time { text-align: right; padding-right: 2px; }

/* ── 입력창 ──────────────────────────────────────────────── */
.chat-input-area {
  padding: 8px 10px 10px;
  border-top: 1px solid var(--color-border);
}

.chat-input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 6px 6px 6px 12px;
  transition: border-color 0.2s;
}

.chat-input-wrapper:focus-within { border-color: var(--color-primary); }

.chat-textarea {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  outline: none;
  max-height: 80px;
  overflow-y: auto;
}

.chat-textarea::placeholder { color: var(--color-text-tertiary); }

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.send-btn.active {
  color: var(--color-primary);
  background: var(--color-surface);
  border-color: var(--color-primary);
}
.send-btn.active:hover {
  background: var(--color-surface-hover);
  transform: scale(1.05);
}
.send-btn:disabled { cursor: not-allowed; }
.send-btn svg { width: 15px; height: 15px; }

/* ── 로딩 ────────────────────────────────────────────────── */
.chat-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  height: 100%;
}
.chat-loading p { margin: 0; }

.chat-loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── 창 등장/퇴장 Transition ─────────────────────────────── */
.chat-slide-enter-active {
  animation: chat-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.chat-slide-leave-active {
  animation: chat-out 0.2s ease forwards;
}

@keyframes chat-in {
  from { opacity: 0; transform: translate3d(var(--chat-tx, 0px), calc(var(--chat-ty, 0px) + 20px), 0) scale(0.95); }
  to   { opacity: 1; transform: translate3d(var(--chat-tx, 0px), var(--chat-ty,   0px),       0) scale(1);    }
}
@keyframes chat-out {
  to { opacity: 0; transform: translate3d(var(--chat-tx, 0px), calc(var(--chat-ty, 0px) + 12px), 0) scale(0.97); }
}

/* ═══════════════════════════════════════════════════════════
   반응형: 태블릿 (481px ~ 768px) - 창 너비 축소, 드래그 유지
═══════════════════════════════════════════════════════════ */
@media (max-width: 768px) and (min-width: 481px) {
  .chat-window {
    width: 260px;
  }
  .chat-body { height: 320px; }
}

/* ═══════════════════════════════════════════════════════════
   반응형: 모바일 (≤ 480px) — Bottom Sheet 모드
   드래그 비활성화 (useDraggable 내부에서 자동 처리)
   창이 화면 하단을 가득 채우는 Sheet 로 변환
═══════════════════════════════════════════════════════════ */
@media (max-width: 480px) {
  .chat-window {
    /* transform 완전 초기화 — Bottom Sheet 위치는 CSS만으로 제어 */
    position: fixed !important;
    top: auto !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    /* 인라인 transform 을 무력화 */
    transform: none !important;
    will-change: auto !important;
    border-radius: 16px 16px 0 0;
    /* 입/출 애니메이션도 아래에서 올라오게 */
    transition: box-shadow 0.2s;
  }

  .chat-header {
    cursor: default; /* 모바일에선 드래그 없음 */
    touch-action: auto;
  }

  .chat-body { height: 55vh; max-height: 420px; }
}
</style>
