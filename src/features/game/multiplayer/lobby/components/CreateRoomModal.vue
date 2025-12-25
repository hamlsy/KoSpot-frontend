<template>
  <div class="modal-backdrop" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h2>새 게임방 만들기</h2>
        <button class="close-button" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="roomName">방 이름</label>
          <input
            type="text"
            id="roomName"
            v-model="roomName"
            placeholder="방 이름을 입력하세요"
            maxlength="30"
          />
          <small>{{ roomName.length }}/30</small>
        </div>

        <div class="form-group">
          <label>게임 모드</label>
          <div class="radio-group">
            <label class="radio-option">
              <input
                type="radio"
                name="gameMode"
                value="roadview"
                v-model="gameMode"
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
                v-model="gameMode"
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

        <div class="form-group">
          <label>게임 타입</label>
          <div class="radio-group">
            <label class="radio-option">
              <input
                type="radio"
                name="gameType"
                value="solo"
                v-model="gameType"
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
                v-model="gameType"
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

        <div class="form-group">
          <label>인원 제한</label>
          <div class="player-count-control">
            <button
              class="count-btn"
              @click="decreasePlayerCount"
              :disabled="maxPlayers <= 2"
            >
              <i class="fas fa-minus"></i>
            </button>
            <span class="player-count">{{ maxPlayers }}명</span>
            <button
              class="count-btn"
              @click="increasePlayerCount"
              :disabled="maxPlayers >= 8"
            >
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>라운드 수</label>
          <div class="player-count-control">
            <button
              class="count-btn"
              @click="decreaseTotalRounds"
              :disabled="totalRounds <= 2"
            >
              <i class="fas fa-minus"></i>
            </button>
            <span class="player-count">{{ totalRounds }}라운드</span>
            <button
              class="count-btn"
              @click="increaseTotalRounds"
              :disabled="totalRounds >= 10"
            >
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>라운드 시간 제한</label>
          <div class="time-limit-control">
            <button
              class="count-btn"
              @click="decreaseTimeLimit"
              :disabled="timeLimit <= 30"
            >
              <i class="fas fa-minus"></i>
            </button>
            <span class="player-count time-display">{{ formattedTimeLimit }}</span>
            <button
              class="count-btn"
              @click="increaseTimeLimit"
              :disabled="timeLimit >= 300"
            >
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>게임 설정</label>
          <div class="settings-group">
            <label class="checkbox-option">
              <input type="checkbox" v-model="gameSettings.isPrivate" />
              <span> 비공개 방 (비밀번호로 입장 가능)</span>
            </label>
            <label class="checkbox-option">
              <input type="checkbox" v-model="gameSettings.isPoiNameVisible" />
              <span> 지명 공개</span>
            </label>
            <!-- <label class="checkbox-option">
              <input type="checkbox" v-model="gameSettings.allowSpectators" />
              <span>관전자 허용</span>
            </label> -->
          </div>
        </div>

        <div v-if="gameSettings.isPrivate" class="private-room-notice">
          <div class="form-group password-form">
            <input
              type="password"
              v-model="password"
              placeholder="비밀번호를 입력하세요"
              maxlength="10"
              class="password-input"
            />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-button" @click="closeModal">취소</button>
        <button
          class="create-button"
          @click="createRoom"
          :disabled="!roomName.trim()"
        >
          방 만들기
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CreateRoomModal",

  data() {
    return {
      roomName: "",
      gameMode: "roadview",
      maxPlayers: 4,
      gameType: "solo",
      timeLimit: 180,
      totalRounds: 5,
      password: "",
      gameSettings: {
        isPrivate: false,
        allowSpectators: true,
        useVoiceChat: false,
        isPoiNameVisible: true,
      },
    };
  },

  computed: {
    formattedTimeLimit() {
      const minutes = Math.floor(this.timeLimit / 60);
      const seconds = this.timeLimit % 60;
      if (minutes === 0) {
        return `${seconds}초`;
      } else if (seconds === 0) {
        return `${minutes}분`;
      } else {
        return `${minutes}분 ${seconds}초`;
      }
    },
  },

  methods: {
    closeModal() {
      this.$emit("close");
    },

    createRoom() {
      if (!this.roomName.trim()) return;

      // gameType을 백엔드 형식으로 변환 (solo, team)
      const playerMatchTypeKey = this.gameType;

      const roomData = {
        title: this.roomName,
        password: this.password || null,
        gameModeKey: this.gameMode,
        timeLimit: this.timeLimit,
        totalRounds: this.totalRounds,
        playerMatchTypeKey: playerMatchTypeKey,
        maxPlayers: this.maxPlayers,
        privateRoom: this.gameSettings.isPrivate,
        isPoiNameVisible: this.gameSettings.isPoiNameVisible === false ? false : true
      };

      this.$emit("create-room", roomData);
    },

    increasePlayerCount() {
      if (this.maxPlayers < 8) {
        this.maxPlayers++;
      }
    },

    decreasePlayerCount() {
      if (this.maxPlayers > 2) {
        this.maxPlayers--;
      }
    },

    increaseTotalRounds() {
      if (this.totalRounds < 10) {
        this.totalRounds++;
      }
    },

    decreaseTotalRounds() {
      if (this.totalRounds > 2) {
        this.totalRounds--;
      }
    },

    increaseTimeLimit() {
      if (this.timeLimit < 300) {
        this.timeLimit += 30;
      }
    },

    decreaseTimeLimit() {
      if (this.timeLimit > 30) {
        this.timeLimit -= 30;
      }
    },
  },
};
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

.form-group:nth-child(1) { animation-delay: 0.1s; }
.form-group:nth-child(2) { animation-delay: 0.2s; }
.form-group:nth-child(3) { animation-delay: 0.3s; }
.form-group:nth-child(4) { animation-delay: 0.4s; }
.form-group:nth-child(5) { animation-delay: 0.5s; }

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}

.form-group input[type="text"],
.form-group select {
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
.form-group select:focus {
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

.select-container {
  position: relative;
}

.select-container select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: none;
  border: none;
  outline: none;
  padding: 0.8rem 1rem;
  padding-right: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #333;
}

.select-container i {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  pointer-events: none;
  color: #666;
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

.time-limit-control {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.time-display {
  min-width: 100px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
}

.checkbox-option input {
  width: 20px;
  height: 20px;
  accent-color: #60a5fa;
  cursor: pointer;
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

.private-room-notice i {
  color: #667eea;
  font-size: 1.2rem;
}

.private-room-notice p {
  margin: 0;
  font-size: 0.9rem;
  color: #555;
  line-height: 1.4;
}

.password-form {
  margin-top: 10px;
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
  }

  .radio-group {
    flex-direction: column;
    gap: 0.8rem;
  }

  .modal-header h2 {
    font-size: 1.2rem;
  }

  .modal-body {
    padding: 1.2rem;
  }

  .modal-footer {
    padding: 1rem 1.2rem;
  }
}
</style>
