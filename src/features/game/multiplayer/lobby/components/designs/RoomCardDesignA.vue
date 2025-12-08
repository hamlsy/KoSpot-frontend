<template>
  <!-- 디자인 A: 네온 글래스모피즘 -->
  <div 
    class="room-card-neon"
    :class="cardClass"
    @click="$emit('click', room)"
  >
    <div class="card-glow"></div>
    <div class="card-content">
      <div class="card-header">
        <div class="room-info">
          <h3 class="room-name">{{ room.title }}</h3>
          <span class="room-host">
            <i class="fas fa-crown"></i>
            {{ room.hostNickname }}
          </span>
        </div>
        <div class="status-indicator">
          <span class="status-icon">
            <i :class="statusIcon"></i>
          </span>
          <span class="status-text">{{ room.gameRoomStatus }}</span>
        </div>
      </div>
      
      <div class="card-badges">
        <span class="badge mode-badge">
          <i :class="room.gameMode === '로드뷰' ? 'fas fa-street-view' : 'fas fa-camera'"></i>
          {{ room.gameMode }}
        </span>
        <span class="badge type-badge">
          <i :class="room.gameType === '개인전' ? 'fas fa-user' : 'fas fa-users'"></i>
          {{ room.gameType }}
        </span>
        <span v-if="room.privateRoom" class="badge private-badge">
          <i class="fas fa-lock"></i>
          비밀방
        </span>
      </div>
      
      <div class="card-footer">
        <div class="player-count">
          <div class="player-bar">
            <div class="player-fill" :style="{ width: playerPercentage + '%' }"></div>
          </div>
          <span class="player-text">
            <i class="fas fa-users"></i>
            {{ room.currentPlayerCount }}/{{ room.maxPlayers }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoomCardDesignA',
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
    statusIcon() {
      const isPlaying = this.room.gameRoomStatus === '게임 중' || this.room.gameRoomStatus === 'PLAYING';
      return isPlaying ? 'fas fa-gamepad' : 'fas fa-hourglass-half';
    },
    playerPercentage() {
      return (this.room.currentPlayerCount / this.room.maxPlayers) * 100;
    }
  }
};
</script>

<style scoped>
.room-card-neon {
  position: relative;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border: 2px solid transparent;
}

.card-glow {
  position: absolute;
  inset: -2px;
  border-radius: 18px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

/* 공개방 - 민트/시안 계열 */
.room-card-neon.is-public {
  border-color: rgba(6, 182, 212, 0.4);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%);
}

.room-card-neon.is-public .card-glow {
  background: linear-gradient(135deg, #06b6d4, #22d3ee);
}

.room-card-neon.is-public:hover {
  border-color: #06b6d4;
  box-shadow: 0 0 30px rgba(6, 182, 212, 0.4);
  transform: translateY(-4px);
}

.room-card-neon.is-public:hover .card-glow {
  opacity: 0.15;
}

/* 비공개방 - 보라/인디고 계열 */
.room-card-neon.is-private {
  border-color: rgba(139, 92, 246, 0.4);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%);
}

.room-card-neon.is-private .card-glow {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
}

.room-card-neon.is-private:hover {
  border-color: #8b5cf6;
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.4);
  transform: translateY(-4px);
}

.room-card-neon.is-private:hover .card-glow {
  opacity: 0.15;
}

/* 게임 중 - 주황/앰버 계열 */
.room-card-neon.is-playing {
  border-color: rgba(245, 158, 11, 0.3);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(15, 23, 42, 0.7) 100%);
  opacity: 0.7;
  cursor: not-allowed;
}

.room-card-neon.is-playing .card-glow {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.card-content {
  position: relative;
  z-index: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.room-info {
  flex: 1;
  min-width: 0;
}

.room-name {
  margin: 0 0 0.25rem 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-host {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #94a3b8;
}

.room-host i {
  color: #fbbf24;
  font-size: 0.7rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
}

.is-public .status-indicator {
  background: rgba(6, 182, 212, 0.2);
  color: #22d3ee;
}

.is-private .status-indicator {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.is-playing .status-indicator {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.status-icon i {
  font-size: 0.75rem;
}

.is-public .status-icon i {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.card-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.badge {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.badge i {
  font-size: 0.65rem;
}

.private-badge {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.3);
  color: #c4b5fd;
}

.card-footer {
  display: flex;
  align-items: center;
}

.player-count {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.player-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.player-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.is-public .player-fill {
  background: linear-gradient(90deg, #06b6d4, #22d3ee);
}

.is-private .player-fill {
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
}

.is-playing .player-fill {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.player-text {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #94a3b8;
  white-space: nowrap;
}

.player-text i {
  font-size: 0.7rem;
}

/* 반응형 */
@media (max-width: 768px) {
  .room-card-neon {
    padding: 0.75rem 1rem;
  }
  
  .room-name {
    font-size: 0.9rem;
  }
  
  .room-host {
    font-size: 0.7rem;
  }
  
  .badge {
    padding: 0.2rem 0.5rem;
    font-size: 0.65rem;
  }
  
  .status-indicator {
    padding: 0.2rem 0.5rem;
    font-size: 0.65rem;
  }
}
</style>

