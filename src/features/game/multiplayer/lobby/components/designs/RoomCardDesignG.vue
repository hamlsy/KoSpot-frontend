<template>
  <!-- 디자인 G: 지도 탐험가 스타일 - 따뜻한 탐험 느낌 -->
  <div 
    class="room-card-explorer"
    :class="cardClass"
    @click="$emit('click', room)"
  >
    <div class="card-pattern"></div>
    
    <div class="card-content">
      <!-- 상단 리본 -->
      <div class="card-ribbon">
        <div class="ribbon-left">
          <span class="room-number">No.{{ room.gameRoomId }}</span>
        </div>
        <div class="ribbon-right">
          <span class="status-badge">
            <i :class="statusIcon"></i>
            {{ statusText }}
          </span>
        </div>
      </div>
      
      <!-- 방 제목 영역 -->
      <div class="room-header">
        <h3 class="room-title">{{ room.title }}</h3>
        <div class="host-line">
          <i class="fas fa-compass"></i>
          <span>탐험대장: <strong>{{ room.hostNickname }}</strong></span>
        </div>
      </div>
      
      <!-- 정보 카드들 -->
      <div class="info-cards">
        <div class="info-card">
          <i :class="room.gameMode === '로드뷰' ? 'fas fa-binoculars' : 'fas fa-camera-retro'"></i>
          <span>{{ room.gameMode }}</span>
        </div>
        <div class="info-card">
          <i :class="room.gameType === '개인전' ? 'fas fa-hiking' : 'fas fa-campground'"></i>
          <span>{{ room.gameType }}</span>
        </div>
        <div class="info-card" v-if="room.privateRoom">
          <i class="fas fa-key"></i>
          <span>비밀</span>
        </div>
      </div>
      
      <!-- 탐험대원 현황 -->
      <div class="crew-section">
        <div class="crew-label">
          <i class="fas fa-users"></i>
          <span>탐험대원</span>
        </div>
        <div class="crew-display">
          <div class="crew-avatars">
            <div 
              v-for="i in room.maxPlayers" 
              :key="i"
              class="crew-avatar"
              :class="{ 'filled': i <= room.currentPlayerCount }"
            >
              <i class="fas fa-user"></i>
            </div>
          </div>
          <span class="crew-count">{{ room.currentPlayerCount }} / {{ room.maxPlayers }}</span>
        </div>
      </div>
      
      <!-- 참여 버튼 -->
      <div class="card-action">
        <div class="action-btn" v-if="!isPlaying">
          <i class="fas fa-map-marked-alt"></i>
          <span>탐험 참여</span>
        </div>
        <div class="action-btn disabled" v-else>
          <i class="fas fa-hourglass-half"></i>
          <span>탐험 중</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoomCardDesignG',
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
    statusIcon() {
      return this.isPlaying ? 'fas fa-running' : 'fas fa-flag';
    },
    statusText() {
      return this.isPlaying ? '탐험 중' : '모집 중';
    }
  }
};
</script>

<style scoped>
.room-card-explorer {
  position: relative;
  background: linear-gradient(145deg, #fffbf5 0%, #fef7ed 100%);
  border-radius: 12px;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  border: 2px solid #f5e6d3;
  box-shadow: 0 2px 8px rgba(180, 140, 100, 0.1);
}

.room-card-explorer:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(180, 140, 100, 0.2);
  border-color: #e8d5c4;
}

/* 배경 패턴 */
.card-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23b4a284' fill-opacity='1'/%3E%3C/svg%3E");
  background-size: 30px 30px;
  pointer-events: none;
}

.is-playing {
  opacity: 0.7;
  cursor: not-allowed;
}

.is-playing:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(180, 140, 100, 0.1);
}

.card-content {
  position: relative;
  padding: 1rem;
  z-index: 1;
}

/* 리본 */
.card-ribbon {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.room-number {
  font-family: 'Georgia', serif;
  font-size: 0.7rem;
  font-weight: 600;
  color: #92785e;
  letter-spacing: 0.05em;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 15px;
  font-size: 0.7rem;
  font-weight: 600;
}

.is-public .status-badge {
  background: #d5f0e5;
  color: #2d7a5f;
}

.is-private .status-badge {
  background: #e8e0f5;
  color: #6b4c9a;
}

.is-playing .status-badge {
  background: #fde8c8;
  color: #b5722d;
}

/* 방 헤더 */
.room-header {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px dashed #e8d5c4;
}

.room-title {
  margin: 0 0 0.35rem 0;
  font-family: 'Georgia', serif;
  font-size: 1.05rem;
  font-weight: 700;
  color: #4a3f35;
  line-height: 1.3;
}

.host-line {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #8b7355;
}

.host-line i {
  color: #b5945a;
  font-size: 0.8rem;
}

.host-line strong {
  color: #5c4d3d;
}

/* 정보 카드 */
.info-cards {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  background: rgba(180, 148, 90, 0.1);
  border: 1px solid rgba(180, 148, 90, 0.2);
  border-radius: 6px;
  font-size: 0.7rem;
  color: #6b5a45;
}

.info-card i {
  color: #b5945a;
  font-size: 0.7rem;
}

/* 탐험대원 */
.crew-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0;
  margin-bottom: 0.6rem;
  border-top: 1px solid #f0e4d8;
  border-bottom: 1px solid #f0e4d8;
}

.crew-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  color: #8b7355;
}

.crew-label i {
  color: #b5945a;
}

.crew-display {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.crew-avatars {
  display: flex;
  gap: 3px;
}

.crew-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
  border: 1.5px solid;
  transition: all 0.2s ease;
}

.crew-avatar:not(.filled) {
  background: #faf5ef;
  border-color: #e0d5c8;
  color: #d1c4b5;
}

.crew-avatar.filled {
  border-color: transparent;
}

.is-public .crew-avatar.filled {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.is-private .crew-avatar.filled {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  color: white;
}

.is-playing .crew-avatar.filled {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.crew-count {
  font-family: 'Georgia', serif;
  font-size: 0.8rem;
  font-weight: 700;
  color: #5c4d3d;
}

/* 액션 버튼 */
.card-action {
  margin-top: 0.25rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.is-public .action-btn:not(.disabled) {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.is-private .action-btn:not(.disabled) {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  color: white;
}

.room-card-explorer:hover .action-btn:not(.disabled) {
  transform: scale(1.02);
}

.action-btn.disabled {
  background: #f0e4d8;
  color: #a0917f;
}

/* 반응형 */
@media (max-width: 768px) {
  .card-content {
    padding: 0.85rem;
  }
  
  .room-title {
    font-size: 0.95rem;
  }
  
  .crew-avatar {
    width: 20px;
    height: 20px;
  }
}
</style>

