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
  const reIssueAttempts = ref(0) // 로드뷰 재발급 시도 횟수
  const maxReIssueAttempts = 5 // 최대 재발급 시도 횟수
  const isRetryingRoadview = ref(false) // 로드뷰 재시도 중 여부
  const isOverlayActive = ref(false) // 오버레이 진행 중 여부
  const pendingTimerStartMessage = ref(null) // 오버레이 진행 중 받은 타이머 시작 메시지
  const timeDiff = ref(0) // 서버 시간과 클라이언트 시간의 차이 (밀리초)

  // WebSocket 연결 상태
  const isConnected = computed(() => webSocketManager.isConnected.value)
  
  // UI 콜백 (SoloGameView에서 전달받음)
  const callbacks = {
    onIntroShow: null,
    onRoundResultShow: null,
    onNextRoundShow: null,
    onGameFinish: null,
    onTimerSync: null,
    onGamePlayersUpdate: null,
    ...uiCallbacks
  }

  const setCallbacks = (nextCallbacks = {}) => {
    Object.assign(callbacks, nextCallbacks)
  }

  const ensureSubmissionSubscription = (incomingGameId) => {
    if (incomingGameId == null) {
      return
    }

    const normalized = Number(incomingGameId)
    if (Number.isNaN(normalized)) {
      return
    }

    if (gameId.value === normalized) {
      return
    }

    gameId.value = normalized
    soloGameWebSocket.setupSubmissionSubscription(normalized, {
      onPlayerSubmission: handlePlayerSubmission
    })
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

  const initializeFromServerStart = async (roomIdParam) => {
    if (!roomIdParam) {
      throw new Error('roomId가 필요합니다.')
    }

    console.log('[Solo Flow] 서버 주도 게임 초기화:', { roomIdParam })

    roomId.value = roomIdParam

    if (!isConnected.value) {
      await connectWebSocket()
    }

    setupWebSocketSubscriptions(roomIdParam)
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
      onGameFinished: handleGameFinished,
      onGlobalChat: handleGlobalChat
    })

    if (gameIdParam != null) {
      ensureSubmissionSubscription(gameIdParam)
    }
  }

  /**
   * 타이머 시작 처리
   */
  const handleTimerStart = (message) => {
    console.log('[Solo Flow] 타이머 시작:', message)

    ensureSubmissionSubscription(message?.gameId)

    const detectedRoundId = message?.roundInfo?.roundId ?? message?.roundId
    if (detectedRoundId != null) {
      const parsedRoundId = Number(detectedRoundId)
      if (!Number.isNaN(parsedRoundId)) {
        roundId.value = parsedRoundId
      }
    }

    // 오버레이가 진행 중이면 타이머 시작 메시지 저장
    if (isOverlayActive.value) {
      console.log('[Solo Flow] 오버레이 진행 중 - 타이머 시작 메시지 저장')
      pendingTimerStartMessage.value = message
      return
    }

    // 오버레이가 완료된 경우에만 타이머 시작
    startTimer(message)
  }

  /**
   * 타이머 시작 (내부 헬퍼)
   */
  const startTimer = (message) => {
    // TimerStartMessage: { roundId, gameMode, serverStartTimeMs, durationMs, serverTimestamp }
    // roundStartTime 설정: message.serverStartTimeMs가 있으면 사용, 없으면 현재 시간 사용
    if (message?.serverStartTimeMs != null) {
      // serverStartTimeMs는 이미 밀리초 단위
      roundStartTime.value = Number(message.serverStartTimeMs)
      console.log('[Solo Flow] ✅ roundStartTime 설정 (serverStartTimeMs):', roundStartTime.value)
    } else if (message?.startTime != null) {
      // 하위 호환성: startTime 필드도 지원 (초 단위면 * 1000)
      const serverStartTime = typeof message.startTime === 'number' 
        ? (message.startTime > 1000000000000 ? message.startTime : message.startTime * 1000)
        : Date.now()
      roundStartTime.value = serverStartTime
      console.log('[Solo Flow] ✅ roundStartTime 설정 (startTime):', roundStartTime.value)
    } else {
      roundStartTime.value = Date.now()
      console.warn('[Solo Flow] ⚠️ serverStartTimeMs가 없어 현재 시간 사용:', roundStartTime.value)
    }

    console.log('[Solo Flow] 📊 타이머 시작 정보:', {
      roundStartTime: roundStartTime.value,
      serverStartTimeMs: message?.serverStartTimeMs,
      durationMs: message?.durationMs,
      serverTimestamp: message?.serverTimestamp
    })

    // 타이머 UI 업데이트
    clearTimerInterval()
    
    // 서버 시간 동기화를 위한 timeDiff 계산 (서버 타임스탬프와 클라이언트 시간 차이)
    const serverTimestamp = message?.serverTimestamp || message?.serverStartTimeMs
    if (serverTimestamp) {
      // 서버 타임스탬프를 받은 시점의 클라이언트 시간과 서버 시간의 차이 계산
      // timeDiff = 클라이언트 시간 - 서버 시간 (양수면 클라이언트가 빠름, 음수면 서버가 빠름)
      timeDiff.value = Date.now() - Number(serverTimestamp)
      console.log('[Solo Flow] ⏱️ timeDiff 계산:', {
        serverTimestamp: Number(serverTimestamp),
        clientTime: Date.now(),
        timeDiff: timeDiff.value
      })
    } else {
      timeDiff.value = 0
      console.warn('[Solo Flow] ⚠️ serverTimestamp가 없어 timeDiff를 0으로 설정')
    }
    
    timerInterval.value = setInterval(() => {
      if (!gameStore) return

      // 서버 시간에 맞춘 현재 시간 계산
      const now = Date.now() - timeDiff.value
      const elapsed = now - roundStartTime.value
      const duration = message?.durationMs || 120000
      const remaining = Math.max(0, duration - elapsed)

      // 소수점까지 정확하게 저장 (밀리초를 초로 변환)
      gameStore.state.remainingTime = remaining / 1000

      if (remaining <= 0) {
        clearTimerInterval()
        gameStore.state.remainingTime = 0
      }
    }, 100)
  }

  const handleTimerSync = (message) => {
    console.log('[Solo Flow] 타이머 동기화:', message)

    ensureSubmissionSubscription(message?.gameId)

    if (!gameStore) {
      return
    }

    // 오버레이가 진행 중이면 타이머 업데이트하지 않음
    if (isOverlayActive.value) {
      console.log('[Solo Flow] 오버레이 진행 중 - 타이머 동기화 스킵')
      return
    }

    if (message?.remainingTimeMs != null) {
      // 소수점까지 정확하게 저장 (밀리초를 초로 변환)
      const remainingSeconds = Math.max(0, Number(message.remainingTimeMs) / 1000)
      gameStore.state.remainingTime = remainingSeconds
      console.log(`[Solo Flow] 타이머 동기화: ${remainingSeconds.toFixed(3)}초`)
    }

    if (message?.finalCountDown != null) {
      gameStore.state.finalCountDown = Boolean(message.finalCountDown)
    }

    if (callbacks.onTimerSync) {
      callbacks.onTimerSync(message)
    }
  }

  /**
   * 플레이어 제출 알림 처리
   */
  const handlePlayerSubmission = (message) => {
    console.log('[Solo Flow] 플레이어 제출 알림:', message)

    if (!gameStore) {
      return
    }

    // PlayerSubmissionMessage: { playerId, roundId, timestamp }
    const playerId = message?.playerId
    if (!playerId) {
      console.warn('[Solo Flow] 플레이어 제출 메시지에 playerId가 없음:', message)
      return
    }

    // 현재 라운드와 일치하는지 확인
    const messageRoundId = message?.roundId
    if (messageRoundId != null && roundId.value != null) {
      const normalizedMessageRoundId = Number(messageRoundId)
      const normalizedCurrentRoundId = Number(roundId.value)
      if (!Number.isNaN(normalizedMessageRoundId) && !Number.isNaN(normalizedCurrentRoundId)) {
        if (normalizedMessageRoundId !== normalizedCurrentRoundId) {
          console.log('[Solo Flow] 다른 라운드의 제출 메시지 무시:', {
            messageRoundId: normalizedMessageRoundId,
            currentRoundId: normalizedCurrentRoundId
          })
          return
        }
      }
    }

    // 플레이어 찾기 및 제출 상태 업데이트
    const player = gameStore.state.players.find(p => p.id === playerId)
    if (player) {
      player.hasSubmitted = true
      console.log(`[Solo Flow] 플레이어 ${player.nickname || playerId} 제출 완료`)
    } else {
      console.warn(`[Solo Flow] 플레이어를 찾을 수 없음: ${playerId}`)
    }
  }

  /**
   * 게임 중 채팅 메시지 처리
   */
  const handleGlobalChat = (message) => {
    console.log('[Solo Flow] 게임 중 채팅 메시지 수신:', message)

    if (!gameStore) {
      console.warn('[Solo Flow] gameStore가 없어 채팅 메시지를 처리할 수 없습니다.')
      return
    }

    // gameStore.state.chatMessages가 배열인지 확인
    if (!Array.isArray(gameStore.state.chatMessages)) {
      console.warn('[Solo Flow] chatMessages가 배열이 아님, 초기화:', gameStore.state.chatMessages)
      gameStore.state.chatMessages = []
    }

    // MultiGameGlobal: { senderId, messageId, nickname, content, messageType, timestamp }
    // timestamp는 LocalDateTime 형식일 수 있으므로 올바르게 변환
    let timestamp = new Date()
    if (message.timestamp) {
      if (typeof message.timestamp === 'string') {
        // ISO 형식 문자열인 경우
        timestamp = new Date(message.timestamp)
      } else if (typeof message.timestamp === 'number') {
        // 밀리초 타임스탬프인 경우
        timestamp = new Date(message.timestamp)
      } else if (message.timestamp instanceof Date) {
        // 이미 Date 객체인 경우
        timestamp = message.timestamp
      }
    }

    const chatMessage = {
      id: message.messageId || `chat-${Date.now()}-${Math.random()}`,
      sender: message.nickname || '알 수 없음',
      message: message.content || '',
      timestamp: timestamp,
      system: false,
      senderId: message.senderId
    }

    gameStore.state.chatMessages.push(chatMessage)
    console.log('[Solo Flow] ✅ 채팅 메시지 추가 완료:', chatMessage, '총 메시지 수:', gameStore.state.chatMessages.length)
  }

  /**
   * 게임 중 채팅 메시지 발행
   */
  const publishGlobalChatMessage = (content) => {
    if (!roomId.value) {
      console.error('[Solo Flow] roomId가 없어 채팅 메시지를 발행할 수 없습니다.')
      return false
    }

    try {
      const success = soloGameWebSocket.publishGlobalChatMessage(roomId.value, content)
      return success
    } catch (error) {
      console.error('[Solo Flow] 채팅 메시지 발행 중 오류:', error)
      return false
    }
  }

  /**
   * 라운드 결과 처리
   */
  const handleRoundResult = (message) => {
    console.log('[Solo Flow] 라운드 결과:', message)

    ensureSubmissionSubscription(message?.gameId)

    const detectedRoundId = message?.roundInfo?.roundId ?? message?.roundId
    if (detectedRoundId != null) {
      const parsedRoundId = Number(detectedRoundId)
      if (!Number.isNaN(parsedRoundId)) {
        roundId.value = parsedRoundId
      }
    }

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
      // gameStore에서 플레이어 정보 가져오기 (마커 이미지, 색상 등)
      const storePlayer = gameStore.state.players.find(p => p.id === player.playerId)
      return {
        playerId: player.playerId,
        playerName: player.nickname,
        position: { lat: submission.lat, lng: submission.lng },
        color: storePlayer?.color || '#3b82f6', // 기본값: 파란색
        markerImageUrl: storePlayer?.equippedMarker || storePlayer?.markerImageUrl || null,
        score: submission.earnedScore,
        distance: submission.distance
      }
    })

    // 라운드 종료 상태 설정
    gameStore.state.roundEnded = true
    gameStore.endGameRound()
    
    // 전환 타이머 초기화 (서버 메시지가 올 때까지 10초로 설정)
    transitionCountdown.value = 10
    
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
    
    // 초기 카운트다운 설정 (서버 메시지가 올 때 즉시 설정)
    const now = Date.now() + message.timeDiff
    const remaining = Math.max(0, message.nextStartTime - now)
    const initialSeconds = Math.ceil(remaining / 1000)
    transitionCountdown.value = initialSeconds
    
    transitionInterval.value = setInterval(() => {
      const currentTime = Date.now() + message.timeDiff
      const remaining = Math.max(0, message.nextStartTime - currentTime)
      const seconds = Math.ceil(remaining / 1000)

      // 카운트다운 값 업데이트 (RoundResults 로딩바 연동)
      transitionCountdown.value = seconds
      console.log(`다음 라운드까지: ${seconds}초`)

      if (remaining <= 0) {
        clearTransitionInterval()
        transitionCountdown.value = 0
      }
    }, 100)
  }

  /**
   * 다음 라운드 시작 처리
   * StartPlayerGame 메시지: { gameId, totalRounds, currentRound, roundInfo, roundVersion, gamePlayers }
   */
  const handleNextRound = (message) => {
    console.log('[Solo Flow] 다음 라운드:', message)

    ensureSubmissionSubscription(message?.gameId)

    if (!gameStore) return

    // 전환 타이머 정리
    clearTransitionInterval()

    // 재발급 시도 횟수 초기화 (새 라운드 시작 시)
    // 단, 재시도 중인 경우에는 초기화하지 않음 (재발급 요청 후 새로운 좌표를 받기 전까지)
    if (!isRetryingRoadview.value) {
      reIssueAttempts.value = 0
    }

    // 라운드 정보 업데이트
    gameId.value = message.gameId
    const nextRoundId = Number(message.roundInfo.roundId)
    if (!Number.isNaN(nextRoundId)) {
      roundId.value = nextRoundId
    }
    
    // 게임 설정 업데이트
    if (message.totalRounds != null) {
      gameStore.state.totalRounds = message.totalRounds
    }
    gameStore.state.currentRound = message.currentRound

    // 재시도 중인 경우 새로운 좌표를 받았으므로 재시도 플래그 해제
    if (isRetryingRoadview.value) {
      console.log('[Solo Flow] 재시도 중 새로운 좌표 수신 - 로드뷰 다시 로드')
      isRetryingRoadview.value = false
    }

    // 라운드 좌표 정보 업데이트
    gameStore.state.currentLocation = {
      lat: message.roundInfo.targetLat,
      lng: message.roundInfo.targetLng
    }
    gameStore.state.actualLocation = {
      lat: message.roundInfo.targetLat,
      lng: message.roundInfo.targetLng
    }

    // 플레이어 정보 업데이트 (gamePlayers가 있는 경우)
    if (message.gamePlayers && Array.isArray(message.gamePlayers)) {
      console.log('[Solo Flow] 플레이어 정보 업데이트:', message.gamePlayers)
      
      // gameStore의 players 업데이트 (기존 플레이어와 병합)
      message.gamePlayers.forEach(gamePlayer => {
        const existingPlayer = gameStore.state.players.find(p => p.id === gamePlayer.playerId)
        
        if (existingPlayer) {
          // 기존 플레이어 정보 업데이트
          existingPlayer.nickname = gamePlayer.nickname || existingPlayer.nickname
          existingPlayer.markerImageUrl = gamePlayer.markerImageUrl || existingPlayer.markerImageUrl
          existingPlayer.equippedMarker = gamePlayer.markerImageUrl || existingPlayer.equippedMarker
          existingPlayer.totalScore = gamePlayer.totalScore != null ? gamePlayer.totalScore : existingPlayer.totalScore
          existingPlayer.roundRank = gamePlayer.roundRank != null ? gamePlayer.roundRank : existingPlayer.roundRank
          existingPlayer.score = gamePlayer.totalScore != null ? gamePlayer.totalScore : existingPlayer.score
        } else {
          // 새 플레이어 추가
          gameStore.state.players.push({
            id: gamePlayer.playerId,
            memberId: gamePlayer.playerId,
            nickname: gamePlayer.nickname || '알 수 없음',
            markerImageUrl: gamePlayer.markerImageUrl || null,
            equippedMarker: gamePlayer.markerImageUrl || null,
            totalScore: gamePlayer.totalScore || 0,
            roundRank: gamePlayer.roundRank || 0,
            score: gamePlayer.totalScore || 0,
            hasSubmitted: false,
            distanceToTarget: null,
            lastRoundScore: 0
          })
        }
      })

      // 플레이어 정보를 콜백으로 전달 (SoloGameView에 저장)
      if (callbacks.onGamePlayersUpdate) {
        callbacks.onGamePlayersUpdate(message.gamePlayers)
      }
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
    
    // 첫 번째 라운드인지 확인 (currentRound === 1)
    const isFirstRound = message.currentRound === 1
    
    // 오버레이 시작 플래그 설정
    isOverlayActive.value = true
    
    // UI 콜백: 첫 번째 라운드면 IntroOverlay, 아니면 NextRoundOverlay
    if (isFirstRound) {
      if (callbacks.onIntroShow) {
        callbacks.onIntroShow()
      }
    } else {
      if (callbacks.onNextRoundShow) {
        callbacks.onNextRoundShow()
      }
    }
  }

  /**
   * 오버레이 완료 처리 (타이머 시작)
   */
  const onOverlayComplete = () => {
    console.log('[Solo Flow] 오버레이 완료 - 타이머 시작 가능')
    isOverlayActive.value = false
    
    // 저장된 타이머 시작 메시지가 있으면 지금 처리
    if (pendingTimerStartMessage.value) {
      console.log('[Solo Flow] 저장된 타이머 시작 메시지 처리')
      const message = pendingTimerStartMessage.value
      pendingTimerStartMessage.value = null
      startTimer(message)
    } else if (!roundStartTime.value) {
      // 타이머 시작 메시지를 아직 받지 못한 경우 대기
      console.log('[Solo Flow] 타이머 시작 메시지 대기 중...')
    } else {
      // 이미 roundStartTime이 설정되어 있다면 타이머는 이미 시작된 상태
      console.log('[Solo Flow] 타이머는 이미 시작됨')
    }
  }

  /**
   * 로드뷰 표시 실패 시 재발급 요청
   */
  const requestRoadviewReIssue = async () => {
    if (!roomId.value || !gameId.value || !roundId.value) {
      console.error('[Solo Flow] 재발급 불가: 게임 정보 없음')
      isRetryingRoadview.value = false
      return false
    }

    if (reIssueAttempts.value >= maxReIssueAttempts) {
      console.warn(`[Solo Flow] 최대 재발급 시도 횟수(${maxReIssueAttempts}) 초과`)
      isRetryingRoadview.value = false
      return false
    }

    try {
      reIssueAttempts.value++
      isRetryingRoadview.value = true
      console.log(`[Solo Flow] 로드뷰 재발급 요청 (${reIssueAttempts.value}/${maxReIssueAttempts}):`, {
        roomId: roomId.value,
        gameId: gameId.value,
        roundId: roundId.value
      })

      await soloGameApi.reIssueRoadview(roomId.value, gameId.value, roundId.value)
      
      console.log('[Solo Flow] 로드뷰 재발급 요청 완료. 서버에서 새로운 좌표 브로드캐스트 대기 중...')
      // 새로운 좌표를 받으면 handleNextRound에서 자동으로 로드뷰를 다시 로드함
      return true
    } catch (error) {
      console.error('[Solo Flow] 로드뷰 재발급 요청 실패:', error)
      isRetryingRoadview.value = false
      return false
    }
  }

  /**
   * 재시도 중인지 확인
   */
  const isRetrying = () => {
    return isRetryingRoadview.value
  }

  /**
   * 게임 종료 처리
   */
  const handleGameFinished = (message) => {
    console.log('[Solo Flow] 게임 종료:', message)

    ensureSubmissionSubscription(message?.gameId)

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
      // timeToAnswer 계산: 라운드 시작부터 정답 제출까지의 시간 (밀리초)
      let timeToAnswerMs = 0
      
      console.log('[Solo Flow] ⏱️ timeToAnswer 계산 시작:', {
        roundStartTime: roundStartTime.value,
        currentTime: Date.now(),
        isOverlayActive: isOverlayActive.value,
        pendingTimerStartMessage: pendingTimerStartMessage.value ? '있음' : '없음'
      })
      
      if (roundStartTime.value) {
        // 서버 시간 기준으로 현재 시간 계산 (timeDiff 적용)
        // roundStartTime.value는 서버 시간(serverStartTimeMs)이므로
        // 클라이언트 시간을 서버 시간으로 변환해야 함
        const serverTimeNow = Date.now() - timeDiff.value
        timeToAnswerMs = serverTimeNow - roundStartTime.value
        console.log('[Solo Flow] ✅ roundStartTime 사용:', {
          roundStartTime: roundStartTime.value,
          clientTime: Date.now(),
          serverTimeNow: serverTimeNow,
          timeDiff: timeDiff.value,
          timeToAnswerMs: timeToAnswerMs
        })
      } else {
        console.warn('[Solo Flow] ⚠️ roundStartTime이 null입니다!', {
          isOverlayActive: isOverlayActive.value,
          pendingTimerStartMessage: pendingTimerStartMessage.value ? '있음' : '없음',
          message: '타이머 시작 메시지를 아직 받지 못했거나 오버레이 완료 처리가 되지 않았을 수 있습니다.'
        })
        
        // pendingTimerStartMessage가 있으면 지금 처리 시도
        if (pendingTimerStartMessage.value) {
          console.log('[Solo Flow] 🔄 pendingTimerStartMessage 처리 시도')
          const message = pendingTimerStartMessage.value
          pendingTimerStartMessage.value = null
          isOverlayActive.value = false
          startTimer(message)
          
          // 다시 계산
          if (roundStartTime.value) {
            // 서버 시간 기준으로 현재 시간 계산 (timeDiff 적용)
            const serverTimeNow = Date.now() - timeDiff.value
            timeToAnswerMs = serverTimeNow - roundStartTime.value
            console.log('[Solo Flow] ✅ 처리 후 roundStartTime 사용:', {
              roundStartTime: roundStartTime.value,
              clientTime: Date.now(),
              serverTimeNow: serverTimeNow,
              timeDiff: timeDiff.value,
              timeToAnswerMs: timeToAnswerMs
            })
          }
        }
      }

      // 밀리초를 초로 변환하고 소수점 3자리까지 반올림
      const timeToAnswer = Number((timeToAnswerMs / 1000).toFixed(3))

      console.log('[Solo Flow] 📤 정답 제출:', { 
        position, 
        timeToAnswer, 
        timeToAnswerMs,
        roundStartTime: roundStartTime.value
      })

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
   * @param {String|Number} playerId - 플레이어 ID
   * @returns {String} 플레이어 색상 (기본값: 파란색)
   */
  const getPlayerColor = (playerId) => {
    // gameStore에서 플레이어 정보 가져오기
    if (gameStore) {
      const player = gameStore.state.players.find(p => p.id === playerId)
      if (player?.color) {
        return player.color
      }
    }
    // 기본값: 파란색
    return '#3b82f6'
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
    initializeFromServerStart,
    setCallbacks,
    submitAnswer,
    requestRoadviewReIssue,
    onOverlayComplete,
    publishGlobalChatMessage,
    cleanup
  }
}

export default useSoloGameFlow

