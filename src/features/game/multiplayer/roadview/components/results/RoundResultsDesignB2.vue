<template>
  <div class="round-results-b2">
    <!-- 상단 헤더 - 라운드 정보 + 관광지 이름 -->
    <header class="results-header">
      <div class="header-inner">
        <div class="round-badge">
          <span class="round-text">ROUND</span>
          <span class="round-current">{{ round }}</span>
          <span class="round-divider">/</span>
          <span class="round-total">{{ totalRounds }}</span>
          <span v-if="isLastRound" class="final-label">FINAL</span>
        </div>
        <div class="location-display">
          <h1 class="poi-name">{{ poiName || locationName || '위치 정보' }}</h1>
          <p class="full-address" v-if="fullAddress">{{ fullAddress }}</p>
        </div>
      </div>
    </header>

    <!-- 메인 컨텐츠 영역 -->
    <main class="main-content">
      <!-- 지도 영역 - 우선 표시 -->
      <section class="map-section">
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
        
        <!-- 우승자 오버레이 -->
        <div class="winner-overlay" v-if="topPlayer && topPlayer.playerName">
          <div class="winner-content">
            <i class="fas fa-crown crown-icon"></i>
            <span class="winner-name">{{ topPlayer.playerName }}</span>
            <span class="winner-distance">{{ formatDistance(topPlayer.distance) }}km</span>
          </div>
        </div>
      </section>

      <!-- 사이드 패널 - 데스크톱에서만 표시 -->
      <aside class="side-panel">
        <!-- 내 결과 -->
        <div class="my-result-card" v-if="myResult">
          <div class="card-header">
            <i class="fas fa-user"></i>
            <span>내 결과</span>
          </div>
          <div class="card-body">
            <div class="result-row">
              <span class="label">거리</span>
              <span class="value distance">{{ formatDistance(myResult.distance) }}km</span>
            </div>
            <div class="result-row">
              <span class="label">점수</span>
              <span class="value score">+{{ myResult.score || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 랭킹 목록 -->
        <div class="ranking-card">
          <div class="card-header">
            <i class="fas fa-ranking-star"></i>
            <span>라운드 순위</span>
          </div>
          <div class="ranking-list">
            <div 
              v-for="(player, idx) in sortedPlayers.slice(0, 5)" 
              :key="player.id"
              class="ranking-item"
              :class="{ 'is-me': player.id === currentUserId }"
            >
              <span class="rank" :class="`rank-${idx + 1}`">{{ idx + 1 }}</span>
              <div 
                class="player-avatar"
                :style="{ backgroundImage: player.equippedMarker ? `url(${player.equippedMarker})` : 'none' }"
              ></div>
              <span class="player-name">{{ player.playerName }}</span>
              <span class="player-distance">{{ formatDistance(player.distance) }}km</span>
            </div>
          </div>
        </div>

        <!-- 준비 상태 -->
        <div class="ready-status-card" v-if="playersReadyDetails.length > 0">
          <div class="ready-avatars">
            <div 
              v-for="p in playersReadyDetails.slice(0, 6)" 
              :key="p.id"
              class="ready-avatar"
              :style="{ backgroundImage: p.equippedMarker ? `url(${p.equippedMarker})` : 'none' }"
            ></div>
          </div>
          <span class="ready-label">{{ playersReadyDetails.length }}명 준비 완료</span>
        </div>
      </aside>
    </main>

    <!-- 하단 액션 바 -->
    <footer class="action-footer">
      <div class="footer-inner">
        <!-- 모바일에서 내 결과 요약 -->
        <div class="mobile-my-result" v-if="myResult">
          <span class="my-label">내 거리</span>
          <span class="my-distance">{{ formatDistance(myResult.distance) }}km</span>
        </div>
        
        <!-- 타이머 또는 버튼 -->
        <div class="action-controls">
          <div v-if="!isLastRound || isServerMode" class="timer-display">
            <div class="timer-circle" :style="{ '--progress': progressPercentage }">
              <span class="timer-value">{{ countdownSeconds }}</span>
            </div>
            <span class="timer-label">다음 라운드</span>
          </div>
          
          <button
            v-if="isLastRound && !isServerMode"
            class="final-result-btn"
            @click="$emit('finish-game')"
          >
            <i class="fas fa-trophy"></i>
            최종 결과 보기
          </button>
        </div>

        <!-- 모바일에서 준비 상태 -->
        <div class="mobile-ready" v-if="playersReadyDetails.length > 0">
          <span class="ready-count">{{ playersReadyDetails.length }}</span>
          <span class="ready-text">명 준비</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import KakaoMap from "@/features/game/shared/components/Kakao/KakaoMap.vue";

export default {
  name: "RoundResultsDesignB2",
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
    sortedPlayers() {
      return [...this.players].sort((a, b) => {
        const distA = a.distance != null ? Number(a.distance) : Infinity;
        const distB = b.distance != null ? Number(b.distance) : Infinity;
        return distA - distB;
      });
    },
    myResult() {
      return this.players.find(p => p.id === this.currentUserId);
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
.round-results-b2 {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;
}

/* 헤더 */
.results-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.875rem 1.5rem;
  flex-shrink: 0;
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
}

.round-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  padding: 0.5rem 1rem;
  border-radius: 12px;
  flex-shrink: 0;
}

.round-text {
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.08em;
}

.round-current {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.round-divider {
  font-size: 1rem;
  color: #94a3b8;
  font-weight: 300;
}

.round-total {
  font-size: 1rem;
  font-weight: 600;
  color: #64748b;
}

.final-label {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #422006;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.6rem;
  font-weight: 800;
  margin-left: 0.5rem;
}

.location-display {
  flex: 1;
  min-width: 0;
}

.poi-name {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.full-address {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 메인 컨텐츠 */
.main-content {
  flex: 1;
  display: flex;
  gap: 1rem;
  padding: 1rem;
  min-height: 0;
  overflow: hidden;
}

/* 지도 섹션 */
.map-section {
  flex: 1;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.winner-overlay {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
}

.winner-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 0.75rem 1.25rem;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.crown-icon {
  color: #f59e0b;
  font-size: 1.1rem;
}

.winner-name {
  font-weight: 700;
  color: #0f172a;
}

.winner-distance {
  color: #2563eb;
  font-weight: 600;
  font-size: 0.9rem;
}

/* 사이드 패널 */
.side-panel {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-shrink: 0;
}

.my-result-card,
.ranking-card,
.ready-status-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  font-weight: 600;
  font-size: 0.9rem;
  color: #334155;
}

.card-header i {
  color: #3b82f6;
}

.card-body {
  padding: 1rem;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.result-row .label {
  color: #64748b;
  font-size: 0.85rem;
}

.result-row .value {
  font-weight: 700;
}

.result-row .value.distance {
  color: #2563eb;
}

.result-row .value.score {
  color: #059669;
}

/* 랭킹 리스트 */
.ranking-list {
  padding: 0.5rem;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  border-radius: 10px;
  transition: background 0.2s;
}

.ranking-item:hover {
  background: #f8fafc;
}

.ranking-item.is-me {
  background: #eff6ff;
}

.rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  background: #f1f5f9;
  color: #64748b;
}

.rank.rank-1 {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}

.rank.rank-2 {
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  color: #4b5563;
}

.rank.rank-3 {
  background: linear-gradient(135deg, #fed7aa, #fdba74);
  color: #9a3412;
}

.player-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  background-size: cover;
  background-position: center;
}

.player-name {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-distance {
  font-size: 0.8rem;
  font-weight: 600;
  color: #3b82f6;
}

/* 준비 상태 카드 */
.ready-status-card {
  padding: 0.875rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ready-avatars {
  display: flex;
}

.ready-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  background-size: cover;
  background-position: center;
  border: 2px solid white;
  margin-left: -8px;
}

.ready-avatar:first-child {
  margin-left: 0;
}

.ready-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

/* 하단 액션 바 */
.action-footer {
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 0.875rem 1.5rem;
  flex-shrink: 0;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.mobile-my-result,
.mobile-ready {
  display: none;
}

.action-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.timer-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: conic-gradient(
    #3b82f6 calc(var(--progress) * 1%),
    #e2e8f0 calc(var(--progress) * 1%)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.timer-circle::before {
  content: '';
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
}

.timer-value {
  position: relative;
  z-index: 1;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.timer-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.final-result-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #422006;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.35);
}

.final-result-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.45);
}

/* 반응형 - 태블릿 */
@media (max-width: 1024px) {
  .side-panel {
    width: 240px;
  }
}

/* 반응형 - 모바일 */
@media (max-width: 768px) {
  .results-header {
    padding: 0.75rem 1rem;
  }

  .header-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.625rem;
  }

  .round-badge {
    padding: 0.4rem 0.75rem;
  }

  .round-current {
    font-size: 1.1rem;
  }

  .location-display {
    width: 100%;
  }

  .poi-name {
    font-size: 1.15rem;
  }

  .full-address {
    font-size: 0.8rem;
  }

  .main-content {
    padding: 0.75rem;
  }

  .side-panel {
    display: none;
  }

  .map-section {
    border-radius: 16px;
  }

  .winner-overlay {
    bottom: 0.75rem;
  }

  .winner-content {
    padding: 0.625rem 1rem;
    border-radius: 12px;
  }

  .action-footer {
    padding: 0.75rem 1rem;
  }

  .footer-inner {
    justify-content: space-between;
    gap: 1rem;
  }

  .mobile-my-result {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .my-label {
    font-size: 0.7rem;
    color: #64748b;
  }

  .my-distance {
    font-size: 1rem;
    font-weight: 700;
    color: #2563eb;
  }

  .mobile-ready {
    display: flex;
    align-items: baseline;
    gap: 0.2rem;
  }

  .ready-count {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
  }

  .ready-text {
    font-size: 0.75rem;
    color: #64748b;
  }

  .timer-circle {
    width: 42px;
    height: 42px;
  }

  .timer-circle::before {
    width: 36px;
    height: 36px;
  }

  .timer-value {
    font-size: 1rem;
  }

  .timer-label {
    display: none;
  }

  .final-result-btn {
    padding: 0.7rem 1.25rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .results-header {
    padding: 0.625rem 0.75rem;
  }

  .round-badge {
    padding: 0.35rem 0.6rem;
  }

  .round-text {
    font-size: 0.6rem;
  }

  .round-current {
    font-size: 1rem;
  }

  .poi-name {
    font-size: 1rem;
  }

  .winner-content {
    padding: 0.5rem 0.875rem;
    font-size: 0.85rem;
  }

  .crown-icon {
    font-size: 1rem;
  }

  .footer-inner {
    gap: 0.75rem;
  }

  .timer-circle {
    width: 38px;
    height: 38px;
  }

  .timer-circle::before {
    width: 32px;
    height: 32px;
  }

  .timer-value {
    font-size: 0.9rem;
  }

  .final-result-btn {
    padding: 0.625rem 1rem;
    font-size: 0.85rem;
    border-radius: 12px;
  }
}
</style>

