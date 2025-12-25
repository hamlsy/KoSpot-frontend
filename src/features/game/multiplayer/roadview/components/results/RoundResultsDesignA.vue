<template>
  <div class="round-results-a">
    <div class="results-card">
      <!-- 컴팩트 헤더 -->
      <div class="card-header">
        <div class="header-badge">
          <span class="round-badge">{{ round }} / {{ totalRounds }}</span>
          <span v-if="isLastRound" class="final-badge">FINAL</span>
        </div>
        <h2 class="location-title">{{ poiName || locationName || '위치 정보' }}</h2>
        <p class="location-address" v-if="fullAddress">
          <i class="fas fa-map-pin"></i>
          {{ fullAddress }}
        </p>
      </div>

      <!-- 지도 영역 (풀 와이드) -->
      <div class="map-section">
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
        
        <!-- 우승자 플로팅 카드 -->
        <div class="winner-float-card" v-if="topPlayer && topPlayer.playerName">
          <div class="winner-icon">
            <i class="fas fa-crown"></i>
          </div>
          <div class="winner-info">
            <span class="winner-label">가장 가까운 플레이어</span>
            <span class="winner-name">{{ topPlayer.playerName }}</span>
            <span class="winner-distance">{{ formatDistance(topPlayer.distance) }} km</span>
          </div>
        </div>
      </div>

      <!-- 하단 액션 바 -->
      <div class="action-bar">
        <!-- 플레이어 아바타 표시 -->
        <div class="ready-players" v-if="playersReadyDetails.length > 0">
          <div 
            v-for="player in playersReadyDetails.slice(0, 5)" 
            :key="player.id"
            class="player-avatar"
            :style="{ backgroundImage: player.equippedMarker ? `url(${player.equippedMarker})` : 'none' }"
            :title="player.nickname"
          ></div>
          <span v-if="playersReadyDetails.length > 5" class="more-count">
            +{{ playersReadyDetails.length - 5 }}
          </span>
        </div>

        <!-- 진행 정보 -->
        <div class="progress-section">
          <div v-if="!isLastRound || isServerMode" class="timer-display">
            <div class="timer-ring">
              <svg viewBox="0 0 36 36">
                <path
                  class="timer-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  class="timer-progress"
                  :stroke-dasharray="`${progressPercentage}, 100`"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span class="timer-text">{{ countdownSeconds }}</span>
            </div>
            <span class="timer-label">다음 라운드</span>
          </div>
          
          <button
            v-if="isLastRound && !isServerMode"
            class="finish-btn"
            @click="$emit('finish-game')"
          >
            <i class="fas fa-trophy"></i>
            최종 결과 보기
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
  name: "RoundResultsDesignA",
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
.round-results-a {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 1rem;
}

.results-card {
  width: 100%;
  height: 100%;
  max-width: 1200px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(37, 99, 235, 0.1), 0 8px 24px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: cardSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cardSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 헤더 */
.card-header {
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  color: white;
}

.header-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.round-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.final-badge {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #111827;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.location-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.location-address {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  opacity: 0.85;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.location-address i {
  font-size: 0.8rem;
}

/* 지도 섹션 */
.map-section {
  flex: 1;
  position: relative;
  min-height: 400px;
}

.winner-float-card {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: white;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 100;
  animation: floatIn 0.4s ease-out 0.3s both;
}

@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.winner-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.winner-info {
  display: flex;
  flex-direction: column;
}

.winner-label {
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.winner-name {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.winner-distance {
  font-size: 0.85rem;
  color: #2563eb;
  font-weight: 600;
}

/* 액션 바 */
.action-bar {
  padding: 1.25rem 2rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ready-players {
  display: flex;
  align-items: center;
}

.player-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  background-size: cover;
  background-position: center;
  border: 2px solid white;
  margin-left: -8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.player-avatar:first-child {
  margin-left: 0;
}

.more-count {
  margin-left: 0.5rem;
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.timer-ring {
  width: 48px;
  height: 48px;
  position: relative;
}

.timer-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.timer-bg {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 3;
}

.timer-progress {
  fill: none;
  stroke: #2563eb;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 1s linear;
}

.timer-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.timer-label {
  font-size: 0.85rem;
  color: #6b7280;
}

.finish-btn {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #111827;
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
}

.finish-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
}

/* 반응형 */
@media (max-width: 768px) {
  .round-results-a {
    padding: 0;
  }

  .results-card {
    border-radius: 0;
  }

  .card-header {
    padding: 1.25rem 1.5rem;
  }

  .location-title {
    font-size: 1.25rem;
  }

  .map-section {
    min-height: 300px;
  }

  .winner-float-card {
    top: 0.75rem;
    right: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .winner-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .action-bar {
    padding: 1rem 1.5rem;
    flex-direction: column;
    gap: 1rem;
  }
}
</style>

