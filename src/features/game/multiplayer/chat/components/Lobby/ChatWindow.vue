<template>
  <div class="chat-window" :style="chatColorVars">
    <div class="chat-header">
      <h3 class="chat-title">채팅방</h3>
      <!-- <div class="online-users">
        <span class="online-indicator"></span>
        <span>{{ onlineUsers }}명 접속중</span>
      </div> -->
    </div>

    <div class="chat-messages" ref="messageContainer">
      <div
        v-for="(message, index) in messages"
        :key="message.id"
        class="message-wrapper"
        :class="{
          'system-message-wrapper': message.system,
          'my-message-wrapper': isMyMessage(message),
          'other-message-wrapper': !message.system && !isMyMessage(message),
        }"
      >
        <!-- 시스템 메시지 -->
        <div v-if="message.system" class="system-message">
          <span class="system-content">{{ message.message }}</span>
        </div>

        <!-- 일반 채팅 메시지 -->
        <div
          v-else
          class="chat-message"
          :class="{
            'my-chat': isMyMessage(message),
            'grouped-message': !shouldShowSender(message, messages[index - 1])
          }"
        >
          <!-- 다른 사용자 메시지 -->
          <div v-if="!isMyMessage(message)" class="other-message">
            <div class="message-content-wrapper">
              <div
                v-if="shouldShowSender(message, messages[index - 1])"
                class="message-info"
              >
                <span class="sender-name">{{ message.sender }}</span>
              </div>
              <div class="message-bubble-row">
                <div class="message-bubble other-bubble" :class="{ 'no-tail': !shouldShowSender(message, messages[index - 1]) }">
                  <span
                    v-if="shouldShowSender(message, messages[index - 1])"
                    class="bubble-tail other-tail"
                  ></span>
                  {{ message.message }}
                </div>
                <span
                  v-if="shouldShowTime(message, messages[index + 1])"
                  class="message-time message-time-side"
                >{{ formatTime(message.timestamp) }}</span>
              </div>
            </div>
          </div>

          <!-- 내 메시지 -->
          <div v-else-if="isMyMessage(message)" class="my-message">
            <div class="my-content-wrapper">
              <div class="message-bubble-row">
                <span
                  v-if="shouldShowTime(message, messages[index + 1])"
                  class="message-time message-time-side my-side"
                >{{ formatTime(message.timestamp) }}</span>
                <div class="message-bubble my-bubble" :class="{ 'no-tail': !shouldShowSender(message, messages[index - 1]) }">
                  {{ message.message }}
                  <span
                    v-if="shouldShowSender(message, messages[index - 1])"
                    class="bubble-tail my-tail"
                  ></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <div class="input-wrapper">
        <input
          type="text"
          v-model="newMessage"
          placeholder="메시지를 입력하세요..."
          @keyup.enter="handleEnter"
          @compositionstart="onCompositionStart"
          @compositionend="onCompositionEnd"
          @focus="handleInputFocus"
          @blur="handleInputBlur"
          ref="chatInput"
        />
        <button
          class="send-button"
          @click="sendMessage"
          :disabled="!newMessage.trim()"
          type="button"
        >
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
      <!-- 모바일에서 채팅창이 열렸을 때만 닫기 버튼 표시 -->
      <button
        v-if="showMobileClose"
        class="close-chat-button"
        @click="closeChat"
        type="button"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { BRAND, TEXT, BACKGROUND } from '@/core/constants/colors.js';

export default {
  name: "MultiplayerLobbyChatWindow",

  props: {
    messages: {
      type: Array,
      required: true,
    },
    currentUserId: {
      type: String,
      default: "",
    },
    showMobileClose: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      newMessage: "",
      onlineUsers: 37, // 테스트 데이터, 실제로는 서버에서 받아와야 함
      currentMemberId: null,
      isInputFocused: false,
      isComposing: false,
    };
  },

  computed: {
    chatColorVars() {
      const hex = BRAND.PRIMARY.replace('#', '');
      const full = hex.length === 3 ? hex.split('').map((ch) => ch + ch).join('') : hex;
      const value = Number.parseInt(full, 16);
      const r = (value >> 16) & 255;
      const g = (value >> 8) & 255;
      const b = value & 255;

      return {
        '--color-primary': BRAND.PRIMARY,
        '--color-secondary': BRAND.SECONDARY,
        '--color-success': BRAND.SUCCESS,
        '--color-danger': BRAND.DANGER,
        '--color-background': BACKGROUND.GRAY,
        '--color-surface': BACKGROUND.LIGHT,
        '--color-border': BRAND.SECONDARY,
        '--color-text-primary': TEXT.PRIMARY,
        '--color-text-secondary': TEXT.SECONDARY,
        '--color-text-tertiary': TEXT.MUTED,
        '--chat-primary-rgb': `${r}, ${g}, ${b}`,
      };
    },
  },

  mounted() {
    this.initializeCurrentUser();
    this.scrollToBottom();
  },

  watch: {
    messages: {
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      },
      deep: true,
    },
    // currentUserId props 변경을 감지하여 memberId 업데이트
    currentUserId: {
      handler(newValue) {
        this.initializeCurrentUser();
      },
      immediate: true,
    },
  },

  updated() {
    this.scrollToBottom();
  },

  methods: {
    initializeCurrentUser() {
      // localStorage에서 memberId 가져오기
      const localStorageMemberId = localStorage.getItem("memberId");

      // props로 전달받은 currentUserId 확인
      const propsUserId = this.currentUserId;

      // localStorage의 memberId를 우선 사용, 없으면 props 사용
      this.currentMemberId = localStorageMemberId || propsUserId;
    },

    onCompositionStart() {
      this.isComposing = true;
    },

    onCompositionEnd(event) {
      // Mac Chrome에서 한글 입력 시 조합 완료와 동시에 엔터 이벤트가 발생할 수 있으므로,
      // 상태 해제를 미세하게 지연시킵니다.
      setTimeout(() => {
        this.isComposing = false;
      }, 50);
    },

    /**
     * Handle enter key event to send message
     */
    handleEnter(event) {
      // IME 조합 중이거나, 이제 막 끝난 상태면 무시
      if (this.isComposing || event.isComposing) {
        return;
      }

      // Shift+Enter는 줄바꿈으로 처리 (메시지 전송하지 않음)
      if (event.shiftKey) {
        return;
      }

      event.preventDefault();
      this.sendMessage();
    },

    sendMessage() {
      if (!this.newMessage.trim()) return;

      this.$emit("send-message", this.newMessage);
      this.newMessage = "";
    },

    handleInputFocus() {
      this.isInputFocused = true;
    },

    handleInputBlur() {
      this.isInputFocused = false;
    },

    closeChat() {
      this.$emit("close");
    },

    scrollToBottom() {
      const messageContainer = this.$refs.messageContainer;
      if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    },

    formatTime(timestamp) {
      const date = new Date(timestamp);
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "오후" : "오전";

      hours = hours % 12;
      hours = hours ? hours : 12; // 0시는 12시로 표시

      return `${ampm} ${hours}:${minutes}`;
    },

    isMyMessage(message) {
      if (message.system) return false;

      // senderId와 현재 사용자 memberId 비교
      if (this.currentMemberId && message.senderId) {
        const isMyMsg =
          String(this.currentMemberId) === String(message.senderId);
        return isMyMsg;
      }

      return false;
    },

    shouldShowSender(message, previousMessage) {
      if (!previousMessage) return true;
      if (message.system || previousMessage.system) return true;
      return message.senderId !== previousMessage.senderId;
    },

    shouldShowTime(message, nextMessage) {
      if (!nextMessage) return true; // 마지막 메시지는 항상 표시
      if (message.system || nextMessage.system) return true;
      
      // 다음 메시지의 보낸이가 다르면 현재 메시지에 시간을 표시
      if (message.senderId !== nextMessage.senderId) return true;

      const currentTime = new Date(message.timestamp);
      const nextTime = new Date(nextMessage.timestamp);

      // 다음 메시지와 같은 분이면 표시 안 함, 다른 분이면 표시
      return (
        currentTime.getFullYear() !== nextTime.getFullYear() ||
        currentTime.getMonth() !== nextTime.getMonth() ||
        currentTime.getDate() !== nextTime.getDate() ||
        currentTime.getHours() !== nextTime.getHours() ||
        currentTime.getMinutes() !== nextTime.getMinutes()
      );
    },
  },
};
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-surface);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  flex: 1;
  border: 1px solid var(--color-border);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%);
  flex-shrink: 0;
}

.chat-title {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-text-primary);
  position: relative;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.chat-title::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 25px;
  height: 2px;
  background: var(--color-primary);
  border-radius: 2px;
}

.online-users {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.online-indicator {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.chat-messages {
  flex: 1;
  padding: 0.8rem;
  overflow-y: auto;
  background: var(--color-background);
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  scrollbar-width: thin;
  scrollbar-color: var(--color-secondary) transparent;
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background-color: var(--color-secondary);
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-text-tertiary);
}

/* 메시지 래퍼 스타일 */
.message-wrapper {
  margin-bottom: 0.2rem;
}

.system-message-wrapper {
  display: flex;
  justify-content: center;
  margin: 0.8rem 0;
}

.my-message-wrapper {
  display: flex;
  justify-content: flex-end;
}

.other-message-wrapper {
  display: flex;
  justify-content: flex-start;
}

/* 시스템 메시지 스타일 */
.system-message {
  background: rgba(100, 116, 139, 0.08);
  border-radius: 16px;
  padding: 0.4rem 0.8rem;
  max-width: 75%;
}

.system-content {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-style: italic;
  font-weight: 500;
}

/* 채팅 메시지 공통 스타일 */
.chat-message {
  max-width: 75%;
  margin-bottom: 0.3rem;
}

/* 다른 사용자 메시지 */
.other-message {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.message-content-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.message-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.2rem;
  margin-left: 0.4rem;
}

.sender-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.message-time {
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
  font-weight: 500;
  white-space: nowrap;
}

.message-bubble-row {
  display: flex;
  align-items: flex-end;
  gap: 0.4rem;
}

.message-time-side {
  margin-bottom: 0.2rem;
}

/* 말풍선 공통 스타일 */
.message-bubble {
  position: relative;
  padding: 0.5rem 0.8rem;
  border-radius: 14px;
  font-size: 0.85rem;
  line-height: 1.4;
  word-wrap: break-word;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
  max-width: fit-content;
}

.message-bubble:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

/* 다른 사용자 말풍선 */
.other-bubble {
  background: var(--color-surface);
  color: var(--color-text-primary);
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.other-bubble.no-tail {
  border-bottom-left-radius: 14px;
}

.other-tail {
  position: absolute;
  bottom: 0;
  left: -4px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 4px 4px 0;
  border-color: transparent white transparent transparent;
}

.other-tail::before {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 1px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 4px 4px 0;
  border-color: transparent rgba(0, 0, 0, 0.04) transparent transparent;
}

/* 내 메시지 스타일 */
.my-message {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}

.my-content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  max-width: 100%;
}

.grouped-message {
  margin-top: -0.1rem;
}

/* 내 말풍선 */
.my-bubble {
  background: var(--color-primary);
  color: white;
  border-bottom-right-radius: 4px;
  border: none;
  font-weight: 500;
}

.my-bubble.no-tail {
  border-bottom-right-radius: 14px;
}

.my-tail {
  position: absolute;
  bottom: 0;
  right: -4px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 4px 0 0 4px;
  border-color: var(--color-primary) transparent transparent transparent;
}

/* 채팅 입력 영역 */
.chat-input {
  display: flex;
  padding: 0.8rem 1rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
  gap: 0.6rem;
  align-items: center;
}

.input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--color-background);
  border-radius: 20px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  overflow: hidden;
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 0 0 3px rgba(var(--chat-primary-rgb), 0.15);
}

.chat-input input {
  flex: 1;
  padding: 0.7rem 1rem;
  border: none;
  background: transparent;
  font-size: 0.85rem;
  outline: none;
  color: var(--color-text-primary);
  font-weight: 500;
}

.chat-input input::placeholder {
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.send-button {
  background: var(--color-primary);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(var(--chat-primary-rgb), 0.3);
  transform: translateY(0);
}

.send-button:hover:not(:disabled) {
  background: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(var(--chat-primary-rgb), 0.4);
}

.send-button:active:not(:disabled) {
  background: var(--color-primary);
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(var(--chat-primary-rgb), 0.3);
}

.send-button:disabled {
  background: var(--color-secondary);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.send-button i {
  font-size: 0.8rem;
}

/* 채팅방 닫기 버튼 */
.close-chat-button {
  background: var(--color-danger);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
}

.close-chat-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
}

.close-chat-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.25);
}

/* 반응형 스타일 */
@media (max-width: 768px) {
  .chat-header {
    padding: 0.8rem 1rem;
  }

  .chat-messages {
    padding: 0.6rem;
  }

  .chat-message {
    max-width: 85%;
  }

  .chat-input {
    padding: 0.8rem;
  }

  .message-bubble {
    padding: 0.45rem 0.7rem;
    font-size: 0.8rem;
  }

  .sender-name {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .chat-title {
    font-size: 1rem;
  }

  .online-users {
    font-size: 0.75rem;
  }

  .chat-input input {
    padding: 0.6rem 0.9rem;
    font-size: 0.8rem;
  }

  .send-button,
  .close-chat-button {
    width: 32px;
    height: 32px;
  }

  .send-button i {
    font-size: 0.75rem;
  }
}
</style>
