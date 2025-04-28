<template>
  <div class="team-chat">
    <div class="chat-header" @click="toggleChat">
      <div class="team-indicator" :class="teamClass">
        <i class="fas fa-users"></i>
        <span>{{ teamName }} 팀 채팅</span>
      </div>
      <div class="chat-controls">
        <div class="unread-badge" v-if="unreadCount > 0">{{ unreadCount }}</div>
        <i :class="isChatOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-up'"></i>
      </div>
    </div>
    
    <div class="chat-body" v-show="isChatOpen">
      <div class="message-container" ref="messageContainer">
        <div 
          v-for="message in teamMessages" 
          :key="message.id"
          class="message"
          :class="{ 
            'system-message': message.system,
            'my-message': message.senderId === currentUserId
          }"
        >
          <div v-if="!message.system" class="message-header">
            <div class="message-sender-info">
              <span class="message-sender">{{ message.sender }}</span>
              <span class="sender-level" v-if="message.senderLevel">Lv.{{ message.senderLevel }}</span>
            </div>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div 
            class="message-content"
            :class="{ 'system-content': message.system }"
          >
            {{ message.message }}
          </div>
        </div>
        
        <div v-if="teamMessages.length === 0" class="empty-chat">
          <i class="fas fa-comment-dots"></i>
          <p>아직 팀 채팅 메시지가 없습니다.</p>
          <p>팀원들에게 첫 메시지를 보내보세요!</p>
        </div>
      </div>
      
      <div class="chat-input-container">
        <input 
          type="text" 
          v-model="newMessage" 
          placeholder="팀 채팅 메시지 입력..." 
          @keyup.enter="sendMessage"
        />
        <button 
          class="send-button" 
          @click="sendMessage" 
          :disabled="!newMessage.trim()"
        >
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
    
    <div class="message-preview" v-if="!isChatOpen && lastMessage && !isPreviewRead">
      <div class="preview-sender" v-if="!lastMessage.system">{{ lastMessage.sender }}:</div>
      <div class="preview-content">{{ messagePreview }}</div>
      <button class="close-preview" @click.stop="dismissPreview">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TeamChat',
  
  props: {
    teamId: {
      type: String,
      required: true
    },
    teamName: {
      type: String,
      required: true
    },
    teamColor: {
      type: String,
      default: 'blue'
    },
    teamMessages: {
      type: Array,
      required: true
    },
    currentUserId: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      newMessage: '',
      isChatOpen: false,
      unreadCount: 0,
      lastReadMessageId: null,
      isPreviewRead: true
    };
  },
  
  computed: {
    teamClass() {
      return `team-${this.teamColor}`;
    },
    
    lastMessage() {
      if (this.teamMessages.length === 0) return null;
      return this.teamMessages[this.teamMessages.length - 1];
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
    teamMessages(newMessages, oldMessages) {
      // 메시지가 새로 추가되었는지 확인
      if (newMessages.length > oldMessages.length) {
        // 내가 보낸 메시지는 읽음 처리
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.senderId !== this.currentUserId) {
          // 채팅창이 열려있지 않은 경우 읽지 않은 메시지로 처리
          if (!this.isChatOpen) {
            this.unreadCount++;
            this.isPreviewRead = false;
          }
        }
      }
      
      // 채팅창이 열려있을 때는 자동 스크롤
      if (this.isChatOpen) {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    
    isActive(active) {
      // 탭이 활성화되면 읽지 않은 메시지 카운트 초기화
      if (active && this.isChatOpen) {
        this.resetUnreadCount();
      }
    }
  },
  
  mounted() {
    this.scrollToBottom();
  },
  
  methods: {
    sendMessage() {
      if (!this.newMessage.trim()) return;
      
      this.$emit('send-team-message', {
        teamId: this.teamId,
        message: this.newMessage
      });
      
      this.newMessage = '';
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    
    toggleChat() {
      this.isChatOpen = !this.isChatOpen;
      
      if (this.isChatOpen) {
        this.resetUnreadCount();
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    
    scrollToBottom() {
      if (this.$refs.messageContainer) {
        this.$refs.messageContainer.scrollTop = this.$refs.messageContainer.scrollHeight;
      }
    },
    
    resetUnreadCount() {
      this.unreadCount = 0;
      if (this.lastMessage) {
        this.lastReadMessageId = this.lastMessage.id;
      }
      this.isPreviewRead = true;
    },
    
    dismissPreview() {
      this.isPreviewRead = true;
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
.team-chat {
  width: 100%;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 1rem;
  overflow: hidden;
  border: 1px solid #eee;
}

.chat-header {
  padding: 0.8rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chat-header:hover {
  background-color: #f9fafb;
}

.team-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
}

.team-blue {
  color: #3b82f6;
}

.team-red {
  color: #ef4444;
}

.team-green {
  color: #10b981;
}

.team-yellow {
  color: #f59e0b;
}

.chat-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.unread-badge {
  background-color: #ef4444;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-body {
  height: 300px;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #eee;
}

.message-container {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background-color: #f9fafb;
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

.my-message {
  align-self: flex-end;
  background-color: #e0f2fe;
}

.system-message {
  align-self: center;
  background-color: transparent;
  box-shadow: none;
  padding: 0.3rem 0.8rem;
  color: #64748b;
  font-size: 0.8rem;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
}

.message-sender-info {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.message-sender {
  font-weight: 600;
  font-size: 0.85rem;
  color: #333;
}

.sender-level {
  font-size: 0.7rem;
  color: #64748b;
  background-color: #f1f5f9;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
}

.message-time {
  font-size: 0.7rem;
  color: #94a3b8;
}

.message-content {
  font-size: 0.9rem;
  line-height: 1.4;
  color: #334155;
}

.system-content {
  text-align: center;
  font-style: italic;
  color: #64748b;
}

.chat-input-container {
  display: flex;
  padding: 0.5rem;
  border-top: 1px solid #eee;
  background-color: white;
}

.chat-input-container input {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input-container input:focus {
  border-color: #4a6cf7;
}

.send-button {
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-button:hover {
  background-color: #3b5de7;
}

.send-button:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}

.message-preview {
  position: relative;
  background-color: white;
  border-top: 1px solid #e2e8f0;
  padding: 0.7rem 1rem;
  font-size: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  animation: slideUp 0.3s ease;
}

.preview-sender {
  font-weight: 600;
  margin-right: 0.3rem;
  color: #333;
}

.preview-content {
  color: #64748b;
}

.close-preview {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.2rem;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  text-align: center;
  padding: 1rem;
}

.empty-chat i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.empty-chat p {
  margin: 0.3rem 0;
  font-size: 0.9rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .team-chat {
    margin-bottom: 0.5rem;
  }
  
  .chat-body {
    height: 200px;
  }
}
</style> 