<template>
  <Transition name="chat-slide">
    <div v-if="isOpen && friend" class="chat-window" :class="{ minimized: isMinimized }">
      <!-- 헤더 -->
      <div class="chat-header" @click="isMinimized = !isMinimized">
        <div class="chat-header-left">
          <div class="chat-avatar-wrap">
            <div class="chat-avatar" :style="{ background: friend.avatarColor }">
              {{ friend.nickname[0].toUpperCase() }}
            </div>
            <span class="chat-online-dot" :class="{ online: friend.isOnline }"></span>
          </div>
          <div class="chat-friend-info">
            <span class="chat-friend-name">{{ friend.nickname }}</span>
            <span class="chat-friend-status">{{ friend.isOnline ? '온라인' : '오프라인' }}</span>
          </div>
        </div>
        <div class="chat-header-actions" @click.stop>
          <button class="chat-action-btn" @click="isMinimized = !isMinimized" :title="isMinimized ? '펼치기' : '접기'">
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
        <div ref="messageList" class="messages-list">
          <div v-if="messages.length === 0" class="chat-empty">
            <span class="chat-empty-icon">◈</span>
            <p>{{ friend.nickname }}님과 대화를 시작해보세요</p>
          </div>

          <div
            v-for="(msg, i) in messages"
            :key="msg.id"
            class="message-item"
            :class="{
              'is-mine': msg.isMine,
              'show-avatar': shouldShowAvatar(i),
            }"
          >
            <!-- 상대방 메시지 -->
            <template v-if="!msg.isMine">
              <div v-if="shouldShowAvatar(i)" class="msg-avatar" :style="{ background: friend.avatarColor }">
                {{ friend.nickname[0].toUpperCase() }}
              </div>
              <div v-else class="msg-avatar-spacer"></div>
              <div class="msg-bubble other-bubble">
                <p class="msg-text">{{ msg.text }}</p>
                <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
            </template>

            <!-- 내 메시지 -->
            <template v-else>
              <div class="msg-bubble my-bubble">
                <p class="msg-text">{{ msg.text }}</p>
                <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
            </template>
          </div>
        </div>

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
export default {
  name: 'ChatWindow',
  props: {
    isOpen: { type: Boolean, default: false },
    friend: { type: Object, default: null },
    messages: { type: Array, default: () => [] },
  },
  emits: ['close', 'send-message'],
  data() {
    return {
      inputText: '',
      isMinimized: false,
    }
  },
  watch: {
    messages() {
      this.$nextTick(() => this.scrollToBottom())
    },
    isOpen(val) {
      if (val) {
        this.isMinimized = false
        this.$nextTick(() => this.scrollToBottom())
      }
    },
  },
  methods: {
    sendMessage(e) {
      if (e && e.isComposing) return
      if (!this.inputText.trim()) return
      this.$emit('send-message', {
        friendId: this.friend.id,
        text: this.inputText.trim(),
      })
      this.inputText = ''
      this.$refs.textarea.style.height = 'auto'
    },
    scrollToBottom() {
      const el = this.$refs.messageList
      if (el) el.scrollTop = el.scrollHeight
    },
    shouldShowAvatar(index) {
      const msg = this.messages[index]
      const prev = this.messages[index - 1]
      if (msg.isMine) return false
      return !prev || prev.isMine || (msg.timestamp - prev.timestamp > 60000)
    },
    formatTime(timestamp) {
      if (!timestamp) return ''
      const d = new Date(timestamp)
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    },
    autoResize(e) {
      e.target.style.height = 'auto'
      e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500&display=swap');

.chat-window {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 300px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 1100;
  font-family: 'Noto Sans KR', sans-serif;
}

/* 다중 채팅 창이 있을 때 오프셋 처리는 부모에서 right 조정 */

/* 헤더 */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.15s;
}

.chat-header:hover { background: var(--color-surface-hover); }

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
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

.chat-online-dot.online {
  background: var(--color-success);
}

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

.chat-header-actions { display: flex; gap: 2px; }

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
.close-chat-btn:hover { color: var(--color-error) !important; background: var(--color-surface-hover) !important; }
.chat-action-btn svg { width: 16px; height: 16px; }

/* 접힌 상태 */
.minimized .chat-body { display: none; }

/* 채팅 바디 */
.chat-body {
  display: flex;
  flex-direction: column;
  height: 360px;
}

/* 메시지 목록 */
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

/* 메시지 아이템 */
.message-item {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.message-item.is-mine {
  flex-direction: row-reverse;
}

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

.msg-avatar-spacer {
  width: 24px;
  flex-shrink: 0;
}

/* 말풍선 */
.msg-bubble {
  max-width: 200px;
  position: relative;
}

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

/* 입력창 */
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

.chat-input-wrapper:focus-within {
  border-color: var(--color-primary);
}

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

/* 채팅 창 트랜지션 */
.chat-slide-enter-active {
  animation: chat-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chat-slide-leave-active {
  animation: chat-out 0.2s ease forwards;
}

@keyframes chat-in {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes chat-out {
  to { opacity: 0; transform: translateY(12px) scale(0.97); }
}
</style>
