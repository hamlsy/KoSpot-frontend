<template>
  <div class="round-results-b">
    <!-- 배경 효과 -->
    <div class="bg-effects">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      <div class="bg-grid"></div>
    </div>

    <div class="game-container">
      <!-- 상단 스코어보드 스타일 헤더 -->
      <div class="scoreboard-header">
        <div class="round-indicator">
          <div class="round-progress-ring">
            <svg viewBox="0 0 100 100">
              <circle class="ring-bg" cx="50" cy="50" r="45" />
              <circle 
                class="ring-fill" 
                cx="50" cy="50" r="45"
                :stroke-dasharray="`${(round / totalRounds) * 283} 283`"
              />
            </svg>
            <div class="round-number">
              <span class="current">{{ round }}</span>
              <span class="separator">/</span>
              <span class="total">{{ totalRounds }}</span>
            </div>
          </div>
          <span v-if="isLastRound" class="final-indicator">
            <i class="fas fa-flag-checkered"></i> FINAL
          </span>
        </div>

        <div class="location-display">
          <div class="location-icon">
            <i class="fas fa-map-marker-alt"></i>
          </div>
          <div class="location-text">
            <h2>{{ poiName || locationName || '알 수 없는 위치' }}</h2>
            <p v-if="fullAddress">{{ fullAddress }}</p>
          </div>
        </div>

        <!-- 우승자 하이라이트 -->
        <div class="winner-highlight" v-if="topPlayer && topPlayer.playerName">
          <div class="crown-animation">
            <i class="fas fa-crown"></i>
          </div>
          <div class="winner-details">
            <span class="label">CLOSEST</span>
            <span class="name">{{ topPlayer.playerName }}</span>
            <span class="score">{{ formatDistance(topPlayer.distance) }} km</span>
          </div>
        </div>
      </div>

      <!-- 메인 게임 영역 -->
      <div class="game-arena">
        <!-- 지도 -->
        <div class="map-wrapper">
          <kakao-map
            :center="actualLocation"
            :marker-position="null"
            :actual-position="actualLocation"
            :prevent-interaction="false"
            :show-marker-hint="false"
            :zoom-level="5"
            :player-guesses="playerMarkers"
            :show-distance-lines="true"
            :fitAllMarkers="true"
            :top-player="topPlayer"
            :is-team-mode="isTeamMode"
            ref="resultMap"
          />
          <div class="map-overlay-border"></div>
        </div>

        <!-- 사이드 플레이어 리스트 (데스크톱) -->
        <div class="player-ranking" v-if="sortedPlayers.length > 0">
          <h3 class="ranking-title">
            <i class="fas fa-medal"></i> 순위
          </h3>
          <div class="ranking-list">
            <div 
              v-for="(player, index) in sortedPlayers.slice(0, 5)" 
              :key="player.id"
              class="ranking-item"
              :class="{ 'top-three': index < 3 }"
            >
              <div class="rank-badge" :class="`rank-${index + 1}`">
                {{ index + 1 }}
              </div>
              <div 
                class="player-marker"
                :style="{ backgroundImage: player.equippedMarker ? `url(${player.equippedMarker})` : 'none' }"
              ></div>
              <div class="player-info">
                <span class="player-name">{{ player.nickname }}</span>
                <span class="player-score">{{ player.lastRoundScore || 0 }} pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 하단 컨트롤 -->
      <div class="game-controls">
        <div class="ready-status">
          <div class="ready-avatars">
            <div 
              v-for="player in playersReadyDetails.slice(0, 4)" 
              :key="player.id"
              class="ready-avatar"
              :style="{ backgroundImage: player.equippedMarker ? `url(${player.equippedMarker})` : 'none' }"
            >
              <i class="fas fa-check"></i>
            </div>
          </div>
          <span v-if="playersReadyDetails.length > 0" class="ready-count">
            {{ playersReadyDetails.length }}명 준비 완료
          </span>
        </div>

        <div class="action-area">
          <div v-if="!isLastRound || isServerMode" class="countdown-display">
            <div class="countdown-bar">
              <div class="countdown-fill" :style="{ width: `${100 - progressPercentage}%` }"></div>
            </div>
            <div class="countdown-info">
              <span class="countdown-number">{{ countdownSeconds }}</span>
              <span class="countdown-text">초 후 다음 라운드</span>
            </div>
          </div>
          
          <button
            v-if="isLastRound && !isServerMode"
            class="final-button"
            @click="$emit('finish-game')"
          >
            <span class="btn-bg"></span>
            <i class="fas fa-trophy"></i>
            <span class="btn-text">최종 결과</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import KakaoMap from "@/features/game/shared/components/Kakao/KakaoMap.vue";
import gameStore from "@/store/gameStore";

export default {
  name: "RoundResultsDesignB",
  components: { KakaoMap },
  
  props: {
    players: { type: Array, default: () => [] },
    teams: { type: Array, default: () => [] },
    isTeamMode: { type: Boolean, default: false },
    actualLocation: { type: Object, default: () => ({}) },
    round: { type: Number, default: 1 },
    totalRounds: { type: Number, default: 5 },
    currentUserId: { type: String, default: "" },
    locationName: { type: String, default: "" },
    poiName: { type: String, default: "" },
    fullAddress: { type: String, default: "" },
    playerGuesses: { type: Array, default: () => [] },
    topPlayer: { type: Object, default: () => ({}) },
    playersReadyDetails: { type: Array, default: () => [] },
    serverCountdownSeconds: { type: Number, default: null },
    isServerMode: { type: Boolean, default: false },
  },

  data() {
    return {
      gameStore,
      localCountdownSeconds: 10,
      totalCountdownTime: 10,
      countdownTimer: null,
    };
  },

  computed: {
    sortedPlayers() {
      return [...this.players].sort((a, b) => (b.score || 0) - (a.score || 0));
    },
    countdownSeconds() {
      return this.serverCountdownSeconds !== null ? this.serverCountdownSeconds : this.localCountdownSeconds;
    },
    progressPercentage() {
      return ((this.totalCountdownTime - this.countdownSeconds) / this.totalCountdownTime) * 100;
    },
    isLastRound() {
      return this.round === this.totalRounds;
    },
    playerMarkers() {
      return this.playerGuesses.map((guess) => {
        const player = this.players.find(p => p.id === guess.playerId);
        return {
          position: guess.position,
          color: guess.color,
          playerName: guess.playerName,
          markerImageUrl: guess.markerImageUrl || player?.equippedMarker || null,
          playerId: guess.playerId
        };
      });
    },
  },

  mounted() {
    this.$nextTick(() => {
      setTimeout(() => this.initMap(), 300);
    });
    if (!this.isLastRound && this.serverCountdownSeconds === null) {
      this.startCountdown();
    }
  },

  beforeUnmount() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  },

  methods: {
    startCountdown() {
      this.countdownTimer = setInterval(() => {
        this.localCountdownSeconds--;
        if (this.localCountdownSeconds <= 0) {
          clearInterval(this.countdownTimer);
          this.$emit('request-next-round');
        }
      }, 1000);
    },
    initMap() {
      if (this.$refs.resultMap) {
        setTimeout(() => {
          this.$refs.resultMap?.fitMapToAllMarkers();
        }, 500);
      }
    },
    formatDistance(distance) {
      if (distance == null) return "0.000";
      return (Math.round(Number(distance) * 1000) / 1000).toFixed(3);
    },
  },
};
</script>

<style scoped>
.round-results-b {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  position: relative;
  overflow: hidden;
}

/* 배경 효과 */
.bg-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: #2563eb;
  top: -100px;
  left: -100px;
  animation: float 8s ease-in-out infinite;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: #f59e0b;
  bottom: -50px;
  right: -50px;
  animation: float 6s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, 20px); }
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* 게임 컨테이너 */
.game-container {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

/* 스코어보드 헤더 */
.scoreboard-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
}

.round-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.round-progress-ring {
  width: 60px;
  height: 60px;
  position: relative;
}

.round-progress-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 6;
}

.ring-fill {
  fill: none;
  stroke: #2563eb;
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s ease;
}

.round-number {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: baseline;
  color: white;
}

.round-number .current {
  font-size: 1.25rem;
  font-weight: 700;
}

.round-number .separator {
  font-size: 0.8rem;
  margin: 0 2px;
  opacity: 0.5;
}

.round-number .total {
  font-size: 0.8rem;
  opacity: 0.7;
}

.final-indicator {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #111827;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.5); }
  50% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.8); }
}

.location-display {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.location-icon {
  width: 48px;
  height: 48px;
  background: rgba(37, 99, 235, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #60a5fa;
  font-size: 1.25rem;
}

.location-text h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.location-text p {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

/* 우승자 하이라이트 */
.winner-highlight {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.1));
  border-radius: 12px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.crown-animation {
  color: #fbbf24;
  font-size: 1.5rem;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.winner-details {
  display: flex;
  flex-direction: column;
}

.winner-details .label {
  font-size: 0.65rem;
  color: #fbbf24;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.winner-details .name {
  font-size: 1rem;
  font-weight: 700;
  color: white;
}

.winner-details .score {
  font-size: 0.85rem;
  color: #60a5fa;
  font-weight: 600;
}

/* 게임 영역 */
.game-arena {
  flex: 1;
  display: flex;
  gap: 1rem;
  min-height: 0;
}

.map-wrapper {
  flex: 1;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}

.map-overlay-border {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  pointer-events: none;
}

/* 플레이어 랭킹 */
.player-ranking {
  width: 240px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ranking-title {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ranking-title i {
  color: #f59e0b;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.2s ease;
}

.ranking-item.top-three {
  background: rgba(255, 255, 255, 0.08);
}

.rank-badge {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #111827;
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #94a3b8, #64748b);
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #d97706, #b45309);
}

.player-marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  background-size: cover;
  background-position: center;
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-score {
  display: block;
  font-size: 0.75rem;
  color: #60a5fa;
}

/* 하단 컨트롤 */
.game-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 1rem;
}

.ready-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ready-avatars {
  display: flex;
}

.ready-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  background-size: cover;
  background-position: center;
  margin-left: -8px;
  border: 2px solid #1e293b;
  position: relative;
}

.ready-avatar:first-child {
  margin-left: 0;
}

.ready-avatar i {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.5rem;
  color: white;
}

.ready-count {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

.action-area {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.countdown-display {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.countdown-bar {
  width: 120px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.countdown-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #60a5fa);
  border-radius: 3px;
  transition: width 1s linear;
}

.countdown-info {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.countdown-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.countdown-text {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.final-button {
  position: relative;
  background: transparent;
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  overflow: hidden;
}

.final-button .btn-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  transition: transform 0.3s ease;
}

.final-button:hover .btn-bg {
  transform: scale(1.05);
}

.final-button i,
.final-button .btn-text {
  position: relative;
  z-index: 1;
  color: #111827;
  font-weight: 700;
}

.final-button i {
  font-size: 1.1rem;
}

/* 반응형 */
@media (max-width: 992px) {
  .player-ranking {
    display: none;
  }
}

@media (max-width: 768px) {
  .game-container {
    padding: 0.75rem;
  }

  .scoreboard-header {
    flex-wrap: wrap;
    padding: 1rem;
    gap: 1rem;
  }

  .winner-highlight {
    width: 100%;
  }

  .round-progress-ring {
    width: 50px;
    height: 50px;
  }

  .location-text h2 {
    font-size: 1rem;
  }

  .game-controls {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
}
</style>

