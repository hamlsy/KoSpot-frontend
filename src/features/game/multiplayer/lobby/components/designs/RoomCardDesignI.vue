<template>
  <!-- 디자인 I: 타일/블록 스타일 - 명확한 구조, 심플 -->
  <div 
    class="room-card-tile"
    :class="cardClass"
    @click="$emit('click', room)"
  >
    <!-- 상태 아이콘 영역 -->
    <div class="tile-icon">
      <i :class="modeIcon"></i>
      <span class="icon-badge" v-if="room.privateRoom">
        <i class="fas fa-lock"></i>
      </span>
    </div>
    
    <!-- 메인 콘텐츠 -->
    <div class="tile-content">
      <div class="content-main">
        <h3 class="room-title">{{ room.title }}</h3>
        <div class="room-meta">
          <span class="host-name">{{ room.hostNickname }}</span>
          <span class="meta-dot">•</span>
          <span class="game-type">{{ room.gameType }}</span>
        </div>
      </div>
      
      <div class="content-stats">
        <div class="stat-block player-stat">
          <div class="stat-value">
            <span class="current">{{ room.currentPlayerCount }}</span>
            <span class="separator">/</span>
            <span class="max">{{ room.maxPlayers }}</span>
          </div>
          <div class="stat-label">참가자</div>
        </div>
        
        <div class="stat-block status-stat" :class="{ playing: isPlaying }">
          <div class="stat-icon">
            <i :class="isPlaying ? 'fas fa-circle' : 'fas fa-circle'"></i>
          </div>
          <div class="stat-label">{{ statusText }}</div>
        </div>
      </div>
    </div>
    
    <!-- 액션 영역 -->
    <div class="tile-action">
      <i class="fas fa-chevron-right"></i>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoomCardDesignI',
  props: {
    room: { type: Object, required: true }
  },
  emits: ['click'],
  computed: {
    isPlaying() {
      return this.room.gameRoomStatus === '게임 중' || this.room.gameRoomStatus === 'PLAYING';
    },
    cardClass() {
      return {
        'is-playing': this.isPlaying,
        'is-private': !this.isPlaying && this.room.privateRoom,
        'is-public': !this.isPlaying && !this.room.privateRoom
      };
    },
    modeIcon() {
      return this.room.gameMode === '로드뷰' ? 'fas fa-street-view' : 'fas fa-camera';
    },
    statusText() {
      return this.isPlaying ? '진행 중' : '대기 중';
    }
  }
};
</script>

<style scoped>
.room-card-tile {
  display: flex;
  align-items: stretch;
  background: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.room-card-tile:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.room-card-tile:active {
  transform: scale(0.99);
}

/* 아이콘 영역 */
.tile-icon {
  width: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.tile-icon > i {
  font-size: 1.4rem;
  color: white;
}

.is-public .tile-icon {
  background: linear-gradient(135deg, #34d399, #10b981);
}

.is-private .tile-icon {
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
}

.is-playing .tile-icon {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.icon-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-badge i {
  font-size: 0.55rem;
  color: #8b5cf6;
}

.is-playing {
  opacity: 0.7;
  cursor: not-allowed;
}

.is-playing:hover {
  box-shadow: none;
}

/* 콘텐츠 영역 */
.tile-content {
  flex: 1;
  display: flex;
  padding: 0.75rem 0.85rem;
  gap: 0.75rem;
  min-width: 0;
}

.content-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.room-title {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.host-name {
  font-weight: 500;
}

.meta-dot {
  color: #d1d5db;
}

.game-type {
  color: #9ca3af;
}

/* 통계 영역 */
.content-stats {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-shrink: 0;
}

.stat-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.player-stat .stat-value {
  display: flex;
  align-items: baseline;
  font-weight: 700;
}

.player-stat .current {
  font-size: 1rem;
  color: #1f2937;
}

.player-stat .separator {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0 0.1rem;
}

.player-stat .max {
  font-size: 0.75rem;
  color: #9ca3af;
}

.stat-label {
  font-size: 0.6rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.status-stat {
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  background: #f3f4f6;
}

.status-stat.playing {
  background: #fef3c7;
}

.stat-icon i {
  font-size: 0.5rem;
}

.is-public .stat-icon i {
  color: #10b981;
}

.is-private .stat-icon i {
  color: #8b5cf6;
}

.is-playing .stat-icon i {
  color: #f59e0b;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* 액션 영역 */
.tile-action {
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-left: 1px solid #f3f4f6;
  color: #d1d5db;
  transition: all 0.2s ease;
}

.room-card-tile:hover .tile-action {
  color: #9ca3af;
}

.is-public:hover .tile-action {
  background: #ecfdf5;
  color: #10b981;
}

.is-private:hover .tile-action {
  background: #f5f3ff;
  color: #8b5cf6;
}

.tile-action i {
  font-size: 0.85rem;
  transition: transform 0.2s ease;
}

.room-card-tile:hover .tile-action i {
  transform: translateX(2px);
}

/* 반응형 */
@media (max-width: 768px) {
  .tile-icon {
    width: 52px;
  }
  
  .tile-icon > i {
    font-size: 1.2rem;
  }
  
  .tile-content {
    padding: 0.6rem 0.7rem;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .content-stats {
    justify-content: flex-start;
  }
  
  .room-title {
    font-size: 0.85rem;
  }
  
  .tile-action {
    width: 32px;
  }
}
</style>

