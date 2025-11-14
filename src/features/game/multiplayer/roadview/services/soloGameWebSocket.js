/**
 * Solo 로드뷰 게임 WebSocket 서비스
 * 
 * 멀티플레이어 개인전(Solo) 게임의 WebSocket을 통한 실시간 메시지 처리
 * - 타이머 시작/동기화
 * - 라운드 결과
 * - 라운드 전환 대기
 * - 다음 라운드 시작
 * - 플레이어 제출 알림
 * - 게임 종료
 */

import webSocketManager from '@/features/game/multiplayer/shared/services/websocket/composables'

class SoloGameWebSocketService {
  constructor() {
    this.roomId = null
    this.gameId = null
    this.subscriptions = new Map()
    this.handlers = {
      onTimerStart: null,
      onTimerSync: null,
      onRoundResult: null,
      onRoundTransition: null,
      onNextRound: null,
      onPlayerSubmission: null,
      onGameFinished: null,
      onLoadingStatus: null,
      onGlobalChat: null
    }
  }

  /**
   * WebSocket 연결 확인
   */
  get isConnected() {
    return webSocketManager.isConnected.value
  }

  /**
   * 게임 채널 구독 설정
   * @param {String} roomId - 게임방 ID
   * @param {Object} handlers - 이벤트 핸들러 객체
   */
  setupGameSubscriptions(roomId, handlers = {}) {
    this.roomId = roomId
    this.handlers = { ...this.handlers, ...handlers }

    console.log(`[Solo WebSocket] 게임 채널 구독 시작: Room ${roomId}`)

    // 타이머 시작 구독
    this.subscribe(
      `/topic/game/${roomId}/timer/start`,
      'timerStart',
      this.handleTimerStart.bind(this)
    )

    // 타이머 동기화 구독
    this.subscribe(
      `/topic/game/${roomId}/timer/sync`,
      'timerSync',
      this.handleTimerSync.bind(this)
    )

    // 라운드 결과 구독
    this.subscribe(
      `/topic/game/${roomId}/round/result`,
      'roundResult',
      this.handleRoundResult.bind(this)
    )

    // 라운드 전환 타이머 구독
    this.subscribe(
      `/topic/game/${roomId}/round/transition`,
      'roundTransition',
      this.handleRoundTransition.bind(this)
    )

    // 다음 라운드 시작 구독
    this.subscribe(
      `/topic/game/${roomId}/round/start`,
      'nextRound',
      this.handleNextRound.bind(this)
    )

    // 게임 종료 구독
    this.subscribe(
      `/topic/game/${roomId}/game/finished`,
      'gameFinished',
      this.handleGameFinished.bind(this)
    )

    // 게임 중 채팅 구독 (서버가 /topic/game/{roomId}/chat/global로 브로드캐스트)
    this.subscribe(
      `/topic/game/${roomId}/chat/global`,
      'globalChat',
      this.handleGlobalChat.bind(this)
    )

    // 로딩 상태 채널 구독 (필요 시)
    if (handlers.onLoadingStatus) {
      this.setupLoadingSubscription(roomId, handlers.onLoadingStatus)
    }

    console.log(`[Solo WebSocket] 모든 게임 채널 구독 완료`)
  }

  /**
   * 제출 알림 채널 구독 (gameId 필요)
   * @param {Number} gameId - 게임 ID
   * @param {Object} handlers - 이벤트 핸들러 객체
   */
  setupSubmissionSubscription(gameId, handlers = {}) {
    this.gameId = gameId
    this.handlers = { ...this.handlers, ...handlers }

    // 플레이어 제출 알림 구독
    this.subscribe(
      `/topic/game/${gameId}/roadview/submissions/player`,
      'playerSubmission',
      this.handlePlayerSubmission.bind(this)
    )

    console.log(`[Solo WebSocket] 제출 알림 채널 구독 완료: Game ${gameId}`)
  }

  /**
   * 채널 구독 (내부 헬퍼)
   */
  subscribe(topic, key, callback) {
    if (!this.isConnected) {
      console.warn(`[Solo WebSocket] 연결되지 않음: ${topic}`)
      return
    }

    const subscriptionId = webSocketManager.subscribe(topic, (message) => {
      try {
        const payload = message && typeof message === 'object' && 'body' in message
          ? JSON.parse(message.body)
          : message
        callback(payload)
      } catch (error) {
        console.error(`[Solo WebSocket] 메시지 파싱 실패 (${topic}):`, error, message)
      }
    })
    if (subscriptionId) {
      this.subscriptions.set(key, { topic, subscriptionId })
      console.log(`[Solo WebSocket] 구독 성공: ${topic}`)
    }
  }

  /**
   * 타이머 시작 메시지 처리
   */
  handleTimerStart(message) {
    console.log('[Solo WebSocket] 타이머 시작:', message)

    if (this.handlers.onTimerStart) {
      const { serverStartTimeMs, durationMs, serverTimestamp } = message

      // 서버-클라이언트 시간차 계산
      const timeDiff = serverTimestamp - Date.now()

      this.handlers.onTimerStart({
        ...message,
        timeDiff,
        startTime: serverStartTimeMs,
        duration: durationMs
      })
    }
  }

  /**
   * 타이머 동기화 메시지 처리
   */
  handleTimerSync(message) {
    console.log('[Solo WebSocket] 타이머 동기화:', message)

    if (this.handlers.onTimerSync) {
      this.handlers.onTimerSync(message)
    }
  }

  /**
   * 라운드 결과 메시지 처리
   */
  handleRoundResult(message) {
    console.log('[Solo WebSocket] 라운드 결과:', message)

    if (this.handlers.onRoundResult) {
      this.handlers.onRoundResult(message)
    }
  }

  /**
   * 라운드 전환 대기 메시지 처리
   */
  handleRoundTransition(message) {
    console.log('[Solo WebSocket] 라운드 전환 대기:', message)

    if (this.handlers.onRoundTransition) {
      const { nextRoundStartTimeMs, serverTimestamp, isLastRound } = message

      // 서버-클라이언트 시간차 계산
      const timeDiff = serverTimestamp - Date.now()

      this.handlers.onRoundTransition({
        ...message,
        timeDiff,
        nextStartTime: nextRoundStartTimeMs,
        isLastRound
      })
    }
  }

  /**
   * 다음 라운드 시작 메시지 처리
   */
  handleNextRound(message) {
    console.log('[Solo WebSocket] 다음 라운드 시작:', message)

    if (this.handlers.onNextRound) {
      this.handlers.onNextRound(message)
    }
  }

  /**
   * 플레이어 제출 알림 메시지 처리
   */
  handlePlayerSubmission(message) {
    console.log('[Solo WebSocket] 플레이어 제출:', message)

    if (this.handlers.onPlayerSubmission) {
      this.handlers.onPlayerSubmission(message)
    }
  }

  /**
   * 게임 종료 메시지 처리
   */
  handleGameFinished(message) {
    console.log('[Solo WebSocket] 게임 종료:', message)

    if (this.handlers.onGameFinished) {
      this.handlers.onGameFinished(message)
    }
  }

  /**
   * 게임 중 채팅 메시지 처리
   */
  handleGlobalChat(message) {
    console.log('[Solo WebSocket] 게임 중 채팅 메시지 수신:', message)

    if (this.handlers.onGlobalChat) {
      console.log('[Solo WebSocket] onGlobalChat 핸들러 호출')
      this.handlers.onGlobalChat(message)
    } else {
      console.warn('[Solo WebSocket] onGlobalChat 핸들러가 설정되지 않았습니다.')
    }
  }

  /**
   * 게임 중 채팅 메시지 발행
   * @param {String} roomId - 게임방 ID
   * @param {String} content - 메시지 내용
   * @returns {Boolean} 발행 성공 여부
   */
  publishGlobalChatMessage(roomId, content) {
    if (!this.isConnected) {
      console.warn('[Solo WebSocket] 연결되지 않아 채팅 메시지를 발행할 수 없습니다.')
      return false
    }

    try {
      const topic = `/app/room.${roomId}.game.global.chat`
      const payload = {
        content: content
      }

      const success = webSocketManager.publish(topic, payload)
      
      if (success) {
        console.log('[Solo WebSocket] 게임 중 채팅 메시지 발행 성공:', { roomId, content })
      } else {
        console.error('[Solo WebSocket] 게임 중 채팅 메시지 발행 실패')
      }
      
      return success
    } catch (error) {
      console.error('[Solo WebSocket] 게임 중 채팅 메시지 발행 중 오류:', error)
      return false
    }
  }

  /**
   * 로딩 상태 메시지 처리
   */
  handleLoadingStatus(message) {
    console.log('[Solo WebSocket] 로딩 상태 업데이트:', message)

    if (this.handlers.onLoadingStatus) {
      this.handlers.onLoadingStatus(message)
    }
  }

  /**
   * 로딩 상태 채널 구독
   * @param {String} roomId - 게임방 ID
   * @param {Function} handler - 로딩 상태 핸들러
   * @param {Boolean} skipSubscribe - 구독은 건너뛰고 핸들러만 설정 (RoomView에서 이미 구독한 경우)
   */
  setupLoadingSubscription(roomId, handler, skipSubscribe = false) {
    if (!this.isConnected) {
      console.warn('[Solo WebSocket] 연결되지 않아 로딩 채널을 구독할 수 없습니다.')
      return
    }

    // 핸들러 설정
    this.handlers.onLoadingStatus = handler

    // 구독은 건너뛰고 핸들러만 설정 (RoomView에서 이미 구독한 경우)
    if (skipSubscribe) {
      console.log(`[Solo WebSocket] 로딩 상태 핸들러만 설정 (구독은 RoomView에서 이미 완료): Room ${roomId}`)
      return
    }

    // 구독 설정 (기존 동작)
    this.unsubscribe('loadingStatus')

    this.subscribe(
      `/topic/game/${roomId}/loading/status`,
      'loadingStatus',
      this.handleLoadingStatus.bind(this)
    )
    console.log(`[Solo WebSocket] 로딩 상태 채널 구독 완료: Room ${roomId}`)
  }

  /**
   * 로딩 상태 구독 해제
   */
  removeLoadingSubscription() {
    this.unsubscribe('loadingStatus')
    this.handlers.onLoadingStatus = null
  }

  /**
   * 로딩 ACK 발행
   */
  publishLoadingAcknowledge(roomId, payload = {}) {
    if (!this.isConnected) {
      console.warn('[Solo WebSocket] 연결되지 않아 로딩 ACK를 보낼 수 없습니다.')
      return false
    }

    const topic = `/app/room.${roomId}.loading.ack`
    const acknowledgePayload = {
      roundId: payload.roundId ?? null,
      acknowledgedAt: payload.acknowledgedAt ?? Date.now()
    }

    const success = webSocketManager.publish(topic, acknowledgePayload)
    if (success) {
      console.log('[Solo WebSocket] 로딩 ACK 발행 성공:', acknowledgePayload)
    } else {
      console.error('[Solo WebSocket] 로딩 ACK 발행 실패')
    }
    return success
  }

  /**
   * 개별 구독 해제
   */
  unsubscribe(key) {
    const subscription = this.subscriptions.get(key)
    if (!subscription) {
      return
    }

    try {
      webSocketManager.unsubscribe(subscription.topic)
      console.log(`[Solo WebSocket] 구독 해제: ${subscription.topic}`)
    } catch (error) {
      console.error(`[Solo WebSocket] 구독 해제 오류 (${subscription.topic}):`, error)
    }

    this.subscriptions.delete(key)
  }

  /**
   * 모든 구독 해제
   */
  unsubscribeAll() {
    console.log('[Solo WebSocket] 모든 구독 해제 시작')

    this.subscriptions.forEach(({ topic, subscriptionId }) => {
      try {
        webSocketManager.unsubscribe(topic)
        console.log(`[Solo WebSocket] 구독 해제: ${topic}`)
      } catch (error) {
        console.error(`[Solo WebSocket] 구독 해제 오류 (${topic}):`, error)
      }
    })

    this.subscriptions.clear()
    this.roomId = null
    this.gameId = null

    console.log('[Solo WebSocket] 모든 구독 해제 완료')
  }

  /**
   * 서비스 초기화
   */
  reset() {
    this.unsubscribeAll()
    this.handlers = {
      onTimerStart: null,
      onRoundResult: null,
      onRoundTransition: null,
      onNextRound: null,
      onPlayerSubmission: null,
      onGameFinished: null
    }
  }
}

// 싱글톤 인스턴스 생성
const soloGameWebSocketService = new SoloGameWebSocketService()

export default soloGameWebSocketService

