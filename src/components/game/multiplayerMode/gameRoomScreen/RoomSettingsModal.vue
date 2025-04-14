<template>
  <div class="room-settings-modal" v-if="show">
    <div class="room-settings-content">
      <h3>방 설정</h3>
      <div class="room-settings-form">
        <div class="setting-group">
          <label class="setting-label">게임 모드:</label>
          <div class="setting-controls">
            <button 
              class="mode-button" 
              :class="{ active: settings.gameMode === '로드뷰' }"
              @click="settings.gameMode = '로드뷰'"
            >
              <i class="fas fa-street-view"></i> 로드뷰
            </button>
            <button 
              class="mode-button" 
              :class="{ active: settings.gameMode === '포토' }"
              @click="settings.gameMode = '포토'"
            >
              <i class="fas fa-camera"></i> 포토
            </button>
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">매치 유형:</label>
          <div class="setting-controls">
            <button 
              class="match-button" 
              :class="{ active: settings.matchType === 'individual' }"
              @click="settings.matchType = 'individual'"
            >
              <i class="fas fa-user"></i> 개인전
            </button>
            <button 
              class="match-button" 
              :class="{ active: settings.matchType === 'team' }"
              @click="settings.matchType = 'team'"
            >
              <i class="fas fa-users"></i> 팀전
            </button>
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">라운드:</label>
          <div class="rounds-selector">
            <div 
              v-for="num in maxRounds - 2" 
              :key="num"
              class="round-option"
              :class="{ active: settings.rounds === num + 2 }"
              @click="settings.rounds = num + 2"
            >
              {{ num + 2 }}
            </div>
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">제한 시간:</label>
          <select v-model="settings.timeLimit" class="setting-select">
            <option value="60">60초</option>
            <option value="90">90초</option>
            <option value="120">120초</option>
            <option value="180">180초</option>
            <option value="240">240초</option>
          </select>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">비밀 방:</label>
          <div class="setting-controls">
            <label class="toggle-switch">
              <input type="checkbox" v-model="settings.isPrivate">
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">{{ settings.isPrivate ? '비밀방' : '공개방' }}</span>
          </div>
        </div>
        
        <div class="setting-group" v-if="settings.isPrivate">
          <label class="setting-label">비밀번호:</label>
          <input type="text" v-model="settings.password" class="password-input" placeholder="비밀번호 입력" maxlength="8">
        </div>
      </div>
      
      <div class="room-settings-actions">
        <button class="cancel-button" @click="cancel">취소</button>
        <button class="apply-button" @click="apply">적용</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoomSettingsModal',
  
  props: {
    show: {
      type: Boolean,
      default: false
    },
    initialSettings: {
      type: Object,
      required: true
    }
  },
  
  data() {
    return {
      settings: {
        gameMode: '',
        matchType: '',
        region: '',
        rounds: 3,
        timeLimit: 120,
        isPrivate: false,
        password: ''
      }
    };
  },
  
  watch: {
    show(newVal) {
      if (newVal) {
        // 모달이 열릴 때 설정 초기화
        this.resetSettings();
      }
    }
  },
  
  computed: {
    maxRounds() {
      // 로드뷰는 최대 10라운드, 포토 모드는 최대 15라운드
      return this.settings.gameMode === '로드뷰' ? 10 : 15;
    }
  },
  
  methods: {
    resetSettings() {
      // 설정 복사 (깊은 복사)
      this.settings = JSON.parse(JSON.stringify(this.initialSettings));
    },
    
    cancel() {
      this.$emit('close');
    },
    
    apply() {
      this.$emit('apply', this.settings);
    }
  },
  
  created() {
    this.resetSettings();
  }
};
</script>

<style scoped>
/* 방 설정 모달 스타일 */
.room-settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(3px);
}

.room-settings-content {
  background-color: white;
  border-radius: 16px;
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.room-settings-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 1.5rem;
  text-align: center;
  position: relative;
}

.room-settings-content h3::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 10px;
}

.room-settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.setting-group .setting-label {
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
}

.setting-controls {
  display: flex;
  gap: 0.75rem;
}

.mode-button,
.match-button {
  flex: 1;
  background-color: #f8fafc;
  color: #64748b;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.mode-button:hover,
.match-button:hover {
  background-color: #f1f5f9;
  transform: translateY(-2px);
}

.mode-button.active,
.match-button.active {
  background-color: #eff6ff;
  color: #3b82f6;
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.mode-button.active:nth-child(2) {
  background-color: #ecfdf5;
  color: #10b981;
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.setting-select {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  color: #334155;
  background-color: #f8fafc;
  font-size: 0.95rem;
  font-weight: 500;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.25rem;
  padding-right: 2.5rem;
  transition: all 0.2s ease;
}

.setting-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 라운드 선택기 스타일 */
.rounds-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  padding: 0.5rem;
  background-color: #f8fafc;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
}

.round-option {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.round-option:hover {
  background-color: #f1f5f9;
  transform: translateY(-2px);
}

.round-option.active {
  background-color: #3b82f6;
  color: white;
  border-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.room-settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-button,
.apply-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button {
  background-color: #f1f5f9;
  color: #64748b;
}

.cancel-button:hover {
  background-color: #e2e8f0;
  transform: translateY(-2px);
}

.apply-button {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.apply-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* 토글 스위치 스타일 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e2e8f0;
  transition: .4s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

input:checked + .toggle-slider {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.toggle-label {
  margin-left: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #334155;
}

.password-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background-color: #f8fafc;
  font-size: 0.95rem;
  color: #334155;
  width: 100%;
  font-family: monospace;
  letter-spacing: 1px;
  transition: all 0.2s ease;
}

.password-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 모바일 반응형 추가 스타일 */
@media (max-width: 768px) {
  .room-settings-content {
    width: 95%;
    max-height: 90vh;
    padding: 1.25rem;
  }
  
  .setting-controls {
    flex-wrap: wrap;
  }
  
  .mode-button,
  .match-button {
    padding: 0.6rem;
    font-size: 0.85rem;
  }
  
  .rounds-selector {
    gap: 0.35rem;
  }
  
  .round-option {
    width: 36px;
    height: 36px;
    font-size: 0.85rem;
  }
}
</style> 