<template>
  <div class="round-results">
    <!-- 배경 효과 (라이트 버전) -->
    <div class="bg-effects">
      <div class="bg-orb orb-1"></div>
      <div class="bg-orb orb-2"></div>
      <div class="bg-pattern"></div>
    </div>

    <div class="game-container">
      <!-- 스코어보드 스타일 헤더 -->
      <header class="scoreboard-header">
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
      </header>

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
          
          <!-- 모바일 우승자 오버레이 -->
          <div class="mobile-winner-overlay" v-if="topPlayer && topPlayer.playerName">
            <i class="fas fa-crown"></i>
            <span class="winner-name">{{ topPlayer.playerName }}</span>
            <span class="winner-dist">{{ formatDistance(topPlayer.distance) }}km</span>
          </div>
        </div>

        <!-- 사이드 플레이어 랭킹 (데스크톱) -->
        <aside class="player-ranking" v-if="sortedPlayers.length > 0">
          <h3 class="ranking-title">
            <i class="fas fa-medal"></i> 순위
          </h3>
          <div class="ranking-list">
            <div 
              v-for="(player, index) in sortedPlayers.slice(0, 5)" 
              :key="player.id"
              class="ranking-item"
              :class="{ 'top-three': index < 3, 'is-me': player.id === currentUserId }"
            >
              <div class="rank-badge" :class="`rank-${index + 1}`">
                {{ index + 1 }}
              </div>
              <div 
                class="player-avatar"
                :style="{ backgroundImage: player.equippedMarker ? `url(${player.equippedMarker})` : 'none' }"
              ></div>
              <div class="player-info">
                <span class="player-name">{{ player.nickname || player.playerName }}</span>
                <span class="player-score">{{ player.lastRoundScore || 0 }} pts</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- 하단 컨트롤 -->
      <footer class="game-controls">
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
      </footer>
    </div>
  </div>
</template>

<script>
import KakaoMap from "@/features/game/shared/components/Kakao/KakaoMap.vue";
import gameStore from "@/store/gameStore";

export default {
  name: "RoundResults",

  components: {
    KakaoMap,
  },

  props: {
    players: {
      type: Array,
      default: () => [],
    },
    teams: {
      type: Array,
      default: () => [],
    },
    isTeamMode: {
      type: Boolean,
      default: false,
    },
    actualLocation: {
      type: Object,
      default: () => ({}),
    },
    round: {
      type: Number,
      default: 1,
    },
    totalRounds: {
      type: Number,
      default: 5,
    },
    currentUserId: {
      type: String,
      default: "",
    },
    locationName: {
      type: String,
      default: "",
    },
    locationDescription: {
      type: String,
      default: "",
    },
    locationImage: {
      type: String,
      default: "",
    },
    interestingFact: {
      type: String,
      default: "",
    },
    poiName: {
      type: String,
      default: "",
    },
    fullAddress: {
      type: String,
      default: "",
    },
    playerGuesses: {
      type: Array,
      default: () => [],
    },
    topPlayer: {
      type: Object,
      default: () => ({}),
    },
    numPlayersReady: {
      type: Number,
      default: 0,
    },
    totalPlayersInRoom: {
      type: Number,
      default: 0,
    },
    majorityThreshold: {
      type: Number,
      default: 0,
    },
    playersReadyDetails: {
      type: Array,
      default: () => [],
    },
    teamMessages: {
      type: Object,
      default: () => ({}),
    },
    isMobile: {
      type: Boolean,
      default: false,
    },
    serverCountdownSeconds: {
      type: Number,
      default: null,
    },
    isServerMode: {
      type: Boolean,
      default: false,
    },
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

    teamsReadyDetails() {
      if (!this.isTeamMode || !this.teams.length) return [];
      
      const teamsReady = [];
      const teamMap = new Map();
      
      this.teams.forEach(team => {
        teamMap.set(team.id, {
          id: team.id,
          name: team.name,
          color: team.color,
          members: [],
          isReady: false,
          representativeMarker: null
        });
      });
      
      this.playersReadyDetails.forEach(player => {
        const playerTeam = this.players.find(p => p.id === player.id)?.teamId;
        if (playerTeam && teamMap.has(playerTeam)) {
          const team = teamMap.get(playerTeam);
          team.members.push(player);
          team.isReady = true;
          if (!team.representativeMarker && player.equippedMarker) {
            team.representativeMarker = player.equippedMarker;
          }
        }
      });
      
      teamMap.forEach(team => {
        if (team.isReady) {
          teamsReady.push(team);
        }
      });
      
      return teamsReady;
    },

    playerMarkers() {
      if (!this.isTeamMode) {
        return this.playerGuesses.map((guess) => {
          const player = this.players.find(p => p.id === guess.playerId);
          const markerImageUrl = guess.markerImageUrl || 
                                player?.equippedMarker || 
                                player?.markerImageUrl || 
                                null;
          
          return {
            position: guess.position,
            color: guess.color,
            playerName: guess.playerName,
            markerImageUrl: markerImageUrl,
            playerId: guess.playerId
          };
        });
      } else {
        const teamGuesses = [];
        const teamMap = new Map();
        
        this.playerGuesses.forEach(guess => {
          const playerTeam = this.players.find(p => p.id === guess.playerId)?.teamId;
          if (playerTeam && !teamMap.has(playerTeam)) {
            const team = this.teams.find(t => t.id === playerTeam);
            teamMap.set(playerTeam, true);
            teamGuesses.push({
              position: guess.position,
              color: team?.color || '#FF5722',
              playerName: team?.name || '팀',
              teamId: playerTeam,
              markerImageUrl: team?.representativeMarker || null
            });
          }
        });
        
        return teamGuesses;
      }
    },
    
  },

  watch: {
    actualLocation: {
      handler(newVal) {
        if (newVal && this.visible) {
          this.$nextTick(() => {
            setTimeout(() => {
              this.initMap();
            }, 300);
          });
        }
      },
      deep: true,
    },

    playerGuesses: {
      handler(newVal) {
        if (newVal && newVal.length > 0 && this.visible) {
          this.$nextTick(() => {
            setTimeout(() => {
              this.initMap();
            }, 300);
          });
        }
      },
      deep: true,
    },
  },

  data() {
    return {
      gameStore,
      visible: true,
      map: null,
      countdownInterval: null,
      showLocationInfoModal: false,
      currentLocationInfo: {},
      localCountdownSeconds: 10,
      totalCountdownTime: 10,
      countdownTimer: null,
    };
  },

  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.initMap();
      }, 300);
    });
    
    if (!this.isLastRound && this.serverCountdownSeconds === null) {
      this.startCountdown();
    }
  },
  
  beforeUnmount() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  },

  methods: {
    close() {
      this.$emit("close");
    },
    
    startCountdown() {
      this.countdownTimer = setInterval(() => {
        this.localCountdownSeconds--;
        
        if (this.localCountdownSeconds <= 0) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
          this.$emit('request-next-round');
        }
      }, 1000);
    },

    initMap() {
      if (this.$refs.resultMap) {
        console.log("지도 초기화 시작");

        setTimeout(() => {
          if (this.$refs.resultMap) {
            setTimeout(() => {
              if (this.$refs.resultMap) {
                this.$refs.resultMap.fitMapToAllMarkers();
              }
            }, 300);
          }
        }, 500);
      }
    },

    getTeamColor(index) {
      const colors = [
        '#FF5722', '#2196F3', '#4CAF50', '#9C27B0',
        '#FFC107', '#795548', '#607D8B', '#E91E63'
      ];
      return colors[index % colors.length];
    },

    finishGame() {
      this.$emit("finish-game");
    },

    formatDistance(distance) {
      if (distance == null || (distance !== 0 && !distance)) return "0.000";
      const rounded = Math.round(Number(distance) * 1000) / 1000;
      return rounded.toFixed(3);
    },
  },
};
</script>

<style scoped>
.round-results {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
  overflow: hidden;
}

/* 배경 효과 (라이트 버전) */
.bg-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.35;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #93c5fd, #60a5fa);
  top: -150px;
  left: -150px;
  animation: float 10s ease-in-out infinite;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #fde68a, #fcd34d);
  bottom: -100px;
  right: -100px;
  animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, 30px); }
}

.bg-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
  background-size: 48px 48px;
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
  background: white;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.round-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
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
  stroke: #e2e8f0;
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
  color: #0f172a;
}

.round-number .current {
  font-size: 1.25rem;
  font-weight: 800;
}

.round-number .separator {
  font-size: 0.8rem;
  margin: 0 2px;
  color: #94a3b8;
}

.round-number .total {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
}

.final-indicator {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #422006;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  animation: glow 2s ease-in-out infinite;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

@keyframes glow {
  0%, 100% { box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3); }
  50% { box-shadow: 0 4px 16px rgba(245, 158, 11, 0.5); }
}

.location-display {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.location-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.location-text {
  min-width: 0;
  flex: 1;
}

.location-text h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.location-text p {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 우승자 하이라이트 */
.winner-highlight {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 12px;
  border: 1px solid rgba(245, 158, 11, 0.2);
  flex-shrink: 0;
}

.crown-animation {
  color: #f59e0b;
  font-size: 1.25rem;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.winner-details {
  display: flex;
  flex-direction: column;
}

.winner-details .label {
  font-size: 0.6rem;
  color: #92400e;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.winner-details .name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.winner-details .score {
  font-size: 0.8rem;
  color: #2563eb;
  font-weight: 600;
}

/* 게임 영역 */
.game-arena {
  flex: 1;
  display: flex;
  gap: 1rem;
  min-height: 0;
  overflow: hidden;
}

.map-wrapper {
  flex: 1;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.map-overlay-border {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  pointer-events: none;
  z-index: 10;
}

/* 모바일 우승자 오버레이 (데스크톱에서 숨김) */
.mobile-winner-overlay {
  display: none;
}

/* 플레이어 랭킹 사이드바 */
.player-ranking {
  width: 260px;
  background: white;
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  overflow-y: auto;
}

.ranking-title {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
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
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.ranking-item:hover {
  background: #f1f5f9;
}

.ranking-item.top-three {
  background: #fefce8;
}

.ranking-item.is-me {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
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
  color: #64748b;
  background: #e2e8f0;
  flex-shrink: 0;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #422006;
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #cbd5e1, #94a3b8);
  color: white;
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #fdba74, #f97316);
  color: white;
}

.player-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-score {
  display: block;
  font-size: 0.75rem;
  color: #2563eb;
  font-weight: 500;
}

/* 하단 컨트롤 */
.game-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-top: 1rem;
  flex-shrink: 0;
}

.action-area {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.countdown-display {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.countdown-bar {
  width: 140px;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.countdown-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #3b82f6);
  border-radius: 4px;
  transition: width 1s linear;
}

.countdown-info {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.countdown-number {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.countdown-text {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.final-button {
  position: relative;
  background: transparent;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.final-button:hover {
  transform: translateY(-2px);
}

.final-button .btn-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  transition: transform 0.3s ease;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.35);
}

.final-button:hover .btn-bg {
  transform: scale(1.02);
}

.final-button i,
.final-button .btn-text {
  position: relative;
  z-index: 1;
  color: #422006;
  font-weight: 700;
}

.final-button i {
  font-size: 1.1rem;
}

/* 반응형 - 태블릿 */
@media (max-width: 992px) {
  .player-ranking {
    display: none;
  }
}

/* 반응형 - 태블릿/모바일 공통 - 하단바 공간 확보 */
@media (max-width: 992px) {
  .round-results {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .game-container {
    padding-bottom: 80px; /* 하단바 높이 + 여유 공간 */
  }
}

/* 반응형 - 모바일 */
@media (max-width: 768px) {
  .game-container {
    padding: 0.75rem;
    padding-bottom: 80px; /* 하단바 공간 유지 */
  }

  .scoreboard-header {
    flex-direction: column;
    align-items: stretch;
    padding: 1rem;
    gap: 0.875rem;
  }

  /* 모바일에서 위치 정보 우선 표시 */
  .location-display {
    order: -1;
    width: 100%;
  }

  .location-text h2 {
    font-size: 1.1rem;
  }

  .location-text p {
    font-size: 0.8rem;
  }

  .location-icon {
    width: 40px;
    height: 40px;
    font-size: 1.1rem;
  }

  .round-indicator {
    width: 100%;
    justify-content: space-between;
  }

  .round-progress-ring {
    width: 50px;
    height: 50px;
  }

  .round-number .current {
    font-size: 1.1rem;
  }

  /* 헤더에서 우승자 숨기고 지도 위에 표시 */
  .winner-highlight {
    display: none;
  }

  .mobile-winner-overlay {
    display: flex;
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    align-items: center;
    gap: 0.5rem;
    background: white;
    padding: 0.6rem 1rem;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }

  .mobile-winner-overlay i {
    color: #f59e0b;
    font-size: 1rem;
  }

  .mobile-winner-overlay .winner-name {
    font-weight: 700;
    color: #0f172a;
    font-size: 0.9rem;
  }

  .mobile-winner-overlay .winner-dist {
    font-size: 0.8rem;
    color: #2563eb;
    font-weight: 600;
  }

  /* 지도 영역 확장 */
  .game-arena {
    min-height: 50vh;
  }

  .map-wrapper {
    border-radius: 16px;
  }

  /* 푸터 컴팩트 */
  .game-controls {
    padding: 0.875rem 1rem;
  }

  .countdown-bar {
    width: 100px;
  }

  .countdown-number {
    font-size: 1.25rem;
  }

  .countdown-text {
    font-size: 0.75rem;
  }

  .final-button {
    padding: 0.75rem 1.25rem;
  }
}

/* 반응형 - 소형 모바일 */
@media (max-width: 480px) {
  .game-container {
    padding: 0.5rem;
    padding-bottom: 76px; /* 하단바 공간 */
  }

  .scoreboard-header {
    padding: 0.875rem;
    gap: 0.75rem;
    border-radius: 14px;
  }

  .location-icon {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .location-text h2 {
    font-size: 1rem;
  }

  .round-progress-ring {
    width: 44px;
    height: 44px;
  }

  .round-number .current {
    font-size: 1rem;
  }

  .final-indicator {
    padding: 0.3rem 0.6rem;
    font-size: 0.7rem;
  }

  /* 지도 최대 활용 */
  .game-arena {
    min-height: 55vh;
  }

  .map-wrapper {
    border-radius: 14px;
  }

  .mobile-winner-overlay {
    padding: 0.5rem 0.875rem;
    font-size: 0.85rem;
  }

  .game-controls {
    padding: 0.75rem;
    border-radius: 14px;
    margin-top: 0.75rem;
  }

  .countdown-bar {
    width: 80px;
    height: 6px;
  }

  .countdown-number {
    font-size: 1.1rem;
  }

  .final-button {
    padding: 0.65rem 1rem;
    font-size: 0.9rem;
  }
}

/* 애니메이션 */
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.game-container {
  animation: slideUp 0.4s ease;
}
</style>
