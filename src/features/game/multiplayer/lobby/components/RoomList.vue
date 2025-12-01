<template>
  <div class="game-rooms-panel">
    <div class="panel-header">
      <div class="panel-title-section">
        <h2 class="panel-title">게임 방 목록</h2>
        <div v-if="loading" class="header-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span class="loading-text">새로고침 중...</span>
        </div>
      </div>
      <div class="room-actions">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="방 이름 또는 지역 검색" 
          />
          <i class="fas fa-search"></i>
        </div>
        <button class="refresh-button" @click="refreshRooms" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
        </button>
      </div>
    </div>
    
    <div class="rooms-container" v-if="rooms && rooms.length > 0">
      <div 
        v-for="room in rooms" 
        :key="room.gameRoomId"
        class="room-card"
        :class="{ 'playing': room.gameRoomStatus === '게임 중' }"
        @click="joinRoom(room)"
      >
        <div class="room-content">
          <div class="room-header">
            <div class="room-info">
              <h3 class="room-name">{{ room.title }}</h3>
              <span class="room-host">방장: {{ room.hostNickname }}</span>
            </div>
            <div class="room-badges">
              <span 
                class="mode-badge"
                :class="{ 
                  'roadview-mode': room.gameMode === '로드뷰',
                  'photo-mode': room.gameMode === '포토모드'
                }"
              >
                <i :class="room.gameMode === '로드뷰' ? 'fas fa-street-view' : 'fas fa-camera'"></i>
                {{ room.gameMode }}
              </span>
              <span 
                class="type-badge"
                :class="{ 
                  'solo': room.gameType === '개인전',
                  'team': room.gameType === '팀전'
                }"
              >
                <i :class="room.gameType === '개인전' ? 'fas fa-user' : 'fas fa-users'"></i>
                {{ room.gameType }}
              </span>
              <span 
                class="status-badge"
                :class="{ 
                  'waiting': room.gameRoomStatus === '대기 중',
                  'playing': room.gameRoomStatus === '게임 중'
                }"
              >
                {{ room.gameRoomStatus }}
              </span>
            </div>
          </div>
          
          <div class="room-details">
            <div class="detail-item">
              <i class="fas fa-users"></i>
              <span>{{ room.currentPlayerCount }}/{{ room.maxPlayers }}명</span>
            </div>
            <div class="detail-item" v-if="room.privateRoom">
              <i class="fas fa-lock"></i>
              <span>비밀방</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="empty-state" v-else>
      <i class="fas fa-gamepad"></i>
      <p>현재 생성된 방이 없습니다.</p>
    </div>

    <!-- 비밀번호 입력 모달 -->
    <div class="modal-overlay" v-if="showPasswordModal">
      <div class="password-modal">
        <h3>비밀번호 입력</h3>
        <input 
          type="password" 
          v-model="passwordInput"
          placeholder="비밀번호를 입력하세요"
          @keyup.enter="handlePasswordSubmit(passwordInput)"
        />
        <div class="modal-actions">
          <button class="cancel-button" @click="showPasswordModal = false">취소</button>
          <button class="submit-button" @click="handlePasswordSubmit(passwordInput)">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "GameRoomList",
  
  props: {
    rooms: {
      type: Array,
      required: true,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      searchQuery: '',
      showPasswordModal: false,
      selectedRoom: null,
      passwordInput: ''
    };
  },
  
  created() {
    console.log('GameRoomList created:', this.rooms);
  },
  
  watch: {
    rooms: {
      handler(newRooms) {
        console.log('Rooms updated:', newRooms);
      },
      immediate: true
    }
  },
  
  methods: {
    refreshRooms() {
      this.$emit('refresh-rooms');
    },
    
    joinRoom(room) {
      // FindGameRoomResponse 구조에 맞는 검증 로직
      if (room.currentPlayerCount >= room.maxPlayers) {
        alert('방이 가득 찼습니다.');
        return;
      }
      
      // Spring에서 올 수 있는 gameRoomStatus 값들 체크
      if (room.gameRoomStatus === '게임 중' || room.gameRoomStatus === 'PLAYING') {
        alert('이미 게임이 진행중인 방입니다.');
        return;
      }
      
      // 비밀방인 경우 비밀번호 모달 표시
      if (room.privateRoom) {
        this.selectedRoom = room;
        this.showPasswordModal = true;
        this.passwordInput = '';
      } else {
        // 공개방인 경우 즉시 입장 (room 객체 전체를 전달)
        this.$emit('join-room', room);
      }
    },
    
    handlePasswordSubmit(password) {
      if (!this.selectedRoom) return;
      
      // Spring API에서 비밀번호 검증이 서버에서 이루어지므로
      // 프론트엔드에서는 빈 비밀번호만 체크
      if (!password || password.trim() === '') {
        alert('비밀번호를 입력해주세요.');
        return;
      }
      
      // room 객체와 비밀번호를 함께 전달
      this.$emit('join-room', this.selectedRoom, password);
      this.showPasswordModal = false;
      this.selectedRoom = null;
      this.passwordInput = '';
    }
  }
};
</script>

<style scoped>
.game-rooms-panel {
  flex: 1;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 600px;
  border: 1px solid var(--color-border);
  transition: all var(--transition-normal);
}

.panel-header {
  padding: var(--spacing-lg) var(--spacing-xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid var(--color-border);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.03) 0%, rgba(59, 130, 246, 0.03) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.panel-title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.panel-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: var(--color-text-primary);
  position: relative;
  padding-bottom: 2px;
}

.header-loading {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.header-loading i {
  color: var(--color-primary);
  font-size: 0.85rem;
}

.loading-text {
  animation: fadeInOut 2s infinite;
}

.panel-title::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-sm);
}

.room-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.search-box {
  position: relative;
}

.search-box input {
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-family: var(--font-body);
  font-size: 0.9rem;
  transition: all var(--transition-normal);
  width: 180px;
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.search-box input::placeholder {
  color: var(--color-text-tertiary);
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  width: 240px;
  background-color: var(--color-surface);
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  transition: color var(--transition-normal);
}

.search-box input:focus + i {
  color: var(--color-primary);
}

.refresh-button {
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  color: var(--color-primary);
  font-size: 1rem;
  cursor: pointer;
  padding: var(--spacing-sm);
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-button:hover:not(:disabled) {
  background: var(--color-surface);
  transform: rotate(180deg);
  box-shadow: var(--shadow-sm);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.refresh-button:disabled:hover {
  background: var(--color-surface-hover);
  transform: none;
  box-shadow: none;
  border-color: var(--color-border);
}

.rooms-container {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background: linear-gradient(to bottom, var(--color-background), var(--color-surface));
  scrollbar-width: thin;
  scrollbar-color: var(--color-primary) transparent;
}

.rooms-container::-webkit-scrollbar {
  width: 6px;
}

.rooms-container::-webkit-scrollbar-track {
  background: transparent;
}

.rooms-container::-webkit-scrollbar-thumb {
  background-color: var(--color-border-dark);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-normal);
}

.rooms-container::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-primary);
}

.room-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
  border: 2px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  position: relative;
  overflow: hidden;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  animation: slideIn 0.4s ease-out;
  animation-fill-mode: both;
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.room-card:nth-child(1) { animation-delay: 0.05s; }
.room-card:nth-child(2) { animation-delay: 0.1s; }
.room-card:nth-child(3) { animation-delay: 0.15s; }
.room-card:nth-child(4) { animation-delay: 0.2s; }
.room-card:nth-child(5) { animation-delay: 0.25s; }

.room-card.playing {
  border-left-color: var(--color-warning);
  cursor: not-allowed;
  opacity: 0.85;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, var(--color-surface) 100%);
}

.room-card:not(.playing):hover {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.02) 0%, var(--color-surface) 100%);
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.room-info {
  flex: 1;
}

.room-name {
  margin: 0 0 var(--spacing-xs) 0;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  color: var(--color-text-primary);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.room-host {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 500;
}

.room-host::before {
  content: '👑';
  font-size: 0.9rem;
}

.room-badges {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.mode-badge, .status-badge, .type-badge {
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-full);
  font-family: var(--font-heading);
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(255, 255, 255, 0.8);
  letter-spacing: 0.02em;
}

.roadview-mode {
  background: linear-gradient(135deg, var(--color-success) 0%, #059669 100%);
  color: white;
}

.photo-mode {
  background: linear-gradient(135deg, var(--color-primary) 0%, #1d4ed8 100%);
  color: white;
}

.waiting {
  background: linear-gradient(135deg, var(--color-info) 0%, #2563eb 100%);
  color: white;
}

.playing {
  background: linear-gradient(135deg, var(--color-warning) 0%, #d97706 100%);
  color: white;
}

.solo {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.team {
  background: linear-gradient(135deg, var(--color-secondary) 0%, #0891b2 100%);
  color: white;
}

.round-info {
  margin-left: 0.3rem;
  font-weight: 700;
  border-left: 1px solid rgba(230, 81, 0, 0.3);
  padding-left: 0.3rem;
}

.room-details {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-surface-hover);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.detail-item i {
  color: var(--color-primary);
  font-size: 0.95rem;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl) 0;
  color: var(--color-text-tertiary);
  background: linear-gradient(to bottom, var(--color-background), var(--color-surface));
  animation: fadeIn 0.5s ease-out;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.3;
  animation: pulse 2.5s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.empty-state p {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

/* 비밀번호 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.password-modal {
  background: var(--color-surface);
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  width: 90%;
  max-width: 400px;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-border);
  animation: slideDown 0.3s ease-out;
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

.password-modal h3 {
  margin: 0 0 var(--spacing-xl) 0;
  font-family: var(--font-heading);
  color: var(--color-text-primary);
  font-size: var(--font-size-h3);
  font-weight: 700;
  position: relative;
  padding-bottom: var(--spacing-xs);
}

.password-modal h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-sm);
}

.password-modal input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-family: var(--font-body);
  font-size: 0.95rem;
  margin-bottom: var(--spacing-xl);
  outline: none;
  transition: all var(--transition-normal);
  background-color: var(--color-surface-hover);
  color: var(--color-text-primary);
}

.password-modal input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  background-color: var(--color-surface);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.cancel-button, .submit-button {
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-lg);
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.cancel-button {
  background: var(--color-surface);
  border: 2px solid var(--color-border);
  color: var(--color-text-secondary);
  box-shadow: var(--shadow-sm);
}

.submit-button {
  background: linear-gradient(135deg, var(--color-primary) 0%, #1d4ed8 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.cancel-button:hover {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-dark);
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .room-actions {
    width: 100%;
  }
  
  .search-box {
    width: 100%;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .search-box input:focus {
    width: 100%;
  }
  
  .room-details {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style> 