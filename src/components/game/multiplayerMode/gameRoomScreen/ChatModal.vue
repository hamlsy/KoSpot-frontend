<template>
  <div class="chat-modal">
    <div class="right-panel" :class="{ 'mobile-chat-active': show }">
      <div class="mobile-chat-header">
        <h3>채팅</h3>
        <button class="mobile-chat-close" @click="close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="chat-container">
        <chat-window 
          :messages="messages"
          :height="'100%'"
          :current-user-id="'user123'"
          @send-message="sendMessage"
          :show-mobile-close="show"
          @close="close"
        />
      </div>
    </div>
    
    <!-- 모바일에서만 채팅 토글 버튼 표시 (채팅 닫혀있을 때만) -->
    <button v-if="!show" class="mobile-chat-toggle" @click="toggle">
      <i class="fas fa-comment"></i>
      <span>채팅 열기</span>
    </button>
  </div>
</template>

<script>
import ChatWindow from '../lobbyScreen/ChatWindow.vue';

export default {
  name: 'ChatModal',
  
  components: {
    ChatWindow
  },
  
  props: {
    show: {
      type: Boolean,
      default: false
    },
    messages: {
      type: Array,
      required: true
    }
  },
  
  methods: {
    toggle() {
      this.$emit('toggle');
    },
    
    close() {
      this.$emit('close');
    },
    
    sendMessage(message) {
      this.$emit('send-message', message);
    }
  }
};
</script>

<style scoped>
.chat-modal {
  position: relative;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-container {
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 180px);
  max-height: calc(100vh - 180px);
}

/* 모바일 채팅 헤더 */
.mobile-chat-header {
  display: none;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.mobile-chat-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  margin: 0;
}

.mobile-chat-close {
  background: none;
  border: none;
  color: #64748b;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
}

/* 모바일 채팅 토글 버튼 */
.mobile-chat-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: white;
  border: none;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 2000;
  display: none; /* 기본적으로 숨김 (반응형에서만 표시) */
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.3s ease;
  font-size: 0.7rem;
}

.mobile-chat-toggle i {
  font-size: 1.2rem;
}

.mobile-chat-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

@media (max-width: 1024px) {
  .chat-container {
    height: 50vh;
    max-height: 50vh;
  }
  
  /* 태블릿에서 토글 버튼 표시 */
  .mobile-chat-toggle {
    display: flex;
  }
}

@media (max-width: 768px) {
  /* 모바일 채팅 스타일 */
  .right-panel {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1500;
    background-color: white;
    transform: translateY(100%);
    transition: transform 0.3s ease-in-out;
    padding: 0;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .right-panel.mobile-chat-active {
    transform: translateY(0);
  }
  
  .chat-container {
    flex: 1;
    height: calc(100% - 130px);
    max-height: calc(100% - 130px);
    overflow: hidden;
  }
  
  /* 모바일에서 채팅 헤더 표시 */
  .mobile-chat-header {
    display: flex;
    position: relative;
    z-index: 1600;
    height: 130px;
  }
}
</style> 