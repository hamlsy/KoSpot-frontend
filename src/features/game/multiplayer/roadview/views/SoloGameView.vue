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
      :is-poi-name-visible="isPoiNameVisibleLocal"
      :poi-name="currentPoiName"
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
        :players="localPlayers"
        :current-user-id="currentUserId"
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
        :players="localPlayers"
        :actual-location="
          gameStore.state.actualLocation || { lat: 37.5665, lng: 126.978 }
        "
        :round="gameStore.state.currentRound"
        :total-rounds="gameStore.state.totalRounds"
        :current-user-id="currentUserId"
        :location-name="gameStore.state.locationInfo.name"
        :poi-name="gameStore.state.locationInfo.poiName || ''"
        :full-address="gameStore.state.locationInfo.fullAddress || ''"
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
        :is-server-mode="isServerMode"
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
        v-if="showGameResults"
        :player-results="finalGameResult?.playerResults || []"
        :current-user-id="currentUserId"
        :total-rounds="gameStore.state.totalRounds"
        :total-game-time="totalGameTime"
        :game-message="finalGameResult?.message"
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
      // 중요: 기본값은 항상 서버 모드(true)
      // history.state?.dummyMode가 명시적으로 true일 때만 더미 모드(false)
      // data() 함수에서 초기값을 설정하므로, history.state를 읽을 수 있음
      isServerMode: (() => {
        try {
          const historyState = typeof history !== 'undefined' ? history.state : null
          const isExplicitlyDummyMode = historyState?.dummyMode === true
          const serverMode = !isExplicitlyDummyMode // 더미 모드가 아니면 서버 모드 (기본값: true)
          console.log('[Solo Game] data() - isServerMode 초기값 설정:', {
            historyState,
            dummyMode: historyState?.dummyMode,
            isExplicitlyDummyMode,
            serverMode,
            '결론: 서버 모드': serverMode
          })
          return serverMode
        } catch (error) {
          console.error('[Solo Game] data() - isServerMode 초기값 설정 중 오류:', error)
          return true // 오류 발생 시 기본값: 서버 모드
        }
      })(),
      isDummyRuntime: (() => {
        try {
          const historyState = typeof history !== 'undefined' ? history.state : null
          const isExplicitlyDummyMode = historyState?.dummyMode === true
          return isExplicitlyDummyMode
        } catch (error) {
          return false // 오류 발생 시 기본값: 더미 모드 아님
        }
      })(),

      // 게임 시간 제한
      timeLimit: (() => {
        try {
          return (typeof history !== 'undefined' && history.state?.timeLimit) || 120
        } catch (error) {
          return 120
        }
      })(),

      // 로드뷰 재시도 중 여부
      isRetryingRoadview: false,

      // 플레이어 로딩 상태
      playerLoading: {
        isActive: true,
        readyCount: 0,
        totalCount: history.state?.expectedPlayers || 1,
        players: []
      },

      pendingIntroOverlay: false,

      // 서버에서 받은 게임 플레이어 정보 (처음 게임 시작할 때 받는 정보)
      // store에 담지 않고 SoloGameView에만 저장
      gamePlayers: [],

      // 게임 최종 결과 (gameStore 사용하지 않고 로컬 데이터로 관리)
      finalGameResult: null,
      showGameResults: false,

      // 자동 로비 이동 상태
      autoExitTimerId: null,
      autoExitRemaining: 0,

      // 지명 공개 관련 로컬 상태
      isPoiNameVisibleLocal: true,
      currentPoiName: ''
    };
  },

  computed: {
    // 현재 사용자 ID (안전하게 접근)
    currentUserId() {
      if (this.isDummyRuntime) {
        return this.gameStore?.state?.currentUser?.id || null
      }
      // 서버 모드: localStorage에서 가져오거나 gamePlayers에서 찾기
      const memberId = localStorage.getItem('memberId')
      if (memberId) {
        return memberId
      }
      // gamePlayers에서 현재 사용자 찾기 (임시로 첫 번째 플레이어 또는 게임플레이어 정보에서)
      return this.gameStore?.state?.currentUser?.id || null
    },
    
    // 플레이어 리스트 컴포넌트에서 사용할 형식으로 변환
    localPlayers() {
      // 더미 모드에서는 gameStore.state.players 사용
      if (this.isDummyRuntime) {
        return this.gameStore.state.players || []
      }
      
      // 서버 모드: gamePlayers를 플레이어 리스트 형식으로 변환
      return this.gamePlayers.map(player => {
        // gamePlayerStatus를 기반으로 hasSubmitted 판단
        // PLAYING 또는 FINISHED 상태면 제출 완료로 간주
        const gamePlayerStatus = player.gamePlayerStatus || 'WAITING'
        const hasSubmitted = gamePlayerStatus === 'PLAYING' || gamePlayerStatus === 'FINISHED'
        
        return {
          id: String(player.playerId),
          memberId: String(player.memberId != null ? player.memberId : player.playerId), // memberId가 있으면 사용, 없으면 playerId 사용
          nickname: player.nickname || '알 수 없음',
          markerImageUrl: player.markerImageUrl || null,
          equippedMarker: player.markerImageUrl || null,
          totalScore: player.totalScore != null ? Number(player.totalScore) : 0,
          roundRank: player.roundRank != null ? Number(player.roundRank) : 0,
          score: player.totalScore != null ? Number(player.totalScore) : 0,
          hasSubmitted: hasSubmitted, // gamePlayerStatus 기반으로 판단
          gamePlayerStatus: gamePlayerStatus, // 플레이어 상태 추가
          distanceToTarget: player.distanceToTarget || null,
          lastRoundScore: player.lastRoundScore || 0
        }
      })
    }
  },

  created() {
    // 게임 상태 초기화 (서버 모드/더미 모드 공통)
    // 이전 게임 상태가 남아있지 않도록 항상 초기화
    this.gameStore.initGame();
    
    const resolvedRoomId = this.resolveRoomId();
    if (resolvedRoomId) {
      this.roomId = resolvedRoomId;
    }
    
    // 중요: 더미 모드 확인
    // history.state?.dummyMode가 명시적으로 true인 경우에만 더미 모드
    // 그 외의 모든 경우(undefined, null, false 등)는 서버 모드 (기본값)
    const historyState = typeof history !== 'undefined' ? history.state : null;
    const isExplicitlyDummyMode = historyState?.dummyMode === true;
    
    // isServerMode 설정: 명시적으로 더미 모드가 아니면 서버 모드 (기본값: true)
    this.isServerMode = !isExplicitlyDummyMode; // 더미 모드가 아니면 서버 모드
    this.isDummyRuntime = isExplicitlyDummyMode;
    
    console.log('[Solo Game] created - 모드 설정 (최종):', {
      historyState: historyState,
      dummyMode: historyState?.dummyMode,
      isExplicitlyDummyMode,
      isServerMode: this.isServerMode,
      isDummyRuntime: this.isDummyRuntime,
      '결론: 서버 모드': this.isServerMode,
      roomId: this.roomId
    });
    
    // isPoiNameVisible 초기화 (네비게이션 상태에서 가져오기, 기본 true)
    try {
      const navState = typeof history !== 'undefined' ? history.state : null
      const roomData = navState?.roomData || {}
      this.isPoiNameVisibleLocal = roomData.isPoiNameVisible !== false
    } catch (e) {
      this.isPoiNameVisibleLocal = true
    }

    // 더미 모드에서만 테스트 데이터 로드 (서버 모드에서는 서버에서 플레이어 데이터를 받음)
    if (isExplicitlyDummyMode) {
      console.log('[Solo Game] 더미 모드로 초기화');
      this.gameStore.loadTestData(false);
      this.initGame();
    } else {
      console.log('[Solo Game] 서버 모드로 초기화 (기본값)');
      // 서버 모드: 플레이어 리스트 초기화 (서버에서 받을 데이터만 사용)
      // store에 플레이어 정보를 저장하지 않음 (gamePlayers에만 저장)
      this.gameStore.state.players = [];
      this.gamePlayers = []; // gamePlayers도 초기화
      
      // 서버 모드: currentUser 초기화 (localStorage에서 가져오기)
      const memberId = localStorage.getItem('memberId');
      if (memberId && !this.gameStore.state.currentUser) {
        this.gameStore.state.currentUser = {
          id: memberId,
          nickname: localStorage.getItem('nickname') || '플레이어',
          markerImageUrl: null,
          equippedMarker: null
        };
      }
    }
    
    this.initializePlayerLoadingState();
  },

  // 강제 종료 시 탈퇴 처리
  handleBeforeUnload() {
    console.log('[Solo Game] 페이지 종료 감지 - 퇴장 처리 시도');
    
    try {
      const roomId = this.roomId;
      const currentUserId = this.currentUserId;
      
      if (!roomId || !currentUserId) {
        console.warn('[Solo Game] roomId 또는 currentUserId가 없어 퇴장 처리를 건너뜁니다.');
        return;
      }
      
      // fetch with keepalive를 사용하여 비동기적으로 퇴장 요청
      // keepalive 옵션은 페이지가 닫혀도 요청이 보장됨
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const leaveUrl = `${apiBaseUrl}/api/rooms/${roomId}/leave`;
      
      try {
        fetch(leaveUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ memberId: currentUserId }),
          keepalive: true, // 페이지가 닫혀도 요청 보장
          credentials: 'include', // 쿠키 포함
        }).catch(() => {
          // fetch 실패는 무시 (페이지가 닫히는 중이므로)
        });
        
        console.log('[Solo Game] ✅ fetch keepalive로 퇴장 요청 전송 시도');
      } catch (error) {
        console.warn('[Solo Game] ⚠️ fetch keepalive 전송 실패:', error);
      }
      
      // 구독 해제 시도 (동기적으로만 가능)
      try {
        this.cleanupSubscriptions();
      } catch (error) {
        console.error('[Solo Game] ❌ 구독 해제 실패:', error);
      }
    } catch (error) {
      console.error('[Solo Game] ❌ beforeunload 퇴장 처리 중 오류:', error);
    }
  },

  async mounted() {
    // 게임 상태 명시적 초기화 (이전 게임 상태 완전 제거)
    // showGameResults 등이 true로 남아있으면 게임 완료 화면이 표시될 수 있음
    this.showGameResults = false; // 로컬 데이터 초기화
    this.finalGameResult = null; // 로컬 데이터 초기화
    this.gameStore.state.roundEnded = false;
    this.gameStore.state.hasSubmittedGuess = false;
    this.gameStore.state.showRoundResults = false;
    this.gameStore.state.currentRound = 1;
    this.gameStore.state.userGuess = null;
    this.gameStore.state.playerGuesses = [];
    this.gameStore.state.remainingTime = 120;
    
    // 강제 종료 감지를 위한 beforeunload 이벤트 리스너 추가
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    
    // 개발자모드 파라미터만 확인
    // history.state?.dummyMode가 명시적으로 true인 경우에만 더미 모드
    const isExplicitlyDummyMode = history.state?.dummyMode === true;
    
    // created()에서 이미 설정했지만, 일관성을 위해 다시 확인
    // computedIsServerMode가 실제 prop 값이므로 이것이 우선
    const expectedServerMode = !isExplicitlyDummyMode;
    if (this.isServerMode !== expectedServerMode) {
      console.warn('[Solo Game] mounted - isServerMode 불일치 감지:', {
        created에서설정: this.isServerMode,
        현재계산값: expectedServerMode,
        isExplicitlyDummyMode,
        computedIsServerMode: this.computedIsServerMode
      });
      this.isServerMode = expectedServerMode;
      this.isDummyRuntime = isExplicitlyDummyMode;
    }
    
    const resolvedRoomId = this.resolveRoomId()
    if (resolvedRoomId) {
      this.roomId = resolvedRoomId
    }
    this.initializePlayerLoadingState()
    
    console.log('[Solo Game] mounted - 최종 모드:', {
      historyState: history.state,
      dummyMode: history.state?.dummyMode,
      isExplicitlyDummyMode,
      isServerMode: this.isServerMode,
      isDummyRuntime: this.isDummyRuntime,
      computedIsServerMode: this.computedIsServerMode, // 실제 prop 값
      roomId: this.roomId
    });
    
    if (isExplicitlyDummyMode) {
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
    // 이벤트 리스너 정리
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    
    // 타이머 정리
    this.clearTimer()
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout)
    }
    // 자동 퇴장 카운트다운 정리
    this.cancelAutoExitCountdown()
    
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
      } else if (this.isDummyRuntime && this.gameStore?.state?.players?.length) {
        total = this.gameStore.state.players.length
      } else if (!this.isDummyRuntime && this.gamePlayers?.length) {
        total = this.gamePlayers.length
      }

      this.playerLoading.totalCount = Math.max(1, total)
      this.playerLoading.readyCount = this.isDummyRuntime ? 0 : this.playerLoading.readyCount
    },

    setupLoadingStatusSubscription() {
      if (!this.roomId) {
        return
      }
      // RoomView에서 이미 구독되어 있으므로, 핸들러만 설정 (skipSubscribe = true)
      soloGameWebSocket.setupLoadingSubscription(this.roomId, this.handleLoadingStatus, true)
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

      // 로드뷰 재발급 중에는 로딩 상태 메시지를 무시
      if (this.isRetryingRoadview) {
        console.log('[Solo Game] 로드뷰 재발급 중 - 로딩 상태 메시지 무시')
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
          
          // 서버 모드: 첫 라운드 시작 시 gamePlayers의 제출 상태 초기화
          if (!this.isDummyRuntime && this.gamePlayers && this.gamePlayers.length > 0) {
            this.gamePlayers.forEach(player => {
              player.gamePlayerStatus = 'WAITING'
              player.distanceToTarget = null
              player.lastRoundScore = 0
            })
            console.log('[Solo Game] 첫 라운드 시작 - 플레이어 제출 상태 초기화: WAITING')
          }
          
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
          
          // 서버 모드: 다음 라운드 시작 시 gamePlayers의 제출 상태 초기화
          if (!this.isDummyRuntime && this.gamePlayers && this.gamePlayers.length > 0) {
            this.gamePlayers.forEach(player => {
              player.gamePlayerStatus = 'WAITING'
              player.distanceToTarget = null
              player.lastRoundScore = 0
            })
            console.log('[Solo Game] 다음 라운드 시작 - 플레이어 제출 상태 초기화: WAITING')
          }
          
          // 현재 사용자 등수 계산
          this.currentUserRank = this.calculateUserRank()
          const totalPlayers = this.isDummyRuntime ? this.gameStore.state.players.length : this.gamePlayers.length
          
          // NextRoundOverlay 표시
          if (this.$refs.baseGame) {
            this.$refs.baseGame.startNextRound(this.currentUserRank, totalPlayers)
          }
        },
        onNextRound: (message) => {
          console.log('[Solo Game] 라운드 데이터 수신 (서버 모드):', message)
          // 통합 라운드 데이터 처리 함수 호출
          this.processRoundData(message, message.isReIssue || false)
        },
        onGameFinish: (finalGameResult) => {
          console.log('[Solo Game] 게임 종료 - WebSocket 메시지 수신:', finalGameResult)
          
          // finalGameResult가 null이거나 빈 객체인 경우 무시
          if (!finalGameResult || typeof finalGameResult !== 'object') {
            console.warn('[Solo Game] 게임 종료 메시지에 finalGameResult 데이터가 없음')
            return
          }
          
          // playerResults가 없거나 빈 배열이면 무시
          if (!finalGameResult.playerResults || !Array.isArray(finalGameResult.playerResults) || finalGameResult.playerResults.length === 0) {
            console.warn('[Solo Game] 게임 종료 메시지에 playerResults가 없거나 빈 배열임')
            return
          }
          
          // WebSocket으로 받은 게임 종료 메시지 데이터를 로컬 데이터에 저장
          this.finalGameResult = finalGameResult
          this.showGameResults = true
          console.log('[Solo Game] 게임 결과 모달 표시:', finalGameResult)
          
          // 총 게임 시간 계산
          if (this.gameStartTime) {
            this.totalGameTime = Math.floor((Date.now() - this.gameStartTime) / 1000)
          }
          
          // 플레이어들의 평균 거리 계산
          this.calculatePlayerAverageDistances()

          // 30초 후 자동 로비 이동 카운트다운 시작 (서버 모드)
          this.startAutoExitCountdown(30)
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
        },
        onGamePlayersUpdate: (gamePlayers) => {
          console.log('[Solo Game] 플레이어 정보 업데이트 (처음 게임 시작할 때 받는 정보):', gamePlayers)
          
          // 처음 게임 시작할 때 받는 플레이어 정보를 SoloGameView의 gamePlayers에 저장
          // store에 담지 않음
          this.gamePlayers = gamePlayers.map(player => ({
            playerId: player.playerId,
            memberId: player.memberId != null ? Number(player.memberId) : player.playerId, // memberId가 없으면 playerId 사용
            nickname: player.nickname || '알 수 없음',
            markerImageUrl: player.markerImageUrl || null,
            totalScore: player.totalScore != null ? Number(player.totalScore) : 0,
            roundRank: player.roundRank != null ? Number(player.roundRank) : 0,
            distanceToTarget: player.distanceToTarget || null,
            lastRoundScore: player.lastRoundScore || 0,
            gamePlayerStatus: player.gamePlayerStatus || 'WAITING' // 기본값: WAITING
          }))
          
          // currentUser 초기화 및 markerImageUrl 업데이트
          const memberId = localStorage.getItem('memberId')
          if (memberId) {
            // currentUser가 없으면 초기화
            if (!this.gameStore.state.currentUser) {
              this.gameStore.state.currentUser = {
                id: memberId,
                nickname: localStorage.getItem('nickname') || '플레이어',
                markerImageUrl: null,
                equippedMarker: null
              }
            }
            
            // 자신의 정보를 gamePlayers에서 찾아서 markerImageUrl 및 nickname 업데이트
            // memberId로 먼저 찾고, 없으면 playerId로 찾기
            const currentPlayerInfo = gamePlayers.find(p => {
              const playerMemberId = p.memberId != null ? String(p.memberId) : null
              const playerPlayerId = p.playerId != null ? String(p.playerId) : null
              return (playerMemberId && String(memberId) === playerMemberId) || 
                     (playerPlayerId && String(memberId) === playerPlayerId)
            })
            if (currentPlayerInfo) {
              if (currentPlayerInfo.markerImageUrl) {
                this.gameStore.state.currentUser.markerImageUrl = currentPlayerInfo.markerImageUrl
                this.gameStore.state.currentUser.equippedMarker = currentPlayerInfo.markerImageUrl
              }
              if (currentPlayerInfo.nickname) {
                this.gameStore.state.currentUser.nickname = currentPlayerInfo.nickname
              }
            }
          }
        },
        onRoundResultUpdate: (roundResultData) => {
          // 라운드 결과에서 받은 플레이어 점수 정보로 gamePlayers 업데이트
          if (roundResultData.playerTotalResults && Array.isArray(roundResultData.playerTotalResults)) {
            roundResultData.playerTotalResults.forEach((result, index) => {
              // 플레이어 매칭: playerId와 memberId 모두 고려
              const player = this.gamePlayers.find(p => {
                const resultPlayerId = result.playerId != null ? String(result.playerId) : null
                const resultMemberId = result.memberId != null ? String(result.memberId) : null
                const pPlayerId = p.playerId != null ? String(p.playerId) : null
                const pMemberId = p.memberId != null ? String(p.memberId) : null
                
                // playerId로 먼저 매칭, 없으면 memberId로 매칭
                return (resultPlayerId && pPlayerId && resultPlayerId === pPlayerId) ||
                       (resultMemberId && pMemberId && resultMemberId === pMemberId) ||
                       (resultPlayerId && pMemberId && resultPlayerId === pMemberId) ||
                       (resultMemberId && pPlayerId && resultMemberId === pPlayerId)
              })
              
              if (player) {
                // memberId 업데이트
                if (result.memberId != null) {
                  player.memberId = Number(result.memberId)
                }
                // gamePlayerStatus 업데이트
                if (result.gamePlayerStatus != null) {
                  player.gamePlayerStatus = result.gamePlayerStatus
                }
                // 점수 정보 업데이트
                player.totalScore = result.totalScore != null ? Number(result.totalScore) : player.totalScore
                player.roundRank = result.roundRank != null ? Number(result.roundRank) : player.roundRank
                
                // 제출 결과 매칭
                const submission = roundResultData.playerSubmissionResults?.[index]
                if (submission) {
                  player.distanceToTarget = submission.distance != null ? Number(submission.distance) : player.distanceToTarget
                  player.lastRoundScore = submission.earnedScore != null ? Number(submission.earnedScore) : player.lastRoundScore
                  // timeToAnswer 필드 저장 (필요 시 사용)
                  if (submission.timeToAnswer != null) {
                    player.timeToAnswer = Number(submission.timeToAnswer)
                  }
                }
              }
            })
          }
          
          // playerGuesses의 markerImageUrl을 gamePlayers에서 가져와서 업데이트
          // (처음 게임 시작할 때 받은 정보 사용)
          if (roundResultData.playerGuesses && Array.isArray(roundResultData.playerGuesses)) {
            const updatedPlayerGuesses = roundResultData.playerGuesses.map(guess => {
              // 플레이어 매칭: playerId와 memberId 모두 고려
              const player = this.gamePlayers.find(p => {
                const guessPlayerId = guess.playerId != null ? String(guess.playerId) : null
                const guessMemberId = guess.memberId != null ? String(guess.memberId) : null
                const pPlayerId = p.playerId != null ? String(p.playerId) : null
                const pMemberId = p.memberId != null ? String(p.memberId) : null
                
                return (guessPlayerId && pPlayerId && guessPlayerId === pPlayerId) ||
                       (guessMemberId && pMemberId && guessMemberId === pMemberId) ||
                       (guessPlayerId && pMemberId && guessPlayerId === pMemberId) ||
                       (guessMemberId && pPlayerId && guessMemberId === pPlayerId)
              })
              
              if (player && player.markerImageUrl) {
                return {
                  ...guess,
                  markerImageUrl: player.markerImageUrl // 처음 게임 시작할 때 받은 markerImageUrl 사용
                }
              }
              return guess
            })
            
            // 업데이트된 playerGuesses를 gameStore에 반영
            if (this.gameStore && this.gameStore.state) {
              this.gameStore.state.playerGuesses = updatedPlayerGuesses
            }
          }
        },
        onPlayerSubmission: (submissionData) => {
          console.log('[Solo Game] 플레이어 제출 알림 수신:', submissionData)
          
          // gamePlayers 배열에서 해당 플레이어 찾기
          const playerId = submissionData.playerId
          const memberId = submissionData.memberId
          
          if (!playerId) {
            console.warn('[Solo Game] 플레이어 제출 알림에 playerId가 없음:', submissionData)
            return
          }
          
          // 플레이어 매칭: playerId로 먼저 매칭, 없으면 memberId로 매칭
          const player = this.gamePlayers.find(p => {
            const pPlayerId = p.playerId != null ? String(p.playerId) : null
            const pMemberId = p.memberId != null ? String(p.memberId) : null
            const submissionPlayerId = playerId != null ? String(playerId) : null
            const submissionMemberId = memberId != null ? String(memberId) : null
            
            // playerId로 먼저 매칭
            if (submissionPlayerId && pPlayerId && submissionPlayerId === pPlayerId) {
              return true
            }
            // memberId로 매칭 (둘 다 있는 경우)
            if (submissionMemberId && pMemberId && submissionMemberId === pMemberId) {
              return true
            }
            // playerId와 memberId 교차 매칭
            if (submissionPlayerId && pMemberId && submissionPlayerId === pMemberId) {
              return true
            }
            if (submissionMemberId && pPlayerId && submissionMemberId === pPlayerId) {
              return true
            }
            return false
          })
          
          if (player) {
            // 플레이어 상태를 'PLAYING'으로 업데이트 (제출 완료 상태)
            player.gamePlayerStatus = 'PLAYING'
            console.log(`[Solo Game] 플레이어 ${player.nickname || playerId} 제출 완료 - 상태 업데이트: PLAYING`)
            
            // memberId 업데이트 (있는 경우)
            if (memberId != null && player.memberId === undefined) {
              player.memberId = Number(memberId)
            }
          } else {
            console.warn(`[Solo Game] 플레이어를 찾을 수 없음: playerId=${playerId}, memberId=${memberId}`)
          }
        },
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
    async handleRoadviewLoadError(errorData) {
      console.log('[Solo Game] handleRoadviewLoadError 호출됨:', {
        isServerMode: this.isServerMode,
        errorData,
        roomId: this.roomId
      })
      
      if (!this.isServerMode) {
        console.warn('[Solo Game] 더미 모드에서는 로드뷰 재발급을 요청하지 않습니다.')
        return
      }

      if (!this.roomId) {
        console.error('[Solo Game] roomId가 없어 재발급 요청을 할 수 없습니다.')
        return
      }

      // 재시도 중인지 확인
      this.isRetryingRoadview = this.soloGameFlow.isRetrying()
      
      console.log(`[Solo Game] 로드뷰 로딩 실패 - 재발급 요청 시작 (재시도 중: ${this.isRetryingRoadview}, roomId: ${this.roomId})`)
      
      try {
        const success = await this.soloGameFlow.requestRoadviewReIssue()
        console.log(`[Solo Game] 재발급 요청 결과: ${success}`)
        
        if (success) {
          // 재시도 중 플래그 업데이트
          this.isRetryingRoadview = this.soloGameFlow.isRetrying()
          console.log('[Solo Game] 로드뷰 재발급 요청 완료. 서버에서 새로운 좌표 브로드캐스트 대기 중...')
          // 재시도 중이므로 에러 화면을 표시하지 않음
          // 새로운 좌표를 받으면 handleNextRound에서 자동으로 로드뷰를 다시 로드함
        } else {
          // 최대 시도 횟수 초과 시에만 에러 화면 표시
          this.isRetryingRoadview = this.soloGameFlow.isRetrying()
          console.warn(`[Solo Game] 로드뷰 재발급 요청 실패 (success: ${success}, isRetrying: ${this.isRetryingRoadview})`)
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

    // 통합 라운드 데이터 처리 함수 (서버/더미 모드 공통)
    processRoundData(message, isReIssue = false) {
      console.log('[Solo Game] 라운드 데이터 처리:', { message, isReIssue });

      // gameStore 업데이트
      if (message.currentRound != null) {
        this.gameStore.state.currentRound = Number(message.currentRound);
      }
      
      if (message.totalRounds != null) {
        this.gameStore.state.totalRounds = message.totalRounds;
      }
      
      // 좌표 정보 추출 및 업데이트
      const targetLat = message.roundInfo?.targetLat ?? message.targetLat ?? message.location?.lat;
      const targetLng = message.roundInfo?.targetLng ?? message.targetLng ?? message.location?.lng;
      
      if (targetLat != null && targetLng != null) {
        this.gameStore.state.currentLocation = {
          lat: Number(targetLat),
          lng: Number(targetLng)
        };
        this.gameStore.state.actualLocation = {
          lat: Number(targetLat),
          lng: Number(targetLng)
        };
      }
      
      // locationInfo 업데이트
      if (message.locationInfo) {
        this.gameStore.state.locationInfo = message.locationInfo;
      }
      
      // poiName 처리 (roundInfo.poiName 우선, 직접 메시지의 poiName, locationInfo.poiName 폴백)
      const poiName = message.roundInfo?.poiName || message.poiName || message.locationInfo?.poiName || '';
      if (poiName) {
        if (!this.gameStore.state.locationInfo) {
          this.gameStore.state.locationInfo = { 
            name: '', 
            description: '', 
            image: '', 
            fact: '', 
            poiName: '', 
            fullAddress: '' 
          };
        }
        this.gameStore.state.locationInfo.poiName = poiName;
        // BaseGameView prop용 currentPoiName 업데이트
        this.currentPoiName = poiName;
      } else {
        // poiName이 없으면 빈 문자열로 초기화
        this.currentPoiName = '';
      }
      
      // 라운드 시간 설정
      if (message.roundTime != null) {
        this.gameStore.state.remainingTime = message.roundTime;
      }
      
      // 라운드 상태 초기화 (재발급 메시지가 아닌 경우에만)
      if (!isReIssue) {
        this.gameStore.state.roundEnded = false;
        this.gameStore.state.hasSubmittedGuess = false;
        this.gameStore.state.userGuess = null;
        this.gameStore.state.playerGuesses = [];
        this.gameStore.state.showRoundResults = false;
        
        // 시뮬레이션 상태 초기화
        this.simulationTriggered = false;
        this.allPlayersSubmitted = false;
        
        // 플레이어 제출 상태 초기화 (더미 모드)
        if (this.isDummyRuntime) {
          this.gameStore.state.players.forEach(player => {
            player.hasSubmitted = false;
          });
        }
        
        // 더미 모드에서는 다른 플레이어 시뮬레이션 트리거
        if (this.isDummyRuntime) {
          console.log('더미 모드: 다른 플레이어 시뮬레이션 트리거');
          this.simulationTriggered = true;
          console.log('시뮬레이션 트리거 설정됨:', this.simulationTriggered);
        }
      }
      
      console.log(`라운드 ${this.gameStore.state.currentRound} 데이터 처리 완료`);
    },

    // 라운드 데이터 수신 이벤트 처리 (더미 모드 전용, processRoundData로 위임)
    handleRoundDataReceived(message) {
      console.log('[Solo Game] 라운드 데이터 수신 (더미 모드):', message);
      // processRoundData로 통합 처리
      this.processRoundData(message, false);
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
      
      // 더미 모드 게임 종료 시뮬레이션 호출 (로컬 데이터로 직접 설정)
      this.simulateGameEnd();

      // 30초 후 자동 로비 이동 카운트다운 시작 (더미 모드)
      this.startAutoExitCountdown(30);
      
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
      const userId = this.currentUserId || this.gameStore?.state?.currentUser?.id
      if (userId) {
        this.showPlayerChatBubble(userId, message);
      }
      
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
        roundTime: 120,
        roundInfo: {
          poiName: (this.gameStore.state.locationInfo && this.gameStore.state.locationInfo.name) ? this.gameStore.state.locationInfo.name : '더미 지명'
        }
      }
      
      // 통합 라운드 데이터 처리 함수 사용 (더미 모드)
      this.processRoundData(roundDataMessage, false)
      
      // 라운드 데이터 가져오기
      this.fetchRoundData()
      
      // 시뮬레이션 트리거는 processRoundData에서 설정됨
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
      
      // 더미 모드에서는 라운드 횟수로 게임 종료를 판단하지 않음
      // WebSocket 게임 종료 메시지를 받을 때만 게임 종료 처리
      // (더미 모드에서는 simulateGameEnd()를 직접 호출하여 게임 종료 시뮬레이션)
    },

    /**
     * 더미 게임 종료 시뮬레이션
     * 더미 모드에서는 WebSocket 메시지를 받지 않으므로, 로컬 데이터로 직접 설정
     */
    simulateGameEnd() {
      console.log('[Solo Game] 더미 게임 종료 시뮬레이션')
      
      // 플레이어들을 점수 순으로 정렬
      const sortedPlayers = [...this.gameStore.state.players].sort((a, b) => (b.score || 0) - (a.score || 0))
      
      // PlayerFinalResult 형식으로 매핑
      const playerResults = sortedPlayers.map((player, index) => ({
        playerId: player.id,
        nickname: player.nickname || '알 수 없음',
        markerImageUrl: player.markerImageUrl || player.equippedMarker || null,
        totalScore: player.totalScore || player.score || 0,
        finalRank: index + 1, // 순위는 1부터 시작
        earnedPoint: Math.floor((player.totalScore || player.score || 0) / 10) // 점수에 비례한 포인트 (예시)
      }))
      
      // 로컬 데이터에 게임 결과 저장
      this.finalGameResult = {
        gameId: null,
        message: '게임이 종료되었습니다.',
        timestamp: Date.now(),
        playerResults: playerResults
      }
      
      // 게임 결과 모달 표시
      this.showGameResults = true
      
      console.log('[Solo Game] 더미 모드 게임 결과 모달 표시:', this.finalGameResult)
    },

    finishGame() {
      // 서버 모드에서는 사용하지 않음 (서버에서 game/finished 채널로 게임 종료 브로드캐스트)
      // 더미 모드에서만 사용
      if (this.isServerMode) {
        console.warn('[Solo Game] 서버 모드에서는 finishGame을 사용하지 않습니다. 서버에서 게임 종료를 처리합니다.');
        return;
      }
      
      console.log('[Solo Game] 더미 모드 게임 완료 처리 시작');
      
      // 총 게임 시간 계산
      if (this.gameStartTime) {
        this.totalGameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
      }
      
      // 플레이어들의 평균 거리 계산
      this.calculatePlayerAverageDistances();
      
      // 더미 모드 게임 종료 시뮬레이션 호출 (로컬 데이터로 직접 설정)
      this.simulateGameEnd();

      // 30초 후 자동 로비 이동 카운트다운 시작
      this.startAutoExitCountdown(30);
      
      console.log('[Solo Game] 더미 모드 게임 완료, 최종 결과 표시');
    },

    restartGame() {
      console.log('[Solo Game] 게임 방으로 복귀')
      
      // 로컬 데이터 초기화
      this.showGameResults = false;
      this.finalGameResult = null;
      // 자동 퇴장 카운트다운 취소
      this.cancelAutoExitCountdown();
      
      // 모든 구독 해제
      this.cleanupSubscriptions();
      
      // 게임 방으로 돌아가기
      const roomId = this.roomId || this.$route?.params?.roomId;
      if (roomId) {
        console.log('[Solo Game] RoomView로 이동:', roomId);
        this.$router.push({
          name: 'RoomView',
          params: { roomId: roomId }
        });
      } else {
        console.warn('[Solo Game] roomId가 없어 로비로 이동합니다.');
        // roomId가 없으면 로비로 이동
        this.$router.push('/lobby');
      }
    },

    exitToLobby() {
      // 확인 다이얼로그 표시
      if (!confirm('정말 게임을 나가시겠습니까? 진행 중인 게임은 저장되지 않습니다.')) {
        return
      }

      // 자동 퇴장 카운트다운 취소
      this.cancelAutoExitCountdown()

      // 모든 구독 해제
      this.cleanupSubscriptions()

      // 로비로 새로고침 이동
      window.location.href = "/lobby"
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

      // 로딩 핸들러만 해제 (구독은 RoomView에서 관리하므로 해제하지 않음)
      if (soloGameWebSocket && soloGameWebSocket.handlers) {
        soloGameWebSocket.handlers.onLoadingStatus = null
        console.log('[Solo Game] 로딩 상태 핸들러 해제 완료 (구독은 RoomView에서 관리)')
      }

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
      
      // 플레이어 제출 상태 초기화 (더미 모드)
      if (this.isDummyRuntime) {
        this.gameStore.state.players.forEach(player => {
          player.hasSubmitted = false;
          player.distanceToTarget = null;
          player.lastRoundScore = 0;
        });
      } else {
        // 서버 모드: gamePlayers의 제출 상태 초기화
        if (this.gamePlayers && this.gamePlayers.length > 0) {
          this.gamePlayers.forEach(player => {
            player.gamePlayerStatus = 'WAITING'
            player.distanceToTarget = null
            player.lastRoundScore = 0
          })
          console.log('[Solo Game] 다음 라운드 준비 - 플레이어 제출 상태 초기화: WAITING')
        }
      }
      
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
      const players = this.isDummyRuntime ? this.gameStore.state.players : this.localPlayers
      
      if (!players || players.length === 0) {
        return 1;
      }
      
      // 점수 기준으로 정렬된 플레이어 배열 생성
      const sortedPlayers = [...players].sort((a, b) => (b.totalScore || b.score || 0) - (a.totalScore || a.score || 0));
      
      // 현재 사용자의 인덱스 찾기
      const userId = this.currentUserId
      if (!userId) {
        return 1
      }
      const currentUserIndex = sortedPlayers.findIndex(player => String(player.id) === String(userId))
      
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
      const userId = this.currentUserId
      const players = this.isDummyRuntime ? this.gameStore.state.players : this.localPlayers
      const otherPlayers = players.filter(
        (player) => String(player.id) !== String(userId)
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

    // ===== 자동 로비 이동 유틸 =====
    startAutoExitCountdown(seconds = 30) {
      try {
        // 중복 방지
        this.cancelAutoExitCountdown();
        this.autoExitRemaining = Number(seconds) > 0 ? Number(seconds) : 30;
        this.autoExitTimerId = setInterval(() => {
          this.autoExitRemaining = Math.max(0, this.autoExitRemaining - 1);
          if (this.autoExitRemaining <= 0) {
            this.cancelAutoExitCountdown();
            this.redirectToLobby();
          }
        }, 1000);
        console.log(`[Solo Game] 자동 로비 이동 카운트다운 시작: ${this.autoExitRemaining}초`);
      } catch (e) {
        console.warn('[Solo Game] 자동 퇴장 카운트다운 시작 오류:', e);
      }
    },

    cancelAutoExitCountdown() {
      if (this.autoExitTimerId) {
        clearInterval(this.autoExitTimerId);
        this.autoExitTimerId = null;
      }
      this.autoExitRemaining = 0;
    },

    redirectToLobby() {
      try {
        console.log('[Solo Game] 30초 경과 - 로비로 자동 이동');
        // 이동 전 정리
        this.cleanupSubscriptions();
        this.$router.replace('/lobby');
      } catch (e) {
        console.error('[Solo Game] 로비 이동 중 오류:', e);
      }
    }
  },
};
</script>