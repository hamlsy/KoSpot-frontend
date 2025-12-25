<template>
  <!-- 디자인 C: 그라데이션 카드 -->
  <div 
    class="room-card-gradient"
    :class="cardClass"
    @click="$emit('click', room)"
  >
    <div class="card-bg"></div>
    <div class="card-content">
      <div class="card-top">
        <div class="status-badge">
          <i :class="statusIcon"></i>
          <span>{{ statusText }}</span>
        </div>
        <div v-if="room.privateRoom" class="private-indicator">
          <i class="fas fa-shield-alt"></i>
        </div>
      </div>
      
      <div class="room-title">
        <h3>{{ room.title }}</h3>
      </div>
      
      <div class="room-meta">
        <div class="meta-item host">
          <i class="fas fa-user-circle"></i>
          <span>{{ room.hostNickname }}</span>
        </div>
        <div class="meta-divider"></div>
        <div class="meta-item mode">
          <i :class="room.gameMode === '로드뷰' ? 'fas fa-street-view' : 'fas fa-camera'"></i>
          <span>{{ room.gameMode }}</span>
        </div>
        <div class="meta-divider"></div>
        <div class="meta-item type">
          <i :class="room.gameType === '개인전' ? 'fas fa-user' : 'fas fa-users'"></i>
          <span>{{ room.gameType }}</span>
        </div>
      </div>
      
      <div class="card-bottom">
        <div class="player-progress">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: playerPercentage + '%' }"></div>
          </div>
          <span class="player-label">{{ room.currentPlayerCount }}/{{ room.maxPlayers }} 참가</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoomCardDesignC',
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
      return isPlaying ? 'fas fa-play-circle' : 'fas fa-door-open';
    },
    statusText() {
      const isPlaying = this.room.gameRoomStatus === '게임 중' || this.room.gameRoomStatus === 'PLAYING';
      return isPlaying ? '게임 진행중' : '입장 가능';
    },
    playerPercentage() {
      return (this.room.currentPlayerCount / this.room.maxPlayers) * 100;
    }
  }
};
</script>

<style scoped>
.room-card-gradient {
  position: relative;
  border-radius: 20px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.card-bg {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  transition: opacity 0.35s ease;
}

/* 공개방 - 민트/그린 그라데이션 */
.room-card-gradient.is-public .card-bg {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%);
}

.room-card-gradient.is-public {
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);
}

.room-card-gradient.is-public:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 40px rgba(16, 185, 129, 0.25);
}

/* 비공개방 - 보라/인디고 그라데이션 */
.room-card-gradient.is-private .card-bg {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #c7d2fe 100%);
}

.room-card-gradient.is-private {
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.15);
}

.room-card-gradient.is-private:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 40px rgba(99, 102, 241, 0.25);
}

/* 게임 중 - 오렌지/앰버 그라데이션 */
.room-card-gradient.is-playing .card-bg {
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 50%, #fde68a 100%);
}

.room-card-gradient.is-playing {
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.1);
  opacity: 0.75;
  cursor: not-allowed;
}

.room-card-gradient.is-playing:hover {
  transform: none;
}

.card-content {
  position: relative;
  z-index: 1;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.is-public .status-badge {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}

.is-private .status-badge {
  background: rgba(99, 102, 241, 0.15);
  color: #4f46e5;
}

.is-playing .status-badge {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}

.status-badge i {
  font-size: 0.8rem;
}

.private-indicator {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 50%;
  color: #6366f1;
  font-size: 0.85rem;
}

.room-title h3 {
  margin: 0 0 0.6rem 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.room-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: #64748b;
}

.meta-item i {
  font-size: 0.75rem;
}

.meta-divider {
  width: 3px;
  height: 3px;
  background: #cbd5e1;
  border-radius: 50%;
}

.card-bottom {
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.player-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-track {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.is-public .progress-fill {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.is-private .progress-fill {
  background: linear-gradient(90deg, #6366f1, #818cf8);
}

.is-playing .progress-fill {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.player-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

/* 반응형 */
@media (max-width: 768px) {
  .room-card-gradient {
    padding: 1rem;
    border-radius: 16px;
  }
  
  .room-title h3 {
    font-size: 0.95rem;
  }
  
  .meta-item {
    font-size: 0.7rem;
  }
  
  .status-badge {
    padding: 0.25rem 0.6rem;
    font-size: 0.7rem;
  }
  
  .private-indicator {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
}
</style>

