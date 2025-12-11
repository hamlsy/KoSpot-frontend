<template>
  <base-multi-road-view-game
    :room-id="roomId"
    :isTeamMode="true"
    @guess-submitted="handleGuessSubmission"
    @round-ended="handleRoundEnded"
    @game-finished="handleGameFinished"
    @next-round-ready="handleNextRoundReady"
    @end-overlay="handleEndOverlay"
    ref="baseGame"
  >
    <!-- 팀 플레이어 리스트 -->
    <template #player-list>
      <team-players-list
        :current-user-id="gameStore.state.currentUser.id"
        :max-players-per-team="4"
      />
    </template>

    <!-- 맵 토글 버튼 오버라이드 -->
    <template #map-toggle>
      <button
        class="map-toggle"
        @click="toggleMap"
        v-if="!gameStore.state.roundEnded"
      >
        <i class="fas fa-map-marked-alt"></i>
        지도
      </button>
    </template>
    <!-- 팀 채팅창 -->
    <template #chat>
      <chat-window
        v-if="currentUserTeam"
        :team-id="gameStore.state.currentUser.teamId"
        :team-color="getTeamColor(currentUserTeam.id)"
        :team-messages="currentTeamMessages"
        :current-user-id="gameStore.state.currentUser.id"
        @send-team-message="sendTeamMessage"
      />
    </template>

    <!-- 메인 게임 영역 -->
    <template #main>
      <!-- 팀 투표 마커 버블 -->
    </template>
    <!-- 팀전 결과 모달 -->
    <template #results>
      <team-game-results
        v-if="gameStore.state.showGameResults"
        :visible="gameStore.state.showGameResults"
        :teams="gameStore.state.teams"
        :players="gameStore.state.players"
        :room-data="gameStore.state.roomData"
        @play-again="restartGame"
        @exit="exitToLobby"
      />

      <!-- 라운드 결과 화면 -->
      <round-results
        v-if="gameStore.state.roundEnded"
        :players="gameStore.state.players"
        :actual-location="
          gameStore.state.actualLocation || { lat: 37.5665, lng: 126.978 }
        "
        :round="gameStore.state.currentRound"
        :total-rounds="gameStore.state.totalRounds"
        :current-user-id="gameStore.state.currentUser.id"
        :location-name="gameStore.state.locationInfo.name"
        :player-guesses="gameStore.state.playerGuesses"
        :top-player="gameStore.state.topPlayer"
        :num-players-ready="
          $refs.baseGame ? $refs.baseGame.numPlayersReadyForNextRound : 0
        "
        :total-players-in-room="
          $refs.baseGame ? $refs.baseGame.totalPlayersInRoom : 0
        "
        :majority-threshold="
          $refs.baseGame ? $refs.baseGame.majorityThreshold : 0
        "
        :players-ready-details="getPlayersReadyDetails()"
        :is-team-mode="true"
        :teams="gameStore.state.teams"
        :team-messages="teamMessages"
        @close="closeRoundResults"
        @request-next-round="requestNextRound"
        @finish-game="finishGame"
      />

      <!-- 토스트 메시지 -->
      <div class="toast-container" v-if="showToastFlag">
        <div class="toast-message">
          {{ toastMessage }}
        </div>
      </div>
    </template>
  </base-multi-road-view-game>
</template>

<script>
import BaseMultiRoadViewGame from "./BaseGameView.vue";
import ChatWindow from "src/features/game/multiplayer/chat/components/Lobby/ChatWindow.vue";
import TeamGameResults from "src/features/game/multiplayer/shared/components/results/TeamGameResults.vue";
import TeamPlayersList from "src/features/game/multiplayer/roadview/components/playerlist/TeamPlayersList.vue";
import RoundResults from "src/features/game/multiplayer/roadview/components/results/RoundResults.vue";
import gameStore from "@/store/gameStore";

export default {
  name: "TeamRoadViewGame",

  components: {
    BaseMultiRoadViewGame,
    ChatWindow,
    TeamGameResults,
    TeamPlayersList,
    RoundResults,
  },

  data() {
    return {
      gameStore,
      roomId: "team-game-1", // 실제로는 라우트 파라미터나 props로 받아옴
      showToastFlag: false,
      toastMessage: "",
      isResponsiveMode: false,
      allPlayersSubmitted: false,
      submittedPlayersCount: 0,
      playerReadyStates: {}, // 플레이어 준비 상태
      teamReadyStates: {}, // 팀 준비 상태
      teamMessages: {}, // 팀별 최신 메시지
    };
  },

  computed: {
    currentUserTeam() {
      return gameStore.state.teams.find(
        (team) => team.id === gameStore.state.currentUser?.teamId
      );
    },

    // 현재 팀의 메시지 가져오기
    currentTeamMessages() {
      const teamId = gameStore.state.currentUser?.teamId;
      return teamId !== undefined ? this.teamMessages[teamId] || [] : [];
    },

    // 맵이 열려있는지 확인
    isMapOpen() {
      return this.$refs.baseGame?.isMapOpen || false;
    },
  },

  mounted() {
    // 테스트 데이터 추가 (4팀 구성)
    this.setupTestData();

    // 게임 초기화
    this.initGame();

    // 테스트용 팀 메시지 설정
    this.setupTestTeamMessages();
  },

  created() {
    // 팀 모드로 설정
    this.isTeamMode = true;
    this.gameMode = "team";
    // 테스트 데이터 로드 및 게임 초기화
    this.gameStore.loadTestData(true);

    // 반응형 모드에서 맵 상태 변화 감지
    window.addEventListener("resize", this.checkResponsiveMode);
    this.checkResponsiveMode();
  },

  beforeUnmount() {
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
    }
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    window.removeEventListener("resize", this.checkResponsiveMode);
  },

  methods: {
    // 준비된 플레이어 상세 정보 가져오기
    getPlayersReadyDetails() {
      const readyPlayers = [];

      // 팀별로 준비된 플레이어 정보 수집
      gameStore.state.players.forEach((player) => {
        if (this.playerReadyStates[player.id]) {
          readyPlayers.push(player);
        }
      });

      return readyPlayers;
    },

    // 다음 라운드 요청 처리 (자동으로 넘어가므로 빈 함수)
    requestNextRound() {
      // 다음 라운드는 자동으로 넘어가므로 별도 처리 불필요
    },

    // 게임 종료 요청 처리
    finishGame() {
      // 게임 종료 로직 구현
      this.$refs.baseGame.handleFinishGame();
    },

    // 라운드 결과 닫기
    closeRoundResults() {
      gameStore.state.roundEnded = false;
    },

    // 테스트용 팀 메시지 설정
    setupTestTeamMessages() {
      this.teamMessages = {
        0: [
          {
            id: "msg1",
            playerId: "player1",
            nickname: "블루팀원1",
            message: "여기가 맞는 것 같아요!",
            timestamp: Date.now() - 120000,
          },
          {
            id: "msg2",
            playerId: "player2",
            nickname: "블루팀원2",
            message: "저도 동의합니다",
            timestamp: Date.now() - 60000,
          },
          {
            id: "msg3",
            playerId: "player3",
            nickname: "블루팀원3",
            message: "좋은 위치인 것 같네요",
            timestamp: Date.now() - 30000,
          },
        ],
        1: [
          {
            id: "msg4",
            playerId: "player4",
            nickname: "레드팀원1",
            message: "이 위치가 정답일 거예요",
            timestamp: Date.now() - 45000,
          },
          {
            id: "msg5",
            playerId: "player5",
            nickname: "레드팀원2",
            message: "확실해요!",
            timestamp: Date.now() - 15000,
          },
        ],
        2: [
          {
            id: "msg6",
            playerId: "player6",
            nickname: "그린팀원1",
            message: "여기가 맞을 것 같아요",
            timestamp: Date.now() - 90000,
          },
          {
            id: "msg7",
            playerId: "player8",
            nickname: "그린팀원3",
            message: "동의합니다",
            timestamp: Date.now() - 20000,
          },
        ],
        3: [
          {
            id: "msg8",
            playerId: "player10",
            nickname: "퍼플팀원1",
            message: "이 근처인 것 같아요",
            timestamp: Date.now() - 60000,
          },
          {
            id: "msg9",
            playerId: "player11",
            nickname: "퍼플팀원2",
            message: "네, 여기가 맞을 거예요",
            timestamp: Date.now() - 10000,
          },
        ],
      };
    },

    // 테스트 데이터 설정
    setupTestData() {
      // 테스트용 플레이어 데이터 생성
      const testPlayers = [
        // 팀 0 (파란색)
        {
          id: "player1",
          nickname: "블루팀원1",
          teamId: 0,
          equippedMarker: "/assets/markers/marker1.png",
          hasSubmitted: true,
          isHost: true,
        },
        {
          id: "player2",
          nickname: "블루팀원2",
          teamId: 0,
          equippedMarker: "/assets/markers/marker2.png",
          hasSubmitted: false,
        },
        {
          id: "player3",
          nickname: "블루팀원3",
          teamId: 0,
          equippedMarker: "/assets/markers/marker3.png",
          hasSubmitted: true,
        },

        // 팀 1 (빨간색)
        {
          id: "player4",
          nickname: "레드팀원1",
          teamId: 1,
          equippedMarker: "/assets/markers/marker4.png",
          hasSubmitted: true,
        },
        {
          id: "player5",
          nickname: "레드팀원2",
          teamId: 1,
          equippedMarker: "/assets/markers/marker5.png",
          hasSubmitted: false,
        },

        // 팀 2 (초록색)
        {
          id: "player6",
          nickname: "그린팀원1",
          teamId: 2,
          equippedMarker: "/assets/markers/marker6.png",
          hasSubmitted: true,
        },
        {
          id: "player7",
          nickname: "그린팀원2",
          teamId: 2,
          equippedMarker: "/assets/markers/marker7.png",
          hasSubmitted: false,
        },
        {
          id: "player8",
          nickname: "그린팀원3",
          teamId: 2,
          equippedMarker: "/assets/markers/marker8.png",
          hasSubmitted: true,
        },
        {
          id: "player9",
          nickname: "그린팀원4",
          teamId: 2,
          equippedMarker: "/assets/markers/marker9.png",
          hasSubmitted: false,
        },

        // 팀 3 (보라색)
        {
          id: "player10",
          nickname: "퍼플팀원1",
          teamId: 3,
          equippedMarker: "/assets/markers/marker10.png",
          hasSubmitted: true,
        },
        {
          id: "player11",
          nickname: "퍼플팀원2",
          teamId: 3,
          equippedMarker: "/assets/markers/marker11.png",
          hasSubmitted: false,
        },
      ];

      // 테스트 팀 데이터 생성
      const testTeams = [
        { id: 0, name: "블루팀", color: "#3b82f6", score: 12500 },
        { id: 1, name: "레드팀", color: "#ef4444", score: 9800 },
        { id: 2, name: "그린팀", color: "#10b981", score: 15200 },
        { id: 3, name: "퍼플팀", color: "#8b5cf6", score: 7600 },
      ];

      // 테스트 데이터로 게임 스토어 업데이트
      this.gameStore.state.players = testPlayers;
      this.gameStore.state.teams = testTeams;
      this.gameStore.state.currentUser = testPlayers[0]; // 현재 사용자를 블루팀 첫 번째 플레이어로 설정
    },

    // 플레이어 상세 정보 처리
    handlePlayerDetails(player) {
      console.log("플레이어 상세 정보:", player);
      // 플레이어 상세 정보 표시 로직 구현
    },

    // 플레이어 강퇴 처리
    handleKickPlayer(player) {
      console.log("플레이어 강퇴:", player);
      // 플레이어 강퇴 로직 구현
    },

    //overlay 끝났음을 알림
    handleEndOverlay() {
      this.simulationTriggered = true;
    },
    // 다음 라운드 준비 완료 처리
    handleNextRoundReady() {
      // 게임 상태 초기화
      this.gameStore.state.hasSubmittedGuess = false;
      this.gameStore.state.userGuess = null;
      this.gameStore.state.playerGuesses = [];


      // 팀원들의 준비 상태 확인
      const readyTeamMembers = this.getReadyTeamMembers();
      const totalTeamMembers = this.getTeamMembers().length;

      // 팀 준비 상태 메시지 표시
      const readyMessage = `팀원 ${readyTeamMembers}/${totalTeamMembers}명이 준비 완료했습니다.`;
      this.showToast(readyMessage);

      // 모든 팀이 준비되었는지 확인
      const allTeamsReady = this.checkAllTeamsReady();

      if (allTeamsReady) {
        // 모든 팀이 준비되면 다음 라운드 시작
        this.showToast(
          "모든 팀이 준비 완료되었습니다. 다음 라운드를 시작합니다."
        );
        setTimeout(() => {
          // 인트로 오버레이 표시 (기존 인트로 오버레이 사용)
          this.gameStore.state.showIntroOverlay = true;

          // 다음 라운드 데이터 가져오기 준비
          this.fetchRoundData();
        }, 1500);
      } else {
        // 아직 모든 팀이 준비되지 않았다면 대기 메시지 표시
        this.showToast("다른 팀의 준비를 기다리는 중입니다...");

        // 실제 구현에서는 WebSocket을 통해 다른 팀의 준비 상태를 수신하게 됨
        // 여기서는 테스트를 위해 타이머로 시뮬레이션
        setTimeout(() => {
          // 인트로 오버레이 표시 (기존 인트로 오버레이 사용)
          this.gameStore.state.showIntroOverlay = true;

          // 다음 라운드 데이터 가져오기 준비
          this.fetchRoundData();
        }, 3000);
      }
    },

    // 준비된 팀원 수 가져오기
    getReadyTeamMembers() {
      // 실제 구현에서는 서버에서 준비된 팀원 정보를 가져옴
      // 여기서는 테스트를 위해 임의의 값 반환
      return Math.floor(Math.random() * 3) + 1; // 1~3명 사이 랜덤
    },

    // 팀원 목록 가져오기
    getTeamMembers() {
      // 현재 사용자의 팀 ID로 팀원 필터링
      const currentTeamId = this.gameStore.state.currentUser.teamId;
      return this.gameStore.state.players.filter(
        (player) => player.teamId === currentTeamId
      );
    },

    // 모든 팀이 준비되었는지 확인
    checkAllTeamsReady() {
      // 실제 구현에서는 서버에서 모든 팀의 준비 상태를 확인
      // 여기서는 테스트를 위해 랜덤하게 결정
      return Math.random() > 0.3; // 70% 확률로 모든 팀 준비 완료
    },

    handleGameFinished() {
      console.log("게임이 종료되었습니다.");
      // 게임 종료 처리 로직
    },

    // 이벤트 핸들러 메서드
    handleRoundEnded() {
      console.log("라운드가 종료되었습니다.");
      // 라운드 종료 처리 로직
      this.clearTimer();
    },

    handleGuessSubmission(position) {
      // 팀 모드에서는 팀 제출 로직을 사용
      if (gameStore.state.roomData.matchType === "team") {
        this.submitTeamGuess(position);
      } else {
        console.error("팀 모드가 아닌데 팀 게임 컴포넌트가 사용됨");
      }
    },

    submitTeamGuess(position) {
      // 팀 모드에서 정답 제출 (투표 없이 바로 제출)
      const userId = gameStore.state.currentUser.id;
      const teamId = gameStore.state.currentUser.teamId;

      // 정답 제출 처리 (점수 합산 기능은 추후 구현)
      // TODO: 점수 합산 기능 구현 필요
      
      this.showToast("정답이 제출되었습니다.");
    },


    // 맵 토글 메서드
    toggleMap() {
      if (this.$refs.baseGame) {
        this.$refs.baseGame.toggleMap();
        this.isMapOpen = !this.isMapOpen;

      }
    },

    // 반응형 모드 체크
    checkResponsiveMode() {
      this.isResponsiveMode = window.innerWidth <= 992;

      // 반응형 모드에서 맵 상태 확인
      if (this.$refs.baseGame) {
        this.isMapOpen = this.$refs.baseGame.isMapOpen;
      }
    },


    // 토스트 메시지 표시 메서드
    showToast(message, duration = 3000) {
      this.toastMessage = message;
      this.showToastFlag = true;

      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }

      this.toastTimeout = setTimeout(() => {
        this.showToastFlag = false;
      }, duration);
    },


    // 타이머 시작 메서드
    startRoundTimer() {
      this.gameStore.state.remainingTime = 120; // 2분

      this.roundTimer = setInterval(() => {
        this.gameStore.state.remainingTime--;

        if (this.gameStore.state.remainingTime <= 0) {
          this.clearTimer();
          this.endRound();
        }
      }, 1000);
    },

    // 타이머 정리 메서드
    clearTimer() {
      if (this.roundTimer) {
        clearInterval(this.roundTimer);
        this.roundTimer = null;
      }
    },

    // 라운드 종료 메서드
    endRound() {
      // 라운드 종료 처리
      this.clearTimer();
      this.gameStore.endGameRound();

      // 플레이어 점수 계산 및 정렬
      this.calculatePlayerScores();

      // 라운드 종료 상태로 설정 (결과 화면 표시를 위해)
      this.gameStore.state.roundEnded = true;

      console.log("라운드 종료:", this.gameMode);
    },

    // 게임 초기화 메서드
    initGame() {
      this.gameStore.initGame();
      this.fetchRoundData();
    },

    // 라운드 데이터 가져오기
    fetchRoundData() {
      // 테스트 데이터에서 위치 가져오기
      setTimeout(() => {
        const getRandomLocation = () => {
          const locations = [
            {
              lat: 37.5665,
              lng: 126.978,
              name: "서울시청",
              description: "서울 중심부에 위치한 시청",
            },
            {
              lat: 35.1796,
              lng: 129.0756,
              name: "부산 해운대",
              description: "부산의 유명한 해변",
            },
            {
              lat: 33.4996,
              lng: 126.5312,
              name: "제주 성산일출봉",
              description: "제주도의 유명한 관광지",
            },
          ];
          return locations[Math.floor(Math.random() * locations.length)];
        };

        const location = getRandomLocation();

        // 현재 위치와 실제 위치(정답 좌표) 모두 설정
        const locationCoords = {
          lat: location.lat,
          lng: location.lng,
        };

        this.gameStore.state.currentLocation = locationCoords;
        this.gameStore.state.actualLocation = locationCoords; // 정답 좌표 설정

        this.gameStore.state.locationInfo = {
          name: location.name,
          description: location.description,
          image: location.image,
          fact: location.fact,
        };

        // 타이머 시작
        this.startRoundTimer();
      }, 1500);
    },

    // 플레이어 점수 계산
    calculatePlayerScores() {
      // 각 플레이어의 점수 계산 (거리 기반)
      if (!this.gameStore.state.actualLocation) return;

      const actualLat = this.gameStore.state.actualLocation.lat;
      const actualLng = this.gameStore.state.actualLocation.lng;

      this.gameStore.state.playerGuesses.forEach((guess) => {
        const distance = this.calculateDistance(
          actualLat,
          actualLng,
          guess.position.lat,
          guess.position.lng
        );

        // 거리에 따른 점수 계산 (0~5000점)
        const score = Math.max(0, Math.floor(5000 - distance * 10));
        guess.score = score;
        guess.distance = distance.toFixed(2);

        // 플레이어 정보 업데이트
        const player = this.gameStore.state.players.find(
          (p) => p.id === guess.playerId
        );
        if (player) {
          // 누적 점수 계산
          if (!player.totalScore) player.totalScore = 0;
          player.totalScore += score;

          // PlayerList 컴포넌트에서 사용하는 속성명으로 설정
          player.score = player.totalScore;
          player.lastScore = score;
          player.lastRoundScore = score;
          player.distanceToTarget = parseFloat(distance.toFixed(2));
        }
      });

      console.log("점수 계산 완료:", this.gameStore.state.players);

      // 점수 기준으로 정렬
      this.gameStore.state.players.sort(
        (a, b) => (b.score || 0) - (a.score || 0)
      );
      this.gameStore.state.topPlayer = {
        playerName: this.gameStore.state.players[0].nickname,
        distance: this.gameStore.state.players[0].distanceToTarget,
      };
    },

    // 거리 계산 함수 (Haversine 공식)
    calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // 지구 반경 (km)
      const dLat = this.deg2rad(lat2 - lat1);
      const dLon = this.deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) *
          Math.cos(this.deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // 거리 (km)
      return distance;
    },

    deg2rad(deg) {
      return deg * (Math.PI / 180);
    },

    sendTeamMessage(data) {
      const { teamId, message } = data;

      if (!teamId || !message.trim()) return;
      this.gameStore.addTeamChatMessage(teamId, message);
    },

    getTeamColor(teamId) {
      const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];
      return colors[teamId % colors.length];
    },

    startNextRound() {
      // 라운드 결과 닫기
      this.gameStore.state.showRoundResults = false;
      this.gameStore.state.roundEnded = false;

      // 다음 라운드를 위한 상태 초기화
      this.allPlayersSubmitted = false;
      this.submittedPlayersCount = 0;
      this.gameStore.state.playerGuesses = [];

      // 플레이어의 마지막 라운드 점수 초기화
      this.gameStore.state.players.forEach((player) => {
        player.lastRoundScore = null;
        player.handleNextRoundReady = () => {
          // 다음 라운드 준비 완료 처리
          console.log("다음 라운드 준비 완료");

          // 팀 투표 초기화

          // 팀원들의 준비 상태 확인
          const readyTeamMembers = this.getReadyTeamMembers();
          const totalTeamMembers = this.teamMembers.length;
        };
      });
    },

    restartGame() {
      this.gameStore.state.showGameResults = false;
      this.initGame();
      // 팀 모드에 맞는 추가 초기화 로직이 필요하다면 여기에 구현
    },

    exitToLobby() {
      this.exitToLobby();
    },
  },
};
</script>

<style scoped>
/* 토스트 메시지 스타일 */
.toast-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  min-width: 250px;
  max-width: 80%;
}

.toast-message {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  text-align: center;
  font-size: 1rem;
  animation: fadeInOut 0.3s ease-in-out;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}


/* 맵 토글 버튼 스타일 오버라이드 */
.map-toggle {
  position: relative;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 50;
}

.map-toggle:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
}
</style>