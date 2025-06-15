<template>
  <div 
    class="countdown-overlay"
    :class="{ 'active': isActive }"
  >
    <div class="countdown-content">
      <div class="countdown-title">게임 시작까지</div>
      <div class="countdown-timer">{{ countdown }}</div>
      <div class="countdown-message">{{ message }}</div>
      
      <button 
        v-if="isHost && canCancel" 
        class="cancel-button"
        @click="$emit('cancel')"
      >
        <i class="fas fa-times"></i>
        <span>취소</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  countdown: {
    type: Number,
    default: 5
  },
  message: {
    type: String,
    default: '준비하세요!'
  },
  isHost: {
    type: Boolean,
    default: false
  },
  canCancel: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['cancel']);
</script>

<style scoped>
.countdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.countdown-overlay.active {
  opacity: 1;
  visibility: visible;
}

.countdown-content {
  background: white;
  border-radius: 24px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 90%;
  width: 400px;
  position: relative;
  overflow: hidden;
}

.countdown-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
}

.countdown-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: black;
  margin-bottom: 1.5rem;
}

.countdown-timer {
  font-size: 5rem;
  font-weight: 800;
  color: black;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.countdown-message {
  font-size: 1.2rem;
  color: #4b5563;
  margin-bottom: 2rem;
}

.cancel-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #ef4444;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 auto;
}

.cancel-button:hover {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  color: #dc2626;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.countdown-timer {
  animation: pulse 1s infinite;
}
</style>
