<template>
  <div class="simple-chat-input">
    <form @submit.prevent="sendMessage" class="chat-form">
      <input
        v-model="message"
        type="text"
        placeholder="메시지를 입력하세요..."
        class="chat-input"
        :disabled="disabled"
      />
      <button 
        type="submit" 
        class="send-button" 
        :disabled="!message.trim() || disabled"
      >
        <i class="fas fa-paper-plane"></i>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['send-message']);
const message = ref('');

const sendMessage = () => {
  if (message.value.trim() && !props.disabled) {
    emit('send-message', message.value);
    message.value = '';
  }
};
</script>

<style scoped>
.simple-chat-input {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(to top, rgba(26, 93, 26, 0.05), transparent);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 0 0 8px 8px;
}

.chat-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chat-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  background-color: white;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  outline: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.chat-input:focus {
  border-color: #4caf50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
}

.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a5d1a, #4caf50);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.send-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.send-button:active {
  transform: translateY(0);
}

.send-button:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.chat-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}
</style>
