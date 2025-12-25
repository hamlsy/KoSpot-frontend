<template>
  <!-- 디자인 E: 소프트 머티리얼 -->
  <div 
    class="room-card-soft"
    :class="cardClass"
    @click="$emit('click', room)"
  >
    <div class="card-inner">
      <div class="card-icon">
        <div class="icon-circle">
          <i :class="statusIcon"></i>
        </div>
        <span v-if="room.privateRoom" class="lock-badge">
          <i class="fas fa-lock"></i>
        </span>
      </div>
      
      <div class="card-body">
        <h3 class="room-name">{{ room.title }}</h3>
        <p class="room-host">호스트: {{ room.hostNickname }}</p>
        
        <div class="room-tags">
          <span class="tag mode-tag">
            <i :class="room.gameMode === '로드뷰' ? 'fas fa-street-view' : 'fas fa-camera'"></i>
            {{ room.gameMode }}
          </span>
          <span class="tag type-tag">
            <i :class="room.gameType === '개인전' ? 'fas fa-user' : 'fas fa-users'"></i>
            {{ room.gameType }}
          </span>
        </div>
      </div>
      
      <div class="card-side">
        <div class="player-info">
          <div class="player-icons">
            <i 
              v-for="i in room.maxPlayers" 
              :key="i"
              class="fas fa-user-circle"
              :class="{ 'active': i <= room.currentPlayerCount }"
            ></i>
          </div>
          <span class="player-text">{{ room.currentPlayerCount }}/{{ room.maxPlayers }}</span>
        </div>
        <span class="status-pill">{{ statusText }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoomCardDesignE',
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
      if (isPlaying) return 'fas fa-gamepad';
      return this.room.privateRoom ? 'fas fa-shield-alt' : 'fas fa-door-open';
    },
    statusText() {
      const isPlaying = this.room.gameRoomStatus === '게임 중' || this.room.gameRoomStatus === 'PLAYING';
      return isPlaying ? '진행 중' : '대기 중';
    }
  }
};
</script>

<style scoped>
.room-card-soft {
  background: #ffffff;
  border-radius: 24px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.room-card-soft:hover {
  transform: translateY(-8px);
}

/* 공개방 */
.room-card-soft.is-public {
  background: linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%);
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.1);
}

.room-card-soft.is-public:hover {
  box-shadow: 0 20px 60px rgba(16, 185, 129, 0.2);
}

/* 비공개방 */
.room-card-soft.is-private {
  background: linear-gradient(145deg, #ffffff 0%, #f5f3ff 100%);
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1);
}

.room-card-soft.is-private:hover {
  box-shadow: 0 20px 60px rgba(139, 92, 246, 0.2);
}

/* 게임 중 */
.room-card-soft.is-playing {
  background: linear-gradient(145deg, #ffffff 0%, #fffbeb 100%);
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.1);
  opacity: 0.75;
  cursor: not-allowed;
}

.room-card-soft.is-playing:hover {
  transform: none;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.1);
}

.card-inner {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.card-icon {
  position: relative;
  flex-shrink: 0;
}

.icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  transition: transform 0.3s ease;
}

.room-card-soft:hover .icon-circle {
  transform: scale(1.1);
}

.is-public .icon-circle {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #059669;
}

.is-private .icon-circle {
  background: linear-gradient(135deg, #ede9fe, #ddd6fe);
  color: #7c3aed;
}

.is-playing .icon-circle {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #d97706;
}

.lock-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background: #7c3aed;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
  border: 2px solid white;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.room-name {
  margin: 0 0 0.25rem 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-host {
  margin: 0 0 0.6rem 0;
  font-size: 0.8rem;
  color: #64748b;
}

.room-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.65rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
}

.is-public .tag {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.is-private .tag {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
}

.is-playing .tag {
  background: rgba(217, 119, 6, 0.1);
  color: #d97706;
}

.tag i {
  font-size: 0.65rem;
}

.card-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.6rem;
  flex-shrink: 0;
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.player-icons {
  display: flex;
  gap: 2px;
}

.player-icons i {
  font-size: 0.85rem;
  color: #e2e8f0;
  transition: color 0.2s ease;
}

.player-icons i.active {
  color: currentColor;
}

.is-public .player-icons i.active { color: #10b981; }
.is-private .player-icons i.active { color: #8b5cf6; }
.is-playing .player-icons i.active { color: #f59e0b; }

.player-text {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
}

.status-pill {
  padding: 0.35rem 0.8rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
}

.is-public .status-pill {
  background: linear-gradient(135deg, #10b981, #34d399);
  color: white;
}

.is-private .status-pill {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
}

.is-playing .status-pill {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: white;
}

/* 반응형 */
@media (max-width: 768px) {
  .room-card-soft {
    padding: 1rem;
    border-radius: 20px;
  }
  
  .card-inner {
    flex-wrap: wrap;
  }
  
  .icon-circle {
    width: 44px;
    height: 44px;
    font-size: 1.1rem;
  }
  
  .room-name {
    font-size: 0.9rem;
  }
  
  .room-host {
    font-size: 0.7rem;
  }
  
  .card-side {
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .player-info {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }
}
</style>

