/**
 * Solo 로드뷰 게임 플로우 Composable
 * 
 * 멀티플레이어 개인전(Solo) 게임 모드의 전체 플로우를 관리합니다:
 * 1. 게임 시작
 * 2. 라운드 진행 (타이머, 제출, 결과)
 * 3. 라운드 전환
 * 4. 게임 종료
 */

import { ref, computed } from 'vue'
import soloGameApi from '../services/soloGameApi'
import soloGameWebSocket from '../services/soloGameWebSocket'
import webSocketManager from '@/features/game/multiplayer/shared/services/websocket/composables'

export function useSoloGameFlow(gameStore, uiCallbacks = {}) {
  // 게임 상태
  const gameId = ref(null)
  const roundId = ref(null)
  const roomId = ref(null)
  const roundStartTime = ref(null)
  const timerInterval = ref(null)
  const transitionInterval = ref(null)
  const transitionCountdown = ref(10) // 라운드 전환 카운트다운 (초)

  // WebSocket 연결 상태
  const isConnected = computed(() => webSocketManager.isConnected.value)
  
  // UI 콜백 (SoloGameView에서 전달받음)
  const callbacks = {
    onIntroShow: null,
    onRoundResultShow: null,
    onNextRoundShow: null,
    onRoundReissued: null,
    onGameFinish: null,
    ...uiCallbacks
  }

  /**
   * WebSocket 연결
   */
  const connectWebSocket = async () => {
    return new Promise((resolve, reject) => {
      if (isConnected.value) {
        console.log('[Solo Flow] WebSocket 이미 연결됨')
        resolve()
        return
      }

      webSocketManager.connect('/ws', () => {
        console.log('[Solo Flow] WebSocket 연결 성공')
        resolve()
      })

      // 타임아웃 설정 (10초)
      setTimeout(() => {
        if (!isConnected.value) {
          console.warn('[Solo Flow] WebSocket 연결 타임아웃')
          reject(new Error('WebSocket 연결 실패'))
        }
      }, 10000)
    })
  }

  /**
   * 게임 시작
   */
  const startGame = async (roomIdParam, settings) => {
    try {
      console.log('[Solo Flow] 게임 시작 요청:', { roomIdParam, settings })

      roomId.value = roomIdParam

      // WebSocket 연결 확인
      if (!isConnected.value) {
        await connectWebSocket()
      }

      // 게임 시작 API 호출
      const result = await soloGameApi.startSoloGame(roomIdParam, {
        gameRoomId: parseInt(roomIdParam),
        totalRounds: settings.totalRounds || 5,
        timeLimit: settings.timeLimit || 60000
      })

      // 게임 데이터 저장
      gameId.value = result.gameId
      roundId.value = result.roundInfo.roundId
      
      // 게임 스토어 업데이트
      if (gameStore) {
        gameStore.state.gameId = result.gameId
        gameStore.state.currentRound = result.currentRound
        gameStore.state.totalRounds = result.totalRounds
        gameStore.state.currentLocation = {
          lat: result.roundInfo.targetLat,
          lng: result.roundInfo.targetLng
        }
        gameStore.state.actualLocation = {
          lat: result.roundInfo.targetLat,
          lng: result.roundInfo.targetLng
        }
        gameStore.state.players = result.gamePlayers || []
      }

      // WebSocket 채널 구독
      setupWebSocketSubscriptions(roomIdParam, result.gameId)

      console.log('[Solo Flow] 게임 시작 완료:', result)
      
      // UI 콜백: 인트로 오버레이 표시
      if (callbacks.onIntroShow) {
        callbacks.onIntroShow()
      }

      return result
    } catch (error) {
      console.error('[Solo Flow] 게임 시작 오류:', error)
      throw error
    }
  }

  /**
   * WebSocket 구독 설정
   */
  const setupWebSocketSubscriptions = (roomIdParam, gameIdParam) => {
    console.log('[Solo Flow] WebSocket 구독 설정')

    // 게임 채널 구독
    soloGameWebSocket.setupGameSubscriptions(roomIdParam, {
      onTimerStart: handleTimerStart,
      onTimerSync: handleTimerSync,
      onRoundResult: handleRoundResult,
      onRoundTransition: handleRoundTransition,
      onNextRound: handleNextRound,
      onGameFinished: handleGameFinished
    })

    // 제출 알림 채널 구독
    soloGameWebSocket.setupSubmissionSubscription(gameIdParam)
  }

  /**
   * 타이머 시작 처리
   */
  const handleTimerStart = (message) => {
    console.log('[Solo Flow] 타이머 시작:', message)

    roundStartTime.value = Date.now()
    if (gameStore) {
      gameStore.state.isFinalCountdown = false
    }

    // 타이머 UI 업데이트
    clearTimerInterval()
    timerInterval.value = setInterval(() => {
      if (!gameStore) return

      const now = Date.now() + message.timeDiff
      const elapsed = now - message.startTime
      const remaining = Math.max(0, message.duration - elapsed)

      gameStore.state.remainingTime = Math.ceil(remaining / 1000)

      if (remaining <= 0) {
        clearTimerInterval()
      }
    }, 100)
  }

  /**
   * 타이머 동기화 처리
   */
  const handleTimerSync = (message) => {
    console.log('[Solo Flow] 타이머 동기화:', message)

    if (!gameStore) return

    if (typeof message.remainingTimeMs === 'number') {
      const remaining = Math.max(0, Math.ceil(message.remainingTimeMs / 1000))
      gameStore.state.remainingTime = remaining
    }

    if (typeof message.isFinalCountDown === 'boolean') {
      gameStore.state.isFinalCountdown = message.isFinalCountDown
    }
  }

  /**
   * 라운드 결과 처리
   */
  const handleRoundResult = (message) => {
    console.log('[Solo Flow] 라운드 결과:', message)

    if (!gameStore) return

    // 타이머 정리
    clearTimerInterval()

    // 정답 좌표 설정
    gameStore.state.actualLocation = {
      lat: message.targetLat,
      lng: message.targetLng
    }

    // 플레이어 결과 업데이트
    if (message.playerTotalResults) {
      message.playerTotalResults.forEach((result, index) => {
        const player = gameStore.state.players.find(p => p.id === result.playerId)
        if (player) {
          player.totalScore = result.totalScore
          player.roundRank = result.roundRank
          player.score = result.totalScore

          // 제출 결과 매칭
          const submission = message.playerSubmissionResults[index]
          if (submission) {
            player.distanceToTarget = submission.distance
            player.lastRoundScore = submission.earnedScore
          }
        }
      })

      // 점수 순으로 정렬
      gameStore.state.players.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))

      // 최고 점수 플레이어 설정
      if (gameStore.state.players.length > 0) {
        const topPlayer = gameStore.state.players[0]
        gameStore.state.topPlayer = {
          playerName: topPlayer.nickname,
          distance: topPlayer.distanceToTarget
        }
      }
    }

    // 플레이어 추측 위치 설정 (지도 표시용)
    gameStore.state.playerGuesses = message.playerSubmissionResults.map((submission, index) => {
      const player = message.playerTotalResults[index]
      return {
        playerId: player.playerId,
        playerName: player.nickname,
        position: { lat: submission.lat, lng: submission.lng },
        color: getPlayerColor(player.playerId),
        score: submission.earnedScore,
        distance: submission.distance
      }
    })

    // 라운드 종료 상태 설정
    gameStore.state.roundEnded = true
    gameStore.endGameRound()
    
    // UI 콜백: 라운드 결과 표시
    if (callbacks.onRoundResultShow) {
      callbacks.onRoundResultShow()
    }
  }

  /**
   * 라운드 전환 처리
   */
  const handleRoundTransition = (message) => {
    console.log('[Solo Flow] 라운드 전환:', message)

    if (!gameStore) return

    // 전환 타이머 시작 (10초 카운트다운)
    clearTransitionInterval()
    transitionInterval.value = setInterval(() => {
      const now = Date.now() + message.timeDiff
      const remaining = Math.max(0, message.nextStartTime - now)
      const seconds = Math.ceil(remaining / 1000)

      // 카운트다운 값 업데이트 (RoundResults 로딩바 연동)
      transitionCountdown.value = seconds
      console.log(`다음 라운드까지: ${seconds}초`)

      if (remaining <= 0) {
        clearTransitionInterval()
      }
    }, 100)
  }

  /**
   * 다음 라운드 시작 처리
   */
  const handleNextRound = (message) => {
    console.log('[Solo Flow] 다음 라운드:', message)

    if (!gameStore) return

    clearTimerInterval()

    const previousRoundNumber = gameStore.state.currentRound
    const previousRoundId = roundId.value != null ? roundId.value.toString() : null
    const incomingRoundId = message.roundInfo?.roundId ?? null
    const incomingRoundIdString = incomingRoundId != null ? incomingRoundId.toString() : null

    // 전환 타이머 정리
    clearTransitionInterval()

    // 라운드 정보 업데이트
    gameId.value = message.gameId
    roundId.value = message.roundInfo.roundId
    gameStore.state.gameId = message.gameId

    gameStore.state.currentRound = message.currentRound
    gameStore.state.currentLocation = {
      lat: message.roundInfo.targetLat,
      lng: message.roundInfo.targetLng
    }
    gameStore.state.actualLocation = {
      lat: message.roundInfo.targetLat,
      lng: message.roundInfo.targetLng
    }

    // 라운드 상태 초기화
    gameStore.state.roundEnded = false
    gameStore.state.hasSubmittedGuess = false
    gameStore.state.userGuess = null
    gameStore.state.playerGuesses = []
    gameStore.state.showRoundResults = false

    // 플레이어 제출 상태 초기화
    gameStore.state.players.forEach(player => {
      player.hasSubmitted = false
      player.distanceToTarget = null
      player.lastRoundScore = 0
    })

    // 라운드 시작 시간 초기화
    roundStartTime.value = null
    
    // UI 콜백: 다음 라운드 오버레이 표시
    const isReissuedRound =
      previousRoundId &&
      incomingRoundIdString &&
      previousRoundId === incomingRoundIdString &&
      previousRoundNumber === message.currentRound

    if (isReissuedRound) {
      if (callbacks.onRoundReissued) {
        callbacks.onRoundReissued(message)
      }
    } else if (callbacks.onNextRoundShow) {
      callbacks.onNextRoundShow()
    }
  }

  /**
   * 게임 종료 처리
   */
  const handleGameFinished = (message) => {
    console.log('[Solo Flow] 게임 종료:', message)

    if (!gameStore) return

    // 모든 타이머 정리
    clearTimerInterval()
    clearTransitionInterval()

    // 백엔드에서 받은 최종 결과 데이터 저장
    if (message.playerResults) {
      gameStore.state.finalGameResult = {
        gameId: message.gameId,
        message: message.message,
        timestamp: message.timestamp,
        playerResults: message.playerResults
      }
    }

    // 최종 결과 표시
    gameStore.state.showGameResults = true
    
    // UI 콜백: 게임 종료 화면 표시
    if (callbacks.onGameFinish) {
      callbacks.onGameFinish()
    }
  }

  /**
   * 정답 제출
   */
  const submitAnswer = async (position) => {
    if (!gameStore || !gameId.value || !roundId.value) {
      console.error('[Solo Flow] 제출 불가: 게임 정보 없음')
      return
    }

    if (gameStore.state.hasSubmittedGuess) {
      console.warn('[Solo Flow] 이미 제출함')
      return
    }

    try {
      const timeToAnswer = roundStartTime.value ? Date.now() - roundStartTime.value : 0

      console.log('[Solo Flow] 정답 제출:', { position, timeToAnswer })

      // API 호출
      await soloGameApi.submitSoloAnswer(roomId.value, gameId.value, roundId.value, {
        lat: position.lat,
        lng: position.lng,
        timeToAnswer
      })

      // 제출 상태 업데이트
      gameStore.state.hasSubmittedGuess = true
      gameStore.state.userGuess = { position }

      // 현재 플레이어 제출 상태 업데이트
      const currentPlayer = gameStore.state.players.find(
        p => p.id === gameStore.state.currentUser.id
      )
      if (currentPlayer) {
        currentPlayer.hasSubmitted = true
      }

      console.log('[Solo Flow] 정답 제출 완료')
    } catch (error) {
      console.error('[Solo Flow] 정답 제출 오류:', error)
      throw error
    }
  }

  /**
   * 타이머 인터벌 정리
   */
  const clearTimerInterval = () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
  }

  /**
   * 전환 타이머 인터벌 정리
   */
  const clearTransitionInterval = () => {
    if (transitionInterval.value) {
      clearInterval(transitionInterval.value)
      transitionInterval.value = null
    }
  }

  /**
   * 플레이어 색상 가져오기
   */
  const getPlayerColor = (playerId) => {
    const colors = [
      '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF',
      '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59',
      '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
    ]
    const idSum = playerId.toString().split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
    return colors[idSum % colors.length]
  }

  /**
   * 게임 정리
   */
  const cleanup = () => {
    console.log('[Solo Flow] 게임 정리 시작')

    clearTimerInterval()
    clearTransitionInterval()
    soloGameWebSocket.unsubscribeAll()

    gameId.value = null
    roundId.value = null
    roomId.value = null
    roundStartTime.value = null

    console.log('[Solo Flow] 게임 정리 완료')
  }

  return {
    // 상태
    gameId,
    roundId,
    roomId,
    isConnected,
    transitionCountdown,

    // 메서드
    connectWebSocket,
    startGame,
    submitAnswer,
    cleanup
  }
}

export default useSoloGameFlow

