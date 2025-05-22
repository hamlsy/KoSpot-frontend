<template>
  <BaseMultiRoadViewGame
    :room-id="roomId"
    :game-mode="gameMode"
    :is-team-mode="false"
    @guess-submitted="handleGuessSubmission"
    @round-ended="handleRoundEnded"
    @game-finished="handleGameFinished"
  >
    <!-- 개인전용 플레이어 리스트 -->
    <template #player-list>
      <player-list
        :players="gameStore.state.players"
        :current-user-id="gameStore.state.currentUser.id"
        :show-scores="
          gameStore.state.hasSubmittedGuess || gameStore.state.roundEnded
        "
        :round-ended="gameStore.state.roundEnded"
      />
    </template>
    <!-- 개인전 채팅창 -->
    <template #chat>
      <chat-window
        :messages="gameStore.state.chatMessages"
        @send-message="sendChatMessage"
      />
    </template>

    <!-- 메인 게임 영역 -->
    <template #main>
      <!-- 라운드 진행 중일 때는 로드뷰 표시 -->
      <road-view
        v-if="!gameStore.state.roundEnded && gameStore.state.currentLocation"
        :position="
          gameStore.state.currentLocation || { lat: 37.5665, lng: 126.978 }
        "
        :show-controls="true"
        :prevent-mouse-events="gameStore.state.hasSubmittedGuess"
      />

      <!-- 라운드 종료 시 결과 컴포넌트 표시 -->
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
        @close="closeRoundResults"
        @next-round="startNextRound"
        @finish-game="finishGame"
      />
    </template>

    <!-- 게임 결과 모달 -->
    <template #results>
      <game-results
        v-if="gameStore.state.showGameResults"
        :visible="gameStore.state.showGameResults"
        :players="gameStore.state.players"
        :room-data="gameStore.state.roomData"
        @play-again="restartGame"
        @exit="exitToLobby"
      />
    </template>
  </BaseMultiRoadViewGame>
</template>

<script>
import BaseMultiRoadViewGame from "./BaseMultiRoadViewGame.vue";
import ChatWindow from "@/components/game/multiplayerMode/gameplay/chat/IndividualChat.vue";
import RoundResults from "@/components/game/multiplayerMode/gameplay/results/MultiplayerRoundResults.vue";
import GameResults from "@/components/game/multiplayerMode/gameplay/results/MultiplayerGameResults.vue";
import RoadView from "@/components/game/common/roadview/RoadView.vue";
import gameStore from "@/store/gameStore";
import PlayerList from "@/components/game/multiplayerMode/gameplay/MultiplayerPlayerList.vue";

export default {
  name: "IndividualRoadViewGame",

  components: {
    BaseMultiRoadViewGame,
    ChatWindow,
    RoundResults,
    GameResults,
    RoadView,
    PlayerList,
  },

  data() {
    return {
      gameStore, // 게임 스토어 참조
      // 게임 설정 데이터
      gameMode: "individual",
      roomId: "individual-room-1", // 테스트용 방 ID

      // 개인 게임 특화 데이터
      submittedPlayersCount: 0,
      allPlayersSubmitted: false,
      roundTimer: null, // 라운드 타이머
      toastTimeout: null, // 토스트 메시지 타이머
    };
  },

  created() {
    console.log("IndividualRoadViewGame created");
    // 테스트 데이터 로드 및 게임 초기화
    this.gameStore.loadTestData(false);
    this.initGame();
  },

  mounted() {
    console.log(
      "IndividualRoadViewGame mounted - players: ",
      this.gameStore.state.players
    );
    // 게임 스토어의 상태 변화 감시
    this.$watch(
      () => this.gameStore.state.actualLocation,
      (newVal) => {
        if (newVal && Object.keys(newVal).length > 0) {
          console.log("실제 위치가 설정되었습니다:", newVal);
          // 실제 위치가 설정된 후에 다른 플레이어들의 추측 시뮬레이션
          this.simulateOtherPlayersGuesses();
        }
      },
      { deep: true }
    );
  },

  beforeDestroy() {
    this.clearTimer();
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  },

  methods: {
    // 이벤트 핸들러 메서드
    handleRoundEnded() {
      console.log("라운드가 종료되었습니다.");
      // 라운드 종료 처리 로직
      this.clearTimer();
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

      // 플레이어 점수 계산 및 정렬
      this.calculatePlayerScores();

      // 라운드 종료 상태로 설정 (결과 화면 표시를 위해)
      this.gameStore.state.roundEnded = true;
      this.gameStore.endGameRound();
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

    // 토스트 메시지 표시
    showToast(message) {
      this.toastMessage = message;
      this.showToastFlag = true;

      if (this.toastTimeout) {
        clearTimeout(this.toastTimeout);
      }

      this.toastTimeout = setTimeout(() => {
        this.showToastFlag = false;
      }, 3000);
    },

    handleGameFinished() {
      console.log("게임이 종료되었습니다.");
      // 게임 종료 처리 로직
    },

    handleGuessSubmission(position) {
      console.log("개인 게임에서 위치 제출:", position);

      // 현재 플레이어의 추측 저장
      const currentPlayer = this.gameStore.state.currentUser;

      // gameStore에 직접 추가
      if (!this.gameStore.state.playerGuesses) {
        this.gameStore.state.playerGuesses = [];
      }

      // 현재 사용자의 추측 정보 저장
      this.gameStore.state.userGuess = { position: position };

      // 추측 정보 객체 생성
      const guessInfo = {
        playerId: currentPlayer.id,
        playerName: currentPlayer.nickname,
        position: position,
        color: this.getRandomColor(currentPlayer.id),
      };

      // playerGuesses 배열에 추가
      this.gameStore.state.playerGuesses.push(guessInfo);

      // 플레이어 객체에 제출 상태 업데이트
      const playerIndex = this.gameStore.state.players.findIndex(
        (p) => p.id === currentPlayer.id
      );
      if (playerIndex !== -1) {
        // 플레이어 객체 업데이트
        this.gameStore.state.players[playerIndex].hasSubmitted = true;

        // PlayerList 컴포넌트에서 사용하는 속성명으로 설정
        this.gameStore.state.players[playerIndex].score =
          this.gameStore.state.players[playerIndex].totalScore || 0;
        this.gameStore.state.players[playerIndex].lastRoundScore =
          this.gameStore.state.players[playerIndex].lastScore || 0;
      }

      // 제출한 플레이어 수 증가
      this.submittedPlayersCount++;

      // 웹소켓으로 서버에 제출 정보 전송
      this.sendGuessToServer({
        playerId: currentPlayer.id,
        position: position,
      });

      this.gameStore.submitGuess();
      console.log(
        "플레이어 제출 상태 업데이트 완료:",
        this.gameStore.state.players
      );

      // 모든 플레이어가 제출했는지 확인
      this.checkAllPlayersSubmitted();
    },

    sendChatMessage(message) {
      if (!message.trim()) return;
      this.gameStore.addChatMessage(message);
    },

    closeRoundResults() {
      this.gameStore.closeRoundResults();
    },

    // 색상 생성 메서드
    getRandomColor(id) {
      const colors = [
        "#FF4081",
        "#E040FB",
        "#7C4DFF",
        "#536DFE",
        "#448AFF",
        "#40C4FF",
        "#18FFFF",
        "#64FFDA",
        "#69F0AE",
        "#B2FF59",
        "#EEFF41",
        "#FFFF00",
        "#FFD740",
        "#FFAB40",
        "#FF6E40",
      ];

      // 플레이어 ID를 기반으로 일관된 색상 생성
      if (id) {
        const idSum = id
          .toString()
          .split("")
          .reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return colors[idSum % colors.length];
      }

      // 임의의 색상 생성
      return colors[Math.floor(Math.random() * colors.length)];
    },

    // 서버에 추측 정보 전송
    sendGuessToServer(guessData) {
      // 실제 구현 시 WebSocket으로 전송
      console.log("서버에 추측 정보 전송:", guessData);

      // 테스트용 더미 구현
      /*
      if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
        this.webSocket.send(JSON.stringify({
          type: 'PLAYER_GUESS',
          payload: guessData
        }));
      } else {
        console.error('웹소켓 연결이 없습니다.');
      }
      */
    },

    // 모든 플레이어가 제출했는지 확인
    checkAllPlayersSubmitted() {
      const totalPlayers = this.gameStore.state.players.length;
      const submittedPlayers = this.gameStore.state.playerGuesses.length;

      console.log(`제출 현황: ${submittedPlayers}/${totalPlayers}`);

      // 모든 플레이어가 제출했는지 확인
      if (submittedPlayers >= totalPlayers) {
        console.log("모든 플레이어가 제출했습니다.");
        setTimeout(() => {
          // 라운드 종료 처리
          this.endRound();

          console.log("라운드가 자동으로 종료되었습니다.");
        }, 500);
      }
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

        // 거리에 따른 점수 계산 (0~12점)
        const score = Math.max(0, Math.floor(12 - distance * 0.01));
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
        player.hasSubmitted = false;
      });

      // 다음 라운드 시작
      if (
        this.gameStore.state.currentRound < this.gameStore.state.totalRounds
      ) {
        this.gameStore.state.currentRound++;
        this.gameStore.state.hasSubmittedGuess = false;
        this.gameStore.state.guessPosition = null;
        this.fetchRoundData();

        console.log("다음 라운드 시작:", this.gameMode);
      } else {
        // 모든 라운드 완료
        this.gameStore.finishGame();
      }

      // 다음 라운드에서 다른 플레이어들의 추측 시뮬레이션
      this.simulateOtherPlayersGuesses();
    },

    finishGame() {
      this.gameStore.finishGame();
    },

    restartGame() {
      this.gameStore.state.showGameResults = false;
      this.initGame();
      this.simulateOtherPlayersGuesses();
    },

    exitToLobby() {
      this.exitToLobby();
    },

    // 더미 데이터로 다른 플레이어들의 정답 제출 시뮬레이션
    simulateOtherPlayersGuesses() {
      console.log("다른 플레이어 추측 시뮬레이션 시작");

      // 라운드가 이미 끝났거나 제출이 완료된 경우 중단
      if (
        this.gameStore.state.hasSubmittedGuess ||
        this.gameStore.state.roundEnded
      ) {
        return;
      }

      // 제출 카운트 초기화
      this.submittedPlayersCount = 0;

      // 실제 위치가 없으면 시뮬레이션 중단
      if (
        !this.gameStore.state.actualLocation ||
        !this.gameStore.state.actualLocation.lat
      ) {
        console.error("실제 위치가 없어 시뮤레이션을 실행할 수 없습니다.");
        return;
      }

      // 현재 플레이어를 제외한 다른 플레이어들
      const otherPlayers = this.gameStore.state.players.filter(
        (player) => player.id !== this.gameStore.state.currentUser.id
      );

      console.log("다른 플레이어 수:", otherPlayers.length);

      // 자기 자신의 추측도 추가 (현재 사용자의 추측)
      if (
        this.gameStore.state.userGuess &&
        this.gameStore.state.userGuess.position
      ) {
        console.log(
          "현재 사용자의 추측 추가:",
          this.gameStore.state.userGuess.position
        );
        this.addPlayerGuessToStore(
          this.gameStore.state.currentUser.id,
          this.gameStore.state.userGuess.position,
          "#FF5252"
        );
        this.submittedPlayersCount++;
      }

      // 각 플레이어마다 랜덤한 위치 생성
      otherPlayers.forEach((player, index) => {
        // 실제 위치 주변에 랜덤한 위치 생성 (최대 20km 반경 내)
        setTimeout(() => {
          const randomOffset = () => (Math.random() - 0.5) * 0.4; // 약 ±20km 범위
          const randomPosition = {
            lat: this.gameStore.state.actualLocation.lat + randomOffset(),
            lng: this.gameStore.state.actualLocation.lng + randomOffset(),
          };

          console.log(
            `플레이어 ${player.nickname || index} 추측 생성:`,
            randomPosition
          );

          // 플레이어 색상 랜덤 생성
          const colors = [
            "#FF4081",
            "#E040FB",
            "#7C4DFF",
            "#536DFE",
            "#448AFF",
            "#40C4FF",
            "#18FFFF",
            "#64FFDA",
            "#69F0AE",
            "#B2FF59",
            "#EEFF41",
            "#FFFF00",
            "#FFD740",
            "#FFAB40",
            "#FF6E40",
          ];
          const color = colors[Math.floor(Math.random() * colors.length)];

          // 플레이어 추측 추가
          this.addPlayerGuessToStore(player.id, randomPosition, color);

          // 플레이어 제출 상태 업데이트
          player.hasSubmitted = true;

          // 제출 카운트 증가 및 확인
          this.submittedPlayersCount++;
          console.log(
            "현재 추측 수:",
            this.gameStore.state.playerGuesses.length,
            "제출 카운트:",
            this.submittedPlayersCount
          );

          // 모든 플레이어가 제출했는지 확인
          this.checkAllPlayersSubmitted();
        }, 500 + Math.random() * 2000); // 시간 단축: 0.5~2.5초 사이에 랜덤하게 제출
      });
    },

    // 플레이어 추측을 스토어에 추가하는 헬퍼 메서드
    addPlayerGuessToStore(playerId, position, color) {
      const player = this.gameStore.state.players.find(
        (p) => p.id === playerId
      );
      if (!player) return;

      // 스토어에 직접 추가
      if (!this.gameStore.state.playerGuesses) {
        this.gameStore.state.playerGuesses = [];
      }

      this.gameStore.state.playerGuesses.push({
        playerId: playerId,
        playerName: player.nickname,
        position: position,
        color: color,
      });
      console.log(
        "player Guesses in store!",
        this.gameStore.state.playerGuesses
      );
    },
  },
};
</script>