# 멀티 결과창 화면상태 동기화 기획안 (Frontend 중심)

## 0. 문서 목적

- 게임 종료 후 `FinalResults` 화면과 `RoomView` 사이에서 플레이어의 현재 화면 상태(`IN_GAME`, `RESULT`, `ROOM`)를 실시간으로 동기화한다.
- 현재 코드 구조를 기준으로, 구현 난이도 대비 리스크가 낮은 경로를 우선 채택한다.
- 백엔드 문서 2종의 충돌 지점을 정리하고, 현 코드베이스에 맞는 단일 실행안을 제시한다.

---

## 1. 현재 플로우 재정리 (코드 기준)

### 1-1. Room -> Game

1. `RoomView.vue`에서 `useRoom.initializeRoom()` 실행
2. `roomWebSocketService.connectToRoom()`가 `/topic/room/{roomId}/playerList` 포함 방 채널 구독
3. 게임 시작 시 `navigateToSoloGame()`로 `BaseGameView.vue` 진입
4. 라우팅 직전 `prepareForGameNavigation()`으로 Room leave 이벤트는 스킵하고 room 채널만 해제

### 1-2. Game 진행 -> 종료

1. `BaseGameView.vue`에서 `useSoloGameFlow.initializeFromServerStart(roomId)` 실행
2. `soloGameWebSocket.js`가 `/topic/game/{roomId}/game/finished` 수신
3. `onGameFinish` 콜백에서 `showGameResults = true`로 `FinalResults` 표시

### 1-3. 종료 후 이동

1. `FinalResults`에서 "방으로 돌아가기" 클릭 시 `BaseGameView.restartGame()` 호출
2. Room detail API 조회 후 `RoomView`로 라우팅
3. 현재는 이 구간 어디에서도 "내 화면이 RESULT/ROOM인지"를 서버에 전송하지 않음

---

## 2. 핵심 문제점

1. **상태 이벤트 미전송**
   - 게임 종료 후/방 복귀 시점에 화면 상태를 발행하지 않으므로 상대 클라이언트가 상태를 알 수 없다.

2. **수신 타입 미지원**
   - `roomWebSocket.service.js`의 `GAME_ROOM_NOTIFICATION_TYPES`에 `SCREEN_STATE_UPDATED`가 없어, 백엔드에서 내려도 기본 분기에서 무시된다.

3. **플레이어 모델에 화면상태 필드 없음**
   - `useRoom.transformGameRoomPlayers()` 결과에 `screenState`, `screenStateSeq`, `screenStateUpdatedAt`가 없다.
   - 따라서 UI 배지/문구로 노출 불가.

4. **역전 방지 규칙 부재**
   - 델타 이벤트와 전체 동기화가 섞일 때, 클라이언트에서 `seq` 기준 드롭 로직이 없어 상태 역전 가능성이 있다.

5. **문서 스펙 충돌**
   - 문서 A: 기존 `/topic/room/{roomId}/playerList` 통합
   - 문서 B: 신규 `/topic/game/{roomId}/screen/state` + snapshot
   - 현 코드 구조는 Room 채널 중심이므로 통합안이 변경 범위/리스크 측면에서 우세.

---

## 3. 아키텍처 결정 (권고안)

## 3-1. 채널 전략

- **P0 채택**: `playerList` 통합 전략
  - 수신: `/topic/room/{roomId}/playerList`
  - 타입: `SCREEN_STATE_UPDATED`(delta) + `PLAYER_LIST_UPDATED`(full sync)
- 이유:
  1. RoomView가 이미 해당 채널을 구독 중
  2. 기존 알림 파이프라인(`GameRoomNotification`) 재사용 가능
  3. 신규 채널/권한/구독 lifecycle 추가 없이 구현 가능

## 3-2. 발행 전략

- 송신 endpoint는 백엔드 문서 기준으로 고정:
  - `/app/room.{roomId}.screen.state`
  - body: `{ state, clientSeq, clientTimestamp }`

## 3-3. 상태 정합성 전략

- 클라이언트는 memberId 단위로 마지막 `screenStateSeq`를 유지
- 적용 규칙:
  - `incomingSeq < localSeq` -> drop
  - `incomingSeq === localSeq` -> no-op
  - `incomingSeq > localSeq` -> apply
- `PLAYER_LIST_UPDATED`에서도 동일 규칙으로 멤버별 적용

---

## 4. Frontend 설계 상세

## 4-1. 데이터 모델

- 공통 enum:
  - `IN_GAME | RESULT | ROOM | DISCONNECTED`
- P0 운영 상태:
  - 송신: `IN_GAME`, `RESULT`, `ROOM`
  - `DISCONNECTED`는 서버 leave 정책과 충돌 소지가 있어 P1 이후 검토

플레이어 객체 확장(최소):

```ts
interface RoomPlayer {
  id: string;
  memberId: string | number;
  nickname: string;
  // ...existing
  screenState?: "IN_GAME" | "RESULT" | "ROOM" | "DISCONNECTED";
  screenStateSeq?: number;
  screenStateUpdatedAt?: number;
}
```

## 4-2. 상태 동기화 유틸 (신규)

- 위치: `src/features/game/multiplayer/room/services/screenStateSync.service.js` (권장)
- 책임:
  1. `clientSeq` 증가기 관리(세션 단위)
  2. `sendScreenState(roomId, state)`
  3. 수신 이벤트 merge 유틸(`applyDelta`, `applyFullSync`)
  4. 상태 문구 변환 유틸(`toLabel`) 제공

## 4-3. Room 수신 처리

- `webSocketChannels.js`
  - `GAME_ROOM_NOTIFICATION_TYPES.SCREEN_STATE_UPDATED` 추가
- `roomWebSocket.service.js`
  - `_handleGameRoomNotification`에 `SCREEN_STATE_UPDATED` 분기 추가
  - payload를 `useRoom.handleGameRoomNotification`으로 전달
- `useRoom.js`
  - `transformGameRoomPlayers`에서 screen state 필드 매핑
  - `handleGameRoomNotification`에 delta 머지 로직 추가
  - `PLAYER_LIST_UPDATED`는 full sync + seq 가드 적용

## 4-4. Game 화면 송신 처리

- `BaseGameView.vue` 전송 타이밍:
  1. 게임 화면 정상 진입 직후 `IN_GAME` 1회 전송
  2. `onGameFinish`에서 `showGameResults=true` 직후 `RESULT` 전송
  3. `restartGame()`에서 라우팅 직전 `ROOM` 전송
- 실패 정책:
  - 전송 실패해도 UX(라우팅/버튼)는 블로킹하지 않음
  - 대신 RoomView 진입 후 `ROOM` 재전송으로 멱등 복구

## 4-5. Room 화면 송신 처리

- `RoomView.vue` 또는 `useRoom.initializeRoom()` 완료 직후 `ROOM` 1회 전송
- 목적:
  - 게임 화면에서 ROOM 전송이 누락돼도 Room 진입 시 최종 보정

## 4-6. UI 반영

### Result 화면

- `FinalResults.vue`에 "상대 화면 상태" 섹션 추가
- 문구 매핑:
  - `RESULT`: 상대가 결과 화면에 있습니다
  - `ROOM`: 상대가 방으로 돌아왔습니다
  - `IN_GAME`: 상대가 게임 화면에 있습니다
  - `DISCONNECTED`: 상대 연결이 일시 끊겼습니다

### Room 화면

- `SoloWaitingList.vue`, `TeamWaitingList.vue`(또는 `shared Player/Card.vue`)에 상태 배지 추가
- 예시:
  - RESULT 배지: "결과 화면"
  - ROOM 배지: "방 대기"
  - IN_GAME 배지: "게임 중"

---

## 5. 문서 충돌 해소안

## 5-1. 충돌 정리

- 문서 A(백엔드 재검증본): playerList 통합 + delta/full
- 문서 B(프론트 명세): 전용 채널 + snapshot

## 5-2. 최종 채택

- **P0는 문서 A 채택** (현 레포 구조와 일치)
- 문서 B의 snapshot 개념은 **P1 옵션**으로 유지
  - 조건: 백엔드가 snapshot endpoint를 실제 제공할 때만 활성화

## 5-3. 구현 시 주의

- FE 코드에서 채널 문자열 하드코딩 금지, constants 경유
- 타입 미등록 시 silent drop이 발생하므로 notification type 동기화를 우선 처리

---

## 6. 단계별 실행 계획

## P0 (필수)

1. notification type/모델 확장
2. Room 수신 파이프라인에 `SCREEN_STATE_UPDATED` 반영
3. `BaseGameView`/`RoomView` 전송 타이밍 반영
4. Result/Room UI 최소 노출 반영
5. seq 역전 방지 로직 적용

완료 기준:

- 2인 방에서 A가 결과창에 남고 B가 방으로 이동할 때, B 화면에서 A 상태가 1초 내 `RESULT`로 보인다.
- A가 방으로 이동하면 B 화면에서 A 상태가 1초 내 `ROOM`으로 변경된다.

## P1 (정합성 강화)

1. 재연결 후 보정 전략 추가(가능 시 snapshot 요청)
2. stale drop 카운트 로깅
3. join 이벤트 payload 재검증(필드 유실 여부)

완료 기준:

- 중복/지연 이벤트 주입 시 상태 역전이 재현되지 않는다.

## P2 (운영 고도화)

1. `DISCONNECTED` 정책을 leave 정책과 함께 재정의
2. 대규모 room 이벤트 부하에서 상태 반영 지연 측정

---

## 7. 테스트 시나리오

## 7-1. 기능 테스트

1. 게임 종료 직후 `RESULT` 전송/수신 확인
2. 방 복귀 클릭 직후 `ROOM` 전송/수신 확인
3. Room 최초 진입 시 `ROOM` 재전송 멱등 확인

## 7-2. 정합성 테스트

1. 동일 memberId에 `seq` 역전 이벤트 주입(`12 -> 11`) 시 drop
2. 동일 `seq` 재수신 시 no-op
3. delta 후 full sync, full sync 후 delta 순서 뒤바뀜 시 최종 상태 불변

## 7-3. 회귀 테스트

1. 기존 `PLAYER_LIST_UPDATED`/`PLAYER_JOINED`/`PLAYER_LEFT` 정상 동작
2. 더미 모드에서 화면 상태 기능 미활성 또는 안전 무시
3. 자동 퇴장(30초) 경로에서 leave/라우팅 회귀 없음

---

## 8. 리스크 및 대응

1. **백엔드-프론트 스펙 불일치**
   - 대응: 채널/타입/payload를 constants와 타입가드로 중앙화

2. **상태 역전으로 인한 UX 혼란**
   - 대응: memberId별 seq 가드 강제

3. **재연결 시 이벤트 유실**
   - 대응: P0는 full sync 복구, P1에서 snapshot 보강

4. **UI 과노출(배지 과다)**
   - 대응: Result/Room에서 상대 상태 중심으로 최소 노출

---

## 9. 작업 파일 제안

- `src/features/game/multiplayer/room/constants/webSocketChannels.js`
- `src/features/game/multiplayer/room/services/roomWebSocket.service.js`
- `src/features/game/multiplayer/room/composables/useRoom.js`
- `src/features/game/multiplayer/roadview/views/BaseGameView.vue`
- `src/features/game/multiplayer/roadview/components/results/FinalResults.vue`
- `src/features/game/multiplayer/room/components/list/SoloWaitingList.vue`
- `src/features/game/multiplayer/room/components/list/TeamWaitingList.vue`
- `src/features/game/shared/components/Player/Card.vue` (팀모드 배지 공통화 시)
- `src/features/game/multiplayer/room/services/screenStateSync.service.js` (신규)

---

## 10. 최종 결론

- 현 코드베이스에서 성공 확률이 가장 높은 경로는 **playerList 통합 + SCREEN_STATE_UPDATED delta 적용**이다.
- P0의 본질은 "전송 타이밍 보장"과 "클라이언트 seq 가드"이며, 이 둘이 없으면 상태 표시는 재현성 있게 깨진다.
- 따라서 이번 이슈는 UI 추가보다 먼저, **Room 수신 파이프라인 정합성 확보**를 우선 구현해야 한다.
