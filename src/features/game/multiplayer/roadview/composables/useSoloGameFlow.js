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
  const timerDurationMs = ref(120000) // 타이머 총 시간 (밀리초) - 서버 동기화 시 사용

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
    onRoundResultUpdate: null, // 라운드 결과 업데이트 콜백
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
        // 플레이어 데이터는 store에 저장하지 않음
        // SoloGameView의 gamePlayers에만 저장 (콜백으로 전달)
        if (result.gamePlayers && Array.isArray(result.gamePlayers)) {
          // 플레이어 정보를 콜백으로 전달 (SoloGameView에 저장)
          if (callbacks.onGamePlayersUpdate) {
            callbacks.onGamePlayersUpdate(result.gamePlayers)
          }
        }
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
    
    } else if (message?.startTime != null) {
      // 하위 호환성: startTime 필드도 지원 (초 단위면 * 1000)
      const serverStartTime = typeof message.startTime === 'number' 
        ? (message.startTime > 1000000000000 ? message.startTime : message.startTime * 1000)
        : Date.now()
      roundStartTime.value = serverStartTime
      
    } else {
      roundStartTime.value = Date.now()
      console.warn('[Solo Flow] ⚠️ serverStartTimeMs가 없어 현재 시간 사용:', roundStartTime.value)
    }

    // 타이머 총 시간 저장 (서버 동기화 시 사용)
    timerDurationMs.value = message?.durationMs || 120000

    // 타이머 UI 업데이트
    clearTimerInterval()
    
    // 서버 시간 동기화를 위한 timeDiff 계산 (서버 타임스탬프와 클라이언트 시간 차이)
    const serverTimestamp = message?.serverTimestamp || message?.serverStartTimeMs
    if (serverTimestamp) {
      // 서버 타임스탬프를 받은 시점의 클라이언트 시간과 서버 시간의 차이 계산
      // timeDiff = 클라이언트 시간 - 서버 시간 (양수면 클라이언트가 빠름, 음수면 서버가 빠름)
      timeDiff.value = Date.now() - Number(serverTimestamp)
    
    } else {
      timeDiff.value = 0
      console.warn('[Solo Flow] ⚠️ serverTimestamp가 없어 timeDiff를 0으로 설정')
    }
    
    // 타이머 업데이트 주기를 1000ms(1초)로 설정하여
    // 1초마다 정확하게 감소하도록 수정
    // 서버가 5초마다 동기화하므로, 클라이언트는 1초마다 계산하고
    // 서버 동기화 메시지가 오면 timeDiff를 재조정하여 정확도를 유지
    timerInterval.value = setInterval(() => {
      if (!gameStore || !roundStartTime.value) {
        return
      }

      // 서버 시간에 맞춘 현재 시간 계산
      const serverTimeNow = Date.now() - timeDiff.value
      const elapsed = serverTimeNow - roundStartTime.value
      const remaining = Math.max(0, timerDurationMs.value - elapsed)

      // 소수점까지 정확하게 저장 (밀리초를 초로 변환)
      const remainingSeconds = remaining / 1000
      gameStore.state.remainingTime = remainingSeconds

      // 1초마다 UI 업데이트 (Timer.vue가 initialTime prop 변경을 감지하여 표시)

      if (remaining <= 0) {
        clearTimerInterval()
        gameStore.state.remainingTime = 0
        console.log('[Solo Flow] 타이머 종료')
      }
    }, 1000) // 1초마다 업데이트 - 사용자는 1초마다 줄어드는 타이머를 볼 수 있음
  }

  const handleTimerSync = (message) => {
  
    ensureSubmissionSubscription(message?.gameId)

    if (!gameStore) {
      return
    }

    // 오버레이가 진행 중이면 타이머 업데이트하지 않음
    if (isOverlayActive.value) {
      console.log('[Solo Flow] 오버레이 진행 중 - 타이머 동기화 스킵')
      return
    }

    // 타이머가 실행 중이 아니면 동기화하지 않음
    if (!timerInterval.value || !roundStartTime.value) {
      console.log('[Solo Flow] 타이머가 실행 중이 아니므로 동기화 스킵')
      return
    }

    // 서버가 5초마다 동기화 메시지를 보내므로,
    // 서버 시간과 클라이언트 시간의 차이(timeDiff)를 재계산하여
    // 클라이언트 계산 오차가 누적되지 않도록 함
    if (message?.serverTimestamp != null && message?.remainingTimeMs != null) {
      const serverTimestamp = Number(message.serverTimestamp)
      const remainingTimeMs = Number(message.remainingTimeMs)
      const clientTimeNow = Date.now()

      // 서버 타임스탬프를 받은 시점의 클라이언트 시간과 서버 시간의 차이 재계산
      const newTimeDiff = clientTimeNow - serverTimestamp
      
      // timeDiff 업데이트 (서버 시간 기준으로 재동기화)
      timeDiff.value = newTimeDiff

      // 서버의 remainingTimeMs를 기준으로 roundStartTime을 역산하여 재조정
      // remainingTimeMs = durationMs - (serverTimeNow - roundStartTime)
      // 따라서: roundStartTime = serverTimeNow - (durationMs - remainingTimeMs)
      const serverTimeNow = serverTimestamp
      const elapsedMs = timerDurationMs.value - remainingTimeMs
      const recalculatedRoundStartTime = serverTimeNow - elapsedMs

      // roundStartTime 재조정 (서버 시간 기준)
      roundStartTime.value = recalculatedRoundStartTime

      // 즉시 타이머 값 업데이트 (서버 값으로 정확하게 설정)
      const remainingSeconds = Math.max(0, remainingTimeMs / 1000)
      gameStore.state.remainingTime = remainingSeconds
    } else if (message?.remainingTimeMs != null) {
      // serverTimestamp가 없으면 remainingTimeMs만 사용
      const remainingSeconds = Math.max(0, Number(message.remainingTimeMs) / 1000)
      gameStore.state.remainingTime = remainingSeconds
    }

    if (message?.finalCountDown != null) {
      gameStore.state.finalCountDown = Boolean(message.finalCountDown)
    }

    // UI 콜백 호출
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

    // 지역 정보 업데이트 (poiName, fullAddress)
    if (message.poiName != null || message.fullAddress != null) {
      if (!gameStore.state.locationInfo) {
        gameStore.state.locationInfo = {
          name: '',
          description: '',
          image: '',
          fact: '',
          poiName: '',
          fullAddress: ''
        }
      }
      
      // poiName (지역이름) 업데이트
      if (message.poiName != null) {
        gameStore.state.locationInfo.poiName = message.poiName
        // name이 없으면 poiName을 name으로도 사용
        if (!gameStore.state.locationInfo.name) {
          gameStore.state.locationInfo.name = message.poiName
        }
      }
      
      // fullAddress (주소) 업데이트
      if (message.fullAddress != null) {
        gameStore.state.locationInfo.fullAddress = message.fullAddress
      }
      
      console.log('[Solo Flow] 지역 정보 업데이트:', {
        poiName: gameStore.state.locationInfo.poiName,
        fullAddress: gameStore.state.locationInfo.fullAddress
      })
    }

    // 플레이어 추측 위치 설정 (지도 표시용)
    // playerTotalResults에서 직접 플레이어 정보 가져오기
    const playerGuessesData = message.playerSubmissionResults.map((submission, index) => {
      const player = message.playerTotalResults[index]
      
      // 마커 이미지 URL은 playerTotalResults에서 가져오거나 기본값 사용
      // (SoloGameView의 onRoundResultUpdate에서 gamePlayers의 markerImageUrl로 업데이트됨)
      const markerImageUrl = player.markerImageUrl || null
      
      return {
        playerId: player.playerId,
        playerName: player.nickname,
        position: { lat: submission.lat, lng: submission.lng },
        color: '#3b82f6', // 기본값: 파란색
        markerImageUrl: markerImageUrl, // 플레이어 마커 이미지 (SoloGameView에서 gamePlayers로 업데이트됨)
        score: submission.earnedScore,
        distance: submission.distance
      }
    })
    
    // 플레이어 결과 업데이트는 SoloGameView의 gamePlayers에서 처리
    // 라운드 결과 정보를 콜백으로 전달하여 gamePlayers 업데이트 및 playerGuesses의 markerImageUrl 업데이트
    if (callbacks.onRoundResultUpdate) {
      callbacks.onRoundResultUpdate({
        playerTotalResults: message.playerTotalResults,
        playerSubmissionResults: message.playerSubmissionResults,
        playerGuesses: playerGuessesData
      })
    } else {
      // 콜백이 없으면 바로 저장 (더미 모드 등)
      gameStore.state.playerGuesses = playerGuessesData
    }

    // 최고 점수 플레이어 설정 (playerTotalResults에서 직접 계산)
    if (message.playerTotalResults && message.playerTotalResults.length > 0) {
      const sortedResults = [...message.playerTotalResults].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      const topResult = sortedResults[0]
      const topSubmissionIndex = message.playerTotalResults.findIndex(r => r.playerId === topResult.playerId)
      const topSubmission = message.playerSubmissionResults[topSubmissionIndex]
      gameStore.state.topPlayer = {
        playerName: topResult.nickname,
        distance: topSubmission?.distance || 0
      }
    }

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
   * 일반 라운드 시작: { gameId, totalRounds, currentRound, roundInfo: { roundId, targetLat, targetLng }, roundVersion, gamePlayers }
   * 재발급 후: { gameId, roundId, roundVersion, targetLat, targetLng }
   * 
   * 재발급 후에도 같은 라운드이므로, 재발급 메시지를 받으면 좌표만 업데이트하고 타이머는 변경하지 않음
   */
  const handleNextRound = (message) => {
    console.log('[Solo Flow] 라운드/재발급 메시지 수신:', message)

    ensureSubmissionSubscription(message?.gameId)

    if (!gameStore) return

    // 좌표 추출 (roundInfo가 있으면 roundInfo에서, 없으면 직접 메시지에서)
    const targetLat = message.roundInfo?.targetLat ?? message.targetLat
    const targetLng = message.roundInfo?.targetLng ?? message.targetLng

    if (targetLat == null || targetLng == null) {
      console.error('[Solo Flow] 좌표 정보가 없습니다:', message)
      return
    }

    // 재발급 메시지인지 확인 (roundInfo가 없거나, roundInfo.roundId가 현재 roundId와 같고 재시도 중인 경우)
    const messageRoundId = message.roundInfo?.roundId ?? message.roundId
    const isReIssueMessage = isRetryingRoadview.value || 
                             (!message.roundInfo && message.targetLat != null && message.targetLng != null) ||
                             (messageRoundId != null && Number(messageRoundId) === roundId.value && isRetryingRoadview.value)

    if (isReIssueMessage) {
      // 재발급 후 메시지: 좌표만 업데이트 (타이머, 라운드 정보는 변경하지 않음)
      console.log('[Solo Flow] 재발급 후 새로운 좌표 수신 - 로드뷰만 다시 로드')
      
      // 재시도 플래그 해제 및 시도 횟수 초기화
      if (isRetryingRoadview.value) {
        isRetryingRoadview.value = false
        reIssueAttempts.value = 0
        console.log('[Solo Flow] 재발급 성공 - 재시도 플래그 해제')
      }

      // 게임 ID 및 라운드 ID 업데이트 (있는 경우)
      if (message.gameId != null) {
        gameId.value = message.gameId
      }
      if (messageRoundId != null) {
        const parsedRoundId = Number(messageRoundId)
        if (!Number.isNaN(parsedRoundId)) {
          roundId.value = parsedRoundId
        }
      }

      // 좌표 정보만 업데이트 (로드뷰 자동 재로드됨)
      gameStore.state.currentLocation = {
        lat: Number(targetLat),
        lng: Number(targetLng)
      }
      gameStore.state.actualLocation = {
        lat: Number(targetLat),
        lng: Number(targetLng)
      }

      console.log('[Solo Flow] 재발급 좌표로 로드뷰 업데이트 완료:', gameStore.state.currentLocation)
      return // 재발급 메시지는 여기서 종료 (타이머, 라운드 상태는 변경하지 않음)
    }

    // 일반 라운드 시작 메시지 처리
    console.log('[Solo Flow] 새로운 라운드 시작')
    
    // 기존 타이머 정리 (라운드 전환 시 반드시 정리)
    clearTimerInterval()
    
    // 전환 타이머 정리
    clearTransitionInterval()

    // 재발급 시도 횟수 초기화 (새 라운드 시작 시)
    if (!isRetryingRoadview.value) {
      reIssueAttempts.value = 0
    }

    // 게임 ID 업데이트
    if (message.gameId != null) {
      gameId.value = message.gameId
    }
    
    // 라운드 정보 업데이트
    if (message.roundInfo) {
      // roundInfo가 있는 경우 (일반 라운드 시작)
      const nextRoundId = Number(message.roundInfo.roundId)
      if (!Number.isNaN(nextRoundId)) {
        roundId.value = nextRoundId
      }
      
      // 게임 설정 업데이트
      if (message.totalRounds != null) {
        gameStore.state.totalRounds = message.totalRounds
      }
      if (message.currentRound != null) {
        gameStore.state.currentRound = message.currentRound
      }
    } else if (messageRoundId != null) {
      // roundInfo가 없지만 roundId가 직접 있는 경우
      const parsedRoundId = Number(messageRoundId)
      if (!Number.isNaN(parsedRoundId)) {
        roundId.value = parsedRoundId
      }
    }

    // 재시도 중이었다면 플래그 해제
    if (isRetryingRoadview.value) {
      console.log('[Solo Flow] 재시도 중 새로운 좌표 수신 - 로드뷰 다시 로드')
      isRetryingRoadview.value = false
      reIssueAttempts.value = 0
    }

    // 라운드 좌표 정보 업데이트
    gameStore.state.currentLocation = {
      lat: Number(targetLat),
      lng: Number(targetLng)
    }
    gameStore.state.actualLocation = {
      lat: Number(targetLat),
      lng: Number(targetLng)
    }

    // 플레이어 정보 업데이트 (gamePlayers가 있는 경우)
    // 처음 게임 시작할 때 받는 정보를 SoloGameView의 gamePlayers에만 저장 (store에 저장하지 않음)
    if (message.gamePlayers && Array.isArray(message.gamePlayers)) {
      console.log('[Solo Flow] 플레이어 정보 업데이트 (처음 게임 시작할 때 받는 정보):', message.gamePlayers)
      
      // 플레이어 정보를 콜백으로 전달 (SoloGameView의 gamePlayers에 저장)
      // store에 담지 않음
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

    // 플레이어 제출 상태 초기화는 SoloGameView의 gamePlayers에서 처리
    // (서버 모드에서는 store에 플레이어 정보를 저장하지 않음)

    // 라운드 시작 시간 초기화 (새 라운드 시작 전에 초기화)
    roundStartTime.value = null
    
    // 타이머 총 시간 초기화
    timerDurationMs.value = 120000
    
    // 타이머 값 초기화 (서버에서 타이머 시작 메시지를 받을 때까지 대기)
    if (gameStore.state) {
      gameStore.state.remainingTime = 0
    }
    
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
    console.log('[Solo Flow] requestRoadviewReIssue 호출됨:', {
      roomId: roomId.value,
      gameId: gameId.value,
      roundId: roundId.value,
      reIssueAttempts: reIssueAttempts.value,
      maxReIssueAttempts: maxReIssueAttempts
    })
    
    if (!roomId.value || !gameId.value || !roundId.value) {
      console.error('[Solo Flow] 재발급 불가: 게임 정보 없음', {
        roomId: roomId.value || '없음',
        gameId: gameId.value || '없음',
        roundId: roundId.value || '없음'
      })
      isRetryingRoadview.value = false
      return false
    }

    if (reIssueAttempts.value >= maxReIssueAttempts) {
      console.warn(`[Solo Flow] 최대 재발급 시도 횟수(${maxReIssueAttempts}) 초과 (현재: ${reIssueAttempts.value})`)
      isRetryingRoadview.value = false
      return false
    }

    try {
      reIssueAttempts.value++
      isRetryingRoadview.value = true
      console.log(`[Solo Flow] 로드뷰 재발급 요청 시작 (${reIssueAttempts.value}/${maxReIssueAttempts}):`, {
        roomId: roomId.value,
        gameId: gameId.value,
        roundId: roundId.value
      })

      const result = await soloGameApi.reIssueRoadview(roomId.value, gameId.value, roundId.value)
      console.log('[Solo Flow] 로드뷰 재발급 API 응답:', result)
      console.log('[Solo Flow] 로드뷰 재발급 요청 완료. 서버에서 새로운 좌표 브로드캐스트 대기 중...')
      // 새로운 좌표를 받으면 handleNextRound에서 자동으로 로드뷰를 다시 로드함
      return true
    } catch (error) {
      console.error('[Solo Flow] 로드뷰 재발급 요청 실패:', error)
      isRetryingRoadview.value = false
      reIssueAttempts.value-- // 실패했으므로 시도 횟수 되돌림
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
   * 서버에서 /topic/game/{roomId}/game/finished 채널로 브로드캐스트
   * GameFinalResult: { gameId, message, timestamp, playerResults: [PlayerFinalResult] }
   * PlayerFinalResult: { playerId, nickname, markerImageUrl, totalScore, finalRank, earnedPoint }
   */
  const handleGameFinished = (message) => {
    console.log('[Solo Flow] 게임 종료:', message)

    ensureSubmissionSubscription(message?.gameId)

    if (!gameStore) return

    // 모든 타이머 정리
    clearTimerInterval()
    clearTransitionInterval()

    // 백엔드에서 받은 최종 결과 데이터 저장
    if (message.playerResults && Array.isArray(message.playerResults)) {
      // PlayerFinalResult를 게임 결과 형식에 맞게 매핑
      const playerResults = message.playerResults.map(player => ({
        playerId: player.playerId,
        nickname: player.nickname || '알 수 없음',
        markerImageUrl: player.markerImageUrl || null,
        totalScore: player.totalScore != null ? Number(player.totalScore) : 0,
        finalRank: player.finalRank != null ? Number(player.finalRank) : 0,
        earnedPoint: player.earnedPoint != null ? Number(player.earnedPoint) : 0,
        score: player.totalScore != null ? Number(player.totalScore) : 0 // 호환성을 위해 score도 설정
      }))

      gameStore.state.finalGameResult = {
        gameId: message.gameId != null ? Number(message.gameId) : null,
        message: message.message || '',
        timestamp: message.timestamp != null ? Number(message.timestamp) : Date.now(),
        playerResults: playerResults
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
      
      if (roundStartTime.value) {
        // 서버 시간 기준으로 현재 시간 계산 (timeDiff 적용)
        // roundStartTime.value는 서버 시간(serverStartTimeMs)이므로
        // 클라이언트 시간을 서버 시간으로 변환해야 함
        const serverTimeNow = Date.now() - timeDiff.value
        timeToAnswerMs = serverTimeNow - roundStartTime.value
        
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
    timerDurationMs.value = 120000
    timeDiff.value = 0

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

