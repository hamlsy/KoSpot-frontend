<template>
  <!-- 디자인 H: 보드게임 카드 스타일 - 물리적 카드 느낌 -->
  <div 
    class="room-card-board"
    :class="cardClass"
    @click="$emit('click', room)"
  >
    <div class="card-inner">
      <!-- 카드 상단 -->
      <div class="card-top">
        <div class="corner-emblem top-left">
          <span>{{ room.currentPlayerCount }}</span>
        </div>
        <div class="card-title-area">
          <span class="mode-label">{{ room.gameMode }}</span>
        </div>
        <div class="corner-emblem top-right">
          <span>{{ room.maxPlayers }}</span>
        </div>
      </div>
      
      <!-- 카드 메인 이미지 영역 -->
      <div class="card-illustration">
        <div class="illustration-bg">
          <i :class="illustrationIcon"></i>
        </div>
        <div class="status-ribbon" v-if="isPlaying">
          <span>게임 중</span>
        </div>
        <div class="private-seal" v-if="room.privateRoom && !isPlaying">
          <i class="fas fa-shield-alt"></i>
        </div>
      </div>
      
      <!-- 카드 정보 영역 -->
      <div class="card-info">
        <h3 class="room-name">{{ room.title }}</h3>
        <div class="host-chip">
          <i class="fas fa-crown"></i>
          <span>{{ room.hostNickname }}</span>
        </div>
      </div>
      
      <!-- 카드 하단 -->
      <div class="card-bottom">
        <div class="stat-chip">
          <i :class="room.gameType === '개인전' ? 'fas fa-user' : 'fas fa-users'"></i>
          <span>{{ room.gameType }}</span>
        </div>
        <div class="player-tokens">
          <span 
            v-for="i in room.maxPlayers" 
            :key="i"
            class="token"
            :class="{ 'active': i <= room.currentPlayerCount }"
          ></span>
        </div>
      </div>
      
      <!-- 카드 하단 코너 -->
      <div class="card-footer-corners">
        <div class="corner-emblem bottom-left inverted">
          <span>{{ room.maxPlayers }}</span>
        </div>
        <div class="corner-emblem bottom-right inverted">
          <span>{{ room.currentPlayerCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoomCardDesignH',
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
    illustrationIcon() {
      if (this.room.gameMode === '로드뷰') return 'fas fa-road';
      return 'fas fa-image';
    }
  }
};
</script>

<style scoped>
.room-card-board {
  position: relative;
  background: #f8f6f3;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  border: 3px solid;
  box-shadow: 
    0 4px 0 rgba(0, 0, 0, 0.1),
    0 8px 20px rgba(0, 0, 0, 0.1);
}

.room-card-board:hover {
  transform: translateY(-6px) rotate(-1deg);
  box-shadow: 
    0 8px 0 rgba(0, 0, 0, 0.1),
    0 16px 30px rgba(0, 0, 0, 0.15);
}

.is-public {
  border-color: #22c55e;
  background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%);
}

.is-private {
  border-color: #8b5cf6;
  background: linear-gradient(180deg, #faf5ff 0%, #f3e8ff 100%);
}

.is-playing {
  border-color: #f59e0b;
  background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%);
  opacity: 0.8;
  cursor: not-allowed;
}

.is-playing:hover {
  transform: none;
  box-shadow: 
    0 4px 0 rgba(0, 0, 0, 0.1),
    0 8px 20px rgba(0, 0, 0, 0.1);
}

.card-inner {
  padding: 0.5rem;
}

/* 상단 코너 */
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.35rem;
}

.corner-emblem {
  width: 24px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  border-radius: 4px;
}

.is-public .corner-emblem {
  background: #22c55e;
  color: white;
}

.is-private .corner-emblem {
  background: #8b5cf6;
  color: white;
}

.is-playing .corner-emblem {
  background: #f59e0b;
  color: white;
}

.corner-emblem.inverted {
  transform: rotate(180deg);
}

.card-title-area {
  flex: 1;
  text-align: center;
}

.mode-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #64748b;
}

/* 일러스트 영역 */
.card-illustration {
  position: relative;
  margin: 0 0.25rem 0.5rem;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.illustration-bg {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.is-public .illustration-bg {
  background: linear-gradient(135deg, #86efac, #22c55e);
  color: white;
}

.is-private .illustration-bg {
  background: linear-gradient(135deg, #c4b5fd, #8b5cf6);
  color: white;
}

.is-playing .illustration-bg {
  background: linear-gradient(135deg, #fcd34d, #f59e0b);
  color: white;
}

.status-ribbon {
  position: absolute;
  top: 8px;
  right: -25px;
  background: #dc2626;
  color: white;
  font-size: 0.55rem;
  font-weight: 700;
  padding: 0.2rem 1.5rem;
  transform: rotate(45deg);
}

.private-seal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: rgba(139, 92, 246, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  border: 3px solid white;
  box-shadow: 0 2px 10px rgba(139, 92, 246, 0.4);
}

/* 카드 정보 */
.card-info {
  text-align: center;
  padding: 0 0.25rem;
  margin-bottom: 0.5rem;
}

.room-name {
  margin: 0 0 0.35rem 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.host-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  font-size: 0.7rem;
  color: #64748b;
}

.host-chip i {
  color: #fbbf24;
  font-size: 0.6rem;
}

/* 카드 하단 */
.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.25rem;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
  margin-bottom: 0.25rem;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  color: #64748b;
}

.stat-chip i {
  font-size: 0.6rem;
}

.player-tokens {
  display: flex;
  gap: 3px;
}

.token {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid;
  transition: all 0.2s ease;
}

.token:not(.active) {
  background: transparent;
}

.is-public .token {
  border-color: #22c55e;
}

.is-public .token.active {
  background: #22c55e;
}

.is-private .token {
  border-color: #8b5cf6;
}

.is-private .token.active {
  background: #8b5cf6;
}

.is-playing .token {
  border-color: #f59e0b;
}

.is-playing .token.active {
  background: #f59e0b;
}

/* 하단 코너 */
.card-footer-corners {
  display: flex;
  justify-content: space-between;
}

.bottom-left,
.bottom-right {
  font-size: 0.65rem;
}

/* 반응형 */
@media (max-width: 768px) {
  .room-name {
    font-size: 0.8rem;
  }
  
  .illustration-bg {
    height: 60px;
    font-size: 1.5rem;
  }
}
</style>

