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
          <div class="setting-controls">
            <button class="round-minus" @click="decrementRounds">-</button>
            <span class="rounds-value">{{ settings.rounds }}회</span>
            <button class="round-plus" @click="incrementRounds">+</button>
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
    },
    
    incrementRounds() {
      // 라운드 수 증가 (최대값 제한)
      if (this.settings.rounds < this.maxRounds) {
        this.settings.rounds++;
      }
    },
    
    decrementRounds() {
      // 라운드 수 감소 (최소 3)
      if (this.settings.rounds > 3) {
        this.settings.rounds--;
      }
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000; /* 더 높은 z-index로 설정 */
}

.room-settings-content {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.room-settings-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 1.5rem;
  text-align: center;
}

.room-settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-group .setting-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
}

.setting-controls {
  display: flex;
  gap: 0.5rem;
}

.mode-button,
.match-button {
  background-color: #f1f5f9;
  color: #64748b;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mode-button.active,
.match-button.active {
  background-color: #dbeafe;
  color: #2563eb;
}

.mode-button.active:nth-child(2) {
  background-color: #dcfce7;
  color: #16a34a;
}

.setting-select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #334155;
  background-color: white;
}

.round-minus,
.round-plus {
  width: 30px;
  height: 30px;
  background-color: #f1f5f9;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.round-minus:hover,
.round-plus:hover {
  background-color: #e2e8f0;
}

.rounds-value {
  width: 60px;
  text-align: center;
  font-weight: 500;
  color: #334155;
}

.room-settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.cancel-button,
.apply-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-button {
  background-color: #f1f5f9;
  color: #64748b;
}

.apply-button {
  background-color: #2563eb;
  color: white;
}

.cancel-button:hover {
  background-color: #e2e8f0;
}

.apply-button:hover {
  background-color: #1d4ed8;
}

/* 토글 스위치 스타일 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 24px;
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
  background-color: #cbd5e1;
  transition: .4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #2563eb;
}

input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.toggle-label {
  margin-left: 10px;
  font-size: 0.875rem;
  color: #334155;
}

.password-input {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #334155;
  width: 100%;
}

/* 모바일 반응형 추가 스타일 */
@media (max-width: 768px) {
  .room-settings-content {
    width: 95%;
    max-height: 90vh;
    padding: 1rem;
  }
  
  .setting-controls {
    flex-wrap: wrap;
  }
  
  .mode-button,
  .match-button {
    flex: 1;
    min-width: 45%;
  }
}
</style> 