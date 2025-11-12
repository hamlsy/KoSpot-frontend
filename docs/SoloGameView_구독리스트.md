# SoloGameView.vue 구독 리스트

## 개요
SoloGameView.vue 페이지에 접속할 때 구독하는 모든 WebSocket 채널 목록입니다.

**중요**: 로딩 상태 채널은 **RoomView.vue에서 미리 구독**하여 타이밍 문제를 방지합니다.

---

## 구독 채널 목록

### 1. 게임 채널 구독 (setupGameSubscriptions)
**호출 위치**: `useSoloGameFlow.js` → `setupWebSocketSubscriptions()` → `soloGameWebSocket.setupGameSubscriptions()`

#### 1.1 타이머 시작
- **채널**: `/topic/game/{roomId}/timer/start`
- **키**: `timerStart`
- **설명**: 라운드 타이머가 시작될 때 서버에서 브로드캐스트
- **핸들러**: `handleTimerStart` → `useSoloGameFlow.handleTimerStart`

#### 1.2 타이머 동기화
- **채널**: `/topic/game/{roomId}/timer/sync`
- **키**: `timerSync`
- **설명**: 타이머 동기화 메시지 (서버 시간과 클라이언트 시간 동기화)
- **핸들러**: `handleTimerSync` → `useSoloGameFlow.handleTimerSync`

#### 1.3 라운드 결과
- **채널**: `/topic/game/{roomId}/round/result`
- **키**: `roundResult`
- **설명**: 라운드 종료 후 결과 정보 (플레이어 점수, 거리 등)
- **핸들러**: `handleRoundResult` → `useSoloGameFlow.handleRoundResult`

#### 1.4 라운드 전환 타이머
- **채널**: `/topic/game/{roomId}/round/transition`
- **키**: `roundTransition`
- **설명**: 라운드 전환 대기 시간 정보 (다음 라운드 시작까지 남은 시간)
- **핸들러**: `handleRoundTransition` → `useSoloGameFlow.handleRoundTransition`

#### 1.5 다음 라운드 시작
- **채널**: `/topic/game/{roomId}/round/start`
- **키**: `nextRound`
- **설명**: 다음 라운드 시작 정보 (새로운 좌표, 라운드 정보 등)
- **핸들러**: `handleNextRound` → `useSoloGameFlow.handleNextRound`

#### 1.6 게임 종료
- **채널**: `/topic/game/{roomId}/game/finished`
- **키**: `gameFinished`
- **설명**: 게임 종료 정보 (최종 결과, 순위 등)
- **핸들러**: `handleGameFinished` → `useSoloGameFlow.handleGameFinished`

#### 1.7 게임 중 채팅
- **채널**: `/topic/game/{roomId}/chat/global`
- **키**: `globalChat`
- **설명**: 게임 중 전역 채팅 메시지
- **핸들러**: `handleGlobalChat` → `useSoloGameFlow.handleGlobalChat`

---

### 2. 제출 알림 채널 구독 (setupSubmissionSubscription)
**호출 위치**: `useSoloGameFlow.js` → `ensureSubmissionSubscription()` → `soloGameWebSocket.setupSubmissionSubscription()`

**조건**: `gameId`가 메시지에 포함되어 있을 때 동적으로 구독

#### 2.1 플레이어 제출 알림
- **채널**: `/topic/game/{gameId}/roadview/submissions/player`
- **키**: `playerSubmission`
- **설명**: 다른 플레이어가 정답을 제출했을 때 알림
- **핸들러**: `handlePlayerSubmission` → `useSoloGameFlow.handlePlayerSubmission`
- **구독 시점**: 
  - 타이머 시작 메시지 수신 시 (`handleTimerStart`)
  - 라운드 결과 메시지 수신 시 (`handleRoundResult`)
  - 다음 라운드 시작 메시지 수신 시 (`handleNextRound`)

---

### 3. 로딩 상태 채널 구독 (RoomView에서 미리 구독)
**호출 위치**: `RoomView.vue` → `useRoom.js` → `initializeRoom()` → `roomWebSocketService.connectToRoom()`

#### 3.1 로딩 상태
- **채널**: `/topic/game/{roomId}/loading/status`
- **키**: `loadingStatus`
- **설명**: 플레이어 로딩 상태 업데이트 (플레이어 도착 여부, 준비 상태 등)
- **핸들러**: `handleLoadingStatus` → `SoloGameView.handleLoadingStatus`
- **구독 시점**: **RoomView.vue에서 미리 구독** (타이밍 문제 방지)
  - `useRoom.js` → `initializeRoom()` → `roomWebSocketService.connectToRoom()` 호출 시
  - SoloGameView.vue에서는 핸들러만 설정 (`skipSubscribe = true`)

---

## 구독 설정 흐름

### 서버 모드 (isServerMode = true)

1. **RoomView.vue에서 미리 구독** (페이지 접속 시)
   ```javascript
   await initializeRoom()
   ```
   - `useRoom.js` → `initializeRoom()` 호출
   - `roomWebSocketService.connectToRoom()` 호출
   - **1개 로딩 채널 구독** (3.1) - **타이밍 문제 방지를 위해 미리 구독**

2. **컴포넌트 마운트** (`mounted()`)
   ```javascript
   await this.startServerMode()
   ```

3. **게임 초기화** (`startServerMode()`)
   ```javascript
   await this.soloGameFlow.initializeFromServerStart(this.roomId)
   ```
   - `useSoloGameFlow.initializeFromServerStart()` 호출
   - `setupWebSocketSubscriptions()` 호출
   - **7개 게임 채널 구독** (1.1 ~ 1.7)

4. **로딩 상태 핸들러 설정** (`setupLoadingStatusSubscription()`)
   ```javascript
   this.setupLoadingStatusSubscription()
   ```
   - **핸들러만 설정** (구독은 RoomView에서 이미 완료, `skipSubscribe = true`)

5. **동적 구독** (게임 진행 중)
   - 타이머 시작 메시지 수신 시 → **제출 알림 채널 구독** (2.1)
   - 라운드 결과 메시지 수신 시 → **제출 알림 채널 구독** (2.1)
   - 다음 라운드 시작 메시지 수신 시 → **제출 알림 채널 구독** (2.1)

### 더미 모드 (isDummyRuntime = true)

- **구독 없음** (로컬 시뮬레이션만 사용)

---

## 총 구독 개수

### RoomView.vue에서 구독 (페이지 접속 시)
- **로딩 채널**: 1개
- **총 1개**

### SoloGameView.vue에서 구독 (게임 시작 시)
- **게임 채널**: 7개
- **총 7개**

### 동적 구독 (게임 진행 중)
- **제출 알림 채널**: 1개 (gameId 수신 시)
- **최대 총 9개** (RoomView 1개 + SoloGameView 7개 + 동적 1개)

---

## 구독 해제

### SoloGameView.vue - cleanupSubscriptions()
**호출 위치**: `SoloGameView.vue` → `beforeUnmount()` 또는 `exitToLobby()`

```javascript
cleanupSubscriptions() {
  // 서버 모드 정리
  if (this.isServerMode) {
    this.soloGameFlow.cleanup()  // 모든 게임 채널 구독 해제
  }
  
  // 로딩 핸들러만 해제 (구독은 RoomView에서 관리)
  soloGameWebSocket.handlers.onLoadingStatus = null
}
```

### RoomView.vue - disconnectWebSocket()
**호출 위치**: `RoomView.vue` → `onBeforeUnmount()` 또는 `leaveRoom()`

```javascript
disconnectWebSocket() {
  // roomWebSocketService.disconnectFromRoom() 호출
  // 모든 방 채널 구독 해제 (로딩 상태 채널 포함)
}
```

---

## 발행 (Publish) 채널

### 1. 게임 중 채팅 발행
- **채널**: `/app/room.{roomId}.game.global.chat`
- **호출**: `soloGameFlow.publishGlobalChatMessage(content)`
- **설명**: 게임 중 전역 채팅 메시지 전송

### 2. 로딩 ACK 발행
- **채널**: `/app/room.{roomId}.loading.ack`
- **호출**: `soloGameWebSocket.publishLoadingAcknowledge(roomId, payload)`
- **설명**: 플레이어 로딩 완료 확인 메시지 전송

### 3. 정답 제출 발행
- **채널**: `/app/game.{gameId}.roadview.submit`
- **호출**: `soloGameFlow.submitAnswer(position)`
- **설명**: 플레이어의 정답 제출 메시지 전송

---

## 참고 파일

- `src/features/game/multiplayer/roadview/views/SoloGameView.vue`
- `src/features/game/multiplayer/roadview/composables/useSoloGameFlow.js`
- `src/features/game/multiplayer/roadview/services/soloGameWebSocket.js`

