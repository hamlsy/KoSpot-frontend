<template>
  <div class="final-results-overlay">
    <div class="final-results-container">
      <!-- 헤더 -->
      <div class="final-header">
        <div class="header-content">
          <div class="trophy-icon">
            <i class="fas fa-trophy"></i>
          </div>
          <h1 class="final-title">게임 완료!</h1>
          <p class="final-subtitle">{{ totalRounds }}라운드 최종 결과</p>
        </div>
      </div>

      <!-- 순위 목록 -->
      <div class="rankings-container">
        <div class="rankings-header">
          <h3>최종 순위</h3>
          <div class="total-players">{{ players.length }}명 참가</div>
        </div>
        
        <div class="rankings-list">
          <div
            v-for="(player, index) in sortedPlayers"
            :key="player.id"
            class="ranking-item"
            :class="{
              'rank-1': index === 0,
              'rank-2': index === 1,
              'rank-3': index === 2,
              'current-user': player.id === currentUserId
            }"
          >
            <!-- 순위 배지 -->
            <div class="rank-badge" :class="`rank-${index + 1}`">
              <span v-if="index < 3" class="rank-icon">
                <i v-if="index === 0" class="fas fa-crown"></i>
                <i v-else-if="index === 1" class="fas fa-medal"></i>
                <i v-else-if="index === 2" class="fas fa-award"></i>
              </span>
              <span v-else class="rank-number">{{ index + 1 }}</span>
            </div>

            <!-- 플레이어 정보 -->
            <div class="player-info">
              <div class="player-avatar">
                <img
                  :src="player.equippedMarker || '/assets/default-marker.png'"
                  :alt="player.nickname"
                />
              </div>
              <div class="player-details">
                <div class="player-name">
                  {{ player.nickname }}
                  <i v-if="player.isHost" class="fas fa-crown host-icon" title="방장"></i>
                </div>
                <div class="player-stats">
                  <span class="total-score">{{ formatScore(player.score || 0) }}점</span>
                  <span class="average-distance">평균 {{ formatDistance(player.averageDistance || 0) }}km</span>
                </div>
              </div>
            </div>

            <!-- 순위 변화 -->
            <div class="rank-change" v-if="player.rankChange">
              <i 
                class="fas"
                :class="{
                  'fa-arrow-up rank-up': player.rankChange > 0,
                  'fa-arrow-down rank-down': player.rankChange < 0,
                  'fa-minus rank-same': player.rankChange === 0
                }"
              ></i>
              <span class="change-value" v-if="player.rankChange !== 0">{{ Math.abs(player.rankChange) }}</span>
            </div>

            <!-- 특별 효과 (1등일 때) -->
            <div v-if="index === 0" class="winner-effect">
              <div class="sparkle sparkle-1"></div>
              <div class="sparkle sparkle-2"></div>
              <div class="sparkle sparkle-3"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 게임 통계 -->
      <div class="game-stats">
        <div class="stat-item">
          <div class="stat-value">{{ totalRounds }}</div>
          <div class="stat-label">총 라운드</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ formatTime(totalGameTime) }}</div>
          <div class="stat-label">게임 시간</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ players.length }}</div>
          <div class="stat-label">참가자</div>
        </div>
      </div>

      <!-- 액션 버튼 -->
      <div class="final-actions">
        <button class="action-btn secondary-btn" @click="$emit('play-again')">
          <i class="fas fa-redo"></i>
          <span>다시 하기</span>
        </button>
        <button class="action-btn primary-btn" @click="$emit('exit-to-lobby')">
          <i class="fas fa-home"></i>
          <span>로비로 나가기</span>
        </button>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: "FinalResults",

  props: {
    players: {
      type: Array,
      required: true,
      default: () => []
    },
    currentUserId: {
      type: String,
      required: true
    },
    totalRounds: {
      type: Number,
      default: 5
    },
    totalGameTime: {
      type: Number,
      default: 0 // 초 단위
    },
    roomData: {
      type: Object,
      default: () => ({})
    }
  },

  computed: {
    sortedPlayers() {
      return [...this.players].sort((a, b) => (b.score || 0) - (a.score || 0));
    }
  },

  methods: {
    formatScore(score) {
      return score.toLocaleString();
    },

    formatDistance(distance) {
      return Math.round(distance * 100) / 100;
    },

    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

  }
};
</script>

<style scoped>
.final-results-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  overflow-y: auto;
  padding: 1rem;
}

.final-results-container {
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  background: white;
  border-radius: 24px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  transform-origin: center;
}

@keyframes modalSlideIn {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 헤더 */
.final-header {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
  text-align: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.header-content {
  position: relative;
  z-index: 2;
}

.trophy-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #FFD700;
}

.final-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.final-subtitle {
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.9;
}

/* 순위 목록 */
.rankings-container {
  padding: 2rem;
  max-height: 400px;
  overflow-y: auto;
}

.rankings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.rankings-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.total-players {
  background: #f0f2f5;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  color: #666;
  font-weight: 600;
}

.rankings-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 15px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.ranking-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.ranking-item.current-user {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  border: 2px solid #2196f3;
}

.ranking-item.rank-1 {
  background: linear-gradient(135deg, #fff8e1, #ffecb3);
  border: 2px solid #ffc107;
}

.ranking-item.rank-2 {
  background: linear-gradient(135deg, #f3e5f5, #e1bee7);
  border: 2px solid #9c27b0;
}

.ranking-item.rank-3 {
  background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
  border: 2px solid #4caf50;
}

/* 순위 배지 */
.rank-badge {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.2rem;
  margin-right: 1rem;
  flex-shrink: 0;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #333;
  box-shadow: 0 4px 15px rgba(192, 192, 192, 0.4);
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #daa520);
  color: white;
  box-shadow: 0 4px 15px rgba(205, 127, 50, 0.4);
}

.rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: linear-gradient(135deg, #666, #888);
  color: white;
}

.rank-icon {
  font-size: 1.5rem;
}

/* 플레이어 정보 */
.player-info {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 1rem;
}

.player-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  background: #eee;
  flex-shrink: 0;
}

.player-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.player-details {
  flex: 1;
}

.player-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.host-icon {
  color: #ffc107;
  font-size: 0.9rem;
}

.player-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.total-score {
  font-weight: 700;
  color: #2196f3;
}

/* 순위 변화 */
.rank-change {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.rank-up {
  color: #4caf50;
}

.rank-down {
  color: #f44336;
}

.rank-same {
  color: #666;
}

/* 우승자 효과 */
.winner-effect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #ffd700;
  border-radius: 50%;
  animation: sparkle 2s infinite;
}

.sparkle-1 { top: 20%; left: 20%; animation-delay: 0s; }
.sparkle-2 { top: 30%; right: 25%; animation-delay: 0.7s; }
.sparkle-3 { bottom: 25%; left: 70%; animation-delay: 1.4s; }

@keyframes sparkle {
  0%, 100% { 
    opacity: 0; 
    transform: scale(0); 
  }
  50% { 
    opacity: 1; 
    transform: scale(1); 
  }
}

/* 게임 통계 */
.game-stats {
  display: flex;
  justify-content: space-around;
  padding: 1.5rem 2rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #2196f3;
  margin-bottom: 0.3rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

/* 액션 버튼 */
.final-actions {
  display: flex;
  gap: 1rem;
  padding: 2rem;
  justify-content: center;
}

.action-btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  min-width: 160px;
  justify-content: center;
}

.primary-btn {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(33, 150, 243, 0.4);
}

.secondary-btn {
  background: linear-gradient(135deg, #757575, #616161);
  color: white;
  box-shadow: 0 4px 15px rgba(117, 117, 117, 0.3);
}

.secondary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(117, 117, 117, 0.4);
}


/* 반응형 */
@media (max-width: 768px) {
  .final-results-container {
    width: 95%;
    max-width: none;
    max-height: 95vh;
    margin: 0;
  }

  .final-title {
    font-size: 2rem;
  }

  .ranking-item {
    padding: 0.8rem;
  }

  .player-info {
    gap: 0.8rem;
  }

  .final-actions {
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    padding: 1.5rem;
    position: sticky;
    bottom: 0;
    background: white;
    border-top: 1px solid #eee;
  }

  .action-btn {
    width: 100%;
    max-width: 280px;
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
  }

  .trophy-icon {
    font-size: 2.5rem;
  }

  .rankings-container {
    max-height: calc(95vh - 300px);
    overflow-y: auto;
  }
}
</style>
