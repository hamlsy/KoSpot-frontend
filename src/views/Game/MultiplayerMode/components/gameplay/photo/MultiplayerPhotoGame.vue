<template>
  <div class="multiplayer-photo-game">
    <!-- 카운트다운 오버레이는 나중에 IntroOverlay와 NextRoundOverlay 컴포넌트로 대체 예정 -->

    <!-- 게임 헤더 컴포넌트 -->
    <multiplayer-game-header
      :roomData="gameStore.state.roomData"
      :currentRound="gameStore.state.currentRound"
      :totalRounds="gameStore.state.totalRounds"
      :remainingTime="gameStore.state.remainingTime"
      :isTimerRunning="true"
      :showCorrectRegion="showCorrectRegion"
      :correctRegion="correctRegion"
      @exit-game="exitGame"
    />

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

      <!-- 오른쪽 패널 -->
      <div class="right-panel">
        <!-- 간단한 채팅 입력 영역 -->
        <div class="chat-input-container">
          <simple-chat-input
            :disabled="
              gameStore.state.hasSubmittedGuess || gameStore.state.roundEnded
            "
            @send-message="sendChatMessage"
          />
        </div>
      </div>
    </div>

    <!-- 모바일용 지도 토글 버튼 -->
    <button class="toggle-map-button" @click="toggleMap">
      <i
        :class="isMapOpen ? 'fas fa-map-marked-alt' : 'fas fa-map-marker-alt'"
      ></i>
      {{ isMapOpen ? "지도 닫기" : "지도 열기" }}
    </button>

    <!-- 플레이어 마커 (아바타) 표시 영역 -->
    <player-markers
      ref="playerMarkers"
      :players="gameStore.state.players"
      :current-user-id="gameStore.state.currentUser.id"
      :is-team-mode="isTeamMode"
      :teams="gameStore.state.teams"
    />

    <!-- 카운트다운 오버레이는 나중에 IntroOverlay와 NextRoundOverlay 컴포넌트로 대체 예정 -->
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
    // 테스트 데이터 로드 및 게임 초기화
    gameStore.loadTestData(this.isTeamMode);
    // nextTick을 사용하여 DOM이 렌더링된 후 게임 초기화
    this.$nextTick(() => {
      // 약간의 지연을 두어 DOM이 완전히 렌더링되도록 함
      setTimeout(() => {
        this.initGame();
      }, 300);
    });
  },

  beforeUnmount() {
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

      // 랜덤 사진 및 위치 가져오기
      setTimeout(() => {
        // 테스트 데이터에서 위치 가져오기
        const location = getRandomLocation();

        // 현재 라운드에 해당하는 사진들 설정
        this.currentPhotos = this.currentPhotos.slice(0, 3); // 최대 3개 사진만 사용

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
        this.showCountdown = true;
      }, 1500);
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
      // 플레이어 마커 컴포넌트에 점수 애니메이션 표시
      if (this.$refs.playerMarkers) {
        this.$refs.playerMarkers.showScoreAnimation(playerId, score);
      }
    },

    toggleMap() {
      this.isMapOpen = !this.isMapOpen;
    },

    submitGuess() {
      if (!this.selectedRegion || gameStore.state.roundEnded) return;

      // 정답 여부 확인 (테스트용)
      const isCorrect = Math.random() > 0.5;

      if (isCorrect) {
        this.correctRegion = this.selectedRegion;
        this.showCorrectAnimation = true;
        this.showCorrectRegion = true;

        // 점수 계산 및 표시 (테스트용)
        const score = Math.floor(Math.random() * 1000) + 500;
        this.showScoreAnimation(gameStore.state.currentUser.id, score);

        // 정답 제출 처리
        gameStore.submitCorrectGuess(score);
      } else {
        this.wrongRegion = this.selectedRegion;
        this.showIncorrectAnimation = true;
      }

      // 플레이어 제출 상태 업데이트
      gameStore.updatePlayerSubmission(gameStore.state.currentUser.id, true);

      // 지도 닫기
      this.isMapOpen = false;

      // 정답 지역 표시 (실제로는 서버에서 받아와야 함)
      setTimeout(() => {
        this.showCorrectRegion = true;
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
      // 게임 초기화
      gameStore.initGame(this.isTeamMode);

      // 플레이어 및 팀 설정 (테스트용)
      if (this.isTeamMode) {
        gameStore.setupTeams();
      }

      // 초기에는 맵을 닫힌 상태로 유지
      this.isMapOpen = false;

      // 카카오맵 초기화 준비 상태를 false로 설정
      this.mapReady = false;

      // DOM이 완전히 렌더링된 후 맵 준비 상태를 true로 설정
      this.$nextTick(() => {
        setTimeout(() => {
          this.mapReady = true;
          console.log("카카오맵 렌더링 준비 완료");
        }, 500);
      });

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
      if (this.$refs.playerMarkers) {
        this.$refs.playerMarkers.showChatMessage(
          gameStore.state.currentUser.id,
          message
        );
      }
    },

    sendChatMessage(message) {
      if (!message.trim()) return;
      gameStore.addChatMessage(message);

      // 채팅 메시지를 플레이어 마커에도 표시
      if (this.$refs.playerMarkers) {
        this.$refs.playerMarkers.showChatMessage(
          gameStore.state.currentUser.id,
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
  },
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


.header-left {
  display: flex;
  align-items: center;
  flex: 1;
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

.exit-text {
  display: inline-block;
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
  margin: 0 1rem;
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
  overflow: hidden;
  position: relative;
  background-color: #000;
}

/* 지도 섹션 스타일 */
.map-section {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  z-index: 20;
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;
}

.map-section.map-open {
  transform: translateY(0);
}

/* 오른쪽 패널 스타일 */
.right-panel {
  width: 300px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: -2px 0 20px rgba(0, 0, 0, 0.05);
  z-index: 5;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(0, 0, 0, 0.05);
}

.game-info-panel {
  padding: 1.5rem;
  height: 100%;
}

.info-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a5d1a;
  margin-bottom: 1rem;
  border-bottom: 2px solid rgba(26, 93, 26, 0.2);
  padding-bottom: 0.5rem;
}

.info-content {
  color: #333;
  font-size: 0.95rem;
  line-height: 1.6;
}

.location-hint {
  margin-top: 1rem;
  padding: 1rem;
  background: linear-gradient(
    135deg,
    rgba(26, 93, 26, 0.05),
    rgba(76, 175, 80, 0.1)
  );
  border-radius: 8px;
  border-left: 3px solid #4caf50;
}

.chat-input-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 60;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

/* 지도 토글 버튼 스타일 */
.toggle-map-button {
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 30;
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
  font-size: 1rem;
}


/* 반응형 스타일 */
@media (max-width: 1200px) {
  .right-panel {
    width: 250px;
  }

  .toggle-map-button {
    right: 270px;
  }
}

@media (max-width: 992px) {
  .game-content {
    flex-direction: column;
  }

  .right-panel {
    width: 100%;
    height: 200px;
    order: 2;
  }

  .photo-section {
    height: calc(100% - 200px);
  }

  .toggle-map-button {
    right: 20px;
    bottom: 220px;
  }
}

@media (max-width: 768px) {
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

  .photo-section {
    height: calc(100% - 150px);
  }

  .right-panel {
    height: 150px;
  }

  .toggle-map-button {
    bottom: 170px;
  }
}

/* 플레이어 마커 스타일 */
.player-markers {
  position: fixed;
  bottom: 70px;
  left: 0;
  right: 0;
  z-index: 50;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 1rem;
  display: flex;
  justify-content: center;
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


</style>