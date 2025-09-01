<template>
  <div class="confirm-modal">
    <div class="modal-overlay" @click="cancel"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-button" @click="cancel">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-content">
        <div class="message-container">
          <div class="icon-container">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="message-text">
            <p v-for="line in messageLines" :key="line">{{ line }}</p>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="cancel" class="cancel-button">
          취소
        </button>
        <button @click="confirm" class="confirm-button">
          확인
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['confirm', 'cancel'])

// 메시지를 줄바꿈으로 분리
const messageLines = computed(() => {
  return props.message.split('\n').filter(line => line.trim().length > 0)
})

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  position: relative;
  z-index: 1;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: zoomIn 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-content {
  padding: 1.5rem;
}

.message-container {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.icon-container {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  background: #fef3c7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d97706;
  font-size: 1.25rem;
}

.message-text {
  flex: 1;
}

.message-text p {
  margin: 0;
  color: #374151;
  line-height: 1.5;
}

.message-text p + p {
  margin-top: 0.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-button,
.confirm-button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.cancel-button {
  background: #f3f4f6;
  color: #374151;
}

.cancel-button:hover {
  background: #e5e7eb;
}

.confirm-button {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.confirm-button:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-2px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoomIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    margin: 1rem;
  }
  
  .message-container {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
  }
  
  .cancel-button,
  .confirm-button {
    width: 100%;
  }
}
</style>
