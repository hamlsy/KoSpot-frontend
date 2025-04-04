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
                value="로드뷰"
                v-model="gameMode"
              />
              <div class="radio-content">
                <i class="fas fa-street-view"></i>
                <span>로드뷰 모드</span>
              </div>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                name="gameMode"
                value="포토"
                v-model="gameMode"
              />
              <div class="radio-content">
                <i class="fas fa-camera"></i>
                <span>포토 모드</span>
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
                value="individual"
                v-model="gameType"
              />
              <div class="radio-content">
                <i class="fas fa-user"></i>
                <span>개인전</span>
              </div>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                name="gameType"
                value="cooperative"
                v-model="gameType"
              />
              <div class="radio-content">
                <i class="fas fa-users"></i>
                <span>협동전</span>
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
          <label>게임 설정</label>
          <div class="settings-group">
            <label class="checkbox-option">
              <input type="checkbox" v-model="gameSettings.isPrivate" />
              <span>비공개 방 (비밀번호로 입장 가능)</span>
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
      gameMode: "로드뷰",
      region: "전국",
      maxPlayers: 4,
      gameType: "individual",
      password: "",
      gameSettings: {
        isPrivate: false,
        allowSpectators: true,
        useVoiceChat: false,
      },
    };
  },

  methods: {
    closeModal() {
      this.$emit("close");
    },

    createRoom() {
      if (!this.roomName.trim()) return;

      const roomData = {
        name: this.roomName,
        gameMode: this.gameMode,
        region: this.region,
        maxPlayers: this.maxPlayers,
        gameType: this.gameType,
        settings: { ...this.gameSettings },
        privacy: this.gameSettings.isPrivate ? "private" : "public",
        password: this.password,
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-button:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}

.form-group input[type="text"],
.form-group select {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.3s ease;
}

.form-group input[type="text"]:focus,
.form-group select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
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
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.radio-content i {
  font-size: 1.5rem;
  color: #667eea;
}

.radio-option input:checked + .radio-content {
  border-color: #667eea;
  background: #f0f2fa;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
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
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  border: none;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
}

.count-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.count-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.player-count {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  min-width: 50px;
  text-align: center;
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
  width: 18px;
  height: 18px;
  accent-color: #667eea;
}

.private-room-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 1rem;
  background: #f0f2fa;
  border-radius: 8px;
  margin-top: 1rem;
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
  padding: 0.8rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.3s ease;
}

.password-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.2rem 1.5rem;
  border-top: 1px solid #eee;
}

.cancel-button {
  padding: 0.7rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background: #f0f0f0;
  color: #333;
}

.create-button {
  padding: 0.7rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

.create-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
}

.create-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
