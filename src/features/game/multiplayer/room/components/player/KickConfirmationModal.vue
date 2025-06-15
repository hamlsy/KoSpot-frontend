<template>
  <div 
    class="kick-modal"
    :class="{ 'active': isActive }"
  >
    <div class="kick-modal-content">
      <div class="kick-modal-header">
        <h3 class="kick-modal-title">플레이어 강퇴</h3>
        <button 
          class="close-button"
          @click="$emit('close')"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="kick-modal-body">
        <div class="player-info" v-if="player">
          <div class="player-avatar">
            <img :src="player.profileImage || '/assets/default-avatar.png'" :alt="player.nickname">
          </div>
          <div class="player-name">{{ player.nickname }}</div>
        </div>
        
        <div class="confirmation-message">
          정말로 이 플레이어를 강퇴하시겠습니까?
        </div>
        
        <div class="kick-actions">
          <button 
            class="cancel-button"
            @click="$emit('close')"
          >
            취소
          </button>
          <button 
            class="confirm-button"
            @click="$emit('confirm')"
          >
            강퇴하기
          </button>
        </div>
      </div>
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
  player: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'confirm']);
</script>

<style scoped>
.kick-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.kick-modal.active {
  opacity: 1;
  visibility: visible;
}

.kick-modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transform: translateY(20px);
  transition: transform 0.3s ease;
}

.kick-modal.active .kick-modal-content {
  transform: translateY(0);
}

.kick-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  position: relative;
}

.kick-modal-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
}

.kick-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: black;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: #6b7280;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: #f3f4f6;
  color: #4b5563;
}

.kick-modal-body {
  padding: 1.5rem;
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
}

.player-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: black;
}

.confirmation-message {
  text-align: center;
  color: #4b5563;
  margin-bottom: 1.5rem;
  font-size: 1rem;
}

.kick-actions {
  display: flex;
  gap: 1rem;
}

.cancel-button, .confirm-button {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.cancel-button {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #4b5563;
}

.cancel-button:hover {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  color: #1f2937;
}

.confirm-button {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #ef4444;
}

.confirm-button:hover {
  background: linear-gradient(135deg, #fecaca 0%, #ef4444 100%);
  color: white;
}
</style>
