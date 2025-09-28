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
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  overflow-y: auto;
  padding: 1rem;
}

.final-results-container {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: modalSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  transform-origin: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

@keyframes modalSlideIn {
  0% {
    opacity: 0;
    transform: scale(0.85) translateY(30px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 헤더 */
.final-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.header-content {
  position: relative;
  z-index: 2;
}

.trophy-icon {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
  color: #FFD700;
  animation: trophyGlow 2s ease-in-out infinite alternate;
}

@keyframes trophyGlow {
  from { filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5)); }
  to { filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.8)); }
}

.final-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.3rem 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.final-subtitle {
  font-size: 1rem;
  margin: 0;
  opacity: 0.9;
  font-weight: 400;
}

/* 순위 목록 */
.rankings-container {
  padding: 1.5rem;
  max-height: 350px;
  overflow-y: auto;
}

.rankings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.rankings-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
  font-weight: 600;
}

.total-players {
  background: linear-gradient(135deg, #f0f2f5, #e9ecef);
  padding: 0.4rem 0.8rem;
  border-radius: 15px;
  color: #666;
  font-weight: 500;
  font-size: 0.9rem;
}

.rankings-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 0.8rem;
  background: #ffffff;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.ranking-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.ranking-item.current-user {
  background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
  border: 1px solid #2196f3;
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.2);
}

.ranking-item.rank-1 {
  background: linear-gradient(135deg, #fff8e1, #fffbf0);
  border: 1px solid #ffc107;
  box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2);
}

.ranking-item.rank-2 {
  background: linear-gradient(135deg, #f3e5f5, #faf5ff);
  border: 1px solid #9c27b0;
  box-shadow: 0 4px 15px rgba(156, 39, 176, 0.2);
}

.ranking-item.rank-3 {
  background: linear-gradient(135deg, #e8f5e8, #f0f8f0);
  border: 1px solid #4caf50;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.2);
}

/* 순위 배지 */
.rank-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  margin-right: 0.8rem;
  flex-shrink: 0;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
  box-shadow: 0 3px 10px rgba(255, 215, 0, 0.3);
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #333;
  box-shadow: 0 3px 10px rgba(192, 192, 192, 0.3);
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #daa520);
  color: white;
  box-shadow: 0 3px 10px rgba(205, 127, 50, 0.3);
}

.rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: linear-gradient(135deg, #666, #888);
  color: white;
  box-shadow: 0 3px 10px rgba(102, 102, 102, 0.3);
}

.rank-icon {
  font-size: 1.2rem;
}

/* 플레이어 정보 */
.player-info {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 0.8rem;
}

.player-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  overflow: hidden;
  background: #eee;
  flex-shrink: 0;
  border: 2px solid #e9ecef;
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
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.host-icon {
  color: #ffc107;
  font-size: 0.8rem;
}

.player-stats {
  display: flex;
  gap: 0.8rem;
  font-size: 0.85rem;
  color: #666;
}

.total-score {
  font-weight: 600;
  color: #2196f3;
}

.average-distance {
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
  width: 6px;
  height: 6px;
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
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-top: 1px solid #e9ecef;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2196f3;
  margin-bottom: 0.2rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
}

/* 액션 버튼 */
.final-actions {
  display: flex;
  gap: 0.8rem;
  padding: 1.5rem;
  justify-content: center;
}

.action-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.3s ease;
  min-width: 140px;
  justify-content: center;
}

.primary-btn {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  box-shadow: 0 3px 12px rgba(33, 150, 243, 0.3);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
}

.secondary-btn {
  background: linear-gradient(135deg, #757575, #616161);
  color: white;
  box-shadow: 0 3px 12px rgba(117, 117, 117, 0.3);
}

.secondary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(117, 117, 117, 0.4);
}


/* 반응형 */
@media (max-width: 768px) {
  .final-results-container {
    width: 95%;
    max-width: none;
    max-height: 95vh;
    margin: 0;
    border-radius: 15px;
  }

  .final-title {
    font-size: 1.8rem;
  }

  .final-subtitle {
    font-size: 0.9rem;
  }

  .trophy-icon {
    font-size: 2rem;
  }

  .ranking-item {
    padding: 0.6rem;
  }

  .player-info {
    gap: 0.6rem;
  }

  .player-avatar {
    width: 40px;
    height: 40px;
  }

  .player-name {
    font-size: 0.9rem;
  }

  .player-stats {
    font-size: 0.8rem;
    gap: 0.6rem;
  }

  .final-actions {
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 1rem;
  }

  .action-btn {
    width: 100%;
    max-width: 250px;
    padding: 0.7rem 1.2rem;
    font-size: 0.9rem;
  }

  .rankings-container {
    max-height: calc(95vh - 250px);
    overflow-y: auto;
  }

  .game-stats {
    padding: 0.8rem 1rem;
  }

  .stat-value {
    font-size: 1.3rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }
}
</style>
