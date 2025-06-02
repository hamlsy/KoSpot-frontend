<template>
  <div class="multiplayer-photo-game">
    <!-- 게임 헤더 -->
    <div class="game-header">
    <div class="header-left">
      <button class="exit-button" @click="exitGame">
        <i class="fas fa-door-open"></i>
        <span class="exit-text">나가기</span>
      </button>
      <div class="room-info">
        <h2 class="room-name">{{ gameStore.state.roomData.name }}</h2>
        <div class="game-mode">
          {{ gameStore.state.roomData.gameMode }} - {{ gameStore.state.roomData.region }}
        </div>
      </div>
    </div>
    
    <div class="header-center col-md-4">
      <div class="round-info">
        <span class="round-number">
          라운드 {{ gameStore.state.currentRound }}/{{ gameStore.state.totalRounds }}
        </span>
        <div class="round-progress">
          <div 
            class="progress-bar" 
            :style="{ width: `${(gameStore.state.currentRound / gameStore.state.totalRounds) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>
    
    <div class="header-right col-md-4">
      <game-timer 
        ref="gameTimer"
        :initialTime="gameStore.state.remainingTime"
        :totalTime="120"
        :warning-threshold="30"
        :danger-threshold="10"
      />
      <div v-if="showCorrectRegion" class="correct-region-display">
        정답: {{ correctRegion }}
      </div>
    </div>
  </div>
  
  <!-- 게임 메인 영역 -->
  <div class="game-content">
    <!-- 사진 섹션 -->
    <div class="photo-section">
      <photo-mode-photo-grid
        :photos="currentPhotos"
        :show-incorrect-animation="showIncorrectAnimation"
        :show-correct-animation="showCorrectAnimation"
        :show-timeout-animation="showTimeoutAnimation"
        :correct-region="correctRegion"
        @photo-loaded="handlePhotoLoaded"
      />
    </div>
    
    <!-- 지도 섹션 -->
    <div class="map-section" :class="{ 'map-open': isMapOpen }">
      <region-map
        ref="regionMap"
        :show-region-names="true"
        :correct-region="correctRegion"
        :wrong-region="wrongRegion"
        v-model:selectedRegion="selectedRegion"
        v-model:selectedRegionEng="selectedRegionEng"
        @submit-guess="submitGuess"
      />
    </div>
    
    <!-- 오른쪽 패널: 채팅 -->
    <div class="right-panel">
      <chat-window 
        v-if="!isTeamMode"
        :messages="gameStore.state.chatMessages"
        @send-message="sendChatMessage"
      />
      
      <!-- 팀 모드일 경우 팀 채팅 표시 -->
      <team-chat
        v-if="isTeamMode && currentUserTeam"
        :team-id="gameStore.state.currentUser.teamId"
        :team-name="currentUserTeam.name"
        :team-color="getTeamColor(currentUserTeam.id)"
        :team-messages="currentTeamMessages"
        :current-user-id="gameStore.state.currentUser.id"
        @send-team-message="sendTeamMessage"
      />
    </div>
  </div>
  
  <!-- 모바일용 지도 토글 버튼 -->
  <button class="toggle-map-button" @click="toggleMap">
    <i :class="isMapOpen ? 'fas fa-map-marked-alt' : 'fas fa-map-marker-alt'"></i>
    {{ isMapOpen ? '지도 닫기' : '지도 열기' }}
  </button>
  
  <!-- 플레이어 마커 (아바타) 표시 영역 -->
  <player-markers
    ref="playerMarkers"
    :players="gameStore.state.players"
    :current-user-id="gameStore.state.currentUser.id"
    :is-team-mode="isTeamMode"
    :teams="gameStore.state.teams"
  />
  
  <!-- 카운트다운 오버레이 -->
  <countdown-overlay
    v-if="showCountdown"
    :initial-value="countdownValue"
    @complete="onCountdownComplete"
  />
  
  <!-- 모달 컴포넌트들 (로드뷰 게임과 동일) -->
  <round-results
    v-if="gameStore.state.showRoundResults && !isTeamMode"
    :visible="gameStore.state.showRoundResults"
    :players="gameStore.state.players"
    :actual-location="gameStore.state.actualLocation"
    :round="gameStore.state.currentRound"
    :total-rounds="gameStore.state.totalRounds"
    :current-user-id="gameStore.state.currentUser.id"
    :location-name="gameStore.state.locationInfo.name"
    :location-description="gameStore.state.locationInfo.description"
    :location-image="gameStore.state.locationInfo.image"
    :interesting-fact="gameStore.state.locationInfo.fact"
    @close="closeRoundResults"
    @next-round="startNextRound"
    @finish-game="finishGame"
  />

  <team-round-results
    v-if="gameStore.state.showRoundResults && isTeamMode"
    :visible="gameStore.state.showRoundResults"
    :teams="gameStore.state.teams"
    :players="gameStore.state.players"
    :actual-location="gameStore.state.actualLocation"
    :round="gameStore.state.currentRound"
    :total-rounds="gameStore.state.totalRounds"
    :current-user-id="gameStore.state.currentUser.id"
    :current-user-team="gameStore.state.currentUser.teamId"
    :location-name="gameStore.state.locationInfo.name"
    :location-description="gameStore.state.locationInfo.description"
    :location-image="gameStore.state.locationInfo.image"
    :interesting-fact="gameStore.state.locationInfo.fact"
    @close="closeRoundResults"
    @next-round="startNextRound"
    @finish-game="finishGame"
  />
  
  <game-results
    v-if="gameStore.state.showGameResults && !isTeamMode"
    :visible="gameStore.state.showGameResults"
    :players="gameStore.state.players"
    :room-data="gameStore.state.roomData"
    @play-again="restartGame"
    @exit="exitToLobby"
  />

  <team-game-results
    v-if="gameStore.state.showGameResults && isTeamMode"
    :visible="gameStore.state.showGameResults"
    :teams="gameStore.state.teams"
    :players="gameStore.state.players"
    :room-data="gameStore.state.roomData"
    :chat-messages="gameStore.state.chatMessages"
    @play-again="restartGame"
    @exit="exitToLobby"
    @send-chat-message="sendChatMessage"
  />
  <!-- 로딩 오버레이 -->
  <div v-if="isLoading" class="loading-overlay">
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
      <span>로딩 중...</span>
    </div>
  </div>
</div>
</template>

<script>
import GameTimer from '@/components/common/ui/game/BaseGameTimer.vue';
import PhotoModePhotoGrid from '@/views/Game/PhotoMode/components/gameplay/PhotoModePhotoGrid.vue';
import RegionMap from '@/views/Game/PhotoMode/components/gameplay/PhotoModeRegionMap.vue';
import CountdownOverlay from '@/components/common/ui/game/CountdownOverlay.vue';
import ChatWindow from '@/views/Game/MultiplayerMode/components/lobby/chat/MultiplayerLobbyChatWindow.vue';
import RoundResults from '@/views/Game/MultiplayerMode/components/gameplay/results/MultiplayerRoundResults.vue';
import GameResults from '@/views/Game/MultiplayerMode/components/gameplay/results/MultiplayerGameResults.vue';
import TeamChat from '@/views/Game/MultiplayerMode/components/gameplay/chat/TeamChat.vue';
import TeamGameResults from '@/views/Game/MultiplayerMode/components/gameplay/results/MultiplayerTeamGameResults.vue';
import TeamRoundResults from '@/views/Game/MultiplayerMode/components/gameplay/results/MultiplayerTeamRoundResults.vue';
import PlayerMarkers from '@/views/Game/MultiplayerMode/components/gameplay/photo/MultiplayerPhotoPlayerMarkers.vue';
import gameStore from '@/store/gameStore';
import { getRandomLocation } from '@/views/Game/MultiplayerMode/MultiplayerGameTestData';

export default {
  name: 'MultiplayerPhotoGame',
  
  components: {
    GameTimer,
    PhotoModePhotoGrid,
    RegionMap,
    CountdownOverlay,
    ChatWindow,
    RoundResults,
    GameResults,
    TeamChat,
    TeamGameResults,
    TeamRoundResults,
    PlayerMarkers
  },
  
  props: {
    roomId: {
      type: String,
      required: true
    },
    isTeamMode: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      gameStore,
      isLoading: false,
      isMapOpen: false,
      showCountdown: false,
      countdownValue: 3,
      selectedRegion: null,
      selectedRegionEng: null,
      correctRegion: null,
      wrongRegion: null,
      showCorrectAnimation: false,
      showIncorrectAnimation: false,
      showTimeoutAnimation: false,
      showCorrectRegion: false,
      mapCenter: { lat: 36.5, lng: 127.5 },
      roundTimer: null,
      currentPhotos: [
        '/assets/photos/seoul_1.jpg',
        '/assets/photos/busan_1.jpg',
        '/assets/photos/jeju_1.jpg',
        '/assets/photos/gyeongju_1.jpg',
        '/assets/photos/incheon_1.jpg'
      ]
    };
  },
  
  computed: {
    // 팀 모드 관련 계산된 속성
    currentUserTeam() {
      if (!this.isTeamMode || !gameStore.state.currentUser.teamId) return null;
      
      return gameStore.state.teams.find(team => team.id === gameStore.state.currentUser.teamId);
    },
    
    teamMembers() {
      if (!this.isTeamMode || !gameStore.state.currentUser.teamId) return [];
      
      return gameStore.state.players.filter(player => 
        player.teamId === gameStore.state.currentUser.teamId && 
        player.id !== gameStore.state.currentUser.id
      );
    },
    
    currentTeamMessages() {
      if (!this.isTeamMode || !gameStore.state.currentUser.teamId) return [];
      
      return gameStore.state.teamChatMessages[gameStore.state.currentUser.teamId] || [];
    },
    
    canSubmit() {
      // 이미 제출했거나 라운드가 끝난 경우
      if (gameStore.state.hasSubmittedGuess || gameStore.state.roundEnded) return false;
      
      // 위치를 선택했는지 확인
      return !!this.guessPosition;
    }
  },
  
  created() {
    // 테스트 데이터 로드 및 게임 초기화
    gameStore.loadTestData(this.isTeamMode);
    this.initGame();
  },
  
  beforeUnmount() {
    this.clearTimer();
  },
  
  methods: {
    initGame() {
      gameStore.initGame();
      this.fetchRoundData();
    },
    
    fetchRoundData() {
      this.isLoading = true;
      
      // 랜덤 사진 및 위치 가져오기
      setTimeout(() => {
        // 테스트 데이터에서 위치 가져오기
        const location = getRandomLocation();
        
        // 현재 라운드에 해당하는 사진들 설정
        this.currentPhotos = this.currentPhotos.slice(0, 3); // 최대 3개 사진만 사용
        
        gameStore.state.currentLocation = { lat: location.lat, lng: location.lng };
        gameStore.state.locationInfo = {
          name: location.name,
          description: location.description,
          image: location.image,
          fact: location.fact
        };
        
        this.isLoading = false;
        this.showCountdown = true;
      }, 1500);
    },
    
    onCountdownComplete() {
      this.showCountdown = false;
      this.startRoundTimer();
    },
    
    handlePhotoLoaded() {
      // 사진이 로드되면 호출되는 메소드
      console.log('Photo loaded');
    },
    
    startRoundTimer() {
      gameStore.state.remainingTime = 120; // 2분
      
      this.roundTimer = setInterval(() => {
        gameStore.state.remainingTime--;
        
        if (gameStore.state.remainingTime <= 0) {
          this.clearTimer();
          this.endRound();
        }
      }, 1000);
    },
    
    clearTimer() {
      if (this.roundTimer) {
        clearInterval(this.roundTimer);
        this.roundTimer = null;
      }
    },
    
    onViewLoaded() {
      // 포토뷰 로딩 완료 처리
    },
    
    toggleMap() {
      this.isMapOpen = !this.isMapOpen;
    },
    
    submitGuess() {
      if (!this.selectedRegion || !this.canSubmit) return;
      
      // 정답 확인 (실제로는 서버에서 확인)
      const correctRegionName = gameStore.state.locationInfo.name;
      const isCorrect = this.selectedRegion === correctRegionName || this.selectedRegionEng === correctRegionName;
      
      if (isCorrect) {
        this.correctRegion = this.selectedRegion;
        this.showCorrectAnimation = true;
        
        // 점수 계산 및 애니메이션 표시
        const score = this.isTeamMode ? 50 : 100; // 팀모드일 경우 점수 조정
        gameStore.addPlayerScore(gameStore.state.currentUser.id, score);
        
        // 플레이어 마커에 점수 애니메이션 표시
        if (this.$refs.playerMarkers) {
          this.$refs.playerMarkers.showScoreAnimation(gameStore.state.currentUser.id, score);
        }
        
        // 팀 모드일 경우 팀원들에게 채팅 메시지 전송
        if (this.isTeamMode && gameStore.state.currentUser.teamId) {
          gameStore.addTeamChatMessage(
            gameStore.state.currentUser.teamId,
            `${gameStore.state.currentUser.nickname}님이 정답을 맞췄습니다! +${score}점`,
            true
          );
        }
      } else {
        this.wrongRegion = this.selectedRegion;
        this.showIncorrectAnimation = true;
      }
      
      // 플레이어 제출 상태 업데이트
      gameStore.updatePlayerSubmission(gameStore.state.currentUser.id, true);
      
      // 정답 지역 표시 (실제로는 서버에서 받아와야 함)
      setTimeout(() => {
        this.showCorrectRegion = true;
        this.correctRegion = correctRegionName;
      }, 1500);
      
      // 라운드 종료 처리
      setTimeout(() => {
        this.endRound();
      }, 3000);
    },
    
    endRound() {
      this.clearTimer();
      
      // 애니메이션 초기화
      this.showCorrectAnimation = false;
      this.showIncorrectAnimation = false;
      this.showTimeoutAnimation = false;
      this.showCorrectRegion = false;
      
      // 실제 위치 설정 (테스트용)
      gameStore.state.actualLocation = {
        lat: gameStore.state.currentLocation.lat + (Math.random() * 0.1 - 0.05),
        lng: gameStore.state.currentLocation.lng + (Math.random() * 0.1 - 0.05)
      };
      
      gameStore.endRound();
      
      // 점수 애니메이션 표시 (테스트용)
      if (this.$refs.playerMarkers) {
        // 플레이어들에게 랜덤 점수 부여 (실제로는 서버에서 계산된 점수 사용)
        gameStore.state.players.forEach((player, index) => {
          if (player.hasSubmitted) {
            const score = Math.floor(Math.random() * 1000) + 100;
            setTimeout(() => {
              this.$refs.playerMarkers.showScoreAnimation(player.id, score);
            }, index * 500); // 순차적으로 애니메이션 표시
          }
        });
      }
      
      // 라운드 결과 표시
      gameStore.showRoundResults();
    },
    
    closeRoundResults() {
      gameStore.state.showRoundResults = false;
    },
    
    startNextRound() {
      gameStore.startNextRound();
      this.selectedRegion = null;
      this.selectedRegionEng = null;
      this.correctRegion = null;
      this.wrongRegion = null;
      this.fetchRoundData();
    },
    
    finishGame() {
      gameStore.finishGame();
    },
    
    restartGame() {
      gameStore.state.showGameResults = false;
      this.initGame();
    },
    
    exitGame() {
      if (confirm('정말 게임을 나가시겠습니까? 진행 중인 게임은 저장되지 않습니다.')) {
        this.exitToLobby();
      }
    },
    
    exitToLobby() {
      this.clearTimer();
      this.$router.push('/multiplayerLobby');
    },
    
  
    
    sendTeamMessage(data) {
      const { teamId, message } = data;
      
      if (!teamId || !message.trim()) return;
      gameStore.addTeamChatMessage(teamId, message);
      
      // 채팅 메시지를 플레이어 마커에도 표시
      if (this.$refs.playerMarkers) {
        this.$refs.playerMarkers.showChatMessage(gameStore.state.currentUser.id, message);
      }
    },
    
    sendChatMessage(message) {
      if (!message.trim()) return;
      gameStore.addChatMessage(message);
      
      // 채팅 메시지를 플레이어 마커에도 표시
      if (this.$refs.playerMarkers) {
        this.$refs.playerMarkers.showChatMessage(gameStore.state.currentUser.id, message);
      }
    },
    
    getTeamColor(teamId) {
      const colorMap = {
        'team1': 'blue',
        'team2': 'red',
        'team3': 'green',
        'team4': 'yellow'
      };
      
      return colorMap[teamId] || 'blue';
    },
    
    // 점수 획득 시 플레이어 마커에 애니메이션 표시
    showScoreAnimation(playerId, score) {
      if (this.$refs.playerMarkers) {
        this.$refs.playerMarkers.showScoreAnimation(playerId, score);
      }
    }
  }
};
</script>

<style scoped>
.multiplayer-photo-game {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
  overflow: hidden;
}

/* 게임 헤더 스타일 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: #1A5D1A; /* 포토 게임 헤더 색상을 다르게 */
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.exit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.exit-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.room-info {
  margin-left: 1rem;
}

.room-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.game-mode {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.header-center {
  flex: 1;
  max-width: 400px;
  margin: 0 2rem;
}

.round-info {
  text-align: center;
}

.round-number {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.round-progress {
  height: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #7DCE13, #BBD6B8); /* 포토 게임 색상 */
  border-radius: 4px;
  transition: width 0.5s ease-out;
}

/* 게임 컨텐츠 스타일 */
.game-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  width: 250px;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 5;
}

.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.game-view {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: #000; /* 사진 배경 검정색으로 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 300px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 5;
  transition: all 0.3s ease;
}

.map-container.expanded {
  width: 60%;
  height: 60%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.expand-map-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background-color: white;
  border: none;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  font-size: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.right-panel {
  width: 300px;
  background-color: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 5;
}

/* 게임 푸터 스타일 */
.game-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: #1A5D1A; /* 포토 게임 푸터 색상 */
  color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.guess-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.guess-info i {
  color: #BBD6B8;
}

.submit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background-color: #7DCE13;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: #6CB011;
}

.submit-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

/* 로딩 오버레이 스타일 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: white;
}

.loading-spinner i {
  font-size: 3rem;
}

/* 반응형 스타일 */
@media (max-width: 1200px) {
  .left-panel {
    width: 200px;
  }
  
  .right-panel {
    width: 250px;
  }
}

@media (max-width: 992px) {
  .game-content {
    flex-direction: column;
  }
  
  .left-panel, .right-panel {
    width: 100%;
    height: auto;
  }
  
  .main-panel {
    order: -1;
    height: 50vh;
  }
  
  .map-container.expanded {
    width: 80%;
    height: 80%;
  }
}

@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    padding: 0.5rem;
  }
  
  .header-center {
    margin: 0.5rem 0;
    max-width: 100%;
  }
  
  .header-right {
    align-self: flex-end;
  }
}

/* 플레이어 마커 관련 추가 스타일 */
.player-markers-container {
  z-index: 50; /* 맵보다 위에 표시되도록 z-index 설정 */
}

/* 맵이 확장되었을 때 플레이어 마커가 가려지지 않도록 */
.map-container.expanded ~ .player-markers-container {
  opacity: 0.8;
  transform: translateY(-60px);
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* 모바일 화면에서 플레이어 마커 스타일 조정 */
@media (max-width: 768px) {
  .player-markers-container {
    padding: 0.5rem;
  }
}
</style>