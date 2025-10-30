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
      onRoundResult: null,
      onRoundTransition: null,
      onNextRound: null,
      onPlayerSubmission: null,
      onGameFinished: null
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
      `/topic/game/${roomId}/timer`,
      'timer',
      this.handleTimerStart.bind(this)
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

    console.log(`[Solo WebSocket] 모든 게임 채널 구독 완료`)
  }

  /**
   * 제출 알림 채널 구독 (gameId 필요)
   * @param {Number} gameId - 게임 ID
   */
  setupSubmissionSubscription(gameId) {
    this.gameId = gameId

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

    const subscriptionId = webSocketManager.subscribe(topic, callback)
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

