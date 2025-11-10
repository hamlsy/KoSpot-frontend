<template>
  <div class="solo-game-container">
    <PlayerLoadingOverlay
      v-if="playerLoading.isActive"
      :ready-count="playerLoading.readyCount"
      :total-count="playerLoading.totalCount"
      :players="playerLoading.players"
    />
    <BaseMultiRoadViewGame
    :room-id="roomId"
    :game-mode="gameMode"
    :is-team-mode="false"
    :current-user-rank="currentUserRank"
    :use-custom-websocket="isServerMode"
      :show-leave-button="true"
      :total-time="timeLimit"
      :suppress-roadview-error="isRetryingRoadview"
      @leave-game="exitToLobby"
    @guess-submitted="handleGuessSubmission"
    @round-ended="handleRoundEnded"
    @game-finished="handleGameFinished"
    @next-round-ready="handleNextRoundReady"
    @end-overlay="handleEndOverlay"
    @game-started="handleGameStarted"
    @round-data-received="handleRoundDataReceived"
    @player-submitted="handlePlayerSubmitted"
    @game-ended="handleGameEnded"
    @roadview-load-error="handleRoadviewLoadError"
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
        :is-mobile="$refs.baseGame ? $refs.baseGame.isMobile : false"
        :server-countdown-seconds="soloGameFlow.transitionCountdown.value"
        @close="closeRoundResults"
        @request-next-round="requestNextRound"
        @finish-game="finishGame"
        @toggle-player-list="togglePlayerList"
        @toggle-chat="toggleChat"
      />
    </template>

    <!-- 게임 결과 모달 -->
    <template #results>
      <final-results
        v-if="gameStore.state.showGameResults"
        :player-results="gameStore.state.finalGameResult?.playerResults || []"
        :current-user-id="gameStore.state.currentUser.id"
        :total-rounds="gameStore.state.totalRounds"
        :total-game-time="totalGameTime"
        :game-message="gameStore.state.finalGameResult?.message"
        @play-again="restartGame"
        @exit-to-lobby="exitToLobby"
      />
    </template>
    </BaseMultiRoadViewGame>
  </div>
</template>

<script>
import BaseMultiRoadViewGame from "./BaseGameView.vue";
import ChatWindow from 'src/features/game/multiplayer/chat/components/Lobby/ChatWindow.vue'
import RoundResults from 'src/features/game/multiplayer/roadview/components/results/RoundResults.vue'
import FinalResults from 'src/features/game/multiplayer/roadview/components/results/FinalResults.vue'
import PlayerList from 'src/features/game/multiplayer/roadview/components/playerlist/SoloPlayerList.vue'
import PlayerLoadingOverlay from 'src/features/game/multiplayer/roadview/components/overlays/PlayerLoadingOverlay.vue'

import gameStore from 'src/store/gameStore.js'
import { useSoloGameFlow } from '@/features/game/multiplayer/roadview/composables/useSoloGameFlow'
import soloGameWebSocket from '@/features/game/multiplayer/roadview/services/soloGameWebSocket'

export default {
  name: "SoloRoadViewGame",

  components: {
    BaseMultiRoadViewGame,
    ChatWindow,
    RoundResults,
    FinalResults,
    PlayerList,
    PlayerLoadingOverlay
  },

  setup() {
    // Solo 게임 플로우 composable 사용
    // UI 콜백은 나중에 methods에서 this로 접근하기 위해 여기서는 전달하지 않음
    const soloGameFlow = useSoloGameFlow(gameStore)
    
    return {
      soloGameFlow
    }
  },

  data() {
    return {
      gameStore,
      gameMode: "solo",
      roomId: null,
      
      // 더미 모드 관련
      allPlayersSubmitted: false,
      simulationTriggered: false,
      
      // 게임 시간
      currentUserRank: 1,
      gameStartTime: null,
      totalGameTime: 0,
      
      // UI 관련
      toastTimeout: null,
      playerChatMessages: {},
      
      // 서버 모드 플래그
      isServerMode: false,
      isDummyRuntime: false,

      // 게임 시간 제한
      timeLimit: history.state?.timeLimit || 120,

      // 로드뷰 재시도 중 여부
      isRetryingRoadview: false,

      // 플레이어 로딩 상태
      playerLoading: {
        isActive: true,
        readyCount: 0,
        totalCount: history.state?.expectedPlayers || 1,
        players: []
      },

      pendingIntroOverlay: false
    };
  },

  created() {
    // 테스트 데이터 로드 (더미 모드용)
    this.gameStore.loadTestData(false);
    const resolvedRoomId = this.resolveRoomId();
    if (resolvedRoomId) {
      this.roomId = resolvedRoomId;
    }
    this.initializePlayerLoadingState();
    
    // 더미 모드에서만 초기화
    const navigationDummyMode = history.state?.dummyMode === true;
    if (this.$route.query.test === 'true' || navigationDummyMode) {
      this.initGame();
    }
  },

  async mounted() {
    // 개발자모드 파라미터만 확인 (인터넷 연결 상태는 더미 모드 전환 조건에서 제외)
    const navigationDummyMode = history.state?.dummyMode === true;
    const queryDummyMode = this.$route.query.test === 'true';
    const isDummyMode = queryDummyMode || navigationDummyMode;
    this.isServerMode = !isDummyMode
    this.isDummyRuntime = isDummyMode
    const resolvedRoomId = this.resolveRoomId()
    if (resolvedRoomId) {
      this.roomId = resolvedRoomId
    }
    this.initializePlayerLoadingState()
    
    if (isDummyMode) {
      console.log('[Solo Game] 더미 모드로 게임 시작')
      this.startDummyMode()
      this.simulateDummyLoading()
    } else {
      console.log('[Solo Game] 서버 모드로 게임 시작')
      try {
        await this.startServerMode()
      } catch (error) {
        console.error('[Solo Game] 서버 모드 시작 실패:', error)
        // 오류 시 더미 모드로 전환하지 않고 로비로 리다이렉트
        alert('게임을 시작할 수 없습니다. 로비로 이동합니다.')
        this.$router.replace('/lobby')
      }
    }
  },

  beforeUnmount() {
    // 타이머 정리
    this.clearTimer()
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout)
    }
    
    // 채팅 말풍선 정리
    Object.values(this.playerChatMessages).forEach(chatData => {
      if (chatData.timer) {
        clearTimeout(chatData.timer)
      }
    })
    
    // 모든 구독 해제
    this.cleanupSubscriptions()
    
    console.log('[Solo Game] 컴포넌트 정리 완료')
  },

  methods: {
    resolveRoomId() {
      const paramId = this.$route?.params?.roomId
      const navState = typeof history !== 'undefined' ? history.state : undefined
      const stateRoomId = navState?.roomId ?? navState?.roomData?.id ?? navState?.roomData?.gameRoomId

      const candidate = paramId ?? stateRoomId ?? this.roomId
      if (candidate == null) {
        return null
      }

      return String(candidate)
    },

    initializePlayerLoadingState() {
      const expectedFromState = parseInt(history.state?.expectedPlayers, 10)
      let total = this.playerLoading.totalCount

      if (!Number.isNaN(expectedFromState) && expectedFromState > 0) {
        total = expectedFromState
      } else if (this.gameStore?.state?.players?.length) {
        total = this.gameStore.state.players.length
      }

      this.playerLoading.totalCount = Math.max(1, total)
      this.playerLoading.readyCount = this.isDummyRuntime ? 0 : this.playerLoading.readyCount
    },

    setupLoadingStatusSubscription() {
      if (!this.roomId) {
        return
      }
      soloGameWebSocket.setupLoadingSubscription(this.roomId, this.handleLoadingStatus)
    },

    sendLoadingAcknowledge() {
      if (this.isDummyRuntime || !this.roomId) {
        return
      }

      soloGameWebSocket.publishLoadingAcknowledge(this.roomId, {
        roundId: null
      })

      if (this.playerLoading.totalCount <= 1) {
        setTimeout(() => this.finishPlayerLoading(), 300)
      }
    },

    handleLoadingStatus(statusMessage) {
      if (!statusMessage) {
        return
      }

      const players = Array.isArray(statusMessage.players) ? statusMessage.players : []
      const transformedPlayers = players.map(player => {
        const storePlayer = this.gameStore?.state?.players?.find(p => p.id === player.memberId)
        const acknowledgedAt =
          typeof player.acknowledgedAt === 'number'
            ? new Date(player.acknowledgedAt).toISOString()
            : player.acknowledgedAt ?? null

        return {
          memberId: player.memberId,
          arrived: Boolean(player.arrived),
          acknowledgedAt,
          nickname: storePlayer?.nickname || player.nickname || null
        }
      })

      this.playerLoading.players = transformedPlayers

      const arrivedCount = transformedPlayers.filter(player => player.arrived).length
      this.playerLoading.readyCount = arrivedCount
      if (players.length) {
        this.playerLoading.totalCount = players.length
      } else if (arrivedCount > this.playerLoading.totalCount) {
        this.playerLoading.totalCount = arrivedCount
      }

      if (statusMessage.allArrived) {
        this.finishPlayerLoading()
      }
    },

    finishPlayerLoading() {
      this.playerLoading.readyCount = Math.max(this.playerLoading.readyCount, this.playerLoading.totalCount)
      this.playerLoading.isActive = false
      if (this.$refs.baseGame) {
        this.$refs.baseGame.showIntroOverlay = true
        this.pendingIntroOverlay = false
      } else {
        this.pendingIntroOverlay = true
      }
      this.triggerIntroOverlayIfNeeded()
    },

    simulateDummyLoading() {
      if (!this.isDummyRuntime) {
        return
      }

      const players = this.gameStore?.state?.players || []
      this.playerLoading.players = players.map(player => ({
        memberId: player.id,
        nickname: player.nickname,
        arrived: false,
        acknowledgedAt: null
      }))
      this.playerLoading.readyCount = 0
      this.playerLoading.totalCount = Math.max(this.playerLoading.totalCount, this.playerLoading.players.length || 1)
      this.playerLoading.isActive = true

      let index = 0
      const simulateArrival = () => {
        if (index >= this.playerLoading.players.length) {
          this.finishPlayerLoading()
          return
        }

        this.playerLoading.players[index].arrived = true
        this.playerLoading.players[index].acknowledgedAt = new Date().toISOString()
        this.playerLoading.readyCount = index + 1
        index += 1
        setTimeout(simulateArrival, 600)
      }

      setTimeout(simulateArrival, 450)
    },

    triggerIntroOverlayIfNeeded() {
      if (!this.$refs.baseGame) {
        return
      }

      if (this.pendingIntroOverlay) {
        this.$refs.baseGame.showIntroOverlay = true
        this.pendingIntroOverlay = false
      }
    },

    // ==================== 서버 모드 메서드 ====================
    
    /**
     * 서버 모드 게임 시작
     */
    async startServerMode() {
      // UI 콜백 재설정 (setup 이후 this 접근 가능)
      this.setupUICallbacks()

      const resolvedRoomId = this.resolveRoomId()
      if (!resolvedRoomId) {
        console.error('[Solo Game] roomId를 확인할 수 없어 로비로 이동합니다.')
        const error = new Error('roomId를 확인할 수 없습니다.')
        error.code = 'ROOM_ID_NOT_FOUND'
        throw error
      }
      this.roomId = resolvedRoomId

      await this.soloGameFlow.initializeFromServerStart(this.roomId)

      this.setupLoadingStatusSubscription()
      this.sendLoadingAcknowledge()
    },
    
    /**
     * useSoloGameFlow의 UI 콜백 설정
     */
    setupUICallbacks() {
      // useSoloGameFlow에서 호출할 UI 업데이트 콜백 설정
      this.soloGameFlow.setCallbacks({
        onIntroShow: () => {
          console.log('[Solo Game] 인트로 오버레이 표시')
          // 재시도 중 플래그 해제 (새로운 좌표를 받았으므로)
          this.isRetryingRoadview = false
          
          if (this.$refs.baseGame) {
            this.$refs.baseGame.showIntroOverlay = true
          }
        },
        onRoundResultShow: () => {
          console.log('[Solo Game] 라운드 결과 표시')
          // 라운드 결과는 gameStore.state.roundEnded가 true가 되면 자동으로 표시됨
        },
        onNextRoundShow: () => {
          console.log('[Solo Game] 다음 라운드 오버레이 표시')
          // 재시도 중 플래그 해제 (새로운 좌표를 받았으므로)
          this.isRetryingRoadview = false
          
          // 현재 사용자 등수 계산
          this.currentUserRank = this.calculateUserRank()
          const totalPlayers = this.gameStore.state.players.length
          
          // NextRoundOverlay 표시
          if (this.$refs.baseGame) {
            this.$refs.baseGame.startNextRound(this.currentUserRank, totalPlayers)
          }
        },
        onGameFinish: () => {
          console.log('[Solo Game] 게임 종료')
          // 총 게임 시간 계산
          if (this.gameStartTime) {
            this.totalGameTime = Math.floor((Date.now() - this.gameStartTime) / 1000)
          }
          
          // 플레이어들의 평균 거리 계산
          this.calculatePlayerAverageDistances()
          
          // 최종 결과는 gameStore.state.showGameResults가 true가 되면 자동으로 표시됨
        },
        onTimerSync: (message) => {
          if (!this.gameStore) {
            return
          }

          if (message?.remainingTimeMs != null) {
            // 소수점까지 정확하게 저장 (밀리초를 초로 변환)
            const remainingSeconds = Math.max(0, Number(message.remainingTimeMs) / 1000)
            this.gameStore.state.remainingTime = remainingSeconds
          }
        }
      })
    },

    /**
     * 서버 모드 정답 제출
     */
    async submitServerAnswer(position) {
      if (!this.isServerMode) {
        return this.handleGuessSubmission(position)
      }

      try {
        console.log('[Solo Game] 서버에 정답 제출:', position)
        
        await this.soloGameFlow.submitAnswer(position)
        
        // UI 업데이트
        this.gameStore.state.hasSubmittedGuess = true
        this.gameStore.state.userGuess = { position }
        
        console.log('[Solo Game] 정답 제출 완료')
      } catch (error) {
        console.error('[Solo Game] 정답 제출 오류:', error)
        alert('정답 제출에 실패했습니다. 다시 시도해주세요.')
      }
    },

    // ==================== 공통 이벤트 핸들러 ====================
    
    /**
     * IntroOverlay 완료 처리
     */
    handleEndOverlay() {
      console.log('[Solo Game] 인트로 오버레이 완료')
      
      // 서버 모드: 오버레이 완료 처리 (타이머 시작 가능)
      if (this.isServerMode) {
        this.soloGameFlow.onOverlayComplete()
      } else {
        // 더미 모드: 시뮬레이션 시작
        console.log('[Solo Game] 더미 모드 시뮬레이션 시작')
        this.simulationTriggered = true
      }
    },

    /**
     * 로드뷰 로딩 실패 처리
     */
    async handleRoadviewLoadError() {
      if (!this.isServerMode) {
        console.warn('[Solo Game] 더미 모드에서는 로드뷰 재발급을 요청하지 않습니다.')
        return
      }

      // 재시도 중인지 확인
      this.isRetryingRoadview = this.soloGameFlow.isRetrying()
      
      console.log(`[Solo Game] 로드뷰 로딩 실패 - 재발급 요청 (재시도 중: ${this.isRetryingRoadview})`)
      
      try {
        const success = await this.soloGameFlow.requestRoadviewReIssue()
        if (success) {
          // 재시도 중 플래그 업데이트
          this.isRetryingRoadview = this.soloGameFlow.isRetrying()
          console.log('[Solo Game] 로드뷰 재발급 요청 완료. 서버에서 새로운 좌표 브로드캐스트 대기 중...')
          // 재시도 중이므로 에러 화면을 표시하지 않음
          // 새로운 좌표를 받으면 handleNextRound에서 자동으로 로드뷰를 다시 로드함
        } else {
          // 최대 시도 횟수 초과 시에만 에러 화면 표시
          this.isRetryingRoadview = this.soloGameFlow.isRetrying()
          if (!this.isRetryingRoadview) {
            console.error('[Solo Game] 로드뷰 재발급 요청 실패 또는 최대 시도 횟수 초과')
            // 재시도가 끝났으므로 에러 화면을 표시할 수 있음 (RoadView에서 자동으로 표시됨)
          }
        }
      } catch (error) {
        console.error('[Solo Game] 로드뷰 재발급 요청 중 오류:', error)
        // 에러 발생 시에도 재시도 중이 아니면 에러 화면 표시
        this.isRetryingRoadview = this.soloGameFlow.isRetrying()
        if (!this.isRetryingRoadview) {
          // 재시도가 끝났으므로 에러 화면을 표시할 수 있음 (RoadView에서 자동으로 표시됨)
        }
      }
    },

    // ==================== 더미 모드 전용 이벤트 핸들러 ====================
    // (서버 모드에서는 useSoloGameFlow가 처리)
    
    // 게임 시작 이벤트 처리 (더미 모드 전용)
    handleGameStarted(message) {
      if (this.isServerMode) return; // 서버 모드에서는 무시
      
      console.log('[Dummy Mode] 개인전 게임 시작 이벤트 처리:', message);
      
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
      
      console.log('[Dummy Mode] 개인전 게임 준비 완료 - 인트로 오버레이 표시');
    },

    // 라운드 데이터 수신 이벤트 처리 (더미 모드 전용)
    handleRoundDataReceived(message) {
      if (this.isServerMode) return; // 서버 모드에서는 무시
      
      console.log('[Dummy Mode] 개인전 라운드 데이터 수신:', message);
      
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

    // 플레이어 제출 이벤트 처리 (더미 모드 전용)
    handlePlayerSubmitted(message) {
      if (this.isServerMode) return; // 서버 모드에서는 무시
      
      console.log('[Dummy Mode] 플레이어 제출 이벤트 처리:', message);
      
      // 모든 플레이어가 제출했는지 확인
      this.checkAllPlayersSubmitted();
      
      const submittedCount = this.gameStore.state.playerGuesses.length;
      console.log(`현재 제출 완료: ${submittedCount}/${this.gameStore.state.players.length}`);
    },

    // 게임 종료 이벤트 처리 (더미 모드 전용)
    handleGameEnded(message) {
      if (this.isServerMode) return; // 서버 모드에서는 무시
      
      console.log('[Dummy Mode] 개인전 게임 종료 이벤트 처리:', message);
      
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

    /**
     * 정답 제출 처리 (서버/더미 모드 분기)
     */
    handleGuessSubmission(position) {
      console.log('[Solo Game] 위치 제출:', position)

      // 이미 제출했거나 라운드가 종료된 경우 무시
      if (this.gameStore.state.hasSubmittedGuess || this.gameStore.state.roundEnded) {
        console.warn('[Solo Game] 이미 제출했거나 라운드가 종료됨')
        return
      }

      // 서버 모드와 더미 모드 분기
      if (this.isServerMode) {
        this.submitServerAnswer(position)
      } else {
        this.submitDummyAnswer(position)
      }
    },

    /**
     * 더미 모드 정답 제출
     */
    submitDummyAnswer(position) {
      const currentPlayer = this.gameStore.state.currentUser

      // 게임 스토어 상태 업데이트
      this.gameStore.state.userGuess = { position }
      this.gameStore.state.hasSubmittedGuess = true

      // 현재 플레이어의 제출 상태 업데이트
      const playerIndex = this.gameStore.state.players.findIndex(
        (p) => p.id === currentPlayer.id
      )
      if (playerIndex !== -1) {
        this.gameStore.state.players[playerIndex].hasSubmitted = true
      }

      // 현재 사용자의 추측을 playerGuesses에 추가
      if (!this.gameStore.state.playerGuesses) {
        this.gameStore.state.playerGuesses = []
      }

      const guessInfo = {
        playerId: currentPlayer.id,
        playerName: currentPlayer.nickname,
        position: position,
        color: this.getRandomColor(currentPlayer.id),
      }

      this.gameStore.state.playerGuesses.push(guessInfo)

      console.log(`[Solo Game] 플레이어 ${currentPlayer.nickname} 제출 완료`)

      // 더미 모드: 모든 플레이어 제출 확인
      this.checkAllPlayersSubmitted()
    },

    sendChatMessage(message) {
      if (!message.trim()) return;
      
      // 현재 사용자의 채팅 말풍선 표시
      this.showPlayerChatBubble(this.gameStore.state.currentUser.id, message);
      
      // 서버 모드: 게임 중 채팅 메시지 발행
      if (this.isServerMode) {
        const success = this.soloGameFlow.publishGlobalChatMessage(message.trim())
        if (!success) {
          console.error('[Solo Game] 채팅 메시지 발행 실패')
        }
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

    // ==================== 더미 모드 메서드 ====================
    
    /**
     * 더미 모드 게임 시작
     */
    startDummyMode() {
      console.log('[Solo Game] 더미 모드 게임 플로우 시작')

      this.simulateDummyLoading()
      
      // 게임 시작 시간 기록
      this.gameStartTime = Date.now()
      
      // 더미 모드 시뮬레이션 감시
      this.$watch(
        () => this.simulationTriggered,
        () => {
          setTimeout(() => {
            this.simulateOtherPlayersGuesses()
          }, 10)
        }
      )
      
      // 3초 후 게임 시작 시뮬레이션
      setTimeout(() => {
        this.simulateGameStart()
      }, 3000)
    },

    /**
     * 더미 게임 시작 시뮬레이션
     */
    simulateGameStart() {
      console.log('[Solo Game] 더미 게임 시작 시뮬레이션')
      
      const gameStartMessage = {
        roomId: this.roomId,
        totalRounds: this.gameStore.state.totalRounds,
        serverStartTime: Date.now()
      }
      
      // BaseGameView의 게임 시작 핸들러 호출
      if (this.$refs.baseGame) {
        this.$refs.baseGame.handleGameStart(gameStartMessage)
      }
      
      // 1초 후 첫 라운드 데이터 시뮬레이션
      setTimeout(() => {
        this.simulateRoundData()
      }, 1000)
    },

    /**
     * 더미 라운드 데이터 시뮬레이션
     */
    simulateRoundData() {
      console.log(`[Solo Game] 더미 라운드 ${this.gameStore.state.currentRound} 데이터 시뮬레이션`)
      
      const roundDataMessage = {
        roundNumber: this.gameStore.state.currentRound,
        location: this.gameStore.state.currentLocation || {
          lat: 37.5665 + (Math.random() - 0.5) * 0.1,
          lng: 126.978 + (Math.random() - 0.5) * 0.1
        },
        locationInfo: this.gameStore.state.locationInfo,
        roundTime: 120
      }
      
      // BaseGameView의 라운드 데이터 핸들러 호출
      if (this.$refs.baseGame) {
        this.$refs.baseGame.handleRoundData(roundDataMessage)
      }
      
      // 라운드 데이터 가져오기
      this.fetchRoundData()
      
      // 시뮬레이션 트리거 설정
      this.simulationTriggered = true
    },

    /**
     * 더미 라운드 종료 시뮬레이션
     */
    simulateRoundEnd() {
      if (this.gameStore.state.roundEnded) {
        console.log('[Solo Game] 라운드가 이미 종료됨')
        return
      }
      
      console.log(`[Solo Game] 더미 라운드 ${this.gameStore.state.currentRound} 종료 시뮬레이션`)
      
      // 라운드 종료 처리
      this.endRound()
      
      // 마지막 라운드 확인
      if (this.gameStore.state.currentRound >= this.gameStore.state.totalRounds) {
        console.log('[Solo Game] 마지막 라운드 완료 - 게임 종료')
        setTimeout(() => {
          this.simulateGameEnd()
        }, 2000)
      }
    },

    /**
     * 더미 게임 종료 시뮬레이션
     */
    simulateGameEnd() {
      console.log('[Solo Game] 더미 게임 종료 시뮬레이션')
      
      const gameEndMessage = {
        finalResults: {
          rankings: this.gameStore.state.players.sort((a, b) => (b.score || 0) - (a.score || 0))
        }
      }
      
      if (this.$refs.baseGame) {
        this.$refs.baseGame.handleGameEnd(gameEndMessage)
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
      // 확인 다이얼로그 표시
      if (!confirm('정말 게임을 나가시겠습니까? 진행 중인 게임은 저장되지 않습니다.')) {
        return
      }

      // 모든 구독 해제
      this.cleanupSubscriptions()

      // 로비로 이동
      this.$router.push("/lobby")
    },

    /**
     * 모든 구독 해제
     */
    cleanupSubscriptions() {
      console.log('[Solo Game] 모든 구독 해제 시작')

      // 서버 모드 정리
      if (this.isServerMode) {
        this.soloGameFlow.cleanup()
      }

      // 로딩 구독 해제
      soloGameWebSocket.removeLoadingSubscription()

      console.log('[Solo Game] 모든 구독 해제 완료')
    },

    // 모바일 액션 핸들러
    togglePlayerList() {
      if (this.$refs.baseGame) {
        this.$refs.baseGame.togglePlayerList();
      }
    },

    toggleChat() {
      if (this.$refs.baseGame) {
        this.$refs.baseGame.toggleChat();
      }
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

    /**
     * 더미 모드: 다른 플레이어 정답 제출 시뮬레이션
     */
    simulateOtherPlayersGuesses() {
      console.log('[Solo Game] 다른 플레이어 추측 시뮬레이션 시작')

      // 라운드 종료 또는 모든 플레이어 제출 완료 시 중단
      if (this.gameStore.state.roundEnded || this.allPlayersSubmitted) {
        console.log('[Solo Game] 시뮬레이션 중단')
        return
      }

      // 실제 위치 확인
      if (!this.gameStore.state.actualLocation?.lat) {
        console.error('[Solo Game] 실제 위치가 없어 시뮬레이션 불가')
        return
      }

      // 현재 플레이어를 제외한 다른 플레이어들
      const otherPlayers = this.gameStore.state.players.filter(
        (player) => player.id !== this.gameStore.state.currentUser.id
      )

      console.log(`[Solo Game] 시뮬레이션 대상: ${otherPlayers.length}명`)

      // 각 플레이어마다 랜덤 위치 생성 및 제출
      otherPlayers.forEach((player) => {
        setTimeout(() => {
          // 실제 위치 주변 랜덤 위치 생성 (±20km)
          const randomOffset = () => (Math.random() - 0.5) * 0.4
          const randomPosition = {
            lat: this.gameStore.state.actualLocation.lat + randomOffset(),
            lng: this.gameStore.state.actualLocation.lng + randomOffset(),
          }

          const color = this.getRandomColor(player.id)

          // 플레이어 추측 추가
          this.addPlayerGuessToStore(player.id, randomPosition, color)

          // 제출 상태 업데이트
          player.hasSubmitted = true

          // 모든 플레이어 제출 확인
          this.checkAllPlayersSubmitted()
        }, 500 + Math.random() * 2000) // 0.5~2.5초 랜덤
      })
    },

    /**
     * 플레이어 추측을 스토어에 추가
     */
    addPlayerGuessToStore(playerId, position, color) {
      const player = this.gameStore.state.players.find((p) => p.id === playerId)
      if (!player) return

      if (!this.gameStore.state.playerGuesses) {
        this.gameStore.state.playerGuesses = []
      }

      this.gameStore.state.playerGuesses.push({
        playerId: playerId,
        playerName: player.nickname,
        position: position,
        color: color,
      })
    },
  },
};
</script>