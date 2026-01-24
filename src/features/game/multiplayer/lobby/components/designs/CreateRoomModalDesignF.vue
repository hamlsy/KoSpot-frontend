<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <!-- 헤더 -->
      <div class="modal-header">
        <div class="header-title">
          <div class="title-icon">
            <i class="fas fa-plus"></i>
          </div>
          <h2>새 게임방 만들기</h2>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- 바디 -->
      <div class="modal-body">
        <!-- 방 이름 -->
        <div class="form-group">
          <label>
            <i class="fas fa-tag"></i>
            방 이름
          </label>
          <div class="input-wrapper">
            <input
              type="text"
              v-model="roomName"
              placeholder="방 이름을 입력하세요"
              maxlength="30"
            />
            <span class="char-count">{{ roomName.length }}/30</span>
          </div>
        </div>
        
        <!-- 게임 모드 -->
        <div class="form-group">
          <label>
            <i class="fas fa-gamepad"></i>
            게임 모드
          </label>
          <div class="option-grid">
            <div 
              class="option-card"
              :class="{ selected: gameMode === 'roadview' }"
              @click="gameMode = 'roadview'"
            >
              <i class="fas fa-street-view"></i>
              <span>로드뷰</span>
              <div class="check-mark" v-if="gameMode === 'roadview'">
                <i class="fas fa-check"></i>
              </div>
            </div>
            <div class="option-card disabled">
              <i class="fas fa-camera"></i>
              <span>포토</span>
              <span class="soon-badge">준비중</span>
            </div>
          </div>
        </div>
        
        <!-- 게임 타입 -->
        <div class="form-group">
          <label>
            <i class="fas fa-users"></i>
            게임 타입
          </label>
          <div class="option-grid">
            <div 
              class="option-card"
              :class="{ selected: gameType === 'solo' }"
              @click="gameType = 'solo'"
            >
              <i class="fas fa-user"></i>
              <span>개인전</span>
              <div class="check-mark" v-if="gameType === 'solo'">
                <i class="fas fa-check"></i>
              </div>
            </div>
            <div class="option-card disabled">
              <i class="fas fa-user-friends"></i>
              <span>팀전</span>
              <span class="soon-badge">준비중</span>
            </div>
          </div>
        </div>
        
        <!-- 설정 그리드 -->
        <div class="settings-row">
          <!-- 인원 제한 -->
          <div class="form-group compact">
            <label>
              <i class="fas fa-user-plus"></i>
              최대 인원
            </label>
            <div class="counter-control">
              <button @click="decreasePlayers" :disabled="maxPlayers <= 2">
                <i class="fas fa-minus"></i>
              </button>
              <span class="counter-value">{{ maxPlayers }}명</span>
              <button @click="increasePlayers" :disabled="maxPlayers >= 8">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
          
          <!-- 라운드 수 -->
          <div class="form-group compact">
            <label>
              <i class="fas fa-redo"></i>
              라운드
            </label>
            <div class="counter-control">
              <button @click="decreaseRounds" :disabled="totalRounds <= 2">
                <i class="fas fa-minus"></i>
              </button>
              <span class="counter-value">{{ totalRounds }}</span>
              <button @click="increaseRounds" :disabled="totalRounds >= 10">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
          
          <!-- 시간 제한 -->
          <div class="form-group compact">
            <label>
              <i class="fas fa-clock"></i>
              제한 시간
            </label>
            <div class="counter-control">
              <button @click="decreaseTime" :disabled="timeLimit <= 30">
                <i class="fas fa-minus"></i>
              </button>
              <span class="counter-value">{{ formattedTime }}</span>
              <button @click="increaseTime" :disabled="timeLimit >= 300">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </div>
        
        <!-- 옵션 토글 -->
        <div class="toggle-group">
          <div class="toggle-item" @click="isPrivate = !isPrivate">
            <div class="toggle-info">
              <i :class="isPrivate ? 'fas fa-lock' : 'fas fa-lock-open'"></i>
              <span>비공개 방</span>
            </div>
            <div class="toggle-switch" :class="{ active: isPrivate }">
              <div class="toggle-thumb"></div>
            </div>
          </div>
          
          <div class="toggle-item" @click="isPoiVisible = !isPoiVisible">
            <div class="toggle-info">
              <i class="fas fa-map-marker-alt"></i>
              <span>지명 표시</span>
            </div>
            <div class="toggle-switch" :class="{ active: isPoiVisible }">
              <div class="toggle-thumb"></div>
            </div>
          </div>
        </div>
        
        <!-- 비밀번호 입력 -->
        <transition name="slide">
          <div v-if="isPrivate" class="password-section">
            <div class="form-group">
              <label>
                <i class="fas fa-key"></i>
                비밀번호
              </label>
              <input
                type="password"
                v-model="password"
                placeholder="비밀번호 입력"
                maxlength="10"
              />
            </div>
          </div>
        </transition>
      </div>
      
      <!-- 푸터 -->
      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">
          취소
        </button>
        <button 
          class="btn-create" 
          @click="createRoom"
          :disabled="!roomName.trim()"
        >
          <i class="fas fa-rocket"></i>
          방 만들기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['close', 'create-room']);

const roomName = ref('');
const gameMode = ref('roadview');
const gameType = ref('solo');
const maxPlayers = ref(4);
const totalRounds = ref(5);
const timeLimit = ref(180);
const isPrivate = ref(false);
const isPoiVisible = ref(true);
const password = ref('');

const formattedTime = computed(() => {
  const min = Math.floor(timeLimit.value / 60);
  const sec = timeLimit.value % 60;
  return sec === 0 ? `${min}분` : `${min}:${String(sec).padStart(2, '0')}`;
});

const increasePlayers = () => { if (maxPlayers.value < 8) maxPlayers.value++; };
const decreasePlayers = () => { if (maxPlayers.value > 2) maxPlayers.value--; };
const increaseRounds = () => { if (totalRounds.value < 10) totalRounds.value++; };
const decreaseRounds = () => { if (totalRounds.value > 2) totalRounds.value--; };
const increaseTime = () => { if (timeLimit.value < 300) timeLimit.value += 30; };
const decreaseTime = () => { if (timeLimit.value > 30) timeLimit.value -= 30; };

const createRoom = () => {
  if (!roomName.value.trim()) return;
  
  emit('create-room', {
    title: roomName.value,
    password: password.value || null,
    gameModeKey: gameMode.value,
    timeLimit: timeLimit.value,
    totalRounds: totalRounds.value,
    playerMatchTypeKey: gameType.value,
    maxPlayers: maxPlayers.value,
    privateRoom: isPrivate.value,
    poiNameVisible: isPoiVisible.value
  });
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 헤더 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e5e7eb;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.title-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.9rem;
}

.header-title h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}

.close-btn {
  width: 34px;
  height: 34px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #ef4444;
}

/* 바디 */
.modal-body {
  padding: 1.25rem 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group label i {
  color: #10b981;
  font-size: 0.75rem;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input,
.password-section input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.2s ease;
  background: #fafafa;
}

.input-wrapper input:focus,
.password-section input:focus {
  border-color: #10b981;
  background: white;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.char-count {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.7rem;
  color: #9ca3af;
}

/* 옵션 그리드 */
.option-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
}

.option-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 1rem;
  background: #fafafa;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-card:hover:not(.disabled) {
  border-color: #d1d5db;
  background: #f3f4f6;
}

.option-card.selected {
  border-color: #10b981;
  background: #ecfdf5;
}

.option-card i {
  font-size: 1.25rem;
  color: #6b7280;
}

.option-card.selected i {
  color: #10b981;
}

.option-card span {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
}

.option-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.check-mark {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-mark i {
  font-size: 0.5rem;
  color: white;
}

.soon-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #f59e0b;
  color: white;
  font-size: 0.55rem;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  font-weight: 700;
}

/* 설정 행 */
.settings-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.form-group.compact {
  margin-bottom: 0;
}

.counter-control {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0.4rem;
}

.counter-control button {
  width: 28px;
  height: 28px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.7rem;
}

.counter-control button:hover:not(:disabled) {
  background: #f3f4f6;
  color: #374151;
}

.counter-control button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.counter-value {
  flex: 1;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #111827;
}

/* 토글 그룹 */
.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-item:hover {
  background: #f3f4f6;
}

.toggle-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-info i {
  color: #6b7280;
  font-size: 0.85rem;
}

.toggle-info span {
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
}

.toggle-switch {
  width: 40px;
  height: 22px;
  background: #d1d5db;
  border-radius: 11px;
  position: relative;
  transition: all 0.2s ease;
}

.toggle-switch.active {
  background: #10b981;
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle-switch.active .toggle-thumb {
  left: 20px;
}

/* 비밀번호 섹션 */
.password-section {
  padding: 0.75rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
}

.password-section .form-group {
  margin-bottom: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 푸터 */
.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-create {
  flex: 1;
  padding: 0.8rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: white;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.btn-cancel:hover {
  background: #f3f4f6;
  color: #374151;
}

.btn-create {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-create:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 반응형 */
@media (max-width: 480px) {
  .modal-container {
    max-height: 85vh;
  }
  
  .settings-row {
    grid-template-columns: 1fr;
  }
  
  .counter-control {
    justify-content: center;
  }
}
</style>

