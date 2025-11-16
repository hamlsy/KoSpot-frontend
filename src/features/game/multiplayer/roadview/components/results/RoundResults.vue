<template>
  <div class="round-results">
    <div class="results-container">
      <!-- 헤더 -->
      <div class="results-header">
        <div class="header-left">
          <h2 class="round-title">
            라운드 {{ round }} 결과
            <span class="location-name" v-if="poiName || locationName">
              - {{ poiName || locationName }}
            </span>
          </h2>
          <div class="round-info">
            {{ round }} / {{ totalRounds }} 라운드 완료
            <span v-if="isLastRound" class="final-round-badge">최종 라운드!</span>
          </div>
          <div class="location-address" v-if="fullAddress">
            <i class="fas fa-map-marker-alt"></i>
            <span>{{ fullAddress }}</span>
          </div>
        </div>
        <div class="results-summary">
          <div class="top-player-info" v-if="topPlayer && topPlayer.playerName">
            <i class="fas fa-crown"></i>
            <span class="top-player-name">{{ topPlayer.playerName }}</span>
            <span class="top-player-distance">{{ formatDistance(topPlayer.distance) }}km</span>
          </div>
        </div>

      </div>

      <!-- 지도 영역 -->
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

      <!-- 하단 버튼 -->
      <div class="results-footer">
        <div class="next-button-container">
          <!-- 플레이어 마커 표시 영역 -->
          <div class="player-markers-container">
            <!-- 팀 모드일 때 -->
            <template v-if="isTeamMode">
              <div 
                v-for="(team, index) in teamsReadyDetails" 
                :key="team.id"
                class="team-marker-wrapper"
              >
                <div 
                  class="team-marker" 
                  :style="{ 
                    backgroundColor: team.color || getTeamColor(index),
                    backgroundImage: team.representativeMarker ? `url(${team.representativeMarker})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }"
                  :title="team.name"
                >
                  <span class="marker-tooltip team-tooltip">{{ team.name }}</span>
                </div>
                <div v-if="teamMessages[team.id]" class="team-chat-bubble">
                  {{ teamMessages[team.id] }}
                </div>
              </div>
            </template>
            <!-- 개인 모드일 때 -->
            <template v-else>
              <div 
                v-for="(player) in playersReadyDetails" 
                :key="player.id"
                class="player-marker-wrapper"
              >
                <div 
                  class="player-marker" 
                  :style="{ 
                    backgroundImage: player.equippedMarker ? `url(${player.equippedMarker})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }"
                  :title="player.nickname"
                >
                  <span class="marker-tooltip">{{ player.nickname }}</span>
                </div>
              </div>
            </template>
          </div>

          <!-- 투표 현황 텍스트 -->
          <div class="vote-info-text" v-if="isVoteTimerActive">
            {{ numPlayersReady }} / {{ totalPlayersInRoom }} (과반수: {{ majorityThreshold }})
          </div>

          <!-- 카운트다운 바 -->
          <div class="countdown-bar" v-if="isVoteTimerActive">
            <div
              class="countdown-progress"
              :style="{ width: voteCountdownProgressPercentage + '%' }"
            ></div>
          </div>

          <button
            v-if="isLastRound && !isServerMode"
            class="action-button finish-button"
            @click="$emit('finish-game')"
          >
            <i class="fas fa-trophy"></i>
            <span>최종 결과 보기</span>
            <div class="button-shine"></div>
          </button>
          <!-- 자동 진행 타이머 -->
          <div v-else class="auto-progress-container">
            <div class="progress-info">
              <i class="fas fa-clock"></i>
              <span class="countdown-text">{{ countdownSeconds }}초 후 다음 라운드</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
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
    playersReadyDetails: { // Array of players who clicked next { id, nickname, equippedMarker }
      type: Array,
      default: () => [],
    },
    isVoteTimerActive: {
      type: Boolean,
      default: false,
    },
    voteTimeRemaining: { // In milliseconds
      type: Number,
      default: 15000, 
    },
    currentUserHasVoted: {
      type: Boolean,
      default: false,
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
      return [...this.players].sort((a, b) => b.score - a.score);
    },
    
    // 카운트다운 초 (서버 값 우선 사용)
    countdownSeconds() {
      return this.serverCountdownSeconds !== null ? this.serverCountdownSeconds : this.localCountdownSeconds;
    },
    
    // 진행바 퍼센테이지 계산
    progressPercentage() {
      return ((this.totalCountdownTime - this.countdownSeconds) / this.totalCountdownTime) * 100;
    },

    isLastRound() {
      return this.round === this.totalRounds;
    },

    // 팀 모드에서 준비된 팀 정보 계산
    teamsReadyDetails() {
      if (!this.isTeamMode || !this.teams.length) return [];
      
      // 팀별로 준비된 플레이어 정보 그룹화
      const teamsReady = [];
      const teamMap = new Map();
      
      // 팀 정보 초기화
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
      
      // 준비된 플레이어 정보로 팀 정보 업데이트
      this.playersReadyDetails.forEach(player => {
        const playerTeam = this.players.find(p => p.id === player.id)?.teamId;
        if (playerTeam && teamMap.has(playerTeam)) {
          const team = teamMap.get(playerTeam);
          team.members.push(player);
          team.isReady = true;
          // 첫 번째 준비된 플레이어의 마커를 팀 대표 마커로 사용
          if (!team.representativeMarker && player.equippedMarker) {
            team.representativeMarker = player.equippedMarker;
          }
        }
      });
      
      // 준비된 팀만 필터링하여 반환
      teamMap.forEach(team => {
        if (team.isReady) {
          teamsReady.push(team);
        }
      });
      
      return teamsReady;
    },

    // 플레이어 추측 위치에 대한 마커 정보 계산
    playerMarkers() {
      if (!this.isTeamMode) {
        return this.playerGuesses.map((guess) => {
          // 플레이어 정보에서 마커 이미지 URL 가져오기
          const player = this.players.find(p => p.id === guess.playerId);
          const markerImageUrl = guess.markerImageUrl || 
                                player?.equippedMarker || 
                                player?.markerImageUrl || 
                                null;
          
          return {
            position: guess.position,
            color: guess.color,
            playerName: guess.playerName,
            markerImageUrl: markerImageUrl, // 플레이어 마커 이미지 추가
            playerId: guess.playerId
          };
        });
      } else {
        // 팀 모드일 때는 팀별로 대표 마커만 표시
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
              markerImageUrl: team?.representativeMarker || null // 팀 대표 마커
            });
          }
        });
        
        return teamGuesses;
      }
    },
    
    voteCountdownProgressPercentage() {
      if (!this.isVoteTimerActive || this.voteTimeRemaining === null) return 0;
      const totalTime = 15000; // TODO: Make this configurable or pass as prop if different from base
      const progress = Math.max(0, (this.voteTimeRemaining / totalTime) * 100);
      return progress;
    },
  },

  watch: {
    // actualLocation이 변경될 때도 지도 초기화
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

    // playerGuesses가 변경될 때도 지도 초기화
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
      // 자동 진행 타이머 관련
      localCountdownSeconds: 10,
      totalCountdownTime: 10,
      countdownTimer: null,
    };
  },

  mounted() {
    // 컴포넌트가 마운트될 때 지도 초기화
    this.$nextTick(() => {
      // 지도 초기화 전 약간의 지연을 주어 DOM이 완전히 렌더링되도록 함
      setTimeout(() => {
        this.initMap();
      }, 300);
    });
    
    // 마지막 라운드가 아니고, 서버 카운트다운 값이 없을 때만 로컬 타이머 시작
    if (!this.isLastRound && this.serverCountdownSeconds === null) {
      this.startCountdown();
    }
  },
  
  beforeUnmount() {
    // 컴포넌트 해제 시 타이머 정리
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  },

  methods: {
    close() {
      this.$emit("close");
    },
    
    // 카운트다운 시작 (로컬 타이머용)
    startCountdown() {
      this.countdownTimer = setInterval(() => {
        this.localCountdownSeconds--;
        
        if (this.localCountdownSeconds <= 0) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
          
          // 다음 라운드로 자동 진행
          this.$emit('request-next-round');
        }
      }, 1000);
    },

    initMap() {
      // 지도 초기화 메서드
      if (this.$refs.resultMap) {
        console.log("지도 초기화 시작");

        // 지도 렌더링 완료 후 플레이어 추측 표시
        setTimeout(() => {
          if (this.$refs.resultMap) {
            // 모든 마커가 보이도록 지도 범위 조정
            setTimeout(() => {
              if (this.$refs.resultMap) {
                this.$refs.resultMap.fitMapToAllMarkers();
              }
            }, 300);
          }
        }, 500);
      }
    },

    // 팀 색상 가져오기 - 팀 색상이 없을 때 기본 색상 배열에서 선택
    getTeamColor(index) {
      const colors = [
        '#FF5722', // 주황색
        '#2196F3', // 파랑
        '#4CAF50', // 초록
        '#9C27B0', // 보라
        '#FFC107', // 노랑
        '#795548', // 갈색
        '#607D8B', // 청회색
        '#E91E63'  // 핑크
      ];
      return colors[index % colors.length];
    },

    finishGame() {
      // this.stopCountdown(); // stopCountdown is removed
      this.$emit("finish-game");
    },

    // 거리 포맷팅 메서드 (소수점 3자리에서 반올림)
    formatDistance(distance) {
      if (distance == null || (distance !== 0 && !distance)) return "0.000";
      // 소수점 3자리에서 반올림: 소수점 4자리에서 반올림하여 소수점 3자리까지 표시
      // 예: 1.23456 -> 1.235, 1.23444 -> 1.234
      const rounded = Math.round(Number(distance) * 1000) / 1000;
      // 소수점 3자리까지 항상 표시 (toFixed(3) 사용)
      return rounded.toFixed(3);
    },
  },
};
</script>

<style scoped>
.round-results {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.results-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%; /* 컨테이너가 전체 높이를 차지하도록 설정 */
}

.results-container {
  animation: slideUp 0.4s ease;
}

/* 헤더 */
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
}

.header-left {
  flex: 1;
}

.round-title {
  margin: 0;
  font-size: 1.6rem;
  color: #333;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.location-name {
  font-size: 1.2rem;
  color: #666;
  font-weight: 500;
}

.round-info {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.location-address {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #888;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.location-address i {
  color: #666;
  font-size: 0.9rem;
}

.location-address span {
  color: #666;
}

.final-round-badge {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  animation: pulse 2s infinite;
}

.results-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.top-player-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.top-player-info i {
  color: #ff6b35;
  font-size: 1.1rem;
}

.top-player-name {
  font-size: 0.9rem;
}

.top-player-distance {
  font-size: 0.8rem;
  color: #666;
  background: white;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #999;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f5f5f5;
  color: #333;
}

/* 위치 정보 */
.location-info {
  display: flex;
  padding: 1.5rem;
  gap: 1.5rem;
  border-bottom: 1px solid #eee;
}

.location-details {
  width: 100%;
}

.location-name {
  font-size: 1.4rem;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.location-description {
  color: #555;
  margin-bottom: 1rem;
  line-height: 1.5;
}

/* 팀 마커 스타일 */
.team-marker-wrapper {
  position: relative;
  margin: 0 5px;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.team-marker {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  border: 2px solid white;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 1001;
}

.team-marker:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.team-tooltip {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  position: absolute;
  bottom: 45px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 1000;
}

.team-marker:hover .team-tooltip {
  opacity: 1;
}

.team-chat-bubble {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 15px;
  padding: 5px 10px;
  font-size: 12px;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 900;
}

.team-chat-bubble:after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid white;
}

/* 확장된 지도 컨테이너 */
.map-container {
  flex: 1;
  width: 100%;
  height: calc(100% - 120px); /* 헤더와 푸터를 제외한 모든 공간 차지 */
  min-height: 500px; /* 최소 높이 설정 */
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 0;
}

.interesting-fact {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.interesting-fact h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
}

.interesting-fact p {
  margin: 0;
  color: #555;
  font-size: 0.95rem;
}

.location-image {
  margin-top: 1rem;
}

.location-image img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
}

/* 푸터 */
.results-footer {
  padding: 1rem;
  display: flex;
  justify-content: center;
  height: 80px; /* 푸터 높이 고정 */
}

.action-button {
  padding: 1rem 2rem;
  border-radius: 12px;
  border: none;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-width: 160px;
  justify-content: center;
}

.next-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.next-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.next-button:disabled {
  background: linear-gradient(135deg, #a5b4fc, #8b5cf6);
  opacity: 0.8;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

.finish-button {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
}

.finish-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 152, 0, 0.4);
}

/* 버튼 반짝임 효과 */
.button-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.6s;
}

.action-button:hover .button-shine {
  left: 100%;
}

.action-button i {
  font-size: 1.2rem;
}

.action-button span {
  font-weight: 700;
  letter-spacing: 0.02em;
}

/* 플레이어 마커 스타일 */
.next-button-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-markers-container {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  height: 40px;
  display: flex;
  justify-content: center;
  z-index: 1000; /* 지도보다 높은 z-index 값 */
  width: 100%;
}

.player-marker-wrapper {
  position: relative;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.player-marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
  position: relative;
  cursor: pointer;
  z-index: 1001; /* 지도보다 높은 z-index 값 */
  background-size: contain !important;
  background-repeat: no-repeat !important;
}

.player-marker:hover .marker-tooltip {
  opacity: 1;
  transform: translateY(0);
}

.marker-tooltip {
  position: relative;
  top: -30px;
  transform: translateX(0%) translateY(5px);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: all 0.2s ease;
  pointer-events: none;
}

.marker-tooltip:after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid rgba(0, 0, 0, 0.8);
}

/* 카운트다운 바 스타일 */
.countdown-bar {
  width: 100%;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;
}

.countdown-progress {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  transition: width 0.05s linear;
}

@keyframes popIn {
  0% {
    transform: scale(0) translateY(10px);
    opacity: 0;
  }
  70% {
    transform: scale(1.2) translateY(-5px);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.finish-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(255, 152, 0, 0.4);
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 모바일 액션 버튼 스타일 */
/* 제거됨: RoundResults 내부 모바일 액션 버튼 관련 스타일 */

/* 반응형 디자인 */
@media (max-width: 768px) {
  .round-results {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .results-container {
    width: 100%;
    max-width: 95vw;
    height: auto;
    max-height: 90vh;
    border-radius: 16px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .results-header {
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
    border-bottom: 1px solid #eee;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
  }

  .results-summary {
    align-items: flex-start;
    width: 100%;
  }

  .top-player-info {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
  
  .mobile-actions {
    width: 100%;
    justify-content: center;
    margin-top: 0.75rem;
  }
  
  .mobile-action-btn {
    flex: 1;
    max-width: 120px;
  }

  .map-container {
    height: 300px;
    min-height: 300px;
  }

  .results-footer {
    position: sticky;
    bottom: 0;
    background: white;
    border-top: 1px solid #eee;
    z-index: 10;
    padding: 1rem;
  }

  .location-info {
    flex-direction: column;
    padding: 1rem;
  }

  .location-map {
    width: 100%;
  }

  .score-details {
    flex-direction: column;
    align-items: flex-end;
    gap: 0.4rem;
  }

  .rank {
    width: 25px;
    height: 25px;
    font-size: 0.9rem;
  }

  .avatar-image {
    width: 35px;
    height: 35px;
  }
}

@media (max-width: 480px) {
  .results-container {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .results-header,
  .location-info,
  .score-board,
  .results-footer {
    padding: 0.8rem;
  }

  .round-title {
    font-size: 1.3rem;
  }

  .player-score-row {
    padding: 0.6rem;
  }

  .player-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }

  .player-avatar {
    margin-right: 0;
  }

  .map-container {
    height: 250px;
    min-height: 250px;
  }

  .auto-progress-container {
    padding: 0.6rem 0.8rem;
    gap: 0.5rem;
    max-width: 280px;
    border-radius: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .progress-info {
    font-size: 0.8rem;
  }

  .countdown-text {
    font-size: 0.75rem;
  }

  .progress-bar-container {
    height: 5px;
    min-width: 80px;
    width: 100%;
  }
}

/* 자동 진행 타이머 스타일 */
.auto-progress-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 1rem;
  background: linear-gradient(135deg, rgba(46, 204, 113, 0.08), rgba(39, 174, 96, 0.08));
  border-radius: 12px;
  border: 1px solid rgba(46, 204, 113, 0.2);
  max-width: 300px;
  margin: 0 auto;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #2ecc71;
  white-space: nowrap;
}

.progress-info i {
  font-size: 1rem;
  animation: pulse-clock 1s infinite;
}

.countdown-text {
  color: #27ae60;
  font-size: 0.85rem;
}

.progress-bar-container {
  flex: 1;
  height: 6px;
  background-color: rgba(46, 204, 113, 0.2);
  border-radius: 3px;
  overflow: hidden;
  min-width: 80px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #2ecc71, #27ae60);
  border-radius: 3px;
  transition: width 1s linear;
  position: relative;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 15px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3));
  animation: progress-shine 2s infinite;
}

@keyframes pulse-clock {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes progress-shine {
  0% { transform: translateX(-20px); }
  100% { transform: translateX(20px); }
}
</style> 