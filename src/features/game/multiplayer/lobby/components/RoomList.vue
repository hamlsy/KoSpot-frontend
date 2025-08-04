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
        :key="room.id"
        class="room-card"
        :class="{ 'playing': room.status === 'playing' }"
        @click="joinRoom(room)"
      >
        <div class="room-content">
          <div class="room-header">
            <div class="room-info">
              <h3 class="room-name">{{ room.name }}</h3>
              <span class="room-host">방장: {{ room.host }}</span>
            </div>
            <div class="room-badges">
              <span 
                class="mode-badge"
                :class="{ 
                  'roadview-mode': room.mode === '로드뷰',
                  'photo-mode': room.mode === '포토'
                }"
              >
                <i :class="room.mode === '로드뷰' ? 'fas fa-street-view' : 'fas fa-camera'"></i>
                {{ room.mode }}
              </span>
              <span 
                class="status-badge"
                :class="{ 
                  'waiting': room.status === 'waiting',
                  'playing': room.status === 'playing'
                }"
              >
                {{ room.status === 'waiting' ? '대기중' : '게임중' }}
                <span v-if="room.status === 'playing' && room.currentRound" class="round-info">
                  {{ room.currentRound }}/{{ room.totalRounds }}R
                </span>
              </span>
            </div>
          </div>
          
          <div class="room-details">
            <div class="detail-item">
              <i class="fas fa-users"></i>
              <span>{{ room.players }}/{{ room.maxPlayers }}명</span>
            </div>
            <div class="detail-item" v-if="room.isPrivate">
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
      if (room.players >= room.maxPlayers) {
        alert('방이 가득 찼습니다.');
        return;
      }
      
      if (room.status === 'playing') {
        alert('이미 게임이 진행중인 방입니다.');
        return;
      }
      
      if (room.isPrivate) {
        this.selectedRoom = room;
        this.showPasswordModal = true;
        this.passwordInput = '';
      } else {
        this.$emit('join-room', room.id);
      }
    },
    
    handlePasswordSubmit(password) {
      if (!this.selectedRoom) return;
      
      if (password === this.selectedRoom.password) {
        this.$emit('join-room', this.selectedRoom.id);
        this.showPasswordModal = false;
        this.selectedRoom = null;
      } else {
        alert('비밀번호가 일치하지 않습니다.');
      }
    },
    
    formatTimeAgo(timestamp) {
      const now = new Date();
      const roomDate = new Date(timestamp);
      const diffMs = now - roomDate;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return '방금 전';
      if (diffMins < 60) return `${diffMins}분 전`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}시간 전`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}일 전`;
    }
  }
};
</script>

<style scoped>
.game-rooms-panel {
  flex: 1;
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 600px;
  border: 1px solid rgba(240, 244, 248, 0.8);
  transition: all 0.3s ease;
}

.panel-header {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  background: linear-gradient(to right, rgba(240, 244, 248, 0.5), rgba(215, 227, 252, 0.5));
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.panel-title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.panel-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #111827;
  position: relative;
  padding-bottom: 5px;
}

.header-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
}

.header-loading i {
  color: #60a5fa;
  font-size: 0.85rem;
}

.loading-text {
  animation: fadeInOut 2s infinite;
}

.panel-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #60a5fa, #8b5cf6);
  border-radius: 2px;
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
  padding: 0.6rem 0.8rem 0.6rem 2.2rem;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  width: 180px;
  background-color: rgba(248, 250, 252, 0.8);
  color: #334155;
}

.search-box input:focus {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
  width: 240px;
  background-color: white;
}

.search-box i {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  transition: color 0.3s ease;
}

.search-box input:focus + i {
  color: #60a5fa;
}

.refresh-button {
  background: rgba(240, 244, 248, 0.8);
  border: 1px solid #e2e8f0;
  color: #60a5fa;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.6rem;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refresh-button:hover:not(:disabled) {
  background: white;
  transform: rotate(180deg);
  box-shadow: 0 4px 8px rgba(96, 165, 250, 0.15);
  color: #3b82f6;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.refresh-button:disabled:hover {
  background: rgba(240, 244, 248, 0.8);
  transform: none;
  box-shadow: none;
}

.rooms-container {
  flex: 1;
  padding: 1.2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: #f8fafc;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.rooms-container::-webkit-scrollbar {
  width: 6px;
}

.rooms-container::-webkit-scrollbar-track {
  background: transparent;
}

.rooms-container::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 6px;
}

.room-card {
  background: white;
  border-radius: 16px;
  padding: 1rem 1.2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  border-left: 4px solid #60a5fa;
  position: relative;
  overflow: hidden;
  min-height: 105px;
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
  border-left-color: #f59e0b;
  cursor: not-allowed;
  opacity: 0.9;
  background: linear-gradient(to right, rgba(255, 247, 237, 0.5), white);
}

.room-card:not(.playing):hover {
  background-color: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.06);
}

.room-info {
  flex: 1;
}

.room-name {
  margin: 0 0 0.3rem 0;
  font-size: 1.05rem;
  color: #111827;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.room-host {
  font-size: 0.85rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.room-host::before {
  content: '👑';
  font-size: 0.8rem;
}

.room-badges {
  display: flex;
  gap: 0.5rem;
}

.mode-badge, .status-badge {
  padding: 0.35rem 0.7rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.7);
}

.roadview-mode {
  background: linear-gradient(135deg, #dcfce7, #d1fae5);
  color: #16a34a;
}

.photo-mode {
  background: linear-gradient(135deg, #dbeafe, #e0f2fe);
  color: #2563eb;
}

.waiting {
  background: linear-gradient(135deg, #e0e7ff, #ddd6fe);
  color: #4f46e5;
}

.playing {
  background: linear-gradient(135deg, #fef3c7, #ffedd5);
  color: #d97706;
}

.round-info {
  margin-left: 0.3rem;
  font-weight: 700;
  border-left: 1px solid rgba(230, 81, 0, 0.3);
  padding-left: 0.3rem;
}

.room-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #64748b;
  background: #f8fafc;
  padding: 0.4rem 0.7rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.detail-item i {
  color: #60a5fa;
  font-size: 0.9rem;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: #94a3b8;
  background-color: #f8fafc;
  animation: fadeIn 0.5s ease-out;
}

.empty-state i {
  font-size: 3.5rem;
  margin-bottom: 1.2rem;
  color: #cbd5e1;
  background: linear-gradient(135deg, #60a5fa, #8b5cf6);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.4;
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.empty-state p {
  margin: 0 0 1.2rem 0;
  font-size: 1rem;
  font-weight: 500;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
}

/* 비밀번호 모달 스타일 */
.modal-overlay {
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

.password-modal {
  background: white;
  padding: 1.5rem;
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.8);
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
  margin: 0 0 1.2rem 0;
  color: #111827;
  font-size: 1.2rem;
  font-weight: 700;
  position: relative;
  padding-bottom: 5px;
}

.password-modal h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #60a5fa, #8b5cf6);
  border-radius: 2px;
}

.password-modal input {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  margin-bottom: 1.2rem;
  outline: none;
  transition: all 0.3s ease;
  background-color: #f8fafc;
  color: #334155;
}

.password-modal input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
  background-color: white;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
}

.cancel-button, .submit-button {
  padding: 0.7rem 1.2rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button {
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
}

.submit-button {
  background: linear-gradient(135deg, #60a5fa 0%, #8b5cf6 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 15px rgba(96, 165, 250, 0.25);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.submit-button::before {
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

.cancel-button:hover {
  background: #f8fafc;
  color: #334155;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(96, 165, 250, 0.35);
}

.submit-button:hover::before {
  opacity: 1;
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