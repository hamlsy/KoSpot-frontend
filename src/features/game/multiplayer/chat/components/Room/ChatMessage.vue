<template>
  <div 
    class="chat-message"
    :class="{ 'own-message': isOwnMessage, 'system-message': isSystemMessage }"
  >
    <div v-if="isSystemMessage" class="system-content">
      <i class="fas fa-info-circle"></i>
      {{ message.content }}
    </div>
    <template v-else>
      <div class="message-sender" v-if="!isOwnMessage">
        {{ message.senderName }}
      </div>
      <div class="message-content">{{ message.content }}</div>
      <div class="message-time">{{ formattedTime }}</div>
    </template>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue';

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: [String, Number],
    required: true
  }
});

// Computed properties
const isOwnMessage = computed(() => {
  const sender = props.message?.senderId;
  if (sender === undefined || sender === null) {
    return false;
  }

  return String(sender) === String(props.currentUserId);
});

const isSystemMessage = computed(() => {
  return props.message.isSystem === true || props.message.messageType === 'SYSTEM';
});

const formattedTime = computed(() => {
  if (!props.message.timestamp) return '';
  
  try {
    const date = new Date(props.message.timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  } catch (e) {
    return '';
  }
});
</script>

<style scoped>
.chat-message {
  max-width: 80%;
  align-self: flex-start;
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.chat-message.own-message {
  align-self: flex-end;
  text-align: right;
}

.message-sender {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.1rem;
}

.chat-message.own-message .message-sender {
  display: none;
}

.message-content {
  display: inline-flex;
  align-items: flex-start;
  background: #f3f4f6;
  padding: 0.75rem 1rem;
  border-radius: 16px 16px 16px 4px;
  color: #111827;
  font-size: 0.92rem;
  line-height: 1.45;
  word-break: break-word;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  max-width: 100%;
}

.chat-message.own-message .message-content {
  margin-left: auto;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: white;
  border-radius: 16px 16px 4px 16px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.message-time {
  font-size: 0.7rem;
  color: #9ca3af;
  text-align: right;
}

.chat-message.own-message .message-time {
  text-align: left;
  margin-left: auto;
  color: rgba(255, 255, 255, 0.75);
}

.chat-message:hover .message-content {
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.chat-message .message-content {
  transition: all 0.2s ease;
}

/* System message styles */
.chat-message.system-message {
  align-self: center;
  max-width: 90%;
  margin: 0.5rem 0;
}

.system-content {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.85rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.system-content i {
  font-size: 0.8rem;
  color: #9ca3af;
}
</style>
