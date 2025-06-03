<template>
  <div class="multiplayer-photo-game">
    <!-- 게임 헤더 컴포넌트 -->
    <multiplayer-game-header
      :room-data="{ name: roomId, mode: isTeamMode ? '팀모드' : '개인모드' }"
      :current-round="gameStore.state.currentRound || 1"
      :total-rounds="gameStore.state.totalRounds || 5"
      :remaining-time="gameStore.state.remainingTime || 0"
      :is-timer-running="true"
      :show-correct-region="showCorrectRegion"
      :correct-region="correctRegion"
      @exit-game="exitGame"
    />

    <!-- 게임 메인 영역 -->
    <div class="game-content">
      <!-- 왼쪽 영역 - 사진 섹션 -->
      <div class="photo-section">
        <photo-mode-photo-grid
          :photos="currentPhotos"
          :show-incorrect-animation="showIncorrectAnimation"
          :show-correct-animation="showCorrectAnimation"
          :show-timeout-animation="showTimeoutAnimation"
          :correct-region="correctRegion"
          @photo-loaded="handlePhotoLoaded"
        />
        
        <!-- 플레이어 마커 영역 -->
        <div class="player-markers-wrapper">
          <player-markers
            ref="playerMarkers"
            :players="gameStore.state.players"
            :current-user-id="gameStore.state.currentUser?.id || ''"
            :is-team-mode="isTeamMode"
            :teams="gameStore.state.teams"
          />
        </div>
      </div>
      
      <!-- 오른쪽 패널 (지도) -->
      <div class="right-panel" :class="{ 'map-open': isMapOpen }">
        <region-map
          v-if="mapReady"
          ref="regionMap"
          :show-region-names="true"
          :correct-region="correctRegion"
          :wrong-region="wrongRegion"
          v-model:selectedRegion="selectedRegion"
          v-model:selectedRegionEng="selectedRegionEng"
          @submit-guess="submitGuess"
        />
      </div>
    </div>
    
    <!-- 채팅 입력 영역 -->
    <div class="chat-input-container">
      <simple-chat-input
        :disabled="
          gameStore.state.hasSubmittedGuess || gameStore.state.roundEnded
        "
        @send-chat-message="sendChatMessage"
      />
    </div>
    
    <!-- 모바일용 지도 토글 버튼 -->
    <button class="toggle-map-button" @click="toggleMap">
      <i :class="isMapOpen ? 'fas fa-times' : 'fas fa-map-marker-alt'"></i>
      {{ isMapOpen ? "지도 닫기" : "지도 열기" }}
    </button>
    
    <!-- 테스트용 점수 변경 버튼 -->
    <button class="test-score-button" @click="testScoreChange">
      테스트: 점수 변경
    </button>

    <!-- 모달 컴포넌트들 -->
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
  </div>
</template>

<script>
import PhotoModePhotoGrid from "@/views/Game/PhotoMode/components/gameplay/PhotoModePhotoGrid.vue";
import RegionMap from "@/views/Game/PhotoMode/components/gameplay/PhotoModeRegionMap.vue";
import RoundResults from "@/views/Game/MultiplayerMode/components/gameplay/results/MultiplayerRoundResults.vue";
import GameResults from "@/views/Game/MultiplayerMode/components/gameplay/results/MultiplayerGameResults.vue";
import TeamGameResults from "@/views/Game/MultiplayerMode/components/gameplay/results/MultiplayerTeamGameResults.vue";
import TeamRoundResults from "@/views/Game/MultiplayerMode/components/gameplay/results/MultiplayerTeamRoundResults.vue";
import PlayerMarkers from "@/views/Game/MultiplayerMode/components/gameplay/photo/MultiplayerPhotoPlayerMarkers.vue";
import MultiplayerGameHeader from "@/views/Game/MultiplayerMode/components/gameplay/common/MultiplayerGameHeader.vue";
import SimpleChatInput from "@/views/Game/MultiplayerMode/components/gameplay/common/SimpleChatInput.vue";
import gameStore from "@/store/gameStore";
import { getRandomLocation } from "@/views/Game/MultiplayerMode/MultiplayerGameTestData";

export default {
  name: "MultiplayerPhotoGame",

  components: {
    PhotoModePhotoGrid,
    RegionMap,
    RoundResults,
    GameResults,
    TeamGameResults,
    TeamRoundResults,
    PlayerMarkers,
    MultiplayerGameHeader,
    SimpleChatInput,
  },

  props: {
    roomId: {
      type: String,
      required: true,
    },
    isTeamMode: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      gameStore,
      isMapOpen: true,
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
      photosLoaded: 0,
      isPhotosReady: false,
      mapReady: false, // 카카오맵 초기화 준비 상태
      currentPhotos: [
        "/assets/photos/seoul/seoul_63building.jpg",
        "/assets/photos/seoul/seoul_cheonggyecheon.jpg",
        "/assets/photos/jeju_1.jpg",
      ],
    };
  },

  created() {
    // 게임 데이터 초기화
    this.initGame();

    // 맵 초기화 이벤트 리스너
    window.addEventListener("kakao_map_ready", this.onMapReady);
    
    // 기본 데이터 설정 (헤더 표시를 위한 초기값)
    if (!gameStore.state.currentRound) gameStore.state.currentRound = 1;
    if (!gameStore.state.totalRounds) gameStore.state.totalRounds = 5;
    if (!gameStore.state.remainingTime) gameStore.state.remainingTime = 120;
  },

  beforeUnmount() {
    window.removeEventListener("kakao_map_ready", this.onMapReady);
    this.clearTimer();
  },

  computed: {
    // 팀 모드 관련 계산된 속성
    currentUserTeam() {
      if (!this.isTeamMode || !gameStore.state.currentUser.teamId) return null;

      return gameStore.state.teams.find(
        (team) => team.id === gameStore.state.currentUser.teamId
      );
    },

    teamMembers() {
      if (!this.isTeamMode || !gameStore.state.currentUser.teamId) return [];

      return gameStore.state.players.filter(
        (player) =>
          player.teamId === gameStore.state.currentUser.teamId &&
          player.id !== gameStore.state.currentUser.id
      );
    },

    currentTeamMessages() {
      if (!this.isTeamMode || !gameStore.state.currentUser.teamId) return [];

      return (
        gameStore.state.teamChatMessages[gameStore.state.currentUser.teamId] ||
        []
      );
    },

    canSubmit() {
      // 이미 제출했거나 라운드가 끝난 경우
      if (gameStore.state.hasSubmittedGuess || gameStore.state.roundEnded)
        return false;

      // 위치를 선택했는지 확인
      return !!this.guessPosition;
    },
  },

  methods: {
    fetchRoundData() {
      // API 호출 대신 임시 데이터 사용
      const location = getRandomLocation();
      
      // 게임 스토어 상태 업데이트
      gameStore.state.currentLocation = location.name;
      gameStore.state.correctRegion = location.region;
      gameStore.state.correctRegionEng = location.regionEng;
      gameStore.state.actualLocation = location.coordinates;
      gameStore.state.locationInfo = {
        name: location.name,
        description: location.description,
        image: location.image,
        fact: location.fact,
      };
      
      // 사진 로드
      this.loadNewPhotos();
      
      // 지도 초기화
      this.selectedRegion = "";
      this.selectedRegionEng = "";
      this.correctRegion = "";
      this.wrongRegion = "";
    },

    handlePhotoLoaded() {
      this.photosLoaded++;
      // 모든 사진이 로드되면 라운드 시작 준비 완료
      if (this.photosLoaded === this.currentPhotos.length) {
        this.isPhotosReady = true;
      }
    },

    startRound() {
      // 라운드 시작 시 초기화
      this.selectedRegion = null;
      this.selectedRegionEng = null;
      this.correctRegion = null;
      this.wrongRegion = null;
      this.showCorrectAnimation = false;
      this.showIncorrectAnimation = false;
      this.showTimeoutAnimation = false;
      this.showCorrectRegion = false;
      this.photosLoaded = 0;
      this.isPhotosReady = false;

      // 새 사진 로드
      this.loadNewPhotos();

      // 카운트다운 시작 (임시 처리 - 나중에 IntroOverlay와 NextRoundOverlay로 대체 예정)
      this.showCountdown = true;
      this.countdownValue = 3;

      // 카운트다운 오버레이 컴포넌트 없이 임시로 카운트다운 처리
      setTimeout(() => {
        this.onCountdownComplete();
      }, 3000);
    },

    onCountdownComplete() {
      this.showCountdown = false;

      // 타이머 시작
      this.startRoundTimer();

      // 카카오맵이 준비되었는지 확인
      if (!this.mapReady) {
        console.log("카카오맵이 아직 준비되지 않았습니다. 잠시 기다립니다.");
        // 맵이 준비되지 않았으면 준비될 때까지 기다림
        const checkMapReady = setInterval(() => {
          if (this.mapReady) {
            clearInterval(checkMapReady);
            this.openMapIfNeeded();
          }
        }, 200);
      } else {
        // 맵이 이미 준비되었으면 바로 열기
        this.openMapIfNeeded();
      }
    },

    // 화면 크기에 따라 지도 열기
    openMapIfNeeded() {
      setTimeout(() => {
        if (window.innerWidth > 768) {
          this.isMapOpen = true;
        }
      }, 300);
    },
    
    // 화면 크기 변경 처리
    handleResize() {
      if (window.innerWidth > 768) {
        this.isMapOpen = true;
      } else {
        this.isMapOpen = false;
      }
    },

    loadNewPhotos() {
      // 테스트용 데이터에서 위치 가져오기
      const location = getRandomLocation();

      // 현재 라운드에 해당하는 사진들 설정
      this.currentPhotos = [
        "/assets/photos/seoul/seoul_63building.jpg",
        "/assets/photos/seoul/seoul_cheonggyecheon.jpg",
        "/assets/photos/jeju_1.jpg",
      ].slice(0, 3); // 최대 3개 사진만 사용

      gameStore.state.currentLocation = {
        lat: location.lat,
        lng: location.lng,
      };
      gameStore.state.locationInfo = {
        name: location.name,
        description: location.description,
        image: location.image,
        fact: location.fact,
      };
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

    showScoreAnimation(playerId, score) {
      // 플레이어 마커 컴포넌트에 점수 애니메이션 표시 메서드 호출
      if (this.$refs.playerMarkers) {
        this.$refs.playerMarkers.showScoreAnimation(playerId, score);
      }
    },
    
    // 채팅 메시지 전송 처리
    sendChatMessage(message) {
      if (!message.trim()) return;
      
      const chatMessage = {
        id: Date.now().toString(),
        playerId: gameStore.state.currentUser.id,
        playerName: gameStore.state.currentUser.name,
        message: message,
        timestamp: new Date().toISOString(),
        isSystemMessage: false
      };
      
      // 채팅 메시지 저장
      gameStore.state.chatMessages.push(chatMessage);
      
      // 플레이어 마커에 채팅 메시지 표시
      if (this.$refs.playerMarkers) {
        this.$refs.playerMarkers.showChatMessage(gameStore.state.currentUser.id, message);
      }
    },
    
    // 플레이어 점수에 따른 정렬
    sortPlayersByScore() {
      // 점수 내림차순으로 정렬
      gameStore.state.players.sort((a, b) => b.score - a.score);
      
      // 플레이어 마커 순서 업데이트 애니메이션 표시
      if (this.$refs.playerMarkers) {
        this.$refs.playerMarkers.updatePlayerOrder();
      }
    },

    toggleMap() {
      this.isMapOpen = !this.isMapOpen;
    },

    submitGuess() {
      // 이미 정답을 제출했거나 라운드가 끝났으면 무시
      if (
        gameStore.state.hasSubmittedGuess ||
        gameStore.state.roundEnded ||
        !this.selectedRegion
      ) {
        return;
      }

      // 정답 확인
      const isCorrect =
        this.selectedRegionEng.toLowerCase() ===
        gameStore.state.correctRegionEng.toLowerCase();

      // 게임 스토어 상태 업데이트
      gameStore.state.hasSubmittedGuess = true;

      if (isCorrect) {
        // 정답인 경우
        this.correctRegion = this.selectedRegion;
        this.showCorrectAnimation = true;
        setTimeout(() => {
          this.showCorrectAnimation = false;
        }, 2000);

        // 점수 계산 (먼저 맞출수록 높은 점수)
        const correctPlayers = gameStore.state.players.filter(
          (p) => p.isCorrect
        ).length;
        let score = 0;

        switch (correctPlayers) {
          case 0: // 첫 번째로 맞춘 경우
            score = 10;
            break;
          case 1: // 두 번째로 맞춘 경우
            score = 8;
            break;
          case 2: // 세 번째로 맞춘 경우
            score = 5;
            break;
          default: // 그 이후
            score = 3;
            break;
        }

        // 현재 사용자 점수 업데이트
        const currentUser = gameStore.state.players.find(
          (p) => p.id === gameStore.state.currentUser.id
        );
        if (currentUser) {
          currentUser.score += score;
          currentUser.isCorrect = true;
          // 점수 애니메이션 표시
          this.showScoreAnimation(currentUser.id, score);
          
          // 정답 맞춤 메시지 자동 전송
          this.sendChatMessage(`${this.correctRegion} 정답! +${score}점 획득했어요!`);
          
          // 플레이어 순서 재정렬 (점수 기준)
          this.sortPlayersByScore();
        }
      } else {
        // 오답인 경우
        this.wrongRegion = this.selectedRegion;
        this.showIncorrectAnimation = true;
        
        // 플레이어 마커에 오답 애니메이션 표시
        if (this.$refs.playerMarkers) {
          this.$refs.playerMarkers.showWrongAnswerAnimation(gameStore.state.currentUser.id);
        }
        
        // 오답 메시지 자동 전송
        this.sendChatMessage(`${this.selectedRegion}? 아닌 것 같아요...`);
        
        setTimeout(() => {
          this.showIncorrectAnimation = false;
          this.wrongRegion = "";
        }, 2000);
      }
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
        lng: gameStore.state.currentLocation.lng + (Math.random() * 0.1 - 0.05),
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
      if (
        confirm(
          "정말 게임을 나가시겠습니까? 진행 중인 게임은 저장되지 않습니다."
        )
      ) {
        this.exitToLobby();
      }
    },

    exitToLobby() {
      // 로비로 돌아가기
      this.$router.push("/multiplayer/lobby");
    },

    initGame() {
      // 게임 상태 초기화
      gameStore.state.hasSubmittedGuess = false;
      gameStore.state.roundEnded = false;
      gameStore.state.showRoundResults = false;
      gameStore.state.showGameResults = false;
      gameStore.state.correctRegionEng = "seoul"; // 테스트용 정답 지역

      // 맵 관련 상태 초기화
      this.mapReady = false;
      this.isMapOpen = window.innerWidth > 768; // PC에서는 기본적으로 맵 표시

      // 첫 라운드 데이터 가져오기
      setTimeout(() => {
        this.fetchRoundData();
      }, 800); // 카카오맵 초기화 후 라운드 데이터 가져오기
    },
    
   

    sendTeamMessage(data) {
      const { teamId, message } = data;

      if (!teamId || !message.trim()) return;
      gameStore.addTeamChatMessage(teamId, message);

      // 채팅 메시지를 플레이어 마커에도 표시
      if (this.$refs.playerMarkers && gameStore.state.currentUser) {
        this.$refs.playerMarkers.showChatMessage(
          gameStore.state.currentUser.id || '',
          message
        );
      }
    },

    getTeamColor(teamId) {
      const colorMap = {
        1: "red",
        2: "blue",
        3: "green",
        4: "purple",
      };

      return colorMap[teamId] || "blue";
    },
    
    // 테스트용 점수 변경 기능
    testScoreChange() {
      // 랜덤하게 플레이어 점수 변경
      gameStore.state.players.forEach(player => {
        // 랜덤 점수 추가 (1~10)
        const randomScore = Math.floor(Math.random() * 10) + 1;
        player.score += randomScore;
        
        // 점수 애니메이션 표시
        this.showScoreAnimation(player.id, randomScore);
        
        // 시스템 메시지로 점수 변경 알림
        const systemMessage = {
          id: Date.now().toString() + player.id,
          playerId: 'system',
          playerName: 'System',
          message: `${player.name}님이 ${randomScore}점을 획득했습니다!`,
          timestamp: new Date().toISOString(),
          isSystemMessage: true
        };
        
        gameStore.state.chatMessages.push(systemMessage);
      });
      
      // 점수에 따라 플레이어 정렬 및 애니메이션 표시
      this.sortPlayersByScore();
    }
  }
}
</script>

<style scoped>
/* 게임 헤더 스타일 */
.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
}

.exit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.exit-button:hover {
  background-color: #d32f2f;
}

.room-info {
  margin-left: 1rem;
  display: flex;
  flex-direction: column;
}

.room-name {
  font-weight: 600;
  color: #1a5d1a;
  font-size: 1.1rem;
}

.room-mode {
  font-size: 0.85rem;
  color: #666;
}

.header-center {
  flex: 0 1 400px;
  max-width: 400px;
}

.round-info {
  text-align: center;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.timer-bar {
  height: 8px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #7dce13, #bbd6b8); /* 포토 게임 색상 */
  border-radius: 4px;
  transition: width 0.5s ease-out;
}

.header-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.correct-region-display {
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* 게임 컨텐츠 스타일 */
.game-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 사진 섹션 스타일 */
.photo-section {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #000;
  max-width: calc(100% - 300px);
}

/* 오른쪽 패널 (지도) 스타일 */
.right-panel {
  width: 300px;
  background-color: #f5f7fa;
  z-index: 20;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
  transform: translateX(0);
}

/* 플레이어 마커 영역 스타일 */
.player-markers-wrapper {
  position: relative;
  padding: 1rem;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.8));
  min-height: 100px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  z-index: 10;
  width: 100%;
  box-sizing: border-box;
}

/* 채팅 입력 영역 스타일 */
.chat-input-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 60;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.toggle-map-button {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 110;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #1a5d1a, #4caf50);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.toggle-map-button:hover {
  background-color: #156415;
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
}

/* 테스트 버튼 스타일 */
.test-score-button {
  position: fixed;
  bottom: 140px;
  right: 20px;
  z-index: 110;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #6a1b9a, #9c27b0);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 500;
  display: flex;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.test-score-button:hover {
  background: linear-gradient(135deg, #4a148c, #7b1fa2);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
}

/* 멀티플레이어 포토 게임 전체 스타일 */
.multiplayer-photo-game {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa, #e4f2f0);
  overflow: hidden;
  position: relative;
}

/* 반응형 스타일 */
@media (min-width: 769px) {
  /* PC 뷰 */
  .toggle-map-button {
    display: none;
  }
  
  .photo-section {
    max-width: calc(100% - 300px);
  }
}

@media (max-width: 768px) {
  /* 모바일 뷰 */
  .game-content {
    flex-direction: column;
  }
  
  .photo-section {
    max-width: 100%;
    width: 100%;
  }
  
  .right-panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: translateX(-100%);
    z-index: 100;
  }
  
  .right-panel.map-open {
    transform: translateX(0);
  }
  
  .toggle-map-button {
    display: flex;
  }
  
  .game-header {
    flex-wrap: wrap;
    padding: 0.5rem;
  }

  .header-left {
    order: 1;
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .header-center {
    order: 3;
    width: 100%;
    max-width: 100%;
    margin: 0.5rem 0;
  }

  .header-right {
    order: 2;
    width: 100%;
    align-items: flex-start;
  }

  .exit-text {
    display: none;
  }

  .room-info {
    margin-left: 0.5rem;
  }

  .player-markers-wrapper {
    padding: 0.5rem;
    min-height: 80px;
  }
}
</style>