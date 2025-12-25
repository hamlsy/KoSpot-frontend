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
        :class="roomCardClass(room)"
        @click="joinRoom(room)"
      >
        <!-- 좌측 상태 바 -->
        <div class="room-status-bar"></div>
        
        <div class="room-content">
          <div class="room-header">
            <div class="room-badges">
              <span class="status-chip" :class="statusChipClass(room)">
                <span class="status-dot"></span>
                {{ isPlaying(room) ? '진행 중' : '대기 중' }}
              </span>
              <span v-if="room.privateRoom" class="lock-badge">
                <i class="fas fa-lock"></i>
              </span>
            </div>
          </div>
          
          <div class="room-main">
            <div class="room-info">
              <h3 class="room-name">{{ room.title }}</h3>
              <div class="room-host">
                <i class="fas fa-user"></i>
                <span>{{ room.hostNickname }}</span>
              </div>
            </div>
          </div>
          
          <div class="room-meta">
            <span class="meta-tag">
              <i :class="room.gameMode === '로드뷰' ? 'fas fa-street-view' : 'fas fa-camera'"></i>
              {{ room.gameMode }}
            </span>
            <span class="meta-divider"></span>
            <span class="meta-tag">
              <i :class="room.gameType === '개인전' ? 'fas fa-user' : 'fas fa-users'"></i>
              {{ room.gameType }}
            </span>
            <span class="meta-divider" v-if="room.totalRounds || room.timeLimit"></span>
            <span class="meta-tag" v-if="room.totalRounds">
              <i class="fas fa-redo"></i>
              {{ room.totalRounds }}라운드
            </span>
            <span class="meta-divider" v-if="room.totalRounds && room.timeLimit"></span>
            <span class="meta-tag" v-if="room.timeLimit">
              <i class="fas fa-clock"></i>
              {{ formatTime(room.timeLimit) }}
            </span>
          </div>
          
          <div class="room-footer">
            <div class="player-bar-wrapper">
              <div class="player-bar">
                <div class="player-fill" :style="{ width: playerPercentage(room) + '%' }"></div>
              </div>
              <span class="player-count">{{ room.currentPlayerCount }}/{{ room.maxPlayers }}</span>
            </div>
            <span class="join-text" v-if="!isPlaying(room)">입장하기 →</span>
            <span class="join-text disabled" v-else>진행 중</span>
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
    
    isPlaying(room) {
      return room.gameRoomStatus === '게임 중' || room.gameRoomStatus === 'PLAYING';
    },
    
    roomCardClass(room) {
      return {
        'is-playing': this.isPlaying(room),
        'is-private': !this.isPlaying(room) && room.privateRoom,
        'is-public': !this.isPlaying(room) && !room.privateRoom
      };
    },
    
    statusChipClass(room) {
      return {
        'status-playing': this.isPlaying(room),
        'status-private': !this.isPlaying(room) && room.privateRoom,
        'status-public': !this.isPlaying(room) && !room.privateRoom
      };
    },
    
    playerPercentage(room) {
      return (room.currentPlayerCount / room.maxPlayers) * 100;
    },
    
    formatTime(seconds) {
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      if (sec === 0) {
        return `${min}분`;
      } else if (min === 0) {
        return `${sec}초`;
      } else {
        return `${min}:${String(sec).padStart(2, '0')}`;
      }
    },
    
    joinRoom(room) {
      // FindGameRoomResponse 구조에 맞는 검증 로직
      if (room.currentPlayerCount >= room.maxPlayers) {
        alert('방이 가득 찼습니다.');
        return;
      }
      
      // Spring에서 올 수 있는 gameRoomStatus 값들 체크
      if (this.isPlaying(room)) {
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
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 600px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}

.panel-header {
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
  background: #fafafa;
}

.panel-title-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.panel-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.panel-title i {
  color: #10b981;
  font-size: 1rem;
}

.header-loading {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 500;
}

.header-loading i {
  color: #10b981;
  font-size: 0.75rem;
}

.loading-text {
  animation: fadeInOut 2s infinite;
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
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
}

.search-box i {
  color: #9ca3af;
  font-size: 0.8rem;
}

.search-box input {
  border: none;
  outline: none;
  font-size: 0.8rem;
  width: 140px;
  color: #374151;
  background: transparent;
}

.search-box input::placeholder {
  color: #9ca3af;
}

.refresh-button {
  width: 34px;
  height: 34px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.refresh-button:hover:not(:disabled) {
  background: #f3f4f6;
  color: #374151;
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rooms-container {
  flex: 1;
  padding: 0.75rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  scrollbar-width: thin;
  scrollbar-color: #10b981 transparent;
}

.rooms-container::-webkit-scrollbar {
  width: 4px;
}

.rooms-container::-webkit-scrollbar-track {
  background: rgba(16, 185, 129, 0.1);
}

.rooms-container::-webkit-scrollbar-thumb {
  background: #10b981;
  border-radius: 2px;
}

.room-card {
  position: relative;
  background: #ffffff;
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  display: flex;
  animation: slideIn 0.4s ease-out;
  animation-fill-mode: both;
}

.room-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

/* 좌측 상태 바 */
.room-status-bar {
  width: 5px;
  flex-shrink: 0;
}

.is-public .room-status-bar {
  background: linear-gradient(180deg, #10b981, #059669);
}

.is-private .room-status-bar {
  background: linear-gradient(180deg, #6366f1, #4f46e5);
}

.is-playing .room-status-bar {
  background: linear-gradient(180deg, #f59e0b, #d97706);
}

.is-playing {
  opacity: 0.65;
  cursor: not-allowed;
}

.is-playing:hover {
  transform: none;
  box-shadow: none;
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

.room-content {
  flex: 1;
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 헤더 */
.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-badges {
  display: flex;
  gap: 0.3rem;
  margin-left: auto;
}

.status-chip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: 2px;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.status-chip.status-public {
  background: #ecfdf5;
  color: #059669;
}

.status-chip.status-private {
  background: #eef2ff;
  color: #4f46e5;
}

.status-chip.status-playing {
  background: #fef3c7;
  color: #d97706;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-chip.status-public .status-dot {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.lock-badge {
  width: 28px;
  height: 28px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

.lock-badge i {
  color: #6366f1;
  font-size: 0.7rem;
}

/* 메인 영역 */
.room-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.room-info {
  flex: 1;
  min-width: 0;
}

.room-name {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-host {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.room-host i {
  font-size: 0.65rem;
}

/* 메타 정보 */
.room-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.meta-tag {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  color: #6b7280;
}

.meta-tag i {
  font-size: 0.65rem;
  color: #9ca3af;
}

.meta-divider {
  width: 3px;
  height: 3px;
  background: #d1d5db;
  border-radius: 50%;
}

/* 푸터 */
.room-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
}

.player-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.player-bar {
  flex: 1;
  max-width: 100px;
  height: 4px;
  background: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;
}

.player-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.is-public .player-fill {
  background: #10b981;
}

.is-private .player-fill {
  background: #6366f1;
}

.is-playing .player-fill {
  background: #f59e0b;
}

.player-count {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  color: #374151;
}

.join-text {
  font-size: 0.7rem;
  font-weight: 600;
  transition: transform 0.2s ease;
}

.is-public .join-text { color: #059669; }
.is-private .join-text { color: #4f46e5; }

.room-card:hover .join-text:not(.disabled) {
  transform: translateX(3px);
}

.join-text.disabled {
  color: #9ca3af;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: #9ca3af;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #d1d5db;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
}

/* 비밀번호 모달 스타일 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.password-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 360px;
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

.password-modal h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.password-modal input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  margin: 1.25rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.password-modal input:focus {
  border-color: #6366f1;
}

.modal-actions {
  display: flex;
  gap: 0.6rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-button, .submit-button {
  flex: 1;
  padding: 0.7rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-button {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.submit-button {
  background: #6366f1;
  border: none;
  color: white;
}

.submit-button:hover {
  background: #4f46e5;
}

@media (max-width: 768px) {
  .game-rooms-panel {
    max-height: none;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }
  
  .panel-title {
    font-size: 1rem;
  }
  
  .room-actions {
    width: 100%;
    gap: 0.5rem;
  }
  
  .search-box {
    width: 100%;
  }
  
  .search-box input {
    width: 100%;
    padding: 0.4rem 0.6rem 0.4rem 2rem;
    font-size: 0.8rem;
  }
  
  .search-box input:focus {
    width: 100%;
  }
  
  .search-box i {
    left: 0.6rem;
    font-size: 0.8rem;
  }
  
  .refresh-button {
    width: 34px;
    height: 34px;
    font-size: 0.85rem;
  }
  
  .rooms-container {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  /* 카드 높이 및 내부 요소 축소 */
  .room-card {
    min-height: auto;
  }

  .room-content {
    padding: 0.75rem 0.875rem;
  }

  .room-name {
    font-size: 0.85rem;
  }

  .room-host {
    font-size: 0.7rem;
  }

  .meta-tag {
    font-size: 0.65rem;
  }

  .player-bar {
    max-width: 80px;
  }
  
  .empty-state {
    padding: 1.5rem 0;
  }
  
  .empty-state i {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }
  
  .empty-state p {
    font-size: 0.85rem;
    padding: 0.6rem 1rem;
  }
}
</style> 