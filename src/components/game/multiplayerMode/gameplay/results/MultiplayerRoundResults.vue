<template>
  <div class="round-results">
    <div class="results-container">
      <!-- 헤더 -->
      <div class="results-header">
        <div class="header-left">
          <h2 class="round-title">라운드 {{ round }} 결과</h2>
        </div>
      </div>

      <!-- 확장된 지도 영역 -->
      <div class="map-container">
        <kakao-map
          :center="actualLocation"
          :marker-position="null"
          :actual-position="actualLocation"
          :prevent-interaction="false"
          :show-marker-hint="false"
          :zoom-level="5"
          :player-guesses="playerGuesses"
          :show-distance-lines="true"
          :fitAllMarkers="true"
          :top-player="topPlayer"
          ref="resultMap"
        />
      </div>

      <!-- 하단 버튼 -->
      <div class="results-footer">
        <div class="next-button-container">
          <!-- 플레이어 마커 표시 영역 -->
          <div class="player-markers-container">
            <div 
              v-for="(player, index) in playersWhoClickedNext" 
              :key="player.id"
              class="player-marker-wrapper"
              :style="{ left: `${index * 30 - 30}px` }"
            >
              <div 
                class="player-marker" 
                :style="{ 
                  backgroundColor: player.markerImage ? 'transparent' : player.color,
                  backgroundImage: player.markerImage ? `url(${player.markerImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }"
                :title="player.name"
              >
                <span class="marker-tooltip">{{ player.name }}</span>
              </div>
            </div>
          </div>

          <!-- 카운트다운 바 -->
          <div class="countdown-bar">
            <div
              class="countdown-progress"
              :style="{ width: `${countdownProgress}%` }"
            ></div>
          </div>

          <button
            v-if="isLastRound"
            class="action-button finish-button"
            @click="finishGame"
          >
            <i class="fas fa-trophy"></i>
            게임 결과 보기
          </button>
          <button 
            v-else 
            class="action-button next-button" 
            @click="nextRound"
            :disabled="hasCurrentUserClickedNext"
          >
            <i class="fas fa-arrow-right"></i>
            다음 라운드
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import KakaoMap from "@/components/game/common/kakao/KakaoMap.vue";

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
    playerGuesses: {
      type: Array,
      default: () => [],
    },
    topPlayer: {
      type: Object,
      default: () => ({}),
    },
  },

  computed: {
    sortedPlayers() {
      return [...this.players].sort((a, b) => b.score - a.score);
    },

    isLastRound() {
      return this.round === this.totalRounds;
    },

    // 플레이어 추측 위치에 대한 마커 정보 계산
    playerMarkers() {
      return this.playerGuesses.map((guess) => ({
        position: guess.position,
        color: guess.color,
        playerName: guess.playerName,
      }));
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
      visible: true,
      playersWhoClickedNext: [],
      countdownDuration: 10000, // 10초
      countdownStart: 0,
      countdownProgress: 100,
      countdownInterval: null,
      hasCurrentUserClickedNext: false,
      // 테스트용 더미 데이터
      testPlayers: [
        { id: 'player1', name: '플레이어1', color: '#FF5733', markerImage: '/images/markers/marker1.png' },
        { id: 'player2', name: '플레이어2', color: '#33FF57', markerImage: '/images/markers/marker2.png' },
        { id: 'player3', name: '플레이어3', color: '#3357FF', markerImage: '/images/markers/marker3.png' },
        { id: 'player4', name: '플레이어4', color: '#F033FF', markerImage: '/images/markers/marker4.png' }
      ],
      defaultMarkerImages: [
        '/images/markers/marker1.png',
        '/images/markers/marker2.png',
        '/images/markers/marker3.png',
        '/images/markers/marker4.png',
        '/images/markers/marker5.png'
      ]
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
    
    // 카운트다운 시작
    this.startCountdown();
    
    // 소켓 이벤트 리스너 등록 - 실제 환경에서 활성화
    if (this.$socket && typeof this.$socket.on === 'function') {
      this.$socket.on('player-clicked-next', this.handlePlayerClickedNext);
    }
    
    // 테스트용: 일정 간격으로 플레이어가 버튼을 누르는 시뮬레이션
    this.simulatePlayersClickingNext();
  },
  
  beforeDestroy() {
    // 컴포넌트가 제거될 때 필요한 정리 작업
    this.stopCountdown();
    
    // 실제 환경에서 활성화
    if (this.$socket && typeof this.$socket.off === 'function') {
      this.$socket.off('player-clicked-next', this.handlePlayerClickedNext);
    }
    
    // 테스트 타이머 정리
    if (this.testClickTimer) {
      clearTimeout(this.testClickTimer);
    }
  },

  methods: {
    formatDistance(distance) {
      if (distance === null || distance === undefined) return "?";

      if (distance < 1) {
        return `${(distance * 1000).toFixed(0)}m`;
      } else {
        return `${distance.toFixed(2)}km`;
      }
    },

    formatNumber(num) {
      if (num === null || num === undefined) return "0";
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

    close() {
      this.$emit("close");
    },

    startCountdown() {
      this.stopCountdown(); // 기존 카운트다운 중지
      this.countdownStart = Date.now();
      this.countdownProgress = 100;

      this.countdownInterval = setInterval(() => {
        const elapsed = Date.now() - this.countdownStart;
        this.countdownProgress = 100 - (elapsed / this.countdownDuration) * 100;

        if (this.countdownProgress <= 0) {
          this.stopCountdown();
          this.proceedToNextRound();
        }
      }, 50);
    },

    stopCountdown() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    },

    nextRound() {
      if (this.hasCurrentUserClickedNext) return;
      
      this.hasCurrentUserClickedNext = true;
      
      // 현재 유저 정보 찾기
      const currentPlayer = this.players.find(player => player.id === this.currentUserId);
      if (!currentPlayer) {
        // 테스트용: 플레이어 정보가 없을 경우 더미 데이터 사용
        this.addPlayerToClickedList({
          id: 'current-user',
          name: '현재 유저',
          color: '#FF9800',
          markerImage: '/images/markers/marker1.png' // 기본 마커 이미지
        });
        return;
      }
      
      // 실제 환경에서 활성화
      // 소켓 이벤트 발송
      if (this.$socket && typeof this.$socket.emit === 'function') {
        this.$socket.emit('player-next-round-clicked', {
          playerId: this.currentUserId,
          playerName: currentPlayer.name,
          playerColor: currentPlayer.color,
          playerMarkerImage: currentPlayer.markerImage || '/images/markers/marker1.png',
          roomId: this.$route.params && this.$route.params.roomId
        });
      }
      
      // 로컬에도 추가
      this.addPlayerToClickedList({
        id: this.currentUserId,
        name: currentPlayer.name,
        color: currentPlayer.color,
        markerImage: currentPlayer.markerImage || '/images/markers/marker1.png'
      });
    },
    
    handlePlayerClickedNext(data) {
      // 다른 플레이어가 다음 라운드 버튼을 클릭했을 때 처리
      this.addPlayerToClickedList({
        id: data.playerId,
        name: data.playerName,
        color: data.playerColor
      });
      
      // 모든 플레이어가 클릭했는지 확인
      this.checkAllPlayersClicked();
    },
    
    addPlayerToClickedList(player) {
      // 이미 추가된 플레이어인지 확인
      if (!this.playersWhoClickedNext.some(p => p.id === player.id)) {
        // 마커 이미지가 없는 경우 기본 이미지 사용
        if (!player.markerImage) {
          const randomIndex = Math.floor(Math.random() * this.defaultMarkerImages.length);
          player.markerImage = this.defaultMarkerImages[randomIndex];
        }
        
        // 플레이어 추가
        this.playersWhoClickedNext.push(player);
        
        // 애니메이션 효과를 위해 약간의 지연 후 체크
        setTimeout(() => this.checkAllPlayersClicked(), 300);
      }
    },
    
    checkAllPlayersClicked() {
      // 모든 플레이어가 클릭했는지 확인
      if (this.playersWhoClickedNext.length >= this.players.length) {
        this.proceedToNextRound();
      }
    },
    
    proceedToNextRound() {
      this.stopCountdown();
      // 이벤트 이름 수정 - 오류 해결
      // 이벤트 이름을 startNextRound로 변경
      this.$emit("startNextRound");
    },
    
    // 테스트용: 다른 플레이어들이 버튼을 누르는 것을 시뮬레이션
    simulatePlayersClickingNext() {
      // 테스트 플레이어는 이미 마커 이미지가 있으므로 그대로 사용
      const updatedTestPlayers = this.testPlayers;
      
      // 첫 번째 플레이어는 1초 후에 클릭
      setTimeout(() => {
        if (updatedTestPlayers.length > 0) {
          this.addPlayerToClickedList(updatedTestPlayers[0]);
        }
      }, 1000);
      
      // 두 번째 플레이어는 3초 후에 클릭
      setTimeout(() => {
        if (updatedTestPlayers.length > 1) {
          this.addPlayerToClickedList(updatedTestPlayers[1]);
        }
      }, 3000);
      
      // 세 번째 플레이어는 5초 후에 클릭
      setTimeout(() => {
        if (updatedTestPlayers.length > 2) {
          this.addPlayerToClickedList(updatedTestPlayers[2]);
        }
      }, 5000);
      
      // 네 번째 플레이어는 7초 후에 클릭
      setTimeout(() => {
        if (updatedTestPlayers.length > 3) {
          this.addPlayerToClickedList(updatedTestPlayers[3]);
        }
      }, 7000);
    },

    finishGame() {
      this.$emit("finish-game");
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
  background-color: white;
}

.results-container {
  animation: slideUp 0.4s ease;
}

/* 헤더 */
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.round-title {
  margin: 0;
  font-size: 1.6rem;
  color: #333;
  font-weight: 600;
}

.round-info {
  margin-top: 0.3rem;
  font-size: 0.9rem;
  color: #666;
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

/* 확장된 지도 컨테이너 */
.map-container {
  flex: 1;
  overflow: hidden;
  border-radius: 12px;
  margin: 0.5rem 1rem 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  height: calc(100% - 120px);
  position: relative;
  background-color: #f8f9fa;
  min-height: 400px;
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
  border-top: 1px solid #eee;
  display: flex;
  justify-content: center;
}

.action-button {
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.next-button {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

.next-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
}

.next-button:disabled {
  background: linear-gradient(135deg, #a5b4fc, #8b5cf6);
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.finish-button {
  background: linear-gradient(135deg, #ff9800, #f57c00);
  color: white;
  box-shadow: 0 4px 10px rgba(255, 152, 0, 0.3);
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
  position: absolute;
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
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
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
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%) translateY(5px);
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

/* 반응형 디자인 */
@media (max-width: 768px) {
  .location-info {
    flex-direction: column;
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
    max-height: 100%;
    border-radius: 0;
  }

  .results-header,
  .location-info,
  .score-board,
  .results-footer {
    padding: 1rem;
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
}
</style> 