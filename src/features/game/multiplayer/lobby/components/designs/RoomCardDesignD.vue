<template>
  <!-- 디자인 D: 게임 HUD 스타일 -->
  <div 
    class="room-card-hud"
    :class="cardClass"
    @click="$emit('click', room)"
  >
    <div class="hud-border">
      <div class="corner corner-tl"></div>
      <div class="corner corner-tr"></div>
      <div class="corner corner-bl"></div>
      <div class="corner corner-br"></div>
    </div>
    
    <div class="hud-scanline"></div>
    
    <div class="hud-content">
      <div class="hud-header">
        <div class="room-id">
          <span class="id-label">ROOM</span>
          <span class="id-hash">#{{ room.gameRoomId || '000' }}</span>
        </div>
        <div class="status-display">
          <span class="status-dot"></span>
          <span class="status-text">{{ statusText }}</span>
        </div>
      </div>
      
      <div class="room-name-display">
        <span class="name-bracket">[</span>
        <h3 class="room-name">{{ room.title }}</h3>
        <span class="name-bracket">]</span>
        <span v-if="room.privateRoom" class="secure-icon">
          <i class="fas fa-lock"></i>
        </span>
      </div>
      
      <div class="hud-stats">
        <div class="stat-item">
          <span class="stat-icon"><i class="fas fa-user-astronaut"></i></span>
          <span class="stat-value">{{ room.hostNickname }}</span>
        </div>
        <div class="stat-divider">|</div>
        <div class="stat-item">
          <span class="stat-icon"><i :class="room.gameMode === '로드뷰' ? 'fas fa-street-view' : 'fas fa-camera'"></i></span>
          <span class="stat-value">{{ room.gameMode }}</span>
        </div>
        <div class="stat-divider">|</div>
        <div class="stat-item">
          <span class="stat-icon"><i :class="room.gameType === '개인전' ? 'fas fa-user' : 'fas fa-users'"></i></span>
          <span class="stat-value">{{ room.gameType }}</span>
        </div>
      </div>
      
      <div class="hud-footer">
        <div class="player-display">
          <div class="player-slots">
            <span 
              v-for="i in room.maxPlayers" 
              :key="i"
              class="player-slot"
              :class="{ 'filled': i <= room.currentPlayerCount }"
            ></span>
          </div>
          <span class="player-count">{{ room.currentPlayerCount }}/{{ room.maxPlayers }} PLAYERS</span>
        </div>
        <div class="action-hint">
          <span v-if="!isPlaying">PRESS TO JOIN</span>
          <span v-else>IN PROGRESS</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoomCardDesignD',
  props: {
    room: {
      type: Object,
      required: true
    }
  },
  emits: ['click'],
  computed: {
    cardClass() {
      const isPlaying = this.room.gameRoomStatus === '게임 중' || this.room.gameRoomStatus === 'PLAYING';
      const isPrivate = this.room.privateRoom;
      
      return {
        'is-playing': isPlaying,
        'is-private': !isPlaying && isPrivate,
        'is-public': !isPlaying && !isPrivate
      };
    },
    isPlaying() {
      return this.room.gameRoomStatus === '게임 중' || this.room.gameRoomStatus === 'PLAYING';
    },
    statusText() {
      return this.isPlaying ? 'ACTIVE' : 'STANDBY';
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap');

.room-card-hud {
  position: relative;
  background: linear-gradient(135deg, #0c1222 0%, #1a2744 100%);
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.room-card-hud:hover {
  transform: scale(1.02);
}

.hud-border {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid;
}

.corner-tl {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
}

.corner-tr {
  top: 0;
  right: 12px;
  border-left: none;
  border-bottom: none;
}

.corner-bl {
  bottom: 12px;
  left: 0;
  border-right: none;
  border-top: none;
}

.corner-br {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
}

/* 공개방 - 시안 */
.room-card-hud.is-public .corner {
  border-color: #22d3ee;
}

.room-card-hud.is-public {
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.2), inset 0 0 30px rgba(34, 211, 238, 0.05);
}

.room-card-hud.is-public:hover {
  box-shadow: 0 0 40px rgba(34, 211, 238, 0.4), inset 0 0 40px rgba(34, 211, 238, 0.1);
}

/* 비공개방 - 퍼플 */
.room-card-hud.is-private .corner {
  border-color: #a78bfa;
}

.room-card-hud.is-private {
  box-shadow: 0 0 20px rgba(167, 139, 250, 0.2), inset 0 0 30px rgba(167, 139, 250, 0.05);
}

.room-card-hud.is-private:hover {
  box-shadow: 0 0 40px rgba(167, 139, 250, 0.4), inset 0 0 40px rgba(167, 139, 250, 0.1);
}

/* 게임 중 - 앰버 */
.room-card-hud.is-playing .corner {
  border-color: #fbbf24;
}

.room-card-hud.is-playing {
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.15);
}

.room-card-hud.is-playing:hover {
  transform: none;
}

.hud-scanline {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.015) 2px,
    rgba(255, 255, 255, 0.015) 4px
  );
  pointer-events: none;
}

.hud-content {
  position: relative;
  z-index: 1;
}

.hud-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.room-id {
  font-family: 'Orbitron', monospace;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.id-label {
  font-size: 0.6rem;
  color: #64748b;
  letter-spacing: 0.1em;
}

.id-hash {
  font-size: 0.7rem;
  font-weight: 700;
}

.is-public .id-hash { color: #22d3ee; }
.is-private .id-hash { color: #a78bfa; }
.is-playing .id-hash { color: #fbbf24; }

.status-display {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: blink 1.5s infinite;
}

.is-public .status-dot { background: #22d3ee; box-shadow: 0 0 8px #22d3ee; }
.is-private .status-dot { background: #a78bfa; box-shadow: 0 0 8px #a78bfa; }
.is-playing .status-dot { background: #fbbf24; box-shadow: 0 0 8px #fbbf24; animation: none; }

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.status-text {
  font-family: 'Orbitron', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.is-public .status-text { color: #22d3ee; }
.is-private .status-text { color: #a78bfa; }
.is-playing .status-text { color: #fbbf24; }

.room-name-display {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.6rem;
}

.name-bracket {
  font-family: 'Orbitron', monospace;
  font-size: 1.1rem;
  color: #475569;
}

.room-name {
  margin: 0;
  font-family: 'Orbitron', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.secure-icon {
  margin-left: 0.4rem;
  color: #a78bfa;
  font-size: 0.75rem;
}

.hud-stats {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.stat-icon {
  font-size: 0.7rem;
  color: #64748b;
}

.stat-value {
  font-size: 0.75rem;
  color: #94a3b8;
}

.stat-divider {
  color: #334155;
  font-size: 0.7rem;
}

.hud-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(100, 116, 139, 0.2);
}

.player-display {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.player-slots {
  display: flex;
  gap: 4px;
}

.player-slot {
  width: 12px;
  height: 6px;
  background: rgba(100, 116, 139, 0.3);
  border-radius: 2px;
}

.player-slot.filled {
  background: currentColor;
}

.is-public .player-slot.filled { color: #22d3ee; }
.is-private .player-slot.filled { color: #a78bfa; }
.is-playing .player-slot.filled { color: #fbbf24; }

.player-count {
  font-family: 'Orbitron', monospace;
  font-size: 0.6rem;
  color: #64748b;
  letter-spacing: 0.05em;
}

.action-hint {
  font-family: 'Orbitron', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  animation: flicker 3s infinite;
}

.is-public .action-hint { color: #22d3ee; }
.is-private .action-hint { color: #a78bfa; }
.is-playing .action-hint { color: #fbbf24; animation: none; }

@keyframes flicker {
  0%, 100% { opacity: 1; }
  92% { opacity: 1; }
  93% { opacity: 0.3; }
  94% { opacity: 1; }
}

/* 반응형 */
@media (max-width: 768px) {
  .room-card-hud {
    padding: 0.75rem 1rem;
  }
  
  .room-name {
    font-size: 0.85rem;
  }
  
  .stat-item {
    font-size: 0.65rem;
  }
  
  .player-slot {
    width: 10px;
    height: 5px;
  }
}
</style>

