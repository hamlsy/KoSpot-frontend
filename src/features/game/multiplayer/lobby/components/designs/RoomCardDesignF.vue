<template>
  <!-- 디자인 F: HUD 라이트 (D+B 중간) - 밝은 배경에 게임 감성 -->
  <div 
    class="room-card-hud-light"
    :class="cardClass"
    @click="$emit('click', room)"
  >
    <!-- 좌측 상태 바 -->
    <div class="status-bar"></div>
    
    <!-- 카드 내용 -->
    <div class="card-content">
      <div class="card-header">
        <div class="room-id-badge">
          <span class="id-hash">#{{ String(room.gameRoomId).padStart(3, '0') }}</span>
        </div>
        <div class="status-chip">
          <span class="status-dot"></span>
          <span>{{ statusText }}</span>
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
        
        <div class="lock-indicator" v-if="room.privateRoom">
          <i class="fas fa-lock"></i>
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
      </div>
      
      <div class="card-footer">
        <div class="player-bar-wrapper">
          <div class="player-bar">
            <div class="player-fill" :style="{ width: playerPercentage + '%' }"></div>
          </div>
          <span class="player-count">{{ room.currentPlayerCount }}/{{ room.maxPlayers }}</span>
        </div>
        <span class="join-text" v-if="!isPlaying">입장하기 →</span>
        <span class="join-text disabled" v-else>진행 중</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoomCardDesignF',
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
    statusText() {
      return this.isPlaying ? '진행 중' : '대기 중';
    },
    playerPercentage() {
      return (this.room.currentPlayerCount / this.room.maxPlayers) * 100;
    }
  }
};
</script>

<style scoped>
.room-card-hud-light {
  position: relative;
  background: #ffffff;
  border-radius: 4px;
  padding: 0;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  display: flex;
}

.room-card-hud-light:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

/* 좌측 상태 바 */
.status-bar {
  width: 5px;
  flex-shrink: 0;
}

.is-public .status-bar {
  background: linear-gradient(180deg, #10b981, #059669);
}

.is-private .status-bar {
  background: linear-gradient(180deg, #6366f1, #4f46e5);
}

.is-playing .status-bar {
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

.card-content {
  flex: 1;
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 헤더 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-id-badge {
  background: #f3f4f6;
  padding: 0.2rem 0.5rem;
  border-radius: 2px;
}

.id-hash {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 0.65rem;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: 0.02em;
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

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.is-public .status-dot {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
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

.lock-indicator {
  width: 28px;
  height: 28px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
}

.lock-indicator i {
  color: #6366f1;
  font-size: 0.7rem;
}

/* 메타 정보 */
.room-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
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
.card-footer {
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

.room-card-hud-light:hover .join-text:not(.disabled) {
  transform: translateX(3px);
}

.join-text.disabled {
  color: #9ca3af;
}

/* 반응형 */
@media (max-width: 768px) {
  .card-content {
    padding: 0.75rem 0.875rem;
  }
  
  .room-name {
    font-size: 0.85rem;
  }
}
</style>

