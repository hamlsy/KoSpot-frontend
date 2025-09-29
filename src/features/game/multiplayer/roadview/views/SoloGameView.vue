<template>
  <BaseMultiRoadViewGame
    :room-id="roomId"
    :game-mode="gameMode"
    :is-team-mode="false"
    :current-user-rank="currentUserRank"
    @guess-submitted="handleGuessSubmission"
    @round-ended="handleRoundEnded"
    @game-finished="handleGameFinished"
    @next-round-ready="handleNextRoundReady"
    @end-overlay="handleEndOverlay"
    @game-started="handleGameStarted"
    @round-data-received="handleRoundDataReceived"
    @player-submitted="handlePlayerSubmitted"
    @game-ended="handleGameEnded"
    ref="baseGame"
  >
    <!-- 개인전용 플레이어 리스트 -->
    <template #player-list="{ closePlayerList, isMobile }">
      <player-list
        :players="gameStore.state.players"
        :current-user-id="gameStore.state.currentUser.id"
        :show-scores="
          gameStore.state.hasSubmittedGuess || gameStore.state.roundEnded
        "
        :round-ended="gameStore.state.roundEnded"
        :player-chat-messages="playerChatMessages"
        :is-mobile="isMobile"
        @close-player-list="closePlayerList"
      />
    </template>
    <!-- 개인전 채팅창 -->
    <template #chat="{ closeChat, isChatOpen }">
      <chat-window
        :messages="gameStore.state.chatMessages"
        :show-mobile-close="isChatOpen"
        @send-message="sendChatMessage"
        @close="closeChat"
      />
    </template>

    <!-- 메인 게임 영역 -->
    <template #main>
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
        :num-players-ready="$refs.baseGame ? $refs.baseGame.numPlayersReadyForNextRound : 0"
        :total-players-in-room="$refs.baseGame ? $refs.baseGame.totalPlayersInRoom : 0"
        :majority-threshold="$refs.baseGame ? $refs.baseGame.majorityThreshold : 0"
        :players-ready-details="[]"
        :is-vote-timer-active="false"
        :vote-time-remaining="15000"
        :current-user-has-voted="false"
        @close="closeRoundResults"
        @request-next-round="requestNextRound"
        @finish-game="finishGame"
      />
    </template>

    <!-- 게임 결과 모달 -->
    <template #results>
      <final-results
        v-if="gameStore.state.showGameResults"
        :players="gameStore.state.players"
        :current-user-id="gameStore.state.currentUser.id"
        :total-rounds="gameStore.state.totalRounds"
        :total-game-time="totalGameTime"
        :room-data="gameStore.state.roomData"
        @play-again="restartGame"
        @exit-to-lobby="exitToLobby"
      />
    </template>
  </BaseMultiRoadViewGame>
</template>

<script>
import BaseMultiRoadViewGame from "./BaseGameView.vue";
import ChatWindow from 'src/features/game/multiplayer/chat/components/Lobby/ChatWindow.vue'

//results
import RoundResults from 'src/features/game/multiplayer/roadview/components/results/RoundResults.vue'
import FinalResults from 'src/features/game/multiplayer/roadview/components/results/FinalResults.vue'


import gameStore from 'src/store/gameStore.js'
import PlayerList from 'src/features/game/multiplayer/roadview/components/playerlist/SoloPlayerList.vue'

export default {
  name: "SoloRoadViewGame",

  components: {
    BaseMultiRoadViewGame,
    ChatWindow,
    RoundResults,
    FinalResults,
    PlayerList,
  },

  data() {
    return {
      gameStore, // 게임 스토어 참조
      // 게임 설정 데이터
      gameMode: "solo",
      roomId: "solo-room-1", // 테스트용 방 ID

      // 개인 게임 특화 데이터
      allPlayersSubmitted: false,
      toastTimeout: null, // 토스트 메시지 타이머
      serverStartTime: 0,
      roundStartDelay: 1000, // 라운드 시작 전 지연 시간(ms)
      simulationTriggered: false, // 시뮬레이션 중복 호출 방지를 위한 플래그

      //현재 유저 랭크
      currentUserRank: 1,
      
      // 게임 시간 추적
      gameStartTime: null,
      totalGameTime: 0,
      
      // 채팅 말풍선 관리
      playerChatMessages: {}, // { playerId: { message: string, timestamp: number, timer: number } }
    };
  },

  created() {
    // 테스트 데이터 로드 및 게임 초기화
    this.gameStore.loadTestData(false);
    this.initGame();
  },

  mounted() {
    // 게임 스토어의 상태 변화 감시
    this.$watch(
      () => this.simulationTriggered,
      () => {
        setTimeout(() => {
          this.simulateOtherPlayersGuesses();
        }, 10); 
      }
    );

    // 더미 모드 여부 확인 (WebSocket 연결 실패 시 또는 테스트 모드)
    const isDummyMode = this.$route.query.test === 'true' || !this.$refs.baseGame?.isWebSocketConnected;
    
    if (isDummyMode) {
      console.log('더미 모드로 게임 시작');
      this.startDummyGameFlow();
    } else {
      // 실제 서버 연결 모드
      console.log('서버 연결 모드로 대기 중');
      this.startRealGameFlow();
    }
  },

  beforeUnmount() {
    // 타이머 정리 (BaseGameView의 타이머)
    this.clearTimer();
    // 토스트 메시지 타이머 정리
    clearTimeout(this.toastTimeout);
    
    // 채팅 말풍선 타이머 정리
    Object.values(this.playerChatMessages).forEach(chatData => {
      if (chatData.timer) {
        clearTimeout(chatData.timer);
      }
    });
    
    // 시뮬레이션 상태 초기화
    this.simulationTriggered = false;
    this.allPlayersSubmitted = false;
    
    console.log('SoloGameView 컴포넌트 정리 완료');
  },

  methods: {
    // IntroOverlay 완료 처리 - 첫 라운드 시작 시에만 호출
    handleEndOverlay() {
      console.log('인트로 오버레이 완료');
      
      // 더미 모드에서 첫 라운드 시뮬레이션 트리거
      const isDummyMode = this.$route.query.test === 'true' || !this.$refs.baseGame?.isWebSocketConnected;
      if (isDummyMode) {
        console.log('더미 모드: 첫 라운드 시뮬레이션 시작');
        this.simulationTriggered = true;
      }
    },

    // 게임 시작 이벤트 처리
    handleGameStarted(message) {
      console.log('개인전 게임 시작 이벤트 처리:', message);
      
      // 게임 시작 시간 기록
      this.gameStartTime = Date.now();
      
      // 서버에서 받은 정보로 게임 설정 업데이트
      if (message.roomId) {
        this.roomId = message.roomId;
      }
      
      if (message.totalRounds) {
        this.gameStore.state.totalRounds = message.totalRounds;
      }
      
      // 게임 시작 시 필요한 초기화
      this.simulationTriggered = false;
      this.allPlayersSubmitted = false;
      
      // 인트로 오버레이 표시 (로드뷰보다 먼저)
      if (this.$refs.baseGame) {
        this.$refs.baseGame.showIntroOverlay = true;
      }
      
      console.log('개인전 게임 준비 완료 - 인트로 오버레이 표시');
    },

    // 라운드 데이터 수신 이벤트 처리
    handleRoundDataReceived(message) {
      console.log('개인전 라운드 데이터 수신:', message);
      
      // 라운드 상태 초기화
      this.simulationTriggered = false;
      this.allPlayersSubmitted = false;
      this.gameStore.state.hasSubmittedGuess = false;
      this.gameStore.state.userGuess = null;
      this.gameStore.state.playerGuesses = [];
      
      // 플레이어 제출 상태 초기화
      this.gameStore.state.players.forEach(player => {
        player.hasSubmitted = false;
      });
      
      // 라운드 타이머는 IntroOverlay 완료 후 시작
      
      // 더미 모드에서는 다른 플레이어 시뮬레이션 트리거
      const isDummyMode = this.$route.query.test === 'true' || !this.$refs.baseGame?.isWebSocketConnected;
      if (isDummyMode) {
        console.log('더미 모드: 다른 플레이어 시뮬레이션 트리거');
        // 시뮬레이션 트리거를 확실히 설정
        this.simulationTriggered = true;
        console.log('시뮬레이션 트리거 설정됨:', this.simulationTriggered);
      }
      
      console.log(`라운드 ${this.gameStore.state.currentRound} 데이터 준비 완료`);
    },

    // 플레이어 제출 이벤트 처리
    handlePlayerSubmitted(message) {
      console.log('플레이어 제출 이벤트 처리:', message);
      
      // 모든 플레이어가 제출했는지 확인
      this.checkAllPlayersSubmitted();
      
      const submittedCount = this.gameStore.state.playerGuesses.length;
      console.log(`현재 제출 완료: ${submittedCount}/${this.gameStore.state.players.length}`);
    },

    // 게임 종료 이벤트 처리
    handleGameEnded(message) {
      console.log('개인전 게임 종료 이벤트 처리:', message);
      
      // 총 게임 시간 계산
      if (this.gameStartTime) {
        this.totalGameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
      }
      
      // 타이머 정리
      this.clearTimer();
      
      // 플레이어들의 평균 거리 계산
      this.calculatePlayerAverageDistances();
      
      // 최종 결과 표시
      this.gameStore.state.showGameResults = true;
      
      console.log('개인전 게임 완전 종료, 총 게임 시간:', this.totalGameTime, '초');
    },

    // 다음 라운드 요청 처리 - NextRoundOverlay 표시 후 진행
    requestNextRound() {
      console.log(`라운드 ${this.gameStore.state.currentRound} 종료 - 다음 라운드 요청`);
      
      // 현재 사용자 등수 계산
      this.currentUserRank = this.calculateUserRank();
      const totalPlayers = this.gameStore.state.players.length;
      
      // BaseGameView의 startNextRound 메서드 호출하여 NextRoundOverlay 표시
      if (this.$refs.baseGame) {
        this.$refs.baseGame.startNextRound(this.currentUserRank, totalPlayers);
      }
    },
  
    // 이벤트 핸들러 메서드
    handleRoundEnded() {
      console.log("라운드가 종료되었습니다.");
      // 라운드 종료 처리 로직
      this.clearTimer();
    },

    // 타이머 정리 메서드 (BaseGameView의 타이머 정리)
    clearTimer() {
      if (this.$refs.baseGame) {
        this.$refs.baseGame.clearRoundTimer();
      }
    },

    // 라운드 종료 메서드
    endRound() {
      // 이미 라운드가 종료되었으면 중복 실행 방지
      if (this.gameStore.state.roundEnded) {
        console.log("라운드가 이미 종료되어 중복 실행 방지");
        return;
      }
      
      console.log("라운드 종료!");
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
        // this.startRoundTimer();
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

      // 이미 제출했거나 라운드가 종료된 경우 무시
      if (this.gameStore.state.hasSubmittedGuess || this.gameStore.state.roundEnded) {
        console.warn('이미 제출했거나 라운드가 종료되어 제출할 수 없습니다.');
        return;
      }

      // 현재 플레이어의 추측 저장
      const currentPlayer = this.gameStore.state.currentUser;

      // 게임 스토어 상태 업데이트
      this.gameStore.state.userGuess = { position: position };
      this.gameStore.state.hasSubmittedGuess = true;

      // 현재 플레이어의 제출 상태 업데이트
      const playerIndex = this.gameStore.state.players.findIndex(
        (p) => p.id === currentPlayer.id
      );
      if (playerIndex !== -1) {
        this.gameStore.state.players[playerIndex].hasSubmitted = true;
      }

      // 현재 사용자의 추측을 playerGuesses에 추가
      if (!this.gameStore.state.playerGuesses) {
        this.gameStore.state.playerGuesses = [];
      }

      const guessInfo = {
        playerId: currentPlayer.id,
        playerName: currentPlayer.nickname,
        position: position,
        color: this.getRandomColor(currentPlayer.id),
      };

      this.gameStore.state.playerGuesses.push(guessInfo);

      // BaseGameView를 통해 서버에 제출 정보 전송
      if (this.$refs.baseGame) {
        this.$refs.baseGame.sendGuessToServer({
        position: position,
          playerId: currentPlayer.id
        });
      }

      console.log(`플레이어 ${currentPlayer.nickname} 제출 완료`);

      // 더미 모드에서만 모든 플레이어 제출 확인
      if (!this.$refs.baseGame?.isWebSocketConnected) {
      this.checkAllPlayersSubmitted();
      }
    },

    sendChatMessage(message) {
      if (!message.trim()) return;
      
      // 현재 사용자의 채팅 말풍선 표시
      this.showPlayerChatBubble(this.gameStore.state.currentUser.id, message);
      
      // BaseGameView를 통해 서버에 채팅 메시지 전송
      if (this.$refs.baseGame) {
        this.$refs.baseGame.sendChatMessageToServer(message);
      } else {
        // 더미 모드에서는 로컬에만 추가
        this.gameStore.addChatMessage(message, this.gameStore.state.currentUser.nickname);
      }
    },

    closeRoundResults() {
      this.gameStore.closeRoundResults();
    },
    
    // 플레이어 채팅 말풍선 표시
    showPlayerChatBubble(playerId, message) {
      // 이전 타이머가 있으면 제거
      if (this.playerChatMessages[playerId]?.timer) {
        clearTimeout(this.playerChatMessages[playerId].timer);
      }
      
      // 새 메시지 설정
      this.playerChatMessages[playerId] = {
        message: message.slice(0, 20) + (message.length > 20 ? '...' : ''), // 20자로 제한
        timestamp: Date.now()
      };
      
      // 3초 후 자동 제거
      this.playerChatMessages[playerId].timer = setTimeout(() => {
        delete this.playerChatMessages[playerId];
      }, 3000);
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
      console.log('서버로 추측 정보 전송:', guessData);
    },

    // 모든 플레이어가 제출했는지 확인하고 라운드 종료 처리
    checkAllPlayersSubmitted() {
      // 이미 라운드가 종료된 경우 중복 실행 방지
      if (this.gameStore.state.roundEnded || this.allPlayersSubmitted) {
        console.log("라운드가 이미 종료되었거나 모든 플레이어 제출 완료");
        return;
      }

      const totalPlayers = this.gameStore.state.players.length;
      const submittedPlayers = this.gameStore.state.playerGuesses.length;

      console.log(`제출 현황: ${submittedPlayers}/${totalPlayers}`);
      
      // 현재 사용자가 제출했는지 확인
      if (!this.gameStore.state.hasSubmittedGuess) {
        console.log("현재 사용자가 아직 제출하지 않음");
        return;
      }

      // 모든 플레이어가 제출했는지 확인
      if (submittedPlayers >= totalPlayers) {
        this.allPlayersSubmitted = true;
        console.log("모든 플레이어가 제출 완료 - 라운드 종료 처리 시작");
        
        // 더미 모드에서 라운드 종료 시뮬레이션
        setTimeout(() => {
          this.simulateRoundEnd();
        }, 1000);
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

    // 플레이어별 평균 거리 계산
    calculatePlayerAverageDistances() {
      this.gameStore.state.players.forEach(player => {
        // 플레이어의 모든 라운드 거리 합산
        let totalDistance = 0;
        let roundCount = 0;
        
        // 예시: 플레이어가 기록한 거리들 (실제로는 각 라운드별로 저장된 데이터를 사용)
        if (player.roundDistances && Array.isArray(player.roundDistances)) {
          totalDistance = player.roundDistances.reduce((sum, distance) => sum + distance, 0);
          roundCount = player.roundDistances.length;
        } else if (player.distanceToTarget !== undefined) {
          // 마지막 라운드 거리만 있는 경우
          totalDistance = player.distanceToTarget;
          roundCount = 1;
        }
        
        // 평균 거리 계산
        player.averageDistance = roundCount > 0 ? totalDistance / roundCount : 0;
      });
    },

    // 실제 서버 연결 모드 게임 플로우 시작
    startRealGameFlow() {
      console.log('실제 서버 연결 모드 게임 플로우 시작');
      
      // 게임 시작 시간 기록
      this.gameStartTime = Date.now();
      
      // 서버 연결 상태 확인
      if (this.$refs.baseGame?.isWebSocketConnected) {
        console.log('WebSocket 연결됨 - 서버와 통신 준비');
        // 서버에서 게임 시작 신호를 기다림
      } else {
        console.log('WebSocket 연결 실패 - 더미 모드로 전환');
        this.startDummyGameFlow();
      }
    },

    // 더미 모드 게임 플로우 시작
    startDummyGameFlow() {
      console.log('더미 모드 게임 플로우 시작');
      
      // 게임 시작 시간 기록
      this.gameStartTime = Date.now();
      
      // 3초 후 게임 시작 신호 시뮬레이션
      setTimeout(() => {
        this.simulateGameStart();
      }, 3000);
    },

    // 더미 게임 시작 시뮬레이션
    simulateGameStart() {
      console.log('더미 게임 시작 시뮬레이션');
      
      // 게임 시작 메시지 시뮬레이션
      const gameStartMessage = {
        roomId: this.roomId,
        totalRounds: this.gameStore.state.totalRounds,
        serverStartTime: Date.now()
      };
      
      // BaseGameView의 게임 시작 핸들러 호출
      if (this.$refs.baseGame) {
        this.$refs.baseGame.handleGameStart(gameStartMessage);
      }
      
      // 1초 후 첫 라운드 데이터 시뮬레이션
      setTimeout(() => {
        this.simulateRoundData();
      }, 1000);
    },

    // 더미 라운드 데이터 시뮬레이션
    simulateRoundData() {
      console.log(`더미 라운드 ${this.gameStore.state.currentRound} 데이터 시뮬레이션`);
      
      // 라운드 데이터 메시지 시뮬레이션
      const roundDataMessage = {
        roundNumber: this.gameStore.state.currentRound,
        location: this.gameStore.state.currentLocation || {
          lat: 37.5665 + (Math.random() - 0.5) * 0.1,
          lng: 126.978 + (Math.random() - 0.5) * 0.1
        },
        locationInfo: this.gameStore.state.locationInfo,
        roundTime: 120
      };
      
      // BaseGameView의 라운드 데이터 핸들러 호출
      if (this.$refs.baseGame) {
        this.$refs.baseGame.handleRoundData(roundDataMessage);
      }
      
      // 라운드 데이터 가져오기 (타이머는 BaseGameView에서 시작됨)
      this.fetchRoundData();
      
      // 더미 모드에서 시뮬레이션 트리거 설정
      console.log('더미 모드: 시뮬레이션 트리거 설정');
      this.simulationTriggered = true;
    },

    // 더미 라운드 종료 시뮬레이션 (모든 플레이어 제출 완료 시 호출)
    simulateRoundEnd() {
      // 이미 라운드가 종료되었으면 중복 실행 방지
      if (this.gameStore.state.roundEnded) {
        console.log("더미 모드: 라운드가 이미 종료되어 시뮬레이션 중단");
        return;
      }
      
      console.log(`더미 라운드 ${this.gameStore.state.currentRound} 종료 시뮬레이션`);
      
      // 일반 라운드 종료 로직 호출
      this.endRound();
      
      // 라운드 종료 메시지 시뮬레이션
      const roundEndMessage = {
        results: {
          playerResults: this.gameStore.state.players.map(player => ({
            playerId: player.id,
            totalScore: player.score || 0,
            roundScore: player.lastRoundScore || 0,
            distance: player.distanceToTarget || 0
          })),
          allGuesses: this.gameStore.state.playerGuesses,
          topPlayer: this.gameStore.state.topPlayer
        }
      };
      
      // BaseGameView의 라운드 종료 핸들러 호출
      if (this.$refs.baseGame) {
        this.$refs.baseGame.handleRoundEnd(roundEndMessage);
      }
      
      // 마지막 라운드인지 확인하여 다음 라운드 또는 게임 종료 처리
      if (this.gameStore.state.currentRound >= this.gameStore.state.totalRounds) {
        console.log("마지막 라운드 완료 - 게임 종료 처리");
        setTimeout(() => {
          this.simulateGameEnd();
        }, 2000);
      } else {
        console.log("다음 라운드로 진행 - RoundResults 자동 카운트다운 대기");
        // RoundResults의 10초 자동 카운트다운이 requestNextRound를 호출하도록 함
      }
    },

    // 더미 게임 종료 시뮬레이션
    simulateGameEnd() {
      console.log('더미 게임 종료 시뮬레이션');
      
      // 게임 종료 메시지 시뮬레이션
      const gameEndMessage = {
        finalResults: {
          rankings: this.gameStore.state.players.sort((a, b) => (b.score || 0) - (a.score || 0))
        }
      };
      
      // BaseGameView의 게임 종료 핸들러 호출
      if (this.$refs.baseGame) {
        this.$refs.baseGame.handleGameEnd(gameEndMessage);
      }
    },

    finishGame() {
      console.log('게임 완료 처리 시작');
      
      // 총 게임 시간 계산
      if (this.gameStartTime) {
        this.totalGameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
      }
      
      // 플레이어들의 평균 거리 계산
      this.calculatePlayerAverageDistances();
      
      // 게임 스토어의 게임 종료 처리
      this.gameStore.finishGame();
      
      console.log('게임 완료, 최종 결과 표시');
    },

    restartGame() {
      this.gameStore.state.showGameResults = false;
      this.initGame();
      this.simulateOtherPlayersGuesses();
    },

    exitToLobby() {
      this.$router.push("/lobby");
    },
  
    // NextRoundOverlay 완료 후 다음 라운드 시작 처리
    handleNextRoundReady() {
      console.log(`다음 라운드 준비 완료 - 라운드 ${this.gameStore.state.currentRound + 1} 시작`);
      
      // 라운드 상태 완전 초기화
      this.gameStore.state.roundEnded = false;
      this.gameStore.state.hasSubmittedGuess = false;
      this.gameStore.state.userGuess = null;
      this.gameStore.state.playerGuesses = [];
      this.gameStore.state.showRoundResults = false;
      
      // 시뮬레이션 상태 초기화
      this.simulationTriggered = false;
      this.allPlayersSubmitted = false;
      
      // 플레이어 제출 상태 초기화
      this.gameStore.state.players.forEach(player => {
        player.hasSubmitted = false;
        player.distanceToTarget = null;
        player.lastRoundScore = 0;
      });
      
      // 다음 라운드로 진행
      this.gameStore.startNextRound();
      
      // 더미 모드에서 다음 라운드 데이터 시뮬레이션
      const isDummyMode = this.$route.query.test === 'true' || !this.$refs.baseGame?.isWebSocketConnected;
      if (isDummyMode) {
        setTimeout(() => {
          this.simulateRoundData();
        }, 1000);
      }
    },
    
    // 사용자의 현재 등수 계산
    calculateUserRank() {
      if (!this.gameStore.state.players || this.gameStore.state.players.length === 0) {
        return 1;
      }
      
      // 점수 기준으로 정렬된 플레이어 배열 생성
      const sortedPlayers = [...this.gameStore.state.players].sort((a, b) => b.score - a.score);
      
      // 현재 사용자의 인덱스 찾기
      const currentUserIndex = sortedPlayers.findIndex(player => player.id === this.gameStore.state.currentUser.id);
      
      // 인덱스 + 1이 등수
      return currentUserIndex !== -1 ? currentUserIndex + 1 : 1;
    },

    // 더미 데이터로 다른 플레이어들의 정답 제출 시뮬레이션
    simulateOtherPlayersGuesses() {
      console.log("다른 플레이어 추측 시뮬레이션 시작");

      // 라운드가 이미 끝났거나 제출이 완료된 경우 중단
      if (
        this.gameStore.state.roundEnded ||
        this.allPlayersSubmitted
      ) {
        console.log("시뮬레이션 중단: 라운드 종료됨 또는 모든 플레이어 제출 완료");
        return;
      }

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

      // 자기 자신의 추측은 이미 handleGuessSubmission에서 추가됨

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

          console.log(
            "현재 추측 수:",
            this.gameStore.state.playerGuesses.length
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