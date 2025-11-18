<template>
  <div 
    class="room-settings-modal"
    :class="{ 'active': isActive }"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fas fa-cog"></i> 방 설정 변경
        </h3>
        <button 
          class="close-button"
          @click="$emit('close')"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="saveSettings">
          <!-- 방 제목 -->
          <div class="form-group">
            <label for="roomTitle">방 제목</label>
            <input 
              type="text" 
              id="roomTitle" 
              v-model="formData.title"
              placeholder="방 제목을 입력하세요"
              maxlength="30"
              class="form-input"
            />
          </div>
          
          <!-- 게임 모드 -->
          <div class="form-group">
            <label>게임 모드</label>
            <div class="mode-selector">
              <button 
                type="button"
                class="mode-button"
                :class="{ 'active': formData.gameMode === 'roadview' }"
                @click="formData.gameMode = 'roadview'"
              >
                <i class="fas fa-street-view"></i>
                <span>로드뷰 모드</span>
              </button>
              
              <button 
                type="button"
                class="mode-button disabled"
                :class="{ 'active': formData.gameMode === 'photo' }"
                disabled
              >
                <i class="fas fa-camera"></i>
                <span>포토 모드</span>
                <span class="badge-disabled">준비 중</span>
              </button>
            </div>
          </div>
          
          <!-- 팀 모드 설정 -->
          <div class="form-group">
            <label>팀 모드</label>
            <div class="toggle-switch disabled-toggle">
              <input 
                type="checkbox" 
                id="teamMode" 
                v-model="formData.isTeamMode"
                class="toggle-input"
                disabled
              />
              <label for="teamMode" class="toggle-label">
                <span class="toggle-inner"></span>
                <span class="toggle-switch-handle"></span>
              </label>
              <span class="toggle-text">{{ formData.isTeamMode ? '팀전' : '개인전' }}</span>
              <span class="badge-disabled-inline">준비 중</span>
            </div>
          </div>
          
          <!-- 라운드 수 -->
          <div class="form-group">
            <label for="rounds">라운드 수</label>
            <div class="slider-container">
              <input 
                type="range" 
                id="rounds" 
                v-model.number="formData.rounds"
                min="1" 
                max="10"
                class="slider"
              />
              <span class="slider-value">{{ formData.rounds }}라운드</span>
            </div>
          </div>
          
          <!-- 제한 시간 -->
          <div class="form-group">
            <label for="timeLimit">제한 시간</label>
            <div class="slider-container">
              <input 
                type="range" 
                id="timeLimit" 
                v-model.number="formData.timeLimit"
                min="30" 
                max="180"
                step="30"
                class="slider"
              />
              <span class="slider-value">{{ formData.timeLimit }}초</span>
            </div>
          </div>
          
          <!-- 최대 인원 -->
          <div class="form-group">
            <label for="maxPlayers">최대 인원</label>
            <div class="slider-container">
              <input 
                type="range" 
                id="maxPlayers" 
                v-model.number="formData.maxPlayers"
                min="2" 
                max="8"
                class="slider"
              />
              <span class="slider-value">{{ formData.maxPlayers }}명</span>
            </div>
          </div>
          
          <!-- 비공개 방 설정 -->
          <div class="form-group">
            <label>비공개 방</label>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                id="isPrivate" 
                v-model="formData.isPrivate"
                class="toggle-input"
              />
              <label for="isPrivate" class="toggle-label">
                <span class="toggle-inner"></span>
                <span class="toggle-switch-handle"></span>
              </label>
              <span class="toggle-text">{{ formData.isPrivate ? '비공개' : '공개' }}</span>
            </div>
          </div>

          <!-- 지명 공개 설정 -->
          <div class="form-group">
            <label>지명 공개</label>
            <div class="toggle-switch">
              <input 
                type="checkbox" 
                id="isPoiNameVisible" 
                v-model="formData.isPoiNameVisible"
                class="toggle-input"
              />
              <label for="isPoiNameVisible" class="toggle-label">
                <span class="toggle-inner"></span>
                <span class="toggle-switch-handle"></span>
              </label>
              <span class="toggle-text">{{ formData.isPoiNameVisible ? '표시' : '비표시' }}</span>
            </div>
          </div>
          
          <!-- 비밀번호 (비공개 방인 경우) -->
          <div class="form-group" v-if="formData.isPrivate">
            <label for="password">비밀번호</label>
            <input 
              type="password" 
              id="password" 
              v-model="formData.password"
              placeholder="4자리 숫자"
              maxlength="4"
              pattern="[0-9]{4}"
              class="form-input"
              required
            />
            <div class="form-hint" v-if="formData.isPrivate && !formData.password">
              비공개 방은 비밀번호를 설정해야 합니다.
            </div>
          </div>
          
          <div class="form-actions">
            <button 
              type="button"
              class="cancel-button"
              @click="$emit('close')"
            >
              취소
            </button>
            <button 
              type="submit"
              class="save-button"
              :disabled="formData.isPrivate && !formData.password"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted } from 'vue';

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  roomData: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'save']);

// 게임 모드 옵션
const gameModes = [
  { id: 'roadview', name: '로드뷰 모드', icon: 'fas fa-street-view' },
  { id: 'photo', name: '포토 모드', icon: 'fas fa-camera' },
  { id: 'mixed', name: '믹스 모드', icon: 'fas fa-random' },
  { id: 'team', name: '팀 모드', icon: 'fas fa-users' }
];

// 폼 데이터 초기화
const formData = ref({
  title: '',
  gameMode: 'roadview',
  isTeamMode: false,
  rounds: 5,
  timeLimit: 60,
  maxPlayers: 8,
  region: '',
  isPrivate: false,
  isPoiNameVisible: true
});

// 방 설정 저장
const saveSettings = () => {
  emit('save', { ...formData.value });
};

// 컴포넌트 마운트 시 초기 데이터 설정
onMounted(() => {
  // props로 받은 roomData로 폼 데이터 초기화
  if (props.roomData) {
    formData.value = {
      title: props.roomData.title || '',
      gameMode: props.roomData.gameMode || 'roadview',
      isTeamMode: props.roomData.isTeamMode || false,
      rounds: props.roomData.rounds || 5,
      timeLimit: props.roomData.timeLimit || 60,
      maxPlayers: props.roomData.maxPlayers || 8,
      region: props.roomData.region || '',
      isPrivate: props.roomData.isPrivate || false,
      isPoiNameVisible: props.roomData.isPoiNameVisible !== false
    };
  }
});
</script>

<style scoped>
.room-settings-modal {
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

.room-settings-modal.active {
  opacity: 1;
  visibility: visible;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: relative;
}

.modal-content::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 16px 16px 0 0;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: black;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-title i {
  color: #3b82f6;
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

.modal-body {
  padding: 24px;
}

/* Form styling */
.form-group {
  margin-bottom: 24px;
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: black;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  color: black;
  transition: all 0.2s;
}

.form-input:focus {
  border-color: #93c5fd;
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-hint {
  font-size: 0.8rem;
  color: #ef4444;
  margin-top: 6px;
}

/* Mode selector styling */
.mode-selector {
  display: flex;
  gap: 12px;
}

.mode-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.mode-button:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.mode-button.active {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #93c5fd;
}

.mode-button i {
  font-size: 1.5rem;
  color: #6b7280;
  margin-bottom: 8px;
}

.mode-button.active i {
  color: #2563eb;
}

.mode-button span {
  font-weight: 600;
  color: black;
}

/* 비활성화된 모드 버튼 스타일 */
.mode-button.disabled {
  cursor: not-allowed;
  opacity: 0.6;
  position: relative;
}

.mode-button.disabled i {
  color: #9ca3af;
}

.mode-button.disabled span {
  color: #9ca3af;
}

.badge-disabled {
  position: absolute;
  top: 8px;
  right: 8px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  font-size: 0.65rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
}

/* Toggle switch styling */
.toggle-switch {
  display: flex;
  align-items: center;
}

.toggle-input {
  display: none;
}

.toggle-label {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
  background-color: #e5e7eb;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s;
  margin-right: 12px;
}

.toggle-inner {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-switch-handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 14px;
}

.toggle-input:checked + .toggle-label {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.toggle-input:checked + .toggle-label .toggle-inner {
  transform: translateX(24px);
}

.toggle-text {
  font-weight: 500;
  color: black;
}

/* 비활성화된 토글 스위치 스타일 */
.toggle-switch.disabled-toggle {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-switch.disabled-toggle .toggle-label {
  cursor: not-allowed;
}

.badge-disabled-inline {
  margin-left: auto;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  font-size: 0.65rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
}

/* Slider styling */
.slider-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.slider {
  flex: 1;
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.slider-value {
  min-width: 80px;
  font-weight: 600;
  color: black;
  text-align: right;
}

/* Button styling */
.form-select:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
  outline: none;
}

/* Form actions styling */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-button, .save-button {
  padding: 0.75rem 1.5rem;
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

.save-button {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.save-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

.save-button:disabled {
  background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.7;
}

/* Scrollbar styling */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 8px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Responsive styling */
@media (max-width: 640px) {
  .mode-options {
    grid-template-columns: 1fr;
  }
  
  .slider-container {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .slider-value {
    align-self: flex-end;
  }
}
</style>
