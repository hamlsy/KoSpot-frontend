<template>
  <div class="game-chat">
    <div class="chat-header">
      <h3 class="chat-title">채팅</h3>
      <div class="chat-toggle" @click="toggleChat">
        <i :class="isChatOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-up'"></i>
      </div>
    </div>
    
    <div class="chat-body" v-show="isChatOpen">
      <div class="message-container" ref="messageContainer">
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
      
      <div class="chat-input-container">
        <input 
          type="text" 
          v-model="newMessage" 
          placeholder="메시지 입력..." 
          :disabled="disabled"
          @keyup.enter="sendMessage"
        />
        <button 
          class="send-button" 
          @click="sendMessage" 
          :disabled="disabled || !newMessage.trim()"
        >
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
    
    <div class="message-preview" v-if="!isChatOpen && lastMessage">
      <div class="preview-sender" v-if="!lastMessage.system">{{ lastMessage.sender }}:</div>
      <div class="preview-content">{{ messagePreview }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameChat',
  
  props: {
    messages: {
      type: Array,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      newMessage: '',
      isChatOpen: true
    };
  },
  
  computed: {
    lastMessage() {
      if (this.messages.length === 0) return null;
      return this.messages[this.messages.length - 1];
    },
    
    messagePreview() {
      if (!this.lastMessage) return '';
      
      const message = this.lastMessage.message;
      if (message.length > 30) {
        return message.substring(0, 30) + '...';
      }
      return message;
    }
  },
  
  watch: {
    messages() {
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    
    isChatOpen(isOpen) {
      if (isOpen) {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    }
  },
  
  mounted() {
    this.scrollToBottom();
  },
  
  methods: {
    sendMessage() {
      if (this.disabled || !this.newMessage.trim()) return;
      
      this.$emit('send-message', this.newMessage);
      this.newMessage = '';
    },
    
    toggleChat() {
      this.isChatOpen = !this.isChatOpen;
    },
    
    scrollToBottom() {
      if (this.$refs.messageContainer) {
        this.$refs.messageContainer.scrollTop = this.$refs.messageContainer.scrollHeight;
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
.game-chat {
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 300px;
  transition: height 0.3s ease;
}

.chat-header {
  padding: 0.8rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
}

.chat-title {
  margin: 0;
  font-size: 1rem;
  color: #333;
}

.chat-toggle {
  cursor: pointer;
  color: #666;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.chat-toggle:hover {
  background: #f0f2f5;
  color: #333;
}

.chat-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.message-container {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.message {
  max-width: 85%;
  word-break: break-word;
  animation: fadeIn 0.3s ease;
}

.message:not(.system-message) {
  background: white;
  padding: 0.7rem;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  align-self: flex-start;
}

.system-message {
  align-self: center;
  margin: 0.3rem 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
}

.message-sender {
  font-weight: 600;
  font-size: 0.85rem;
  color: #333;
}

.message-time {
  font-size: 0.7rem;
  color: #999;
}

.message-content {
  font-size: 0.9rem;
  line-height: 1.4;
  color: #333;
}

.system-content {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
  background: #f0f2f5;
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
}

.chat-input-container {
  display: flex;
  padding: 0.8rem;
  background: white;
  border-top: 1px solid #eee;
}

.chat-input-container input {
  flex: 1;
  padding: 0.7rem 1rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.3s ease;
}

.chat-input-container input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.chat-input-container input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.send-button {
  background: #667eea;
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-left: 0.6rem;
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

.message-preview {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid #eee;
  display: flex;
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
}

.message-preview:hover {
  background: white;
}

.preview-sender {
  font-weight: 600;
  margin-right: 0.3rem;
  color: #333;
}

/* 애니메이션 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1200px) {
  .game-chat {
    height: 200px;
  }
}

@media (max-width: 640px) {
  .message {
    max-width: 90%;
  }
}
</style> 