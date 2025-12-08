<template>
  <!-- 디자인 B: 미니멀 플랫 -->
  <div 
    class="room-card-minimal"
    :class="cardClass"
    @click="$emit('click', room)"
  >
    <div class="status-bar"></div>
    <div class="card-content">
      <div class="card-main">
        <div class="room-info">
          <div class="title-row">
            <h3 class="room-name">{{ room.title }}</h3>
            <span v-if="room.privateRoom" class="lock-icon">
              <i class="fas fa-lock"></i>
            </span>
          </div>
          <span class="room-host">{{ room.hostNickname }}</span>
        </div>
        
        <div class="card-right">
          <div class="player-count">
            <span class="count-number">{{ room.currentPlayerCount }}</span>
            <span class="count-divider">/</span>
            <span class="count-max">{{ room.maxPlayers }}</span>
          </div>
          <span class="status-chip">{{ statusText }}</span>
        </div>
      </div>
      
      <div class="card-tags">
        <span class="tag">{{ room.gameMode }}</span>
        <span class="tag">{{ room.gameType }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoomCardDesignB',
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
    statusText() {
      const isPlaying = this.room.gameRoomStatus === '게임 중' || this.room.gameRoomStatus === 'PLAYING';
      return isPlaying ? '게임중' : '대기중';
    }
  }
};
</script>

<style scoped>
.room-card-minimal {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  padding: 0;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.room-card-minimal:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.status-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

/* 공개방 - 그린 계열 */
.room-card-minimal.is-public .status-bar {
  background: linear-gradient(180deg, #10b981, #34d399);
}

.room-card-minimal.is-public:hover {
  border-color: #10b981;
}

/* 비공개방 - 인디고 계열 */
.room-card-minimal.is-private .status-bar {
  background: linear-gradient(180deg, #6366f1, #818cf8);
}

.room-card-minimal.is-private:hover {
  border-color: #6366f1;
}

/* 게임 중 */
.room-card-minimal.is-playing {
  opacity: 0.6;
  cursor: not-allowed;
}

.room-card-minimal.is-playing .status-bar {
  background: linear-gradient(180deg, #f59e0b, #fbbf24);
}

.room-card-minimal.is-playing:hover {
  transform: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-content {
  padding: 0.875rem 1rem 0.875rem 1.25rem;
}

.card-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.room-info {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.room-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lock-icon {
  color: #6366f1;
  font-size: 0.75rem;
}

.room-host {
  font-size: 0.75rem;
  color: #64748b;
}

.card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.player-count {
  display: flex;
  align-items: baseline;
  font-weight: 700;
}

.count-number {
  font-size: 1.1rem;
  color: #1e293b;
}

.count-divider {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0 0.1rem;
}

.count-max {
  font-size: 0.85rem;
  color: #94a3b8;
}

.status-chip {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.is-public .status-chip {
  background: #ecfdf5;
  color: #059669;
}

.is-private .status-chip {
  background: #eef2ff;
  color: #4f46e5;
}

.is-playing .status-chip {
  background: #fef3c7;
  color: #d97706;
}

.card-tags {
  display: flex;
  gap: 0.4rem;
}

.tag {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.15rem 0.5rem;
  background: #f1f5f9;
  color: #475569;
  border-radius: 4px;
}

/* 반응형 */
@media (max-width: 768px) {
  .card-content {
    padding: 0.65rem 0.75rem 0.65rem 1rem;
  }
  
  .room-name {
    font-size: 0.85rem;
  }
  
  .room-host {
    font-size: 0.7rem;
  }
  
  .count-number {
    font-size: 0.95rem;
  }
  
  .tag {
    font-size: 0.65rem;
    padding: 0.1rem 0.4rem;
  }
}
</style>

