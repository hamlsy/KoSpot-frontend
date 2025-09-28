<template>
  <div class="multiplayer-roadview-game">
    <!-- 게임 헤더 -->
    <div class="game-header row">
      <div class="header-left col-md-4">
        <div class="room-info">
          <div class="room-name">{{ roomData?.name || "방 이름 없음" }}</div>
          <div class="game-mode">{{ gameMode === "team" ? "팀전" : "개인전" }}</div>
        </div>
      </div>

      <div class="header-center col-md-4">
        <div class="round-info">
          <span class="round-number">
            라운드 {{ gameStore.state.currentRound }}/{{
              gameStore.state.totalRounds
            }}
          </span>
          <div class="round-progress">
            <div
              class="progress-bar"
              :style="{
                width: `${
                  (gameStore.state.currentRound / gameStore.state.totalRounds) *
                  100
                }%`,
              }"
            ></div>
          </div>
        </div>
      </div>

      <div class="header-right col-md-4">
        <!-- 플레이어 리스트 토글 버튼 (항상 표시) -->
        <button 
          class="player-list-toggle-btn"
          @click="togglePlayerList"
          :class="{ 'active': isPlayerListOpen }"
          :title="isPlayerListOpen ? '플레이어 목록 닫기' : '플레이어 목록 열기'"
        >
          <i class="fas fa-users"></i>
          <span class="toggle-text">{{ isPlayerListOpen ? '목록 닫기' : '플레이어' }}</span>
        </button>
        
        <game-timer
          :initialTime="gameStore.state.remainingTime"
          :totalTime="120"
          :warning-threshold="30"
          :danger-threshold="10"
          :is-running="!showIntroOverlay && !showNextRoundOverlay"
        />
      </div>
    </div>

    <!-- 게임 메인 영역 -->
    <div class="game-content">
      <!-- 왼쪽 패널: 플레이어 목록 (토글 가능) -->
      <div class="left-panel" :class="{ 
        'hidden': !isPlayerListOpen,
        'mobile-open': isMobile && isPlayerListOpen 
      }">
        <slot name="player-list" :close-player-list="closePlayerList" :is-mobile="isMobile"> </slot>
      </div>

      <!-- 중앙 패널: 게임 화면 -->
      <div class="main-panel">
        <div class="game-view">
          <!-- 멀티플레이어 인트로 오버레이 -->
          <multiplayer-intro-overlay
            v-if="showIntroOverlay && !showNextRoundOverlay"
            :current-round="gameStore.state.currentRound"
            :show-intro="showIntroOverlay"
            :room-id="roomId"
            :server-start-time="$parent.serverStartTime || 0"
            @intro-complete="handleIntroComplete"
          />
          <!-- 다음 라운드 오버레이 -->
          <multiplay-next-round-overlay
            v-if="showNextRoundOverlay"
            :current-round="gameStore.state.currentRound"
            :show-intro="showNextRoundOverlay"
            :user-rank="userRank"
            :total-players="totalPlayers"
            :room-id="roomId"
            :server-start-time="$parent ? $parent.serverStartTime : 0"
            @intro-complete="handleNextRoundComplete"
          />

          <!-- 메인 게임 영역 (로드뷰 또는 결과 컴포넌트) -->
          <slot name="main">
            <road-view
              v-if="
                !gameStore.state.roundEnded && 
                gameStore.state.currentLocation &&
                !showIntroOverlay &&
                !showNextRoundOverlay
              "
              :position="
                gameStore.state.currentLocation || {
                  lat: 37.5665,
                  lng: 126.978,
                }
              "
              :show-controls="true"
              :prevent-mouse-events="gameStore.state.hasSubmittedGuess"
              @load-complete="onViewLoaded"
            />
            <div
              v-else-if="!gameStore.state.roundEnded && !showIntroOverlay && !showNextRoundOverlay"
              class="loading-container"
            >
              <p>로드뷰를 불러오는 중입니다...</p>
            </div>
          </slot>

          <!-- 지도 버튼 -->
          <!-- 채팅 토글 버튼 (모바일) -->
          <button class="chat-toggle" @click="toggleChat">
            <i class="fas" :class="isChatOpen ? 'fa-times' : 'fa-comments'"></i>
            {{ isChatOpen ? "채팅 닫기" : "채팅 열기" }}
          </button>

          <button
            class="map-toggle"
            @click="toggleMap"
            v-if="!gameStore.state.roundEnded"
          >
            <i class="fas fa-map-marked-alt"></i>
            지도
          </button>
        </div>
      </div>

      <!-- 오른쪽 패널: 채팅 -->
      <div class="right-panel" :class="{ 'chat-open': isChatOpen }">
        <slot name="chat" :close-chat="closeChat" :is-chat-open="isChatOpen"></slot>
      </div>

      <!-- 결과 모달 -->
      <slot name="results" @request-next-round="handleRequestNextRound"></slot>
    </div>

    <!-- 휴대폰 프레임 -->
    <PhoneFrame
      :style="{ zIndex: isMapOpen && !gameStore.state.roundEnded ? 15 : -1 }"
      :centerLocation="mapCenter || { lat: 37.5665, lng: 126.978 }"
      :actualLocation="
        gameStore.state.actualLocation || { lat: 37.5665, lng: 126.978 }
      "
      :showHintCircles="false"
      :disabled="gameStore.state.roundEnded"
      :showDistance="false"
      :showMarker="true"
      :isTeamMode="false"
      :gameMode="'solo'"
      @spot-answer="handlePhoneMapGuess"
    />

    <!-- 토스트 메시지 -->
    <div class="toast-message" :class="{ show: showToastFlag }">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script>
import GameTimer from "@/features/game/shared/components/Common/Timer.vue";
import RoadView from 'src/features/game/shared/components/roadview/RoadView.vue'
import PhoneFrame from 'src/features/game/shared/components/Phone/PhoneFrame.vue'
import MultiplayerIntroOverlay from "@/features/game/multiplayer/shared/components/intro/IntroOverlay.vue";
import MultiplayNextRoundOverlay from "@/features/game/multiplayer/shared/components/intro/NextRoundOverlay.vue";
import gameStore from "@/store/gameStore";
import webSocketManager from "@/features/game/multiplayer/shared/services/websocket/composables/index.js";
import { useRoomWebSocket } from "@/features/game/multiplayer/room/composables/useRoomWebSocket.js";

const NEXT_ROUND_VOTE_TIME_LIMIT_MS = 15000;

export default {
  name: "BaseMultiRoadViewGame",

  components: {
    GameTimer,
    RoadView,
    PhoneFrame,
    MultiplayerIntroOverlay,
    MultiplayNextRoundOverlay,
  },

  props: {
    roomId: {
      type: String,
      required: true,
      default: "room1",
    },
    // 게임 모드에 따라 필요한 추가 props
    gameMode: {
      type: String,
      default: "solo",
      validator: (value) => ["solo", "team"].includes(value),
    },
    currentUserRank: {
      type: Number,
      default: 1,
    },
    isTeamMode: {
      type: Boolean,
      default: false
    }
  },

  provide() {
    return {
      roomId: this.roomId,
      isTeamMode: this.isTeamMode,
      gameMode: this.gameMode,
      gameStore: this.gameStore,
      toggleMap: this.toggleMap,
      handlePhoneMapGuess: this.handlePhoneMapGuess,
      formatCoords: this.formatCoords,
      calculateDistance: this.calculateDistance,
      // 자식 컴포넌트에서 사용할 수 있는 메서드들
      getRandomColor: this.getRandomColor,
    };
  },

  inject: {
    $super: {
      default: () => ({}),
    },
  },

  data() {
    return {
      //room
      roomData: null,
      gameStore,
      isMapOpen: false,
      mapCenter: null,
      isChatOpen: false,
      isResponsiveMode: false,
      showToastFlag: false,
      // UI 상태 관리
      isPlayerListOpen: true, // 플레이어 리스트 표시 여부 (기본값: 열림)
      isMobile: false, // 모바일 화면 여부 (768px 이하)
      // Next Round Voting State
      playersReadyForNextRound: new Set(),
      nextRoundVoteTimerId: null,
      isNextRoundVoteActive: false,
      nextRoundVoteRemainingTime: NEXT_ROUND_VOTE_TIME_LIMIT_MS,
      toastMessage: "",
      toastTimeout: null,
      // WebSocket 관련 상태
      socketConnected: false,
      gameSubscriptions: new Map(),
      userGuessPosition: null,
      userHasSubmitted: false,
      showIntroOverlay: false,
      showNextRoundOverlay: false,
      userRank: 1,
      totalPlayers: 1,
      // 게임 진행 상태 
      isGameStarted: false,
      serverStartTime: 0,
      // 라운드 타이머
      roundTimer: null
    };
  },

  computed: {
    totalPlayersInRoom() {
      return this.gameStore.state.players?.length || 0;
    },
    majorityThreshold() {
      if (this.totalPlayersInRoom === 0) return 1; // Avoid division by zero, default to 1 if no players
      return Math.ceil(this.totalPlayersInRoom / 2);
    },
    numPlayersReadyForNextRound() {
      return this.playersReadyForNextRound.size;
    },
    didCurrentUserVoteForNextRound() {
      return this.playersReadyForNextRound.has(this.gameStore.state.currentUser?.id);
    },
    nextRoundVoteStatusText() {
      if (!this.isNextRoundVoteActive) return "";
      return `${this.numPlayersReadyForNextRound} / ${this.totalPlayersInRoom}`;
    },
    // WebSocket 연결 상태
    isWebSocketConnected() {
      return webSocketManager.isConnected.value;
    },
    canSubmit() {
      return (
        !this.gameStore.state.hasSubmittedGuess &&
        !this.gameStore.state.roundEnded
      );
    },
  },

  created() {
    // 게임 중에도 WebSocket 연결 상태 확인 및 구독 설정
    this.initializeWebSocketConnection();
  },

  mounted() {
    // 로딩 화면 제거
    // 토스트 메시지 스타일 추가
    this.addToastStyles();
    this.checkResponsive();
    window.addEventListener("resize", this.checkResponsive);
  },

  beforeUnmount() {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    window.removeEventListener("resize", this.checkResponsive);
    this.disconnectWebSocket();
    // 라운드 타이머 정리
    this.clearRoundTimer();
  },
  methods: {
    // 인트로 완료 처리
    handleIntroComplete() {
      this.showIntroOverlay = false;
      this.handleEndOverlay();
    },

    // 다음 라운드 인트로 완료 처리
    handleNextRoundComplete() {
      this.showNextRoundOverlay = false;
      this.handleEndOverlay();
      this.$emit("next-round-ready");
    },

    handleEndOverlay() {
      this.$emit("end-overlay");
    },

    // 다음 라운드 요청 처리 (슬롯에서 전달된 이벤트)
    handleRequestNextRound() {
      console.log("BaseMultiRoadViewGame: 다음 라운드 요청 받음");
      // 부모 컴포넌트로 이벤트 전달
      this.$emit("request-next-round");
    },

    // 슬롯에서 발생하는 next-round 이벤트 처리
    handleNextRound() {
      console.log("BaseMultiRoadViewGame: 다음 라운드 처리");
      // 이벤트 발생
      this.$emit("next-round");
      
      // 다음 라운드 투표 타이머 취소
      if (this.nextRoundVoteTimerId) {
        clearInterval(this.nextRoundVoteTimerId);
        this.nextRoundVoteTimerId = null;
      }
      
      // 투표 상태 초기화
      this.isNextRoundVoteActive = false;
      this.playersReadyForNextRound.clear();
      
      // 게임 스토어의 다음 라운드 시작 메서드 호출
      this.gameStore.startNextRound();
      
      // 라운드 데이터 처리는 각 게임 뷰에서 담당
    },

    // 다음 라운드 시작
    startNextRound(userRank, totalPlayers) {
      this.userRank = userRank;
      this.totalPlayers = totalPlayers;
      this.$nextTick(() => {
        setTimeout(() => {
          this.showNextRoundOverlay = true;
          // 라운드 데이터 처리는 각 게임 뷰에서 담당
        }, 500);
      });
    },

    // 라운드 타이머 시작
    startRoundTimer() {
      console.log('라운드 타이머 시작');
      
      // 기존 타이머가 있다면 정리
      this.clearRoundTimer();
      
      // 타이머 시작
      this.roundTimer = setInterval(() => {
        if (this.gameStore.state.remainingTime > 0) {
          this.gameStore.state.remainingTime--;
        } else {
          this.clearRoundTimer();
          // 시간 초과 시 라운드 종료
          this.$emit('round-timeout');
        }
      }, 1000);
    },

    // 라운드 타이머 정리
    clearRoundTimer() {
      if (this.roundTimer) {
        clearInterval(this.roundTimer);
        this.roundTimer = null;
      }
    },

    // 사용자의 현재 등수 가져오기
    getUserRank() {
      if (
        !this.gameStore.state.players ||
        this.gameStore.state.players.length === 0
      ) {
        return 1;
      }

      // 점수 기준으로 정렬된 플레이어 배열 생성
      const sortedPlayers = [...this.gameStore.state.players].sort(
        (a, b) => b.score - a.score
      );

      // 현재 사용자의 인덱스 찾기
      const currentUserIndex = sortedPlayers.findIndex(
        (player) => player.id === this.gameStore.state.currentUser.id
      );

      // 인덱스 + 1이 등수
      return currentUserIndex !== -1 ? currentUserIndex + 1 : 1;
    },
    // 반응형 상태 확인 및 설정
    checkResponsive() {
      const isMobile = window.innerWidth <= 992;
      this.isMobile = window.innerWidth <= 768;
      this.isResponsiveMode = isMobile;
      
      // 채팅 패널 표시/숨김 처리
      const rightPanel = document.querySelector(".right-panel");
      if (rightPanel) {
        if (!isMobile) {
          rightPanel.style.display = "block";
        } else if (!this.isChatOpen) {
          rightPanel.style.display = "none";
        }
      }
    },

    // 플레이어 리스트 토글
    togglePlayerList() {
      this.isPlayerListOpen = !this.isPlayerListOpen;
    },

    // 플레이어 리스트 닫기 (모바일 전용)
    closePlayerList() {
      this.isPlayerListOpen = false;
    },

    // 채팅 패널 토글 (모바일에서만 사용)
    toggleChat() {
      this.isChatOpen = !this.isChatOpen;
    },

    // 채팅 패널 닫기
    closeChat() {
      this.isChatOpen = false;
    },

    // 로드뷰 로딩 완료 처리
    onViewLoaded() {
      console.log("로드뷰 로딩 완료");
    },

    // 추측 위치 설정
    onGuessPlaced(position) {
      this.guessPosition = position;
    },

    // 좌표를 문자열로 포맷팅 (소수점 4자리까지)
    formatCoords(position) {
      if (!position) return "";

      const lat = position.lat.toFixed(4);
      const lng = position.lng.toFixed(4);
      return `${lat}, ${lng}`;
    },

    toggleMap() {
      // 라운드가 끝났을 때는 결과 지도 표시/숨김 토글
      if (this.gameStore.state.roundEnded) {
      
        this.showResultMap = !this.showResultMap;
        this.initiateNextRoundVoting(); // Start voting when round results are shown
      } else {
        this.isMapOpen = !this.isMapOpen;
      }
    },

    initiateNextRoundVoting() {
      this.isNextRoundVoteActive = true;
      this.playersReadyForNextRound.clear();
      this.nextRoundVoteRemainingTime = NEXT_ROUND_VOTE_TIME_LIMIT_MS;
      this.nextRoundVoteTimerId = setInterval(() => {
        this.nextRoundVoteRemainingTime -= 1000;
        if (this.nextRoundVoteRemainingTime <= 0) {
          clearInterval(this.nextRoundVoteTimerId);
          this.isNextRoundVoteActive = false;
          
          // 다음 라운드 시작 메서드 호출
          this.gameStore.startNextRound();
          
          // 다음 라운드 데이터 가져오기
          this.fetchRoundData();
          
          console.log("타이머 종료로 다음 라운드 시작", this.gameStore.state.currentRound);
        }
      }, 1000);
    },

    // ...
    handlePhoneMapGuess(position) {
      if (
        this.gameStore.state.hasSubmittedGuess ||
        this.gameStore.state.roundEnded
      )
        return;

      // 선택한 위치 설정
      this.guessPosition = position;

      // 지도 닫기
      this.isMapOpen = false;

      // 게임 모드별 추측 제출 처리
      this.handleGuessSubmission(position);
    },

    // 게임 모드별로 구현해야 하는 메서드 (추상)
    handleGuessSubmission(position) {
      // 이벤트 발생
      this.$emit("guess-submitted", position);
    },

    // WebSocket 초기화 및 연결
    initializeWebSocketConnection() {
      console.log('게임 WebSocket 연결 초기화 시작');
      
      // WebSocket이 이미 연결되어 있다면 게임 구독만 설정
      if (this.isWebSocketConnected) {
        this.setupGameSubscriptions();
        console.log('WebSocket이 이미 연결됨. 게임 구독 설정 완료');
        return;
      }
      
      // WebSocket 연결 시도
      webSocketManager.connect('/ws', () => {
        // core.js에서 실제 연결 실패 시에도 콜백은 호출될 수 있으므로, isConnected를 신뢰
        if (webSocketManager.isConnected && webSocketManager.isConnected.value) {
          console.log('게임 WebSocket 연결 성공');
          this.socketConnected = true;
          this.setupGameSubscriptions();
        } else {
          console.warn('WebSocket 연결 실패로 더미 모드로 진행합니다.');
          this.socketConnected = false;
          // 더미 모드에서는 즉시 게임 시작 흐름을 트리거하지 않음. 상위 뷰에서 처리
        }
      });
    },

    // 게임 관련 WebSocket 구독 설정
    setupGameSubscriptions() {
      if (!this.roomId) {
        console.warn('방 ID가 없어 게임 구독을 설정할 수 없습니다.');
        return;
      }

      console.log(`방 ${this.roomId}의 게임 구독 설정 시작`);

      // 게임 시작 신호 구독
      this.subscribeToGameStart();
      
      // 라운드 데이터 구독  
      this.subscribeToRoundData();
      
      // 플레이어 제출 상태 구독
      this.subscribeToPlayerSubmissions();
      
      // 라운드 종료 구독
      this.subscribeToRoundEnd();
      
      // 게임 종료 구독
      this.subscribeToGameEnd();
      
      // 서버 시간 동기화 구독
      this.subscribeToServerTime();

      console.log('모든 게임 구독 설정 완료');
    },

    // 게임 시작 신호 구독
    subscribeToGameStart() {
      const topic = `/topic/room/${this.roomId}/game/start`;
      const subscriptionId = webSocketManager.subscribe(topic, (message) => {
        console.log('게임 시작 신호 수신:', message);
        this.handleGameStart(message);
      });
      this.gameSubscriptions.set('gameStart', subscriptionId);
    },

    // 라운드 데이터 구독
    subscribeToRoundData() {
      const topic = `/topic/room/${this.roomId}/game/round/data`;
      const subscriptionId = webSocketManager.subscribe(topic, (message) => {
        console.log('라운드 데이터 수신:', message);
        this.handleRoundData(message);
      });
      this.gameSubscriptions.set('roundData', subscriptionId);
    },

    // 플레이어 제출 상태 구독
    subscribeToPlayerSubmissions() {
      const topic = `/topic/room/${this.roomId}/game/submissions`;
      const subscriptionId = webSocketManager.subscribe(topic, (message) => {
        console.log('플레이어 제출 상태 수신:', message);
        this.handlePlayerSubmission(message);
      });
      this.gameSubscriptions.set('submissions', subscriptionId);
    },

    // 라운드 종료 구독
    subscribeToRoundEnd() {
      const topic = `/topic/room/${this.roomId}/game/round/end`;
      const subscriptionId = webSocketManager.subscribe(topic, (message) => {
        console.log('라운드 종료 신호 수신:', message);
        this.handleRoundEnd(message);
      });
      this.gameSubscriptions.set('roundEnd', subscriptionId);
    },

    // 게임 종료 구독
    subscribeToGameEnd() {
      const topic = `/topic/room/${this.roomId}/game/end`;
      const subscriptionId = webSocketManager.subscribe(topic, (message) => {
        console.log('게임 종료 신호 수신:', message);
        this.handleGameEnd(message);
      });
      this.gameSubscriptions.set('gameEnd', subscriptionId);
    },

    // 서버 시간 동기화 구독
    subscribeToServerTime() {
      const topic = `/topic/room/${this.roomId}/game/time`;
      const subscriptionId = webSocketManager.subscribe(topic, (message) => {
        console.log('서버 시간 수신:', message);
        this.handleServerTime(message);
      });
      this.gameSubscriptions.set('serverTime', subscriptionId);
    },

    // WebSocket 구독 해제
    disconnectWebSocket() {
      console.log('게임 WebSocket 구독 해제 시작');
      
      // 모든 게임 구독 해제
      this.gameSubscriptions.forEach((subscriptionId, topic) => {
        webSocketManager.unsubscribe(subscriptionId);
        console.log(`구독 해제: ${topic}`);
      });
      
      this.gameSubscriptions.clear();
      this.socketConnected = false;
      
      console.log('게임 WebSocket 구독 해제 완료');
    },

    // 게임 시작 처리
    handleGameStart(message) {
      console.log('게임 시작 처리:', message);
      
      // 서버에서 받은 게임 시작 정보 처리
      if (message.serverStartTime) {
        this.serverStartTime = message.serverStartTime;
      }
      
      if (message.totalRounds) {
        this.gameStore.state.totalRounds = message.totalRounds;
      }
      
      // 게임 시작 상태로 변경
      this.isGameStarted = true;
      this.gameStore.state.currentRound = 1;
      
      // IntroOverlay 표시
      this.showIntroOverlay = true;
      
      // 부모 컴포넌트에 게임 시작 이벤트 전달
      this.$emit('game-started', message);
    },

    // 라운드 데이터 처리
    handleRoundData(message) {
      console.log('라운드 데이터 처리:', message);
      
      // 라운드 정보 업데이트
      if (message.roundNumber) {
        this.gameStore.state.currentRound = message.roundNumber;
      }
      
      // 위치 정보 업데이트
      if (message.location) {
        this.gameStore.state.currentLocation = message.location;
        this.gameStore.state.actualLocation = message.location; // 정답 좌표
      }
      
      // 위치 상세 정보 업데이트
      if (message.locationInfo) {
        this.gameStore.state.locationInfo = message.locationInfo;
      }
      
      // 라운드 시간 설정
      if (message.roundTime) {
        this.gameStore.state.remainingTime = message.roundTime;
      }
      
      // 라운드 상태 초기화
      this.gameStore.state.roundEnded = false;
      this.gameStore.state.hasSubmittedGuess = false;
      this.gameStore.state.playerGuesses = [];
      
      // 라운드 타이머 시작 (오버레이가 표시되지 않은 경우에만)
      if (!this.showIntroOverlay && !this.showNextRoundOverlay) {
        this.startRoundTimer();
      }
      
      // 부모 컴포넌트에 라운드 데이터 이벤트 전달
      this.$emit('round-data-received', message);
    },

    // 플레이어 제출 상태 처리
    handlePlayerSubmission(message) {
      console.log('플레이어 제출 상태 처리:', message);
      
      // 플레이어 리스트에서 해당 플레이어의 제출 상태 업데이트
      const player = this.gameStore.state.players.find(p => p.id === message.playerId);
      if (player) {
        player.hasSubmitted = true;
        
        // 제출한 플레이어의 추측 정보 저장 (위치는 숨김)
        if (message.position && message.playerId !== this.gameStore.state.currentUser.id) {
          this.gameStore.state.playerGuesses.push({
            playerId: message.playerId,
            playerName: player.nickname,
            position: message.position,
            color: this.getRandomColor(message.playerId)
          });
        }
        
        console.log(`플레이어 ${player.nickname} 제출 완료`);
      }
      
      // 부모 컴포넌트에 제출 상태 이벤트 전달
      this.$emit('player-submitted', message);
    },

    // 라운드 종료 처리
    handleRoundEnd(message) {
      console.log('라운드 종료 처리:', message);
      
      // 라운드 종료 상태로 변경
      this.gameStore.state.roundEnded = true;
      
      // 결과 데이터 처리
      if (message.results) {
        // 플레이어 점수 및 순위 업데이트
        if (message.results.playerResults) {
          message.results.playerResults.forEach(result => {
            const player = this.gameStore.state.players.find(p => p.id === result.playerId);
            if (player) {
              player.score = result.totalScore;
              player.lastRoundScore = result.roundScore;
              player.distanceToTarget = result.distance;
            }
          });
          
          // 점수 순으로 정렬
          this.gameStore.state.players.sort((a, b) => (b.score || 0) - (a.score || 0));
        }
        
        // 모든 플레이어 추측 위치 표시 (라운드 종료 후)
        if (message.results.allGuesses) {
          this.gameStore.state.playerGuesses = message.results.allGuesses;
        }
        
        // 최고 점수 플레이어 정보
        if (message.results.topPlayer) {
          this.gameStore.state.topPlayer = message.results.topPlayer;
        }
      }
      
      // 부모 컴포넌트에 라운드 종료 이벤트 전달
      this.$emit('round-ended', message);
    },

    // 게임 종료 처리
    handleGameEnd(message) {
      console.log('게임 종료 처리:', message);
      
      // 최종 결과 화면 표시
      this.gameStore.state.showGameResults = true;
      
      // 최종 순위 정보 업데이트
      if (message.finalResults) {
        this.gameStore.state.players = message.finalResults.rankings || this.gameStore.state.players;
      }
      
      // 부모 컴포넌트에 게임 종료 이벤트 전달
      this.$emit('game-ended', message);
    },

    // 서버 시간 동기화 처리
    handleServerTime(message) {
      console.log('서버 시간 동기화:', message);
      
      if (message.serverTime) {
        this.serverStartTime = message.serverTime;
      }
      
      if (message.remainingTime !== undefined) {
        this.gameStore.state.remainingTime = message.remainingTime;
      }
    },

    handlePlayerGuess(data) {
      // 다른 플레이어의 추측 정보 저장
      const player = gameStore.state.players.find(
        (p) => p.id === data.playerId
      );
      if (player) {
        // gameStore에 직접 추가
        if (!gameStore.state.playerGuesses) {
          gameStore.state.playerGuesses = [];
        }

        gameStore.state.playerGuesses.push({
          playerId: data.playerId,
          playerName: player.nickname,
          position: data.position,
          color: this.getRandomColor(data.playerId),
        });

        this.submittedPlayersCount++;

        // 모든 플레이어가 제출했는지 확인
        if (this.submittedPlayersCount >= gameStore.state.players.length) {
          this.allPlayersSubmitted = true;
          this.endRound();
        }
      }
    },

    // 서버로 플레이어 추측 정보 전송
    sendGuessToServer(guessData) {
      console.log("서버에 추측 정보 전송:", guessData);

      const topic = `/app/room/${this.roomId}/game/submit-guess`;
      const payload = {
        roomId: this.roomId,
        playerId: this.gameStore.state.currentUser.id,
        position: guessData.position,
        roundNumber: this.gameStore.state.currentRound,
        timestamp: Date.now()
      };
      
      const success = webSocketManager.publish(topic, payload);
      
      if (!success) {
        console.error('❌ 추측 정보 전송 실패 - 더미 모드로 처리');
        // 더미 모드에서는 로컬에서 처리
        this.handleLocalGuessSubmission(guessData);
      } else {
        console.log('✅ 추측 정보 전송 성공');
      }
      
      return success;
    },

    // 더미 모드에서 로컬 추측 처리
    handleLocalGuessSubmission(guessData) {
      // 현재 플레이어의 제출 상태 업데이트
      const currentPlayer = this.gameStore.state.players.find(
        p => p.id === this.gameStore.state.currentUser.id
      );
      if (currentPlayer) {
        currentPlayer.hasSubmitted = true;
      }
      
      // 게임 스토어 상태 업데이트
      this.gameStore.state.hasSubmittedGuess = true;
      this.gameStore.state.userGuess = { position: guessData.position };
    },

    // 서버로 다음 라운드 준비 완료 신호 전송
    sendNextRoundReadyToServer(userId) {
      console.log(`서버에 다음 라운드 준비 완료 신호 전송: ${userId}`);
      
      const topic = `/app/room/${this.roomId}/game/next-round-ready`;
      const payload = {
        roomId: this.roomId,
        playerId: userId,
        roundNumber: this.gameStore.state.currentRound,
        timestamp: Date.now()
      };
      
      const success = webSocketManager.publish(topic, payload);
      
      if (!success) {
        console.error('❌ 다음 라운드 준비 신호 전송 실패');
      } else {
        console.log('✅ 다음 라운드 준비 신호 전송 성공');
      }
      
      return success;
    },

    // 서버로 채팅 메시지 전송
    sendChatMessageToServer(message) {
      console.log("서버에 채팅 메시지 전송:", message);
      
      const topic = `/app/room/${this.roomId}/chat`;
      const payload = {
        roomId: this.roomId,
        senderId: this.gameStore.state.currentUser.id,
        senderName: this.gameStore.state.currentUser.nickname,
        message: message,
        timestamp: Date.now()
      };
      
      const success = webSocketManager.publish(topic, payload);
      
      if (!success) {
        console.error('❌ 채팅 메시지 전송 실패');
        // 더미 모드에서는 로컬에 추가
        this.gameStore.addChatMessage(message, this.gameStore.state.currentUser.nickname);
      } else {
        console.log('✅ 채팅 메시지 전송 성공');
      }
      
      return success;
    },

    calculatePlayerScores() {
      // 각 플레이어의 점수 계산 (거리 기반)
      this.gameStore.state.players.forEach((player) => {
        // 플레이어의 추측 위치 찾기
        const guess = this.gameStore.state.playerGuesses.find(
          (g) => g.playerId === player.id
        );
        if (guess) {
          // 실제 위치와의 거리 계산 (km)
          const distance = this.calculateDistance(
            guess.position.lat,
            guess.position.lng,
            this.gameStore.state.actualLocation.lat,
            this.gameStore.state.actualLocation.lng
          );

          // 거리에 따른 점수 계산 (최대 5000점, 거리가 멀수록 점수 감소)
          const score = Math.max(0, Math.round(5000 - distance * 10));

          // 마지막 라운드 점수 저장
          player.lastRoundScore = score;

          // 플레이어 총점 업데이트
          player.score = (player.score || 0) + score;
          player.distanceToTarget = distance;
        }
      });

      // 점수에 따라 플레이어 정렬
      this.gameStore.state.players.sort((a, b) => b.score - a.score);
    },

    calculateDistance(lat1, lon1, lat2, lon2) {
      // 두 지점 간의 거리 계산 (Haversine 공식)
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

    handleMapError(error) {
      console.error("지도 오류:", error);
      this.showToast("지도를 로드하는 중 오류가 발생했습니다.");
    },

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

    addToastStyles() {
      // 동적으로 스타일 추가
      const style = document.createElement("style");
      style.textContent = `
          .toast-message {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            z-index: 9999;
            font-size: 14px;
            transition: opacity 0.3s, transform 0.3s;
            opacity: 0;
            pointer-events: none;
          }
          
          .toast-message.show {
            opacity: 1;
            transform: translate(-50%, -10px);
          }
        `;
      document.head.appendChild(style);
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
      this.clearTimers();
      // STOMP Placeholder: Disconnect WebSocket
      // this.disconnectWebSocket();
      this.$router.push("/multiplayerLobby");
    },
  },
};
</script>

<style scoped>
.multiplayer-roadview-game {
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
  background-color: #222831;
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-height: 80px; /* 최소 높이 고정 */
  flex-shrink: 0; /* 축소 방지 */
}

.header-left {
  display: flex;
  align-items: center;
}

.header-center {
  flex: 1;
  max-width: 400px;
  margin: 0 2rem;
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

@media (max-width: 768px) {
  .exit-text {
    display: none;
  }

  .exit-button {
    padding: 0.5rem;
  }
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
  background: linear-gradient(90deg, #4f46e5, #3b82f6);
  border-radius: 4px;
  transition: width 0.5s ease-out;
}

/* 게임 컨텐츠 스타일 */
.game-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 왼쪽 패널: 플레이어 목록 */
.left-panel {
  width: 250px;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 5;
  overflow-y: auto;
  max-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  /* 개별 속성별 애니메이션 설정 */
  transition: 
    width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.2s ease-out,
    overflow 0.1s ease-out;
}

/* 데스크톱에서 숨김 상태 */
.left-panel.hidden {
  width: 0;
  overflow: hidden;
  box-shadow: none;
  /* 숨김 시 더 빠른 애니메이션 */
  transition: 
    width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.1s ease-in,
    overflow 0.05s ease-in;
}

/* 모바일에서만 플레이어 리스트가 닫힐 때 적용 */
@media (max-width: 768px) {
  .left-panel:not(.mobile-open) {
    transform: translateX(-100%);
    opacity: 0;
    pointer-events: none;
    /* 닫힐 때 더 빠른 애니메이션 */
    transition: 
      transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.15s ease-in,
      box-shadow 0.1s ease-in;
  }
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
  background-color: #222831;
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
  color: #3b82f6;
}

.submit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: #4338ca;
}

.submit-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
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

/* 태블릿 사이즈 (992px 이하) */
@media (max-width: 992px) {
  .game-content {
    flex-direction: row; /* 다시 row로 변경 */
    height: calc(100vh - 80px);
    position: relative;
  }

  /* 채팅 패널을 position: absolute로 플렉스에서 제거 */
  .right-panel {
    position: fixed;
    top: 0;
    right: -100%; /* 화면 밖으로 숨김 */
    width: 100%;
    max-width: 400px;
    height: 100vh; /* 전체 화면 높이 사용 */
    background: white;
    box-shadow: -2px 0 20px rgba(0, 0, 0, 0.3);
    z-index: 1000; /* 더 높은 z-index로 다른 요소들 위에 표시 */
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
    border-radius: 0 0 0 12px; /* 왼쪽 하단 모서리만 둥글게 */
  }

  .right-panel.chat-open {
    right: 0; /* 화면으로 슬라이드 인 */
  }

  /* 채팅창 내부 스타일 조정 */
  .right-panel .chat-window {
    height: 100%;
    border-radius: 0; /* 채팅창 내부 둥근 모서리 제거 */
  }

  .main-panel {
    width: 100%; /* 전체 너비 사용 */
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .game-view {
    flex: 1;
    height: 100%;
    position: relative;
    min-height: 300px; /* 최소 높이 축소 */
  }

  .map-container.expanded {
    width: 90%;
    height: 90%;
    max-height: calc(100vh - 100px);
  }

  .mobile-player-info {
    display: flex;
  }

  .chat-toggle {
    display: flex; /* 태블릿에서도 표시 */
  }
}

@media (max-width: 768px) {
  .game-header {
    flex-direction: row;
    padding: 0.5rem 0.8rem;
    flex-wrap: nowrap; /* wrap 제거하여 요소들이 한 줄에 유지 */
    justify-content: space-between;
    align-items: center;
    min-height: 70px; /* 모바일에서 약간 작은 높이 */
    overflow: hidden; /* 넘치는 요소 숨김 */
  }

  .header-left {
    flex: 0 0 auto; /* 고정 크기 */
    min-width: 120px;
    max-width: 40%;
  }

  .header-center {
    flex: 1;
    margin: 0 0.3rem;
    max-width: 30%;
    text-align: center;
  }

  .header-right {
    flex: 0 0 auto; /* 고정 크기 */
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  /* 헤더 내부 요소들 크기 조정 */
  .room-name {
    font-size: 0.9rem;
  }

  .game-mode {
    font-size: 0.75rem;
  }

  .round-number {
    font-size: 0.8rem;
  }

  .player-list-toggle-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
    min-width: 70px;
  }

  .toggle-text {
    font-size: 0.7rem;
  }

  /* 모바일에서 채팅 패널 최적화 */
  .right-panel {
    max-width: 100%; /* 모바일에서는 전체 너비 */
    height: 100vh; /* 모바일에서도 전체 화면 높이 사용 */
    right: -100%;
    z-index: 1000; /* 모바일에서도 높은 z-index 유지 */
  }
  
  .game-view {
    min-height: 250px; /* 모바일에서 더 작은 최소 높이 */
  }

  /* 모바일에서 채팅 토글 버튼 표시 */
  .chat-toggle {
    display: flex;
  }
}

/* 더 작은 화면에서 헤더 최적화 */
@media (max-width: 480px) {
  .game-header {
    padding: 0.4rem 0.6rem;
    min-height: 65px;
  }

  .header-left {
    min-width: 100px;
    max-width: 35%;
  }

  .header-center {
    max-width: 25%;
    margin: 0 0.2rem;
  }

  .header-right {
    gap: 0.2rem;
  }

  .room-name {
    font-size: 0.8rem;
  }

  .game-mode {
    font-size: 0.7rem;
  }

  .round-number {
    font-size: 0.75rem;
  }

  .player-list-toggle-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
    min-width: 60px;
  }

  .toggle-text {
    font-size: 0.65rem;
  }

  /* 더 작은 화면에서 채팅 패널 높이 조정 */
  .right-panel {
    height: 100vh; /* 더 작은 화면에서도 전체 화면 높이 사용 */
    z-index: 1000; /* 높은 z-index 유지 */
  }
}

.home-button {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #333, #222);
  border-radius: 50%;
  border: 2px solid #444;
  cursor: pointer;
  position: relative;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.home-button:before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 15px;
  height: 15px;
  border: 2px solid #666;
  border-radius: 3px;
}

.home-button:active {
  transform: scale(0.95);
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.8);
}

.phone-map {
  width: 100%;
  height: 100%;
  z-index: 101;
}

/* 휴대폰 내부 Spot 버튼 */
.phone-spot-button {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(46, 204, 113, 0.4);
  transition: all 0.3s ease;
  z-index: 102;
  display: flex;
  align-items: center;
  gap: 6px;
}

.phone-spot-button:hover {
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 6px 12px rgba(46, 204, 113, 0.6);
}

.phone-spot-button:active {
  transform: translateX(-50%) translateY(-1px);
}

/* 지도 토글 버튼 */
.map-toggle {
  position: absolute;
  bottom: 30px;
  right: 30px;
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

@media (max-width: 768px) {
  .phone-frame {
    width: 340px;
    height: 640px;
  }
}

@media (max-width: 480px) {
  .phone-frame {
    width: 300px;
    height: 600px;
  }

  .map-toggle {
    padding: 10px 15px;
    font-size: 0.9rem;
    bottom: 20px;
    right: 20px;
  }

  .phone-spot-button {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
}

/* 채팅 토글 버튼 */
.chat-toggle {
  display: none; /* 기본적으로 숨김 */
  position: absolute;
  bottom: 30px;
  left: 30px;
  background: linear-gradient(135deg, #9c27b0, #673ab7);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 1rem;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 50;
}

.chat-toggle:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
}

@media (max-width: 992px) {
  .chat-toggle {
    display: flex;
    padding: 10px 15px;
    font-size: 0.9rem;
    bottom: 20px;
    left: 20px;
  }
}

/* 플레이어 리스트 토글 버튼 (항상 표시) */
.player-list-toggle-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex; /* 항상 표시 */
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  margin-right: 1rem;
  min-width: 100px;
  justify-content: center;
}

.player-list-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  background: linear-gradient(135deg, #45a049, #388e3c);
}

.player-list-toggle-btn.active {
  background: linear-gradient(135deg, #FF6B6B, #E55A5A);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.player-list-toggle-btn.active:hover {
  background: linear-gradient(135deg, #E55A5A, #D32F2F);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

.toggle-text {
  font-size: 0.8rem;
  white-space: nowrap;
}

/* 모바일 사이즈 (768px 이하) - 플레이어 리스트 오버레이 스타일 */
@media (max-width: 768px) {
  /* 게임 헤더 높이 계산용 변수 */
  .game-header {
    height: 80px; /* 헤더 고정 높이 설정 */
  }
  
  /* 모바일에서 플레이어 리스트가 열린 상태일 때 오버레이로 표시 */
  .left-panel.mobile-open {
    position: fixed;
    top: 80px; /* 헤더 높이만큼 아래에서 시작 */
    left: 0;
    width: 100%;
    max-width: 320px;
    height: calc(100vh - 80px); /* 헤더 높이를 제외한 나머지 영역 */
    z-index: 500; /* 헤더보다 낮게 설정 */
    background: white;
    box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3);
    transform: translateX(0);
    opacity: 1;
    pointer-events: auto;
    overflow-y: auto;
    padding: 0; /* 상단 패딩 제거 */
    /* 개별 속성별 애니메이션으로 부드러운 전환 */
    transition: 
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.25s ease-out,
      box-shadow 0.2s ease-out;
    border-top: 1px solid #dee2e6;
  }
  
  /* 게임 화면 최적화 */
  .game-view {
    min-height: 300px; /* 모바일에서 최소 높이 축소 */
  }
  
  /* 토글 버튼 모바일 최적화 */
  .player-list-toggle-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    margin-right: 0.5rem;
    min-width: 80px;
  }
  
  .toggle-text {
    font-size: 0.75rem;
  }
}

/* 더 작은 화면에서 추가 최적화 */
@media (max-width: 480px) {
  .left-panel.mobile-open {
    width: 100vw; /* 전체 화면 너비 사용 */
    max-width: none;
  }
  
  .mobile-header {
    padding: 0.8rem;
  }
  
  .close-button {
    width: 28px;
    height: 28px;
  }
}

/* 페이드 트랜지션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>