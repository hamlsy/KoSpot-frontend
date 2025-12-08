<template>
  <div class="round-results-d">
    <!-- 상단 컴팩트 헤더 -->
    <div class="compact-header">
      <div class="header-content">
        <div class="round-chip">
          <span class="chip-label">ROUND</span>
          <span class="chip-value">{{ round }}/{{ totalRounds }}</span>
          <span v-if="isLastRound" class="final-chip">FINAL</span>
        </div>
        <div class="location-info">
          <h1 class="location-title">{{ poiName || locationName || '위치 정보' }}</h1>
          <p class="location-sub" v-if="fullAddress">{{ fullAddress }}</p>
        </div>
        <div class="winner-chip" v-if="topPlayer && topPlayer.playerName">
          <i class="fas fa-crown"></i>
          <span class="winner-name">{{ topPlayer.playerName }}</span>
          <span class="winner-distance">{{ formatDistance(topPlayer.distance) }}km</span>
        </div>
      </div>
    </div>

    <!-- 메인 지도 영역 (풀스크린) -->
    <div class="map-fullscreen">
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
      
      <!-- 하단 그라데이션 오버레이 -->
      <div class="map-bottom-gradient"></div>
    </div>

    <!-- 하단 플로팅 컨트롤 바 -->
    <div class="floating-control-bar">
      <div class="control-content">
        <!-- 준비된 플레이어들 -->
        <div class="ready-section" v-if="playersReadyDetails.length > 0">
          <div class="avatar-stack">
            <div 
              v-for="player in playersReadyDetails.slice(0, 4)" 
              :key="player.id"
              class="stacked-avatar"
              :style="{ backgroundImage: player.equippedMarker ? `url(${player.equippedMarker})` : 'none' }"
            ></div>
          </div>
          <span class="ready-text">{{ playersReadyDetails.length }}명 준비</span>
        </div>

        <!-- 타이머 또는 최종 버튼 -->
        <div class="action-section">
          <div v-if="!isLastRound || isServerMode" class="countdown-pill">
            <div class="countdown-inner">
              <span class="countdown-num">{{ countdownSeconds }}</span>
              <span class="countdown-label">초</span>
            </div>
            <div class="countdown-bar">
              <div class="bar-fill" :style="{ width: `${100 - progressPercentage}%` }"></div>
            </div>
          </div>
          
          <button
            v-if="isLastRound && !isServerMode"
            class="final-btn"
            @click="$emit('finish-game')"
          >
            <i class="fas fa-trophy"></i>
            최종 결과
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import KakaoMap from "@/features/game/shared/components/Kakao/KakaoMap.vue";

export default {
  name: "RoundResultsDesignD",
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
.round-results-d {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  position: relative;
  overflow: hidden;
}

/* 상단 컴팩트 헤더 */
.compact-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1rem;
  background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.9) 70%, transparent 100%);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.round-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.chip-label {
  font-size: 0.65rem;
  color: #6b7280;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.chip-value {
  font-size: 1rem;
  font-weight: 800;
  color: #111827;
}

.final-chip {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #111827;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.6rem;
  font-weight: 700;
}

.location-info {
  flex: 1;
  min-width: 0;
}

.location-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.location-sub {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.winner-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  padding: 0.5rem 1rem;
  border-radius: 24px;
  box-shadow: 0 2px 12px rgba(245, 158, 11, 0.2);
  flex-shrink: 0;
}

.winner-chip i {
  color: #f59e0b;
}

.winner-name {
  font-weight: 700;
  color: #111827;
  font-size: 0.9rem;
}

.winner-distance {
  font-size: 0.8rem;
  color: #2563eb;
  font-weight: 600;
}

/* 지도 풀스크린 */
.map-fullscreen {
  flex: 1;
  position: relative;
}

.map-bottom-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(0deg, rgba(248,250,252,1) 0%, transparent 100%);
  pointer-events: none;
  z-index: 10;
}

/* 하단 플로팅 컨트롤 바 */
.floating-control-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1rem 1.5rem 1.5rem;
}

.control-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 0.875rem 1.25rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  max-width: 600px;
  margin: 0 auto;
}

.ready-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-stack {
  display: flex;
}

.stacked-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  background-size: cover;
  background-position: center;
  border: 2px solid white;
  margin-left: -8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.stacked-avatar:first-child {
  margin-left: 0;
}

.ready-text {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.action-section {
  display: flex;
  align-items: center;
}

.countdown-pill {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f3f4f6;
  padding: 0.5rem 1rem;
  border-radius: 16px;
}

.countdown-inner {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
}

.countdown-num {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.countdown-label {
  font-size: 0.7rem;
  color: #6b7280;
}

.countdown-bar {
  width: 80px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #3b82f6);
  border-radius: 3px;
  transition: width 1s linear;
}

.final-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #111827;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
}

.final-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
}

/* 반응형 - 모바일 */
@media (max-width: 768px) {
  .compact-header {
    padding: 0.75rem;
  }

  .header-content {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .round-chip {
    padding: 0.4rem 0.75rem;
  }

  .chip-value {
    font-size: 0.9rem;
  }

  .location-info {
    order: -1;
    width: 100%;
    flex: none;
    text-align: center;
    margin-bottom: 0.25rem;
  }

  .location-title {
    font-size: 1.1rem;
  }

  .winner-chip {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;
  }

  .floating-control-bar {
    padding: 0.75rem 1rem 1rem;
  }

  .control-content {
    padding: 0.75rem 1rem;
    border-radius: 16px;
  }

  .countdown-bar {
    width: 60px;
  }
}

@media (max-width: 480px) {
  .compact-header {
    padding: 0.5rem;
  }

  .location-title {
    font-size: 1rem;
  }

  .location-sub {
    font-size: 0.75rem;
  }

  .winner-chip {
    display: none;
  }

  .stacked-avatar {
    width: 28px;
    height: 28px;
  }

  .countdown-pill {
    padding: 0.4rem 0.75rem;
    gap: 0.75rem;
  }

  .countdown-num {
    font-size: 1.25rem;
  }

  .countdown-bar {
    width: 50px;
    height: 5px;
  }

  .final-btn {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
}
</style>

