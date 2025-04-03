<template>
  <div class="chat-window">
    <div class="chat-header">
      <h3 class="chat-title">로비 채팅</h3>
      <div class="online-users">
        <span class="online-indicator"></span>
        <span>{{ onlineUsers }}명 접속중</span>
      </div>
    </div>
    
    <div class="chat-messages" ref="messageContainer">
      <div 
        v-for="message in messages" 
        :key="message.id"
        class="message"
        :class="{ 'system-message': message.system }"
      >
        <div v-if="!message.system" class="message-header">
          <span class="message-sender">{{ message.sender }}</span>
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        </div>
        <div 
          class="message-content"
          :class="{ 'system-content': message.system }"
        >
          {{ message.message }}
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <input 
        type="text" 
        v-model="newMessage" 
        placeholder="메시지를 입력하세요" 
        @keyup.enter="sendMessage"
      />
      <button class="send-button" @click="sendMessage" :disabled="!newMessage.trim()">
        <i class="fas fa-paper-plane"></i>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "ChatWindow",
  
  props: {
    messages: {
      type: Array,
      required: true
    }
  },
  
  data() {
    return {
      newMessage: '',
      onlineUsers: 37 // 테스트 데이터, 실제로는 서버에서 받아와야 함
    };
  },
  
  computed: {
    onlineUsers() {
      // 실제 구현에서는 웹소켓으로 현재 접속자 수를 가져옴
      return Math.floor(Math.random() * 50) + 150; // 150~200명 테스트용
    }
  },
  
  watch: {
    messages: {
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      },
      deep: true
    }
  },
  
  mounted() {
    this.scrollToBottom();
  },
  
  updated() {
    this.scrollToBottom();
  },
  
  methods: {
    sendMessage() {
      if (!this.newMessage.trim()) return;
      
      this.$emit('send-message', this.newMessage);
      this.newMessage = '';
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
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? '오후' : '오전';
      
      hours = hours % 12;
      hours = hours ? hours : 12; // 0시는 12시로 표시
      
      return `${ampm} ${hours}:${minutes}`;
    }
  }
};
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  flex: 1;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.chat-title {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
  position: relative;
}

.chat-title::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 20px;
  height: 3px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

.online-users {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #666;
}

.online-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4caf50;
}

.chat-messages {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.message {
  max-width: 85%;
  word-break: break-word;
}

.message:not(.system-message) {
  background: white;
  padding: 0.8rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  align-self: flex-start;
}

.system-message {
  align-self: center;
  text-align: center;
  margin: 0.5rem 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.4rem;
  align-items: center;
}

.message-sender {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
}

.message-time {
  font-size: 0.75rem;
  color: #999;
}

.message-content {
  font-size: 0.95rem;
  line-height: 1.4;
  color: #333;
}

.system-content {
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}

.chat-input {
  display: flex;
  padding: 1rem;
  border-top: 1px solid #eee;
  background: white;
}

.chat-input input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.3s ease;
}

.chat-input input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.send-button {
  background: #667eea;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-left: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.send-button:hover:not(:disabled) {
  background: #5a6edb;
  transform: translateY(-2px);
}

.send-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .message {
    max-width: 90%;
  }
}
</style> 