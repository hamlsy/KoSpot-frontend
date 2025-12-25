<template>
  <div class="round-results-c">
    <!-- 대시보드 그리드 레이아웃 -->
    <div class="dashboard-grid">
      <!-- 왼쪽 사이드바: 라운드 정보 + 통계 -->
      <aside class="sidebar">
        <!-- 라운드 카드 -->
        <div class="widget round-widget">
          <div class="widget-header">
            <span class="widget-label">라운드</span>
            <span v-if="isLastRound" class="final-tag">FINAL</span>
          </div>
          <div class="round-display">
            <span class="round-current">{{ round }}</span>
            <span class="round-divider">/</span>
            <span class="round-total">{{ totalRounds }}</span>
          </div>
          <div class="round-progress-bar">
            <div class="progress-fill" :style="{ width: `${(round / totalRounds) * 100}%` }"></div>
          </div>
        </div>

        <!-- 위치 정보 카드 -->
        <div class="widget location-widget">
          <div class="widget-icon">
            <i class="fas fa-location-dot"></i>
          </div>
          <h3 class="location-name">{{ poiName || locationName || '위치 정보' }}</h3>
          <p class="location-address" v-if="fullAddress">{{ fullAddress }}</p>
        </div>

        <!-- 우승자 카드 -->
        <div class="widget winner-widget" v-if="topPlayer && topPlayer.playerName">
          <div class="widget-header">
            <i class="fas fa-crown"></i>
            <span>라운드 우승</span>
          </div>
          <div class="winner-content">
            <div class="winner-name">{{ topPlayer.playerName }}</div>
            <div class="winner-stat">
              <span class="stat-value">{{ formatDistance(topPlayer.distance) }}</span>
              <span class="stat-unit">km</span>
            </div>
          </div>
        </div>

        <!-- 타이머 위젯 -->
        <div class="widget timer-widget" v-if="!isLastRound || isServerMode">
          <div class="timer-circle">
            <svg viewBox="0 0 100 100">
              <circle class="timer-bg-circle" cx="50" cy="50" r="42" />
              <circle 
                class="timer-progress-circle" 
                cx="50" cy="50" r="42"
                :stroke-dasharray="`${(1 - progressPercentage / 100) * 264} 264`"
              />
            </svg>
            <div class="timer-value">
              <span class="timer-number">{{ countdownSeconds }}</span>
              <span class="timer-unit">초</span>
            </div>
          </div>
          <span class="timer-label">다음 라운드</span>
        </div>

        <!-- 최종 결과 버튼 -->
        <button 
          v-if="isLastRound && !isServerMode"
          class="final-results-btn"
          @click="$emit('finish-game')"
        >
          <i class="fas fa-trophy"></i>
          <span>최종 결과 보기</span>
        </button>
      </aside>

      <!-- 메인 영역: 지도 -->
      <main class="main-content">
        <div class="map-panel">
          <div class="map-header">
            <h2>결과 지도</h2>
            <div class="map-legend">
              <span class="legend-item">
                <span class="legend-dot answer"></span>
                정답 위치
              </span>
              <span class="legend-item">
                <span class="legend-dot player"></span>
                플레이어 추측
              </span>
            </div>
          </div>
          <div class="map-container">
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
          </div>
        </div>
      </main>

      <!-- 오른쪽 사이드바: 플레이어 리스트 -->
      <aside class="sidebar-right">
        <div class="widget players-widget">
          <div class="widget-header">
            <i class="fas fa-users"></i>
            <span>플레이어 순위</span>
          </div>
          <div class="players-list">
            <div 
              v-for="(player, index) in sortedPlayers" 
              :key="player.id"
              class="player-row"
              :class="{ 'is-current': player.id === currentUserId }"
            >
              <div class="player-rank" :class="`rank-${index + 1}`">
                <span v-if="index < 3">
                  <i class="fas" :class="getRankIcon(index)"></i>
                </span>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <div 
                class="player-avatar"
                :style="{ backgroundImage: player.equippedMarker ? `url(${player.equippedMarker})` : 'none' }"
              ></div>
              <div class="player-details">
                <span class="player-name">{{ player.nickname }}</span>
                <div class="player-stats">
                  <span class="stat">
                    <i class="fas fa-star"></i>
                    {{ player.lastRoundScore || 0 }}
                  </span>
                  <span class="stat total">
                    총 {{ player.score || 0 }}점
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 준비 상태 위젯 -->
        <div class="widget ready-widget" v-if="playersReadyDetails.length > 0">
          <div class="widget-header">
            <i class="fas fa-check-circle"></i>
            <span>준비 완료</span>
          </div>
          <div class="ready-avatars">
            <div 
              v-for="player in playersReadyDetails.slice(0, 6)" 
              :key="player.id"
              class="ready-avatar"
              :style="{ backgroundImage: player.equippedMarker ? `url(${player.equippedMarker})` : 'none' }"
              :title="player.nickname"
            ></div>
          </div>
          <div class="ready-count">
            {{ playersReadyDetails.length }} / {{ players.length }} 준비됨
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
import KakaoMap from "@/features/game/shared/components/Kakao/KakaoMap.vue";
import gameStore from "@/store/gameStore";

export default {
  name: "RoundResultsDesignC",
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
    getRankIcon(index) {
      const icons = ['fa-trophy', 'fa-medal', 'fa-award'];
      return icons[index] || 'fa-circle';
    },
  },
};
</script>

<style scoped>
.round-results-c {
  width: 100%;
  height: 100%;
  background: #f3f4f6;
  overflow: hidden;
}

/* 대시보드 그리드 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  height: 100%;
  gap: 1rem;
  padding: 1rem;
}

/* 사이드바 공통 */
.sidebar,
.sidebar-right {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

/* 위젯 공통 스타일 */
.widget {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.widget-header i {
  color: #2563eb;
}

/* 라운드 위젯 */
.round-widget .widget-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.final-tag {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #111827;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 700;
  margin-left: auto;
}

.round-display {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin: 0.5rem 0;
}

.round-current {
  font-size: 2.5rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.round-divider {
  font-size: 1.5rem;
  color: #d1d5db;
}

.round-total {
  font-size: 1.25rem;
  color: #9ca3af;
}

.round-progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.75rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #3b82f6);
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* 위치 위젯 */
.location-widget {
  text-align: center;
}

.widget-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: #2563eb;
  font-size: 1.5rem;
}

.location-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem;
}

.location-address {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

/* 우승자 위젯 */
.winner-widget .widget-header {
  color: #f59e0b;
}

.winner-widget .widget-header i {
  color: #f59e0b;
}

.winner-content {
  text-align: center;
}

.winner-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.winner-stat {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  background: #f0fdf4;
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
}

.stat-unit {
  font-size: 0.8rem;
  color: #6b7280;
}

/* 타이머 위젯 */
.timer-widget {
  text-align: center;
}

.timer-circle {
  width: 100px;
  height: 100px;
  margin: 0 auto 0.75rem;
  position: relative;
}

.timer-circle svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.timer-bg-circle {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 8;
}

.timer-progress-circle {
  fill: none;
  stroke: #2563eb;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dasharray 1s linear;
}

.timer-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.timer-number {
  display: block;
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.timer-unit {
  font-size: 0.7rem;
  color: #9ca3af;
}

.timer-label {
  font-size: 0.8rem;
  color: #6b7280;
}

/* 최종 결과 버튼 */
.final-results-btn {
  width: 100%;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #111827;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.final-results-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
}

/* 메인 컨텐츠 */
.main-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.map-panel {
  flex: 1;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.map-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.map-legend {
  display: flex;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.answer {
  background: #ef4444;
}

.legend-dot.player {
  background: #2563eb;
}

.map-container {
  flex: 1;
  min-height: 400px;
}

/* 플레이어 위젯 */
.players-widget {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.players-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 10px;
  background: #f9fafb;
  transition: all 0.2s ease;
}

.player-row.is-current {
  background: #dbeafe;
  border: 1px solid #93c5fd;
}

.player-rank {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  background: #e5e7eb;
  color: #6b7280;
}

.player-rank.rank-1 {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #111827;
}

.player-rank.rank-2 {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
  color: white;
}

.player-rank.rank-3 {
  background: linear-gradient(135deg, #d97706, #b45309);
  color: white;
}

.player-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e5e7eb;
  background-size: cover;
  background-position: center;
}

.player-details {
  flex: 1;
  min-width: 0;
}

.player-name {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-stats {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.player-stats .stat {
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.player-stats .stat i {
  color: #f59e0b;
  font-size: 0.65rem;
}

.player-stats .stat.total {
  color: #2563eb;
}

/* 준비 위젯 */
.ready-widget {
  margin-top: auto;
}

.ready-avatars {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.ready-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e5e7eb;
  background-size: cover;
  background-position: center;
  border: 2px solid #10b981;
}

.ready-count {
  font-size: 0.8rem;
  color: #6b7280;
  text-align: center;
}

/* 반응형 */
@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 240px 1fr 260px;
  }
}

@media (max-width: 992px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }

  .sidebar {
    flex-direction: row;
    flex-wrap: wrap;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .sidebar .widget {
    flex: 1;
    min-width: 200px;
  }

  .sidebar-right {
    display: none;
  }
}

@media (max-width: 768px) {
  .dashboard-grid {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .widget {
    padding: 1rem;
    border-radius: 12px;
  }

  .round-current {
    font-size: 2rem;
  }

  .timer-circle {
    width: 80px;
    height: 80px;
  }
}
</style>

