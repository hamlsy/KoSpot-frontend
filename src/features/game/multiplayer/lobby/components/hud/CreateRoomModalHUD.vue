<template>
  <div class="hud-modal-overlay" @click.self="closeModal">
    <div class="hud-modal">
      <!-- HUD 테두리 -->
      <div class="hud-border">
        <div class="corner corner-tl"></div>
        <div class="corner corner-tr"></div>
        <div class="corner corner-bl"></div>
        <div class="corner corner-br"></div>
      </div>
      <div class="hud-scanline"></div>
      
      <div class="modal-content">
        <!-- 헤더 -->
        <div class="modal-header">
          <div class="header-title">
            <i class="fas fa-plus-square"></i>
            <h2>CREATE NEW ROOM</h2>
          </div>
          <button class="close-btn" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- 바디 -->
        <div class="modal-body">
          <!-- 방 이름 -->
          <div class="hud-form-group">
            <label>
              <span class="label-icon"><i class="fas fa-tag"></i></span>
              <span class="label-text">ROOM NAME</span>
            </label>
            <div class="hud-input-wrapper">
              <input
                type="text"
                v-model="roomName"
                placeholder="ENTER ROOM NAME..."
                maxlength="30"
              />
              <span class="char-count">{{ roomName.length }}/30</span>
            </div>
          </div>
          
          <!-- 게임 모드 -->
          <div class="hud-form-group">
            <label>
              <span class="label-icon"><i class="fas fa-gamepad"></i></span>
              <span class="label-text">GAME MODE</span>
            </label>
            <div class="hud-radio-group">
              <div 
                class="hud-radio-option"
                :class="{ selected: gameMode === 'roadview' }"
                @click="gameMode = 'roadview'"
              >
                <div class="option-icon"><i class="fas fa-street-view"></i></div>
                <span class="option-label">ROADVIEW</span>
                <div class="option-indicator"></div>
              </div>
              <div class="hud-radio-option disabled">
                <div class="option-icon"><i class="fas fa-camera"></i></div>
                <span class="option-label">PHOTO</span>
                <span class="coming-soon">COMING SOON</span>
              </div>
            </div>
          </div>
          
          <!-- 게임 타입 -->
          <div class="hud-form-group">
            <label>
              <span class="label-icon"><i class="fas fa-trophy"></i></span>
              <span class="label-text">GAME TYPE</span>
            </label>
            <div class="hud-radio-group">
              <div 
                class="hud-radio-option"
                :class="{ selected: gameType === 'solo' }"
                @click="gameType = 'solo'"
              >
                <div class="option-icon"><i class="fas fa-user"></i></div>
                <span class="option-label">SOLO</span>
                <div class="option-indicator"></div>
              </div>
              <div class="hud-radio-option disabled">
                <div class="option-icon"><i class="fas fa-users"></i></div>
                <span class="option-label">TEAM</span>
                <span class="coming-soon">COMING SOON</span>
              </div>
            </div>
          </div>
          
          <!-- 설정 그리드 -->
          <div class="settings-grid">
            <!-- 인원 제한 -->
            <div class="hud-form-group compact">
              <label>
                <span class="label-icon"><i class="fas fa-users"></i></span>
                <span class="label-text">MAX PLAYERS</span>
              </label>
              <div class="hud-counter">
                <button class="counter-btn" @click="decreasePlayerCount" :disabled="maxPlayers <= 2">
                  <i class="fas fa-minus"></i>
                </button>
                <div class="counter-display">
                  <span class="counter-value">{{ maxPlayers }}</span>
                  <span class="counter-unit">PLAYERS</span>
                </div>
                <button class="counter-btn" @click="increasePlayerCount" :disabled="maxPlayers >= 8">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
            
            <!-- 라운드 수 -->
            <div class="hud-form-group compact">
              <label>
                <span class="label-icon"><i class="fas fa-redo"></i></span>
                <span class="label-text">ROUNDS</span>
              </label>
              <div class="hud-counter">
                <button class="counter-btn" @click="decreaseTotalRounds" :disabled="totalRounds <= 2">
                  <i class="fas fa-minus"></i>
                </button>
                <div class="counter-display">
                  <span class="counter-value">{{ totalRounds }}</span>
                  <span class="counter-unit">ROUNDS</span>
                </div>
                <button class="counter-btn" @click="increaseTotalRounds" :disabled="totalRounds >= 10">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
            
            <!-- 시간 제한 -->
            <div class="hud-form-group compact">
              <label>
                <span class="label-icon"><i class="fas fa-clock"></i></span>
                <span class="label-text">TIME LIMIT</span>
              </label>
              <div class="hud-counter">
                <button class="counter-btn" @click="decreaseTimeLimit" :disabled="timeLimit <= 30">
                  <i class="fas fa-minus"></i>
                </button>
                <div class="counter-display">
                  <span class="counter-value">{{ formattedTimeLimit }}</span>
                </div>
                <button class="counter-btn" @click="increaseTimeLimit" :disabled="timeLimit >= 300">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 게임 옵션 -->
          <div class="hud-form-group">
            <label>
              <span class="label-icon"><i class="fas fa-cog"></i></span>
              <span class="label-text">OPTIONS</span>
            </label>
            <div class="hud-options">
              <div 
                class="hud-toggle"
                :class="{ active: gameSettings.isPrivate }"
                @click="gameSettings.isPrivate = !gameSettings.isPrivate"
              >
                <div class="toggle-icon">
                  <i :class="gameSettings.isPrivate ? 'fas fa-lock' : 'fas fa-lock-open'"></i>
                </div>
                <span class="toggle-label">PRIVATE ROOM</span>
                <div class="toggle-switch">
                  <div class="switch-track">
                    <div class="switch-thumb"></div>
                  </div>
                </div>
              </div>
              
              <div 
                class="hud-toggle"
                :class="{ active: gameSettings.poiNameVisible }"
                @click="gameSettings.poiNameVisible = !gameSettings.poiNameVisible"
              >
                <div class="toggle-icon">
                  <i class="fas fa-map-marker-alt"></i>
                </div>
                <span class="toggle-label">SHOW LOCATION NAME</span>
                <div class="toggle-switch">
                  <div class="switch-track">
                    <div class="switch-thumb"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 비밀번호 입력 -->
          <transition name="slide">
            <div v-if="gameSettings.isPrivate" class="hud-form-group password-section">
              <label>
                <span class="label-icon"><i class="fas fa-key"></i></span>
                <span class="label-text">ACCESS CODE</span>
              </label>
              <div class="hud-input-wrapper">
                <input
                  type="password"
                  v-model="password"
                  placeholder="ENTER PASSWORD..."
                  maxlength="10"
                />
              </div>
            </div>
          </transition>
        </div>
        
        <!-- 푸터 -->
        <div class="modal-footer">
          <button class="hud-btn cancel" @click="closeModal">
            <i class="fas fa-times"></i>
            <span>CANCEL</span>
          </button>
          <button 
            class="hud-btn confirm" 
            @click="createRoom"
            :disabled="!roomName.trim()"
          >
            <i class="fas fa-rocket"></i>
            <span>CREATE ROOM</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CreateRoomModalHUD',
  
  emits: ['close', 'create-room'],
  
  data() {
    return {
      roomName: '',
      gameMode: 'roadview',
      gameType: 'solo',
      maxPlayers: 4,
      totalRounds: 5,
      timeLimit: 180,
      password: '',
      gameSettings: {
        isPrivate: false,
        poiNameVisible: true
      }
    };
  },
  
  computed: {
    formattedTimeLimit() {
      const minutes = Math.floor(this.timeLimit / 60);
      const seconds = this.timeLimit % 60;
      if (minutes === 0) return `${seconds}SEC`;
      if (seconds === 0) return `${minutes}MIN`;
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
  },
  
  methods: {
    closeModal() {
      this.$emit('close');
    },
    
    createRoom() {
      if (!this.roomName.trim()) return;
      
      const roomData = {
        title: this.roomName,
        password: this.password || null,
        gameModeKey: this.gameMode,
        timeLimit: this.timeLimit,
        totalRounds: this.totalRounds,
        playerMatchTypeKey: this.gameType,
        maxPlayers: this.maxPlayers,
        privateRoom: this.gameSettings.isPrivate,
        poiNameVisible: this.gameSettings.poiNameVisible
      };
      
      this.$emit('create-room', roomData);
    },
    
    increasePlayerCount() {
      if (this.maxPlayers < 8) this.maxPlayers++;
    },
    
    decreasePlayerCount() {
      if (this.maxPlayers > 2) this.maxPlayers--;
    },
    
    increaseTotalRounds() {
      if (this.totalRounds < 10) this.totalRounds++;
    },
    
    decreaseTotalRounds() {
      if (this.totalRounds > 2) this.totalRounds--;
    },
    
    increaseTimeLimit() {
      if (this.timeLimit < 300) this.timeLimit += 30;
    },
    
    decreaseTimeLimit() {
      if (this.timeLimit > 30) this.timeLimit -= 30;
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');

.hud-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
  padding: 1rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.hud-modal {
  position: relative;
  background: linear-gradient(135deg, #0c1222 0%, #1a2744 100%);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  clip-path: polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px));
  animation: slideIn 0.3s ease;
  font-family: 'Orbitron', monospace;
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to { 
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.hud-modal::-webkit-scrollbar {
  width: 4px;
}

.hud-modal::-webkit-scrollbar-track {
  background: rgba(34, 211, 238, 0.1);
}

.hud-modal::-webkit-scrollbar-thumb {
  background: #22d3ee;
}

/* HUD 테두리 */
.hud-border {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 2px solid #22d3ee;
}

.corner-tl { top: 0; left: 0; border-right: none; border-bottom: none; }
.corner-tr { top: 0; right: 24px; border-left: none; border-bottom: none; }
.corner-bl { bottom: 24px; left: 0; border-right: none; border-top: none; }
.corner-br { bottom: 0; right: 0; border-left: none; border-top: none; }

.hud-scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(34, 211, 238, 0.02) 2px,
    rgba(34, 211, 238, 0.02) 4px
  );
  pointer-events: none;
  z-index: 1;
}

.modal-content {
  position: relative;
  z-index: 2;
  padding: 1.5rem;
}

/* 헤더 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid rgba(34, 211, 238, 0.2);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title i {
  font-size: 1.5rem;
  color: #22d3ee;
}

.header-title h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #22d3ee;
  letter-spacing: 0.1em;
  text-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
}

.close-btn {
  width: 36px;
  height: 36px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
}

/* 폼 그룹 */
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hud-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.hud-form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label-icon {
  color: #64748b;
  font-size: 0.75rem;
}

.label-text {
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.1em;
}

/* 입력 필드 */
.hud-input-wrapper {
  position: relative;
}

.hud-input-wrapper input {
  width: 100%;
  background: rgba(34, 211, 238, 0.05);
  border: 1px solid rgba(34, 211, 238, 0.3);
  padding: 0.75rem 1rem;
  color: #e2e8f0;
  font-family: 'Orbitron', monospace;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  outline: none;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.hud-input-wrapper input:focus {
  border-color: #22d3ee;
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
}

.hud-input-wrapper input::placeholder {
  color: #475569;
  font-size: 0.75rem;
}

.char-count {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.6rem;
  color: #64748b;
  letter-spacing: 0.05em;
}

/* 라디오 그룹 */
.hud-radio-group {
  display: flex;
  gap: 0.75rem;
}

.hud-radio-option {
  flex: 1;
  background: rgba(34, 211, 238, 0.05);
  border: 1px solid rgba(34, 211, 238, 0.2);
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.hud-radio-option:hover:not(.disabled) {
  background: rgba(34, 211, 238, 0.1);
  border-color: rgba(34, 211, 238, 0.4);
}

.hud-radio-option.selected {
  background: rgba(34, 211, 238, 0.15);
  border-color: #22d3ee;
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
}

.hud-radio-option.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.option-icon {
  font-size: 1.25rem;
  color: #64748b;
  transition: color 0.3s ease;
}

.hud-radio-option.selected .option-icon {
  color: #22d3ee;
}

.option-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.08em;
}

.hud-radio-option.selected .option-label {
  color: #22d3ee;
}

.option-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22d3ee;
  opacity: 0;
  transition: opacity 0.3s ease;
  box-shadow: 0 0 10px #22d3ee;
}

.hud-radio-option.selected .option-indicator {
  opacity: 1;
}

.coming-soon {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  font-size: 0.45rem;
  padding: 0.15rem 0.35rem;
  border-radius: 2px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* 설정 그리드 */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.hud-form-group.compact {
  gap: 0.4rem;
}

/* 카운터 */
.hud-counter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.counter-btn {
  width: 32px;
  height: 32px;
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.3);
  color: #22d3ee;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px));
  font-size: 0.7rem;
}

.counter-btn:hover:not(:disabled) {
  background: rgba(34, 211, 238, 0.2);
  box-shadow: 0 0 15px rgba(34, 211, 238, 0.3);
}

.counter-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.counter-display {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.counter-value {
  font-size: 1rem;
  font-weight: 800;
  color: #22d3ee;
  text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
}

.counter-unit {
  font-size: 0.5rem;
  color: #64748b;
  letter-spacing: 0.1em;
}

/* 옵션 토글 */
.hud-options {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.hud-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(100, 116, 139, 0.05);
  border: 1px solid rgba(100, 116, 139, 0.2);
  padding: 0.65rem 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
}

.hud-toggle:hover {
  background: rgba(100, 116, 139, 0.1);
}

.hud-toggle.active {
  background: rgba(167, 139, 250, 0.1);
  border-color: rgba(167, 139, 250, 0.4);
}

.toggle-icon {
  font-size: 0.85rem;
  color: #64748b;
  width: 20px;
  text-align: center;
}

.hud-toggle.active .toggle-icon {
  color: #a78bfa;
}

.toggle-label {
  flex: 1;
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.hud-toggle.active .toggle-label {
  color: #a78bfa;
}

.toggle-switch {
  width: 36px;
}

.switch-track {
  width: 100%;
  height: 16px;
  background: rgba(100, 116, 139, 0.3);
  border-radius: 8px;
  position: relative;
  transition: background 0.3s ease;
}

.hud-toggle.active .switch-track {
  background: rgba(167, 139, 250, 0.4);
}

.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  background: #64748b;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.hud-toggle.active .switch-thumb {
  left: calc(100% - 14px);
  background: #a78bfa;
  box-shadow: 0 0 10px #a78bfa;
}

/* 비밀번호 섹션 */
.password-section {
  padding: 0.75rem;
  background: rgba(167, 139, 250, 0.05);
  border: 1px solid rgba(167, 139, 250, 0.2);
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.password-section .hud-input-wrapper input {
  background: rgba(167, 139, 250, 0.05);
  border-color: rgba(167, 139, 250, 0.3);
}

.password-section .hud-input-wrapper input:focus {
  border-color: #a78bfa;
  box-shadow: 0 0 20px rgba(167, 139, 250, 0.2);
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
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(34, 211, 238, 0.2);
}

.hud-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}

.hud-btn.cancel {
  background: rgba(100, 116, 139, 0.1);
  border: 1px solid rgba(100, 116, 139, 0.3);
  color: #94a3b8;
}

.hud-btn.cancel:hover {
  background: rgba(100, 116, 139, 0.2);
  border-color: #94a3b8;
}

.hud-btn.confirm {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(34, 211, 238, 0.1) 100%);
  border: 1px solid rgba(34, 211, 238, 0.5);
  color: #22d3ee;
}

.hud-btn.confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(34, 211, 238, 0.15) 100%);
  box-shadow: 0 0 25px rgba(34, 211, 238, 0.3);
}

.hud-btn.confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.hud-btn i {
  font-size: 0.8rem;
}

/* 반응형 */
@media (max-width: 640px) {
  .hud-modal {
    max-height: 85vh;
  }
  
  .modal-content {
    padding: 1rem;
  }
  
  .header-title h2 {
    font-size: 0.95rem;
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .hud-radio-group {
    flex-direction: column;
  }
  
  .hud-btn {
    padding: 0.75rem;
    font-size: 0.7rem;
  }
  
  .counter-value {
    font-size: 0.9rem;
  }
}
</style>

