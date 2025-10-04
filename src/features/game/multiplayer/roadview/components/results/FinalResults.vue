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
          <i class="fas fa-arrow-left"></i>
          <span>돌아가기</span>
        </button>
        <button class="action-btn primary-btn" @click="$emit('exit-to-lobby')">
          <i class="fas fa-sign-out-alt"></i>
          <span>나가기</span>
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
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  overflow-y: auto;
  padding: 2rem 1rem;
}

.final-results-container {
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  background: #3182f6;
  color: white;
  text-align: center;
  padding: 2rem 1.5rem;
}

.header-content {
  position: relative;
}

.trophy-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  color: #FFD700;
}

.final-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.final-subtitle {
  font-size: 0.95rem;
  margin: 0;
  opacity: 0.95;
  font-weight: 400;
}

/* 순위 목록 */
.rankings-container {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.rankings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.rankings-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #191f28;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.total-players {
  background: #f2f4f6;
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  color: #4e5968;
  font-weight: 600;
  font-size: 0.875rem;
}

.rankings-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 16px;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.ranking-item:hover {
  background: #f2f4f6;
}

.ranking-item.current-user {
  background: #e8f3ff;
  border: 1.5px solid #3182f6;
}

.ranking-item.rank-1 {
  background: #fffbf0;
  border: 1.5px solid #ffc107;
}

.ranking-item.rank-2 {
  background: #f8f4fb;
  border: 1.5px solid #9c27b0;
}

.ranking-item.rank-3 {
  background: #f0f8f4;
  border: 1.5px solid #4caf50;
}

/* 순위 배지 */
.rank-badge {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  margin-right: 0.875rem;
  flex-shrink: 0;
}

.rank-badge.rank-1 {
  background: #ffd700;
  color: #191f28;
}

.rank-badge.rank-2 {
  background: #e0e0e0;
  color: #191f28;
}

.rank-badge.rank-3 {
  background: #cd7f32;
  color: white;
}

.rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: #8b95a1;
  color: white;
}

.rank-icon {
  font-size: 1.125rem;
}

/* 플레이어 정보 */
.player-info {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 0.875rem;
}

.player-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: #e5e8eb;
  flex-shrink: 0;
  border: 2px solid white;
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
  color: #191f28;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  letter-spacing: -0.01em;
}

.host-icon {
  color: #ffc107;
  font-size: 0.875rem;
}

.player-stats {
  display: flex;
  gap: 0.875rem;
  font-size: 0.875rem;
  color: #6b7684;
}

.total-score {
  font-weight: 700;
  color: #3182f6;
}

.average-distance {
  color: #6b7684;
  font-weight: 500;
}

/* 우승자 효과 제거 (심플하게) */
.winner-effect {
  display: none;
}

/* 게임 통계 */
.game-stats {
  display: flex;
  justify-content: space-around;
  padding: 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e8eb;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #191f28;
  margin-bottom: 0.25rem;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 0.8125rem;
  color: #6b7684;
  font-weight: 500;
}

/* 액션 버튼 */
.final-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  background: white;
}

.action-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  letter-spacing: -0.01em;
}

.primary-btn {
  background: #3182f6;
  color: white;
}

.primary-btn:hover {
  background: #1b64da;
}

.primary-btn:active {
  background: #1957c2;
}

.secondary-btn {
  background: #f2f4f6;
  color: #191f28;
}

.secondary-btn:hover {
  background: #e5e8eb;
}

.secondary-btn:active {
  background: #d1d6db;
}

/* 반응형 */
@media (max-width: 768px) {
  .final-results-overlay {
    padding: 1rem;
  }

  .final-results-container {
    max-width: 100%;
    border-radius: 20px;
  }

  .final-header {
    padding: 1.75rem 1.25rem;
  }

  .final-title {
    font-size: 1.5rem;
  }

  .final-subtitle {
    font-size: 0.875rem;
  }

  .trophy-icon {
    font-size: 2.25rem;
  }

  .rankings-container {
    padding: 1.25rem;
    max-height: 320px;
  }

  .ranking-item {
    padding: 0.875rem;
  }

  .player-info {
    gap: 0.75rem;
  }

  .player-avatar {
    width: 44px;
    height: 44px;
  }

  .player-name {
    font-size: 0.9375rem;
  }

  .player-stats {
    font-size: 0.8125rem;
    gap: 0.75rem;
  }

  .final-actions {
    flex-direction: column;
    gap: 0.625rem;
    padding: 1.25rem;
  }

  .action-btn {
    padding: 0.875rem;
    font-size: 0.9375rem;
  }

  .game-stats {
    padding: 1.25rem 1rem;
  }

  .stat-value {
    font-size: 1.375rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }
}
</style>
