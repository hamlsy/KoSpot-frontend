# Roadview Multiplayer Bugfix Plan (Code-Critical Revision)

## 0) 목적

이 문서는 아래 3개 버그를 **실제 코드 흐름 기준**으로 재검증하고, 구현 시 실패 가능성이 높은 가정을 제거한 개선 계획이다.

1. `SoloPlayerList.vue` 제출 상태 즉시 반영 문제
2. `FinalResults.vue` 자동 퇴장 타이머 미표시 문제
3. 타이머 websocket 수신 시 오버레이 강제 종료 필요

---

## 1) 분석 범위

- 시작 흐름: `src/features/game/multiplayer/room/views/RoomView.vue`
- Room orchestration: `src/features/game/multiplayer/room/composables/useRoom.js`
- 게임 메인: `src/features/game/multiplayer/roadview/views/BaseGameView.vue`
- 레이아웃/오버레이: `src/features/game/multiplayer/roadview/views/BaseGameLayout.vue`
- 상태 표시 컴포넌트: `src/features/game/multiplayer/roadview/components/playerlist/SoloPlayerList.vue`
- 결과 화면: `src/features/game/multiplayer/roadview/components/results/FinalResults.vue`
- 실시간 플로우: `src/features/game/multiplayer/roadview/composables/useSoloGameFlow.js`, `src/features/game/multiplayer/roadview/services/soloGameFlowCallbacks.js`, `src/features/game/multiplayer/roadview/services/soloGameWebSocket.js`, `src/features/game/multiplayer/roadview/services/soloGamePlayerMapper.js`

---

## 2) 코드 기준 실제 흐름 (확정 사실)

### A. Room -> Game 진입

1. `RoomView.vue`에서 접근 권한/상세 조회 후 `useRoom.initializeRoom()` 수행
2. `useRoom`이 room websocket 구독 + 게임 시작 카운트다운 이벤트 수신
3. `handleGameStartSignal()`에서 카운트다운 후 `SoloRoadViewGameView` 라우팅
4. `history.state`로 `roomData`, `expectedPlayers`, `timeLimit`, `dummyMode` 전달

### B. BaseGameView 초기화

1. `created/mounted`에서 `gameStore` 상태를 강하게 초기화
2. 서버 모드면 `startServerMode()` 실행
3. `soloGameFlow.initializeFromServerStart(roomId)`에서 게임 채널 구독
4. 이어서 로딩 상태 구독(`setupLoadingStatusSubscription`) + ACK 발행
5. `playerLoading.isActive`가 false가 될 때까지 `PlayerLoadingOverlay` 유지

### C. 라운드/오버레이/타이머

1. `/topic/game/{roomId}/round/start` -> `useSoloGameFlow.handleNextRound`
2. `isOverlayActive=true` 설정 후 Intro 또는 NextRound 오버레이 표시 콜백 호출
3. `/timer/start` 수신 시:
   - 오버레이 활성: `pendingTimerStartMessage` 저장 후 return
   - 오버레이 비활성: 즉시 `startTimer()`
4. 오버레이 완료 이벤트(`intro-complete`) -> `onOverlayComplete()` -> pending 타이머 시작
5. `/timer/sync`는 현재 코드상 **오버레이 활성 중에는 스킵**됨

### D. 제출/결과/종료

1. 제출 알림 채널: `/topic/game/{gameId}/roadview/submissions/player`
2. `handlePlayerSubmission` -> callback -> `gamePlayers[].gamePlayerStatus` 갱신
3. 라운드 결과 수신 -> `roundEnded=true` + 결과 정보 갱신
4. 게임 종료 수신 -> `showGameResults=true` + 부모에서 자동 퇴장 카운트다운 시작

---

## 3) 기존 계획 대비 보정 포인트 (비판적 체크)

1. 제출 상태 이슈는 단순 UI 결합 문제보다, **이벤트 파싱/식별자 불일치 가능성**이 더 우선이다.
   - 현재 `useSoloGameFlow.handlePlayerSubmission()`는 `playerId` 없으면 early return
   - `memberId`만 오는 payload면 제출 이벤트 자체가 버려질 수 있음

2. 오버레이 강제 종료는 `timerSync` 훅만으로 해결되지 않는다.
   - 현재 코드에서 오버레이 활성 중 `handleTimerSync`는 return
   - 따라서 `timerStart` 또는 별도 강제종료 루트를 먼저 설계해야 함

3. 결과 타이머는 이원화되어 있다.
   - `BaseGameView`와 `FinalResults`가 각각 카운트다운 보유
   - 실제 자동 이동 시점과 UI 표기 시점이 불일치 가능

4. 자동 퇴장과 수동 퇴장이 동일 경로로 섞이면 정책 충돌이 생긴다.
   - 수동 퇴장은 confirm 필요
   - 자동 퇴장은 confirm 없이 진행되어야 함

---

## 4) 버그별 개선 계획

## 버그 1) SoloPlayerList 제출 상태 즉시 반영

### 증상

- 내가 제출하기 전에는 다른 플레이어 제출 상태가 실시간으로 보이지 않음

### 코드상 우선 원인

1. `useSoloGameFlow.handlePlayerSubmission()`가 `playerId` 부재 시 메시지를 폐기
2. ID 체계가 혼재(`playerId` vs `memberId`)되어 업데이트 대상 매칭 실패 가능
3. `mapGamePlayersToLocalPlayers()`의 제출 상태 판정 enum이 제한적(`PLAYING|FINISHED`)

### 구현 계획

1. `useSoloGameFlow.handlePlayerSubmission()`에서 식별자 처리 완화
   - `actorId = message.playerId ?? message.memberId`
   - 둘 다 없을 때만 무시
2. callback payload를 `playerId/memberId` 모두 포함해 전달
3. `applySubmissionStatusToPlayers()`와 matcher를 현재 유지하되, status 값을 안전하게 수용
4. `mapGamePlayersToLocalPlayers()`의 `hasSubmitted` 판정 확장
   - 최소: `PLAYING`, `FINISHED`
   - 방어적으로 `SUBMITTED`, `ANSWERED` 등 서버 enum 변화도 허용
5. 제출 상태 표시와 점수 표시를 분리
   - `SoloPlayerList.vue`에서 제출 배지는 `showScores`에 종속하지 않도록 분리 검토
   - 최소한 라운드 진행 중에는 항상 제출 배지 노출

### 대상 파일

- `src/features/game/multiplayer/roadview/composables/useSoloGameFlow.js`
- `src/features/game/multiplayer/roadview/services/soloGamePlayerMapper.js`
- `src/features/game/multiplayer/roadview/services/soloGameFlowCallbacks.js`
- `src/features/game/multiplayer/roadview/components/playerlist/SoloPlayerList.vue`

### 완료 기준

- 내가 제출하지 않아도 타 유저 제출이 1초 내 반영
- 라운드 시작 시 제출 상태가 WAITING으로 초기화
- 첫 라운드 초반(구독 직후)에도 상태 누락이 재현되지 않음

---

## 버그 2) FinalResults 자동 퇴장 타이머 미표시

### 증상

- 결과 화면에서 남은 초가 보이지 않거나 실제 자동 이동과 불일치

### 코드상 우선 원인

1. 카운트다운 상태가 부모/자식에 중복 존재
2. 자동 이동 로직은 부모, 표시 로직은 자식에 분리
3. 모바일에서 결과 카드 하단 정보가 fold 아래로 밀릴 수 있음

### 구현 계획

1. 카운트다운 단일화(Single Source of Truth)
   - `BaseGameView`의 `autoExitRemaining`만 사용
   - `FinalResults` 내부 interval 제거
2. `FinalResults`는 표시 전용으로 변경
   - props: `auto-exit-remaining`, `auto-exit-total`
3. 자동 퇴장/수동 퇴장 분리
   - 수동 버튼: 기존 confirm 경로 유지
   - 자동 만료: confirm 없는 `redirectToLobby()` 경로 고정
4. 가시성 보강
   - 타이머 블록을 결과 화면 내 항상 보이는 위치로 배치(모바일 포함)

### 대상 파일

- `src/features/game/multiplayer/roadview/views/BaseGameView.vue`
- `src/features/game/multiplayer/roadview/components/results/FinalResults.vue`

### 완료 기준

- 결과 화면 진입 즉시 남은 초 표시
- 표시 카운트와 실제 자동 이동 시점 오차 1초 이내
- 수동 퇴장 버튼 동작은 기존 UX(확인 다이얼로그) 유지

---

## 버그 3) 타이머 수신 시 오버레이 강제 종료

### 증상

- 타이머 websocket이 왔는데도 오버레이가 남아 입력이 막힘

### 코드상 우선 원인

1. 오버레이 종료 트리거가 `intro-complete` 이벤트에 과의존
2. 오버레이 상태가 부모/자식으로 분산
3. 오버레이 활성 중 `timerSync`는 스킵되어 회복 기회가 줄어듦

### 구현 계획

1. 공통 강제종료 메서드 추가 (BaseGameView)
   - `playerLoading.isActive=false`
   - `pendingIntroOverlay=false`
   - `baseGame.showIntroOverlay=false`
   - `baseGame.showNextRoundOverlay=false`
2. 타이머 수신 시 강제종료 트리거 연결
   - `useSoloGameFlow`에 `onTimerStartReceived`(또는 동등 콜백) 추가
   - 오버레이가 켜진 상태에서 timer start 수신 시 부모에 종료 요청
3. 강제종료 후 `onOverlayComplete()` 호출로 pending 타이머 즉시 시작
4. 라운드별 1회 가드
   - 동일 라운드에서 중복 강제종료 방지

### 대상 파일

- `src/features/game/multiplayer/roadview/composables/useSoloGameFlow.js`
- `src/features/game/multiplayer/roadview/services/soloGameFlowCallbacks.js`
- `src/features/game/multiplayer/roadview/views/BaseGameView.vue`
- `src/features/game/multiplayer/roadview/views/BaseGameLayout.vue`

### 완료 기준

- 타이머 메시지 수신 후 1초 내 블로킹 오버레이 완전 해제
- 오버레이 잔존으로 조작 불가 상태 재현 불가

---

## 5) 구현 순서 (수정)

1. 버그 3 선반영: 게임 진행 불가 상태 즉시 차단
2. 버그 1 반영: 제출 이벤트 파싱/ID 매칭 안정화
3. 버그 2 반영: 타이머 단일화 + 표시 안정화
4. 로그 축소/정리: 디버그 로그를 최소 운영 수준으로 정리

---

## 6) 테스트 매트릭스

### 서버 모드

- [ ] 내가 미제출 상태에서 타 유저 제출 배지 즉시 반영
- [ ] 1라운드 시작 직후 제출 이벤트 누락 없음
- [ ] 타이머 수신 시 3개 오버레이(loading/intro/next-round) 잔존 없음
- [ ] 결과 화면 타이머와 실제 자동 이동 시점 일치

### 더미 모드

- [ ] 기존 시뮬레이션(제출/라운드/종료) 회귀 없음
- [ ] 결과 화면 타이머 표시/자동 이동 정상

### 회귀

- [ ] 뒤로가기/재입장 시 구독 중복 없음
- [ ] 수동 퇴장(confirm)과 자동 퇴장(no-confirm) 정책 분리 유지

---

## 7) 리스크와 방어

- 오버레이 강제 종료가 과도하면 연출 손실
  - 타이머 수신 + 오버레이 활성 조건에서만 실행
- 서버 enum 변경으로 제출 상태 판정 누락 가능
  - status 매핑을 중앙화하여 허용 enum을 확장 가능하게 유지
- 타이머 단일화 과정에서 UX 변화 가능
  - 기존 버튼 동선은 유지하고 내부 상태 소스만 통합

---

## 8) 최종 목표

- 제출 상태가 내 제출 여부와 무관하게 실시간 반영
- 결과 화면 자동 퇴장 타이머가 항상 보이고 실제 이동과 일치
- 타이머가 오면 오버레이가 즉시 정리되어 게임 진행이 막히지 않음
