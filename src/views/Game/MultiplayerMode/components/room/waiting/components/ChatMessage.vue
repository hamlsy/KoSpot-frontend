<template>
  <div 
    class="chat-message"
    :class="{ 'own-message': isOwnMessage }"
  >
    <div class="message-sender" v-if="!isOwnMessage">
      {{ message.senderName }}
    </div>
    <div class="message-content">{{ message.content }}</div>
    <div class="message-time">{{ formattedTime }}</div>
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
    type: String,
    required: true
  }
});

// Computed properties
const isOwnMessage = computed(() => {
  return props.message.senderId === props.currentUserId;
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
}

.chat-message.own-message {
  align-self: flex-end;
}

.message-sender {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.message-content {
  background: #f3f4f6;
  padding: 0.75rem 1rem;
  border-radius: 16px 16px 16px 0;
  color: black;
  font-size: 0.9rem;
  word-break: break-word;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.chat-message.own-message .message-content {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border-radius: 16px 16px 0 16px;
}

.message-time {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-top: 0.25rem;
  text-align: right;
}

/* Add subtle hover effect */
.chat-message:hover .message-content {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* Add subtle transition */
.chat-message .message-content {
  transition: all 0.2s ease;
}
</style>
