<template>
  <div class="hud-rooms-panel">
    <!-- HUD 테두리 장식 -->
    <div class="hud-border">
      <div class="corner corner-tl"></div>
      <div class="corner corner-tr"></div>
      <div class="corner corner-bl"></div>
      <div class="corner corner-br"></div>
    </div>
    <div class="hud-scanline"></div>
    
    <!-- 헤더 섹션 -->
    <div class="hud-header">
      <div class="header-title">
        <span class="title-bracket">[</span>
        <h2>GAME ROOMS</h2>
        <span class="title-bracket">]</span>
        <div v-if="loading" class="loading-indicator">
          <span class="loading-dot"></span>
          <span class="loading-text">SYNCING...</span>
        </div>
      </div>
      
      <div class="header-controls">
        <div class="hud-search">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="SEARCH ROOM..."
          />
        </div>
        <button class="hud-refresh" @click="refreshRooms" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'spinning': loading }"></i>
          <span>REFRESH</span>
        </button>
      </div>
    </div>
    
    <!-- 방 목록 컨테이너 -->
    <div class="hud-rooms-container" v-if="filteredRooms && filteredRooms.length > 0">
      <div 
        v-for="room in filteredRooms" 
        :key="room.gameRoomId"
        class="hud-room-card"
        :class="cardClass(room)"
        @click="joinRoom(room)"
      >
        <div class="card-border">
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>
        </div>
        <div class="card-scanline"></div>
        
        <div class="card-content">
          <div class="card-header">
            <div class="room-id">
              <span class="id-label">ROOM</span>
              <span class="id-value">#{{ String(room.gameRoomId).padStart(3, '0') }}</span>
            </div>
            <div class="status-indicator" :class="statusClass(room)">
              <span class="status-dot"></span>
              <span class="status-text">{{ statusText(room) }}</span>
            </div>
          </div>
          
          <div class="room-title">
            <span class="bracket">[</span>
            <h3>{{ room.title }}</h3>
            <span class="bracket">]</span>
            <span v-if="room.privateRoom" class="lock-icon">
              <i class="fas fa-lock"></i>
            </span>
          </div>
          
          <div class="room-meta">
            <div class="meta-item">
              <i class="fas fa-user-astronaut"></i>
              <span>{{ room.hostNickname }}</span>
            </div>
            <span class="meta-divider">|</span>
            <div class="meta-item">
              <i :class="room.gameMode === '로드뷰' ? 'fas fa-street-view' : 'fas fa-camera'"></i>
              <span>{{ room.gameMode }}</span>
            </div>
            <span class="meta-divider">|</span>
            <div class="meta-item">
              <i :class="room.gameType === '개인전' ? 'fas fa-user' : 'fas fa-users'"></i>
              <span>{{ room.gameType }}</span>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="player-slots">
              <span 
                v-for="i in room.maxPlayers" 
                :key="i"
                class="slot"
                :class="{ 'filled': i <= room.currentPlayerCount }"
              ></span>
            </div>
            <span class="player-count">{{ room.currentPlayerCount }}/{{ room.maxPlayers }} PLAYERS</span>
            <span class="join-hint" v-if="!isPlaying(room)">[ PRESS TO JOIN ]</span>
            <span class="join-hint disabled" v-else>[ IN PROGRESS ]</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 빈 상태 -->
    <div class="hud-empty" v-else>
      <div class="empty-icon">
        <i class="fas fa-satellite-dish"></i>
      </div>
      <p class="empty-text">NO ROOMS DETECTED</p>
      <p class="empty-subtext">CREATE A NEW ROOM TO START</p>
    </div>

    <!-- HUD 스타일 비밀번호 모달 -->
    <div class="hud-modal-overlay" v-if="showPasswordModal">
      <div class="hud-modal">
        <div class="modal-border">
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>
        </div>
        <div class="modal-scanline"></div>
        
        <div class="modal-content">
          <div class="modal-header">
            <i class="fas fa-shield-alt"></i>
            <h3>ACCESS CODE REQUIRED</h3>
          </div>
          
          <div class="modal-body">
            <div class="hud-input-group">
              <label>ENTER PASSWORD</label>
              <input 
                type="password" 
                v-model="passwordInput"
                placeholder="********"
                @keyup.enter="handlePasswordSubmit"
              />
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="hud-btn cancel" @click="closePasswordModal">
              <span>CANCEL</span>
            </button>
            <button class="hud-btn confirm" @click="handlePasswordSubmit">
              <span>AUTHENTICATE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoomListHUD',
  
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
  
  emits: ['refresh-rooms', 'join-room'],
  
  data() {
    return {
      searchQuery: '',
      showPasswordModal: false,
      selectedRoom: null,
      passwordInput: ''
    };
  },
  
  computed: {
    filteredRooms() {
      if (!this.searchQuery.trim()) {
        return this.rooms;
      }
      const query = this.searchQuery.toLowerCase();
      return this.rooms.filter(room => 
        room.title.toLowerCase().includes(query) ||
        room.hostNickname.toLowerCase().includes(query)
      );
    }
  },
  
  methods: {
    refreshRooms() {
      this.$emit('refresh-rooms');
    },
    
    isPlaying(room) {
      return room.gameRoomStatus === '게임 중' || room.gameRoomStatus === 'PLAYING';
    },
    
    cardClass(room) {
      const playing = this.isPlaying(room);
      const isPrivate = room.privateRoom;
      
      return {
        'is-playing': playing,
        'is-private': !playing && isPrivate,
        'is-public': !playing && !isPrivate
      };
    },
    
    statusClass(room) {
      if (this.isPlaying(room)) return 'status-playing';
      if (room.privateRoom) return 'status-private';
      return 'status-public';
    },
    
    statusText(room) {
      if (this.isPlaying(room)) return 'ACTIVE';
      return 'STANDBY';
    },
    
    joinRoom(room) {
      if (room.currentPlayerCount >= room.maxPlayers) {
        alert('ROOM IS FULL');
        return;
      }
      
      if (this.isPlaying(room)) {
        alert('GAME IN PROGRESS');
        return;
      }
      
      if (room.privateRoom) {
        this.selectedRoom = room;
        this.showPasswordModal = true;
        this.passwordInput = '';
      } else {
        this.$emit('join-room', room);
      }
    },
    
    handlePasswordSubmit() {
      if (!this.selectedRoom) return;
      
      if (!this.passwordInput || this.passwordInput.trim() === '') {
        alert('PASSWORD REQUIRED');
        return;
      }
      
      this.$emit('join-room', this.selectedRoom, this.passwordInput);
      this.closePasswordModal();
    },
    
    closePasswordModal() {
      this.showPasswordModal = false;
      this.selectedRoom = null;
      this.passwordInput = '';
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');

.hud-rooms-panel {
  position: relative;
  background: linear-gradient(135deg, #0c1222 0%, #1a2744 100%);
  border-radius: 0;
  padding: 1.5rem;
  clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
  font-family: 'Orbitron', monospace;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* HUD 테두리 */
.hud-border {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border: 2px solid #22d3ee;
}

.corner-tl { top: 0; left: 0; border-right: none; border-bottom: none; }
.corner-tr { top: 0; right: 16px; border-left: none; border-bottom: none; }
.corner-bl { bottom: 16px; left: 0; border-right: none; border-top: none; }
.corner-br { bottom: 0; right: 0; border-left: none; border-top: none; }

.hud-scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(34, 211, 238, 0.02) 2px,
    rgba(34, 211, 238, 0.02) 4px
  );
  pointer-events: none;
  z-index: 1;
}

/* 헤더 */
.hud-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(34, 211, 238, 0.2);
  position: relative;
  z-index: 2;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-title h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  color: #22d3ee;
  letter-spacing: 0.15em;
  text-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
}

.title-bracket {
  color: #64748b;
  font-size: 1.5rem;
  font-weight: 300;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 1rem;
}

.loading-dot {
  width: 8px;
  height: 8px;
  background: #22d3ee;
  border-radius: 50%;
  animation: pulse 1s infinite;
  box-shadow: 0 0 10px #22d3ee;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.loading-text {
  color: #22d3ee;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hud-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(34, 211, 238, 0.05);
  border: 1px solid rgba(34, 211, 238, 0.3);
  padding: 0.5rem 0.75rem;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.hud-search i {
  color: #22d3ee;
  font-size: 0.8rem;
}

.hud-search input {
  background: transparent;
  border: none;
  color: #e2e8f0;
  font-family: 'Orbitron', monospace;
  font-size: 0.75rem;
  width: 150px;
  outline: none;
  letter-spacing: 0.05em;
}

.hud-search input::placeholder {
  color: #64748b;
}

.hud-refresh {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.4);
  color: #22d3ee;
  padding: 0.5rem 0.75rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
  letter-spacing: 0.05em;
}

.hud-refresh:hover:not(:disabled) {
  background: rgba(34, 211, 238, 0.2);
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
}

.hud-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hud-refresh i.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 방 목록 컨테이너 */
.hud-rooms-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  z-index: 2;
  padding-right: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: #22d3ee transparent;
}

.hud-rooms-container::-webkit-scrollbar {
  width: 4px;
}

.hud-rooms-container::-webkit-scrollbar-track {
  background: rgba(34, 211, 238, 0.1);
}

.hud-rooms-container::-webkit-scrollbar-thumb {
  background: #22d3ee;
  border-radius: 2px;
}

/* 방 카드 */
.hud-room-card {
  position: relative;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.05) 0%, rgba(15, 23, 42, 0.8) 100%);
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
}

.hud-room-card .card-border {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hud-room-card .corner {
  width: 16px;
  height: 16px;
}

.hud-room-card .card-scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 1px,
    rgba(255, 255, 255, 0.01) 1px,
    rgba(255, 255, 255, 0.01) 2px
  );
  pointer-events: none;
}

/* 공개방 */
.hud-room-card.is-public {
  border-color: rgba(34, 211, 238, 0.3);
}

.hud-room-card.is-public .corner {
  border-color: #22d3ee;
}

.hud-room-card.is-public:hover {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%);
  box-shadow: 0 0 30px rgba(34, 211, 238, 0.2), inset 0 0 20px rgba(34, 211, 238, 0.05);
  transform: translateX(4px);
}

/* 비공개방 */
.hud-room-card.is-private .corner {
  border-color: #a78bfa;
}

.hud-room-card.is-private {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.05) 0%, rgba(15, 23, 42, 0.8) 100%);
}

.hud-room-card.is-private:hover {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%);
  box-shadow: 0 0 30px rgba(167, 139, 250, 0.2), inset 0 0 20px rgba(167, 139, 250, 0.05);
  transform: translateX(4px);
}

/* 게임 중 */
.hud-room-card.is-playing .corner {
  border-color: #fbbf24;
}

.hud-room-card.is-playing {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.03) 0%, rgba(15, 23, 42, 0.6) 100%);
  opacity: 0.6;
  cursor: not-allowed;
}

.hud-room-card.is-playing:hover {
  transform: none;
}

.card-content {
  position: relative;
  z-index: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.room-id {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.id-label {
  font-size: 0.6rem;
  color: #64748b;
  letter-spacing: 0.1em;
}

.id-value {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.is-public .id-value { color: #22d3ee; }
.is-private .id-value { color: #a78bfa; }
.is-playing .id-value { color: #fbbf24; }

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-public .status-dot {
  background: #22d3ee;
  box-shadow: 0 0 8px #22d3ee;
  animation: pulse 1.5s infinite;
}

.status-private .status-dot {
  background: #a78bfa;
  box-shadow: 0 0 8px #a78bfa;
  animation: pulse 1.5s infinite;
}

.status-playing .status-dot {
  background: #fbbf24;
  box-shadow: 0 0 8px #fbbf24;
}

.status-text {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.status-public .status-text { color: #22d3ee; }
.status-private .status-text { color: #a78bfa; }
.status-playing .status-text { color: #fbbf24; }

.room-title {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.room-title .bracket {
  color: #475569;
  font-size: 1rem;
}

.room-title h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.lock-icon {
  margin-left: 0.5rem;
  color: #a78bfa;
  font-size: 0.7rem;
}

.room-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  color: #94a3b8;
}

.meta-item i {
  font-size: 0.65rem;
  color: #64748b;
}

.meta-divider {
  color: #334155;
  font-size: 0.6rem;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(100, 116, 139, 0.15);
}

.player-slots {
  display: flex;
  gap: 3px;
}

.slot {
  width: 10px;
  height: 5px;
  background: rgba(100, 116, 139, 0.3);
  border-radius: 1px;
}

.slot.filled {
  background: currentColor;
}

.is-public .slot.filled { color: #22d3ee; }
.is-private .slot.filled { color: #a78bfa; }
.is-playing .slot.filled { color: #fbbf24; }

.player-count {
  font-size: 0.6rem;
  color: #64748b;
  letter-spacing: 0.05em;
}

.join-hint {
  margin-left: auto;
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  animation: flicker 3s infinite;
}

.is-public .join-hint { color: #22d3ee; }
.is-private .join-hint { color: #a78bfa; }

.join-hint.disabled {
  color: #fbbf24;
  animation: none;
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  92% { opacity: 1; }
  93% { opacity: 0.3; }
  94% { opacity: 1; }
}

/* 빈 상태 */
.hud-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: rgba(34, 211, 238, 0.1);
  border: 2px solid rgba(34, 211, 238, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.empty-icon i {
  font-size: 2rem;
  color: #22d3ee;
  animation: pulse 2s infinite;
}

.empty-text {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.15em;
}

.empty-subtext {
  margin: 0;
  font-size: 0.7rem;
  color: #475569;
  letter-spacing: 0.1em;
}

/* 비밀번호 모달 */
.hud-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.hud-modal {
  position: relative;
  background: linear-gradient(135deg, #0c1222 0%, #1a2744 100%);
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.hud-modal .modal-border {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hud-modal .corner {
  border-color: #a78bfa;
}

.hud-modal .modal-scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(167, 139, 250, 0.02) 2px,
    rgba(167, 139, 250, 0.02) 4px
  );
  pointer-events: none;
}

.modal-content {
  position: relative;
  z-index: 1;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(167, 139, 250, 0.2);
}

.modal-header i {
  font-size: 1.5rem;
  color: #a78bfa;
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #a78bfa;
  letter-spacing: 0.1em;
}

.hud-input-group {
  margin-bottom: 1.5rem;
}

.hud-input-group label {
  display: block;
  font-size: 0.7rem;
  color: #64748b;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

.hud-input-group input {
  width: 100%;
  background: rgba(167, 139, 250, 0.05);
  border: 1px solid rgba(167, 139, 250, 0.3);
  padding: 0.75rem 1rem;
  color: #e2e8f0;
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem;
  letter-spacing: 0.2em;
  outline: none;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.hud-input-group input:focus {
  border-color: #a78bfa;
  box-shadow: 0 0 20px rgba(167, 139, 250, 0.2);
}

.hud-input-group input::placeholder {
  color: #475569;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.hud-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  font-family: 'Orbitron', monospace;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.hud-btn.cancel {
  background: rgba(100, 116, 139, 0.1);
  border: 1px solid rgba(100, 116, 139, 0.3);
  color: #94a3b8;
}

.hud-btn.cancel:hover {
  background: rgba(100, 116, 139, 0.2);
  border-color: #94a3b8;
}

.hud-btn.confirm {
  background: rgba(167, 139, 250, 0.2);
  border: 1px solid rgba(167, 139, 250, 0.5);
  color: #a78bfa;
}

.hud-btn.confirm:hover {
  background: rgba(167, 139, 250, 0.3);
  box-shadow: 0 0 20px rgba(167, 139, 250, 0.3);
}

/* 반응형 */
@media (max-width: 768px) {
  .hud-rooms-panel {
    padding: 1rem;
  }
  
  .hud-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .header-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .hud-search {
    flex: 1;
  }
  
  .hud-search input {
    width: 100%;
  }
  
  .header-title h2 {
    font-size: 1rem;
  }
  
  .room-title h3 {
    max-width: 150px;
    font-size: 0.8rem;
  }
  
  .card-footer {
    flex-wrap: wrap;
  }
  
  .join-hint {
    width: 100%;
    text-align: center;
    margin-left: 0;
    margin-top: 0.5rem;
  }
}
</style>

