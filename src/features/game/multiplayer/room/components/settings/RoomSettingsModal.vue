<template>
  <div v-if="isActive" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h2>방 설정 변경</h2>
        <button class="close-button" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="roomTitle">방 이름</label>
          <input
            type="text"
            id="roomTitle"
            v-model="formData.title"
            placeholder="방 이름을 입력하세요"
            maxlength="30"
          />
          <small>{{ formData.title.length }}/30</small>
        </div>

        <!-- 게임 모드 선택지 숨김 -->
        <div v-if="false" class="form-group">
          <label>게임 모드</label>
          <div class="radio-group">
            <label class="radio-option">
              <input
                type="radio"
                name="gameMode"
                value="roadview"
                v-model="formData.gameMode"
              />
              <div class="radio-content">
                <i class="fas fa-street-view"></i>
                <span>로드뷰 모드</span>
              </div>
            </label>
            <label class="radio-option disabled">
              <input
                type="radio"
                name="gameMode"
                value="photo"
                v-model="formData.gameMode"
                disabled
              />
              <div class="radio-content">
                <i class="fas fa-camera"></i>
                <span>포토 모드</span>
                <span class="badge-disabled">준비 중</span>
              </div>
            </label>
          </div>
        </div>

        <!-- 게임 타입 선택 -->
        <div class="form-group">
          <label>게임 타입</label>
          <div class="radio-group">
            <label class="radio-option">
              <input
                type="radio"
                name="gameType"
                value="solo"
                v-model="formData.gameType"
              />
              <div class="radio-content">
                <i class="fas fa-user"></i>
                <span>개인전</span>
              </div>
            </label>
            <label class="radio-option disabled">
              <input
                type="radio"
                name="gameType"
                value="team"
                v-model="formData.gameType"
                disabled
              />
              <div class="radio-content">
                <i class="fas fa-users"></i>
                <span>협동전</span>
                <span class="badge-disabled">준비 중</span>
              </div>
            </label>
          </div>
        </div>

        <!-- 인원 제한 및 라운드 수 가로 배치 -->
        <div class="form-group form-group-inline">
          <div class="inline-control-group">
            <div class="inline-control-item">
              <label>인원 제한</label>
              <div class="player-count-control">
                <button
                  class="count-btn"
                  @click="decreaseMaxPlayers"
                  :disabled="formData.maxPlayers <= 2"
                >
                  <i class="fas fa-minus"></i>
                </button>
                <span class="player-count">{{ formData.maxPlayers }}명</span>
                <button
                  class="count-btn"
                  @click="increaseMaxPlayers"
                  :disabled="formData.maxPlayers >= 8"
                >
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
            <div class="inline-control-item">
              <label>라운드 수</label>
              <div class="player-count-control">
                <button
                  class="count-btn"
                  @click="decreaseRounds"
                  :disabled="formData.rounds <= 2"
                >
                  <i class="fas fa-minus"></i>
                </button>
                <span class="player-count">{{ formData.rounds }}라운드</span>
                <button
                  class="count-btn"
                  @click="increaseRounds"
                  :disabled="formData.rounds >= 10"
                >
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 라운드 시간 제한 (라디오 버튼) -->
        <div class="form-group">
          <label>라운드 시간 제한</label>
          <div class="radio-group time-limit-radio-group">
            <label class="radio-option">
              <input
                type="radio"
                name="timeLimit"
                :value="60"
                v-model="formData.timeLimit"
              />
              <div class="radio-content">
                <span>1분</span>
              </div>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                name="timeLimit"
                :value="180"
                v-model="formData.timeLimit"
              />
              <div class="radio-content">
                <span>3분<span class="default-badge">(기본)</span></span>
              </div>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                name="timeLimit"
                :value="300"
                v-model="formData.timeLimit"
              />
              <div class="radio-content">
                <span>5분</span>
              </div>
            </label>
          </div>
        </div>

        <!-- 게임 설정 (지명 공개 상단 이동 및 설명 추가, 비공개 방 설명 스타일 통일) -->
        <div class="form-group">
          <label>게임 설정</label>
          <div class="settings-group">
            <label class="toggle-option">
              <div class="toggle-label-content">
                <span class="toggle-label-text">지명 공개</span>
                <span class="toggle-description">(좌표 지역 명이 공개됩니다.)</span>
              </div>
              <div class="toggle-switch">
                <input type="checkbox" v-model="formData.poiNameVisible" />
                <span class="toggle-slider"></span>
              </div>
            </label>
            <label class="toggle-option">
              <div class="toggle-label-content">
                <span class="toggle-label-text">비공개 방</span>
                <span class="toggle-description">(비밀번호로 입장 가능)</span>
              </div>
              <div class="toggle-switch">
                <input type="checkbox" v-model="formData.isPrivate" />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
        </div>

        <!-- 비밀번호 (비공개 방인 경우) -->
        <div v-if="formData.isPrivate" ref="passwordSectionRef" class="private-room-notice">
          <div class="form-group password-form">
            <input
              type="password"
              v-model="formData.password"
              placeholder="비밀번호를 입력하세요"
              maxlength="10"
              class="password-input"
            />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-button" @click="$emit('close')">취소</button>
        <button
          class="create-button"
          @click="saveSettings"
          :disabled="formData.isPrivate && !formData.password"
        >
          저장
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, watch, nextTick } from 'vue';

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

// 비밀번호 섹션 ref
const passwordSectionRef = ref(null);

// 폼 데이터 초기화
const formData = ref({
  title: '',
  gameMode: 'roadview',
  gameType: 'solo',
  rounds: 5,
  timeLimit: 180,
  maxPlayers: 8,
  isPrivate: false,
  poiNameVisible: true,
  password: ''
});

// 방 설정 저장
const saveSettings = () => {
  emit('save', { ...formData.value });
};

// 인원 수 증가/감소
const increaseMaxPlayers = () => {
  if (formData.value.maxPlayers < 8) {
    formData.value.maxPlayers++;
  }
};

const decreaseMaxPlayers = () => {
  if (formData.value.maxPlayers > 2) {
    formData.value.maxPlayers--;
  }
};

// 라운드 수 증가/감소
const increaseRounds = () => {
  if (formData.value.rounds < 10) {
    formData.value.rounds++;
  }
};

const decreaseRounds = () => {
  if (formData.value.rounds > 2) {
    formData.value.rounds--;
  }
};

// 비공개방 선택 시 스크롤 처리
watch(() => formData.value.isPrivate, async (newValue) => {
  if (newValue) {
    await nextTick();
    if (passwordSectionRef.value) {
      passwordSectionRef.value.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }
});

// 컴포넌트 마운트 시 초기 데이터 설정
onMounted(() => {
  // props로 받은 roomData로 폼 데이터 초기화
  if (props.roomData) {
    formData.value = {
      title: props.roomData.title || '',
      gameMode: props.roomData.gameMode || 'roadview',
      gameType: props.roomData.playerMatchTypeKey || props.roomData.gameType || 'solo',
      rounds: props.roomData.rounds || props.roomData.totalRounds || 5,
      timeLimit: props.roomData.timeLimit || 180,
      maxPlayers: props.roomData.maxPlayers || 8,
      isPrivate: props.roomData.isPrivate || false,
      poiNameVisible: props.roomData.poiNameVisible !== false,
      password: props.roomData.password || ''
    };
  }
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  animation: slideDown 0.3s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  background: linear-gradient(to right, rgba(240, 244, 248, 0.5), rgba(215, 227, 252, 0.5));
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #111827;
  font-weight: 700;
  position: relative;
  padding-bottom: 5px;
}

.modal-header h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #60a5fa, #8b5cf6);
  border-radius: 2px;
}

.close-button {
  background: rgba(240, 244, 248, 0.8);
  border: none;
  color: #64748b;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #1e293b;
  background: rgba(226, 232, 240, 1);
  transform: rotate(90deg);
}

.modal-body {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
  background: white;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 6px;
}

.form-group {
  margin-bottom: 1.5rem;
  animation: fadeInUp 0.4s ease-out;
  animation-fill-mode: both;
}

@keyframes fadeInUp {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}

.form-group input[type="text"],
.form-group input[type="password"] {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.3s ease;
  background-color: #f8fafc;
  color: #334155;
}

.form-group input[type="text"]:focus,
.form-group input[type="password"]:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
  background-color: white;
}

.form-group small {
  display: block;
  text-align: right;
  margin-top: 0.3rem;
  color: #999;
  font-size: 0.8rem;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.time-limit-radio-group {
  gap: 0.75rem;
}

.time-limit-radio-group .radio-option {
  flex: 1;
}

.time-limit-radio-group .radio-content {
  padding: 0.9rem 0.5rem;
  min-height: 60px;
  justify-content: center;
}

.time-limit-radio-group .radio-content span {
  font-size: 1rem;
  font-weight: 600;
}

.default-badge {
  color: #60a5fa;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.25rem;
}

.radio-option {
  flex: 1;
  position: relative;
  cursor: pointer;
}

.radio-option input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.radio-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.2rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s ease;
  background-color: #f8fafc;
}

.radio-content i {
  font-size: 1.5rem;
  color: #60a5fa;
  transition: all 0.3s ease;
}

.radio-option input:checked + .radio-content {
  border-color: #60a5fa;
  background: linear-gradient(135deg, rgba(240, 249, 255, 0.9), rgba(224, 242, 254, 0.9));
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
}

.radio-option input:checked + .radio-content i {
  color: #3b82f6;
  transform: scale(1.1);
}

/* 비활성화된 옵션 스타일 */
.radio-option.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.radio-option.disabled .radio-content {
  background-color: #f1f5f9;
  border-color: #e2e8f0;
  position: relative;
}

.radio-option.disabled .radio-content i {
  color: #94a3b8;
}

.radio-option.disabled .radio-content span {
  color: #94a3b8;
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

.form-group-inline {
  margin-bottom: 1.5rem;
}

.inline-control-group {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.inline-control-item {
  flex: 1;
}

.inline-control-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}

.player-count-control {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.count-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.count-btn:hover:not(:disabled) {
  background: #e2e8f0;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.count-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.player-count {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  min-width: 60px;
  text-align: center;
  background: #f8fafc;
  padding: 0.5rem 0.8rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.toggle-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.toggle-option:hover {
  background: rgba(240, 244, 248, 0.5);
}

.toggle-label-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.toggle-label-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.toggle-description {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 400;
  line-height: 1.4;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  flex-shrink: 0;
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
  transition: 0.4s;
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
  transition: 0.4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #60a5fa;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.toggle-switch input:focus + .toggle-slider {
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
}

.private-room-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 1.2rem;
  background: linear-gradient(135deg, rgba(240, 249, 255, 0.7), rgba(224, 242, 254, 0.7));
  border-radius: 12px;
  margin-top: 1rem;
  border: 1px solid rgba(186, 230, 253, 0.5);
  animation: fadeIn 0.3s ease-out;
}

.password-form {
  margin-top: 0;
  width: 100%;
}

.password-input {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.3s ease;
  background-color: white;
  color: #334155;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
}

.password-input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.2rem 1.5rem;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  background: linear-gradient(to right, rgba(240, 244, 248, 0.5), rgba(215, 227, 252, 0.5));
}

.cancel-button {
  padding: 0.8rem 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
}

.cancel-button:hover {
  background: #f8fafc;
  color: #334155;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.create-button {
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #60a5fa 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(96, 165, 250, 0.25);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.create-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #8b5cf6 0%, #60a5fa 100%);
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
}

.create-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(96, 165, 250, 0.35);
}

.create-button:hover:not(:disabled)::before {
  opacity: 1;
}

.create-button:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.7;
}

@media (max-width: 640px) {
  .modal-container {
    width: 95%;
    max-height: 90vh;
  }

  .modal-header h2 {
    font-size: 1.2rem;
  }

  .modal-body {
    padding: 1.2rem;
    max-height: calc(90vh - 120px);
  }

  .modal-footer {
    padding: 1rem 1.2rem;
  }

  .form-group {
    margin-bottom: 1.2rem;
  }

  .inline-control-group {
    flex-direction: column;
    gap: 1rem;
  }

  .inline-control-item {
    width: 100%;
  }

  .radio-group {
    flex-direction: column;
    gap: 0.8rem;
  }

  .time-limit-radio-group {
    flex-direction: row;
    gap: 0.5rem;
  }

  .time-limit-radio-group .radio-content {
    padding: 0.75rem 0.5rem;
    min-height: 50px;
    font-size: 0.9rem;
  }

  .player-count-control {
    gap: 0.75rem;
  }

  .count-btn {
    width: 36px;
    height: 36px;
    font-size: 0.85rem;
  }

  .player-count {
    font-size: 1rem;
    min-width: 50px;
    padding: 0.4rem 0.6rem;
  }

  .settings-group {
    gap: 0.7rem;
  }

  .toggle-option {
    padding: 0.6rem;
    gap: 0.75rem;
  }

  .toggle-label-text {
    font-size: 0.9rem;
  }

  .toggle-description {
    font-size: 0.75rem;
    line-height: 1.4;
  }

  .toggle-switch {
    width: 44px;
    height: 22px;
  }

  .toggle-slider:before {
    height: 16px;
    width: 16px;
    left: 3px;
    bottom: 3px;
  }

  .toggle-switch input:checked + .toggle-slider:before {
    transform: translateX(22px);
  }
}
</style>
