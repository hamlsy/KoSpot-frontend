<template>
  <div class="game-rooms-panel">
    <div class="panel-header">
      <h2 class="panel-title">게임 방 목록</h2>
      <div class="room-actions">
        <div class="search-box">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="방 이름 또는 지역 검색" 
          />
          <i class="fas fa-search"></i>
        </div>
        <button class="refresh-button" @click="refreshRooms">
          <i class="fas fa-sync-alt"></i>
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
              <i class="fas fa-map-marker-alt"></i>
              <span>{{ room.region }}</span>
            </div>
            <div class="detail-item">
              <i class="fas fa-users"></i>
              <span>{{ room.players }}/{{ room.maxPlayers }}명</span>
            </div>
            <div class="detail-item">
              <i class="fas fa-clock"></i>
              <span>{{ formatTimeAgo(room.createdAt) }}</span>
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
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 600px;
}

.panel-header {
  padding: 1rem 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  background: linear-gradient(to right, #f8f9fa, #f1f3f9);
}

.panel-title {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
  position: relative;
  font-weight: 700;
}

.panel-title::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 30px;
  height: 3px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

.room-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 0.6rem 1rem 0.6rem 2.2rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 0.9rem;
  width: 200px;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.8);
}

.search-box input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  width: 240px;
  background-color: white;
}

.search-box i {
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.refresh-button {
  background: none;
  border: none;
  color: #667eea;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.refresh-button:hover {
  background: #f0f2fa;
  transform: rotate(180deg);
}

.rooms-container {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  background-color: #f9fafc;
}

.room-card {
  background: white;
  border-radius: 12px;
  padding: 0.8rem 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  transition: background-color 0.2s ease;
  border-left: 4px solid #667eea;
  position: relative;
  overflow: hidden;
  min-height: 105px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
}

.room-card.playing {
  border-left-color: #ff9800;
  cursor: not-allowed;
  opacity: 0.85;
}

.room-card:not(.playing):hover {
  background-color: #f7f9fc;
}

.room-card:not(.playing):hover::after,
.room-card:not(.playing):hover::before,
.room-card:not(.playing):hover .room-content {
  /* 모두 제거 */
}

.room-content {
  position: relative;
  z-index: 1;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.8rem;
}

.room-info {
  flex: 1;
}

.room-name {
  margin: 0 0 0.2rem 0;
  font-size: 1.05rem;
  color: #333;
  font-weight: 600;
}

.room-host {
  font-size: 0.85rem;
  color: #666;
}

.room-badges {
  display: flex;
  gap: 0.5rem;
}

.mode-badge, .status-badge {
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.roadview-mode {
  background: #e8f5e9;
  color: #2e7d32;
}

.photo-mode {
  background: #e3f2fd;
  color: #1976d2;
}

.waiting {
  background: #e8eaf6;
  color: #3949ab;
}

.playing {
  background: #fff3e0;
  color: #e65100;
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
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #666;
}

.detail-item i {
  color: #999;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: #999;
  background-color: #f9fafc;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
  color: #667eea;
}

.empty-state p {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

/* 비밀번호 모달 스타일 */
.modal-overlay {
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
}

.password-modal {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.password-modal h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.2rem;
}

.password-modal input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.cancel-button, .submit-button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-button {
  background: #f0f2f5;
  border: 1px solid #ddd;
  color: #666;
}

.submit-button {
  background: #667eea;
  border: none;
  color: white;
}

.cancel-button:hover {
  background: #e0e2e5;
}

.submit-button:hover {
  background: #5a6edb;
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