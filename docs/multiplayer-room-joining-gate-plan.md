# 멀티 Room `JOINING` 게이트 반영 세부 실행 계획

## 0. 문서 목적

- 백엔드 최신 스펙(조인 직후 `JOINING`, `playerList` 구독 시 `ROOM` 승격)에 맞춰 프론트의 방 입장/표시/게임시작 게이트를 정합성 있게 맞춘다.
- 현재 미구현 상태인 **"RoomView 진입 도중(`JOINING`) 표시"**를 사용자 UI와 내부 상태머신 모두에서 정확히 반영한다.
- 기존에 구현된 `SCREEN_STATE_UPDATED`/`PLAYER_LIST_UPDATED` 동기화에 `JOINING`을 안전하게 추가하되, 기존 흐름(게임/결과/복귀)을 깨지 않도록 단계적으로 적용한다.

---

## 1. 백엔드 계약(최신) 요약

1. `POST /rooms/{roomId}/join` 직후 서버 저장 상태는 `JOINING`.
2. 클라이언트가 `SUBSCRIBE /topic/room/{roomId}/playerList`를 수행하면 서버가 `JOINING -> ROOM` 승격.
3. `POST /rooms/{roomId}/start`는 시작 전 전원 `ROOM`인지 검증.
4. 화면 상태 수신은 `playerList` 채널 단일화:
   - delta: `SCREEN_STATE_UPDATED`
   - full: `PLAYER_LIST_UPDATED`
5. 클라이언트 송신은 `IN_GAME | RESULT | ROOM`만 허용 (`JOINING`은 서버 전용 상태).

---

## 2. 현재 코드 기준 문제 진단

### 2-1. `JOINING`이 `ROOM`으로 강제 정규화됨

- 파일: `src/features/game/multiplayer/room/services/screenStateSync.service.js`
- `normalizeScreenState()`가 인식하지 않는 상태를 기본 `ROOM`으로 내림.
- 결과: 서버가 `JOINING`을 내려도 UI/스토어에서는 `ROOM`으로 보여 "입장 중"이 사라짐.

### 2-2. 동일 seq 전이(`JOINING -> ROOM`) 반영 규칙 부재

- 파일: `src/features/game/multiplayer/room/services/screenStateSync.service.js`
- `shouldApplyScreenState()`가 `incomingSeq === currentSeq`를 무조건 drop.
- 스펙상 동일 seq라도 상태가 다르면 반영해야 함(서버 승격 케이스).

### 2-3. 시작 버튼 게이트가 인원수 기준만 사용

- 파일: `src/features/game/multiplayer/room/composables/useRoomPlayer.js`, `useRoom.js`, `RoomHeader.vue`
- 현재 `canStartGame`은 최소 인원/팀 조건만 확인.
- `JOINING` 플레이어가 있어도 버튼이 켜질 수 있어 서버 409/400 에러를 유발.

### 2-4. `JOINING` UI 표현 누락

- 파일: `SoloWaitingList.vue`, `Card.vue`(팀 카드 공용)
- 상태 라벨/배지 스타일에 `JOINING` 없음.
- 사용자 입장에서는 "누가 들어오는 중인지"를 확인할 수 없음.

### 2-5. RoomView 진입 시 구독 선행 보장 약함

- 파일: `RoomView.vue` + `useRoom.js`
- 현재는 접근권한 확인/방 상세조회 후 `initializeRoom()`에서 구독.
- 네트워크 지연 시 `JOINING` 유지 시간이 길어지고, 방장이 그 사이 시작을 누르면 서버 거절 가능성이 커짐.

### 2-6. delta 수신 시 대상 플레이어 미존재하면 상태가 유실될 수 있음

- 파일: `src/features/game/multiplayer/room/composables/useRoom.js`
- `applyScreenStateDelta()`는 현재 목록에서 멤버를 찾을 때만 갱신하고, 없으면 drop.
- 조인 직후 이벤트 순서가 `SCREEN_STATE_UPDATED` -> `PLAYER_JOINED/PLAYER_LIST_UPDATED`로 들어오면 `JOINING` 표시가 늦어지거나 누락될 수 있음.

### 2-7. `PLAYER_LIST_UPDATED` 빈 배열(full sync) 케이스 처리 취약

- 파일: `src/features/game/multiplayer/room/composables/useRoom.js`
- `hasPlayersArray = Array.isArray(players) && players.length > 0` 조건이라, 빈 배열도 유효한 full sync인데 반영이 생략됨.
- 이 케이스가 남아 있으면 상태 게이트 계산(`allPlayersInRoomState`)이 과거 목록 기준으로 남을 수 있음.

---

## 3. 목표/비목표

### 목표

1. Room 진입 도중 플레이어를 `JOINING`으로 정확히 표시.
2. 방장은 `JOINING` 존재 시 시작 버튼 비활성 + 안내 문구 노출.
3. `JOINING -> ROOM` 승격을 seq 규칙에 맞게 안정 반영.
4. 기존 `IN_GAME/RESULT/ROOM` 흐름과 충돌 없이 동작.

### 비목표

- `JOINING`을 클라이언트가 직접 송신하는 기능(금지).
- 별도 snapshot 채널 도입(현 스펙 범위 밖).

---

## 4. 설계 원칙

1. **수신/송신 정규화 분리**: 수신은 `JOINING` 허용, 송신은 3상태만 허용.
2. **서버 권위 우선**: 상태 충돌 시 서버 delta/full sync를 기준으로 병합.
3. **동일 seq 상태전이 허용**: 상태값이 다르면 apply.
4. **UI 게이트 + API 게이트 이중화**: 버튼 비활성 + 클릭 시 재검증.
5. **기존 더미 모드/기능 회귀 방지**: dummy에서는 JOINING 게이트 우회.
6. **보수적 시작 차단**: `playerList`가 준비되지 않았거나 WebSocket이 불안정하면 시작 버튼을 잠정 비활성.

---

## 5. 파일별 상세 실행 계획

## 5-1. 상태 유틸 계층 정리 (`screenStateSync.service.js`)

대상: `src/features/game/multiplayer/room/services/screenStateSync.service.js`

실행 항목:

1. enum 확장
   - `MULTIPLAYER_SCREEN_STATES`에 `JOINING` 추가.
2. 정규화 함수 분리
   - `normalizeIncomingScreenState(value)`:
     - 허용: `JOINING | IN_GAME | RESULT | ROOM | DISCONNECTED`
     - 미정값 fallback은 `ROOM`.
   - `normalizeOutgoingScreenState(value)`:
     - 허용: `IN_GAME | RESULT | ROOM`
     - 그 외 상태면 `null` 반환 + 경고 로그(실수 조기 탐지).
3. seq 적용 판정 개선
   - 기존 단순 `currentSeq < incomingSeq` 비교를 상태 비교 포함 로직으로 교체:
     - `incomingSeq < currentSeq` -> drop
     - `incomingSeq > currentSeq` -> apply
     - `incomingSeq === currentSeq`:
       - `incomingState === currentState` -> no-op
       - `incomingState !== currentState` -> apply
   - 구현 안정성: 기존 호출부 호환을 위해 `normalizeScreenState`는 수신 정규화 alias로 유지하고, 신규 함수를 병행 제공.
4. merge 함수 갱신
   - `mergeScreenStateFields`에서 위 판정 사용.
5. 송신 보호
   - `sendScreenState(roomId, state)`는 `normalizeOutgoingScreenState` 통과 상태만 publish.
   - `JOINING` 전달 시 publish하지 않음.

산출물:

- 수신 경로에서 `JOINING` 유지 가능.
- 송신 경로에서 스펙 위반 차단.

---

## 5-2. Room 플레이어 매핑/병합 규칙 보강 (`useRoom.js`)

대상: `src/features/game/multiplayer/room/composables/useRoom.js`

실행 항목:

1. 플레이어 변환 시 `screenState`를 수신 정규화로 매핑
   - `transformGameRoomPlayers()`/`transformGameRoomPlayer()`에서 `JOINING` 보존.
2. delta 적용 규칙 업데이트
   - `applyScreenStateDelta()`에서 동일 seq + 상태 변경 허용.
   - 대상 멤버가 목록에 없을 때는 `transformGameRoomPlayer(playerInfo)`로 최소 정보 upsert를 허용.
3. full sync 병합 규칙 업데이트
   - `mergeScreenStateFromFullSync()`가 스펙의 seq 규칙 그대로 따르도록 수정.
   - `PLAYER_LIST_UPDATED`에서 `players: []`도 유효 full sync로 처리(목록 비우기 포함).
4. 시작 가능 파생 상태 추가
   - `joiningPlayers` (screenState=`JOINING` 목록)
   - `hasJoiningPlayers`
   - `allPlayersInRoomState` (모든 플레이어 `ROOM` 여부)
   - `canStartGameWithScreenGate = canStartGame && allPlayersInRoomState`
   - `hasNonRoomPlayers` (`JOINING`, `IN_GAME`, `RESULT`, `DISCONNECTED` 포함)
   - `isPlayerListReady` (최초 playerList 동기화 수신 여부)
   - `startBlockReason` (인원 부족/팀 조건 실패/동기화 대기/비ROOM 플레이어 존재를 구분)
5. `startGame()` API 호출 전 재검증
   - 버튼 disabled와 별개로 함수 내부에서도 `isPlayerListReady` + `allPlayersInRoomState` 체크.
   - `JOINING`이 포함된 경우 권장 문구: `참여 중인 플레이어가 있습니다. 잠시 후 다시 시도해주세요.`
   - 그 외 비ROOM 상태가 있으면 일반 문구: `모든 플레이어가 방 화면으로 돌아온 뒤 시작할 수 있습니다.`

산출물:

- 상태 병합 역전 방지 + JOINING 기반 시작 게이트 확보.

---

## 5-3. RoomView 초기 진입 순서 개선 (구독 선행)

대상: `src/features/game/multiplayer/room/views/RoomView.vue`, `useRoom.js`

실행 항목:

1. 초기화 시퀀스 재정렬(지연 최소화)
   - 현재: 접근확인/상세조회 -> initializeRoom -> WS connect+subscribe
   - 목표: 접근확인 직후 가능한 빨리 WS connect+`playerList` subscribe
2. 구현 방식
   - `initializeRoom()` 내부를 2단계로 분리:
     - A. 연결/구독 단계(승격 트리거)
     - B. 상세 데이터 보강 단계(API)
   - 또는 병렬화:
     - WS connect+subscribe와 roomDetail fetch를 `Promise.allSettled`로 동시에 수행.
3. 실패 처리
   - WS 연결 실패 시 기존 fallback 유지(토스트/재시도), 단 시작 버튼은 보수적으로 비활성 유지.
4. 멱등 ROOM 재전송 유지
    - subscribe 직후 서버 승격이 표준 경로이며,
    - 기존 `ROOM` 재전송은 복구용으로 유지하되 JOINING 표현을 덮어쓰지 않게 타이밍 조정.
   - 재검토 결론: `ROOM` 재전송을 제거하지 않고 유지하되, **최초 full sync 수신 이후** 1회로 제한하면 JOINING 가시성과 복구성을 동시에 확보 가능.

산출물:

- JOINING 체류 시간 감소, 시작 거절 확률 감소.

---

## 5-4. 헤더 UX 게이트 반영 (`RoomHeader.vue` + `RoomView.vue`)

대상: `src/features/game/multiplayer/room/components/header/RoomHeader.vue`, `src/features/game/multiplayer/room/views/RoomView.vue`

실행 항목:

1. `RoomHeader` props 확장
   - `startBlockReason?: string`
   - `joiningCount?: number`
2. 버튼 하단 안내 문구 노출
   - 호스트 + 시작 불가일 때만 노출.
   - `JOINING` 사유일 때 문구:
      - `참여 중인 플레이어가 있습니다. 잠시 후 다시 시도해주세요.`
   - `비ROOM` 일반 사유(`RESULT`/`IN_GAME`) 문구:
      - `모든 플레이어가 방 화면으로 돌아오면 시작할 수 있습니다.`
   - `동기화 대기` 사유 문구:
      - `참가자 상태를 확인하는 중입니다. 잠시만 기다려주세요.`
3. `RoomView`에서 신규 computed 전달
   - `can-start-game`에 `canStartGameWithScreenGate` 연결.
   - 안내 문구/카운트 전달.

산출물:

- 서버 에러 전 UX 선차단, 사용자 이해도 향상.

---

## 5-5. 목록/카드 `JOINING` 시각화

대상:

- `src/features/game/multiplayer/room/components/list/SoloWaitingList.vue`
- `src/features/game/shared/components/Player/Card.vue`
- (필요시) `TeamWaitingList.vue`

실행 항목:

1. 상태 라벨 맵에 `JOINING` 추가
   - 라벨: `입장 중`
2. 배지 스타일 추가
   - class 예: `.state-joining`
   - 색상은 `ROOM`과 명확히 구분되는 경고계열(amber) 사용.
3. 현재 사용자 본인도 `JOINING` 표시 허용
   - self 관점에서도 진입 진행 상태를 인지 가능.

산출물:

- RoomView 진입 도중 상태가 실제로 보이는 UI 완성.

---

## 5-6. 게임 화면 수신 병합 규칙 동기화 (`BaseGameView.vue`)

대상: `src/features/game/multiplayer/roadview/views/BaseGameView.vue`

실행 항목:

1. room playerList 구독 병합 로직에서 동일 seq 상태전이 허용.
2. 수신 정규화 함수도 `JOINING` 인지하도록 동기화.
3. 결과 화면 상태표시 컴포넌트(`FinalResults`)에 `JOINING` 라벨 추가(필요 시).

산출물:

- 결과 화면에서도 Room 진입 중 상대 상태를 왜곡 없이 관찰 가능.

---

## 5-7. 수동 새로고침 경로 정합성

대상: `src/features/game/multiplayer/room/views/RoomView.vue` (`handleRefreshRoom`)

실행 항목:

1. 수동 새로고침 변환 로직도 `JOINING` 보존 정규화 사용.
2. 새로고침 직후 시작 버튼 게이트 재평가.

산출물:

- 수동 갱신으로 상태가 `ROOM`으로 되돌아가는 회귀 방지.

---

## 6. 단계별 구현 순서 (권장)

### Phase 1: 상태 모델/병합 규칙

1. `screenStateSync.service.js` 분리 정규화 + seq 규칙 수정
2. `useRoom.js` delta/full merge 반영
3. `BaseGameView.vue` merge 규칙 동기화

### Phase 2: JOINING 표시

1. `SoloWaitingList.vue`, `Card.vue` 라벨/스타일 추가
2. 필요 시 `FinalResults.vue` 보강

### Phase 3: 시작 게이트

1. `useRoom.js` 파생 computed + `startGame()` 재검증
2. `RoomHeader.vue` 안내 문구 props/UI
3. `RoomView.vue` wiring

### Phase 4: 진입 순서 개선

1. Room 초기화 시퀀스 재정렬 또는 병렬화
2. 실패/재시도/더미모드 회귀 검증

### Phase 5: 안정성 보강(권장)

1. delta upsert/empty full sync 처리 회귀 테스트
2. `startGame()` 가드와 헤더 disabled 조건 불일치 여부 점검
3. 재연결 후 첫 `PLAYER_LIST_UPDATED` 전까지 시작 차단 동작 검증

---

## 7. QA 체크리스트 (JOINING 중심)

1. 조인 직후(입장자 클라이언트): 본인 카드가 잠시 `입장 중`으로 표시되는가.
2. 기존 방 참가자 관점: 새 플레이어가 `입장 중`으로 보였다가 `방 대기`로 승격되는가.
3. 방장 관점: `JOINING` 플레이어가 1명이라도 있으면 시작 버튼이 비활성화되는가.
4. 방장 클릭 시: 권장 문구가 노출되고 시작 API 호출이 차단되는가.
5. 동일 seq 승격 케이스(`JOINING -> ROOM`, seq 동일)에서 상태가 정상 변경되는가.
6. `incomingSeq < currentSeq` 이벤트는 drop되는가.
7. 수동 새로고침 이후에도 `JOINING`이 보존되는가.
8. 재연결 후 재구독 + 상태 재전송으로 최종 상태가 복구되는가.
9. `PLAYER_LIST_UPDATED`가 빈 배열로 올 때도 로컬 목록/게이트가 정합하게 갱신되는가.
10. delta가 먼저 도착한 경우(플레이어 미존재) `JOINING`이 유실되지 않는가.

---

## 8. 리스크 및 대응

1. **정규화 함수 변경으로 기존 상태 해석 영향**
   - 대응: 수신/송신 함수 분리, 호출부를 단계별 교체.
2. **동일 seq 허용으로 오적용 가능성**
   - 대응: "동일 seq + 상태 다름"일 때만 apply, 그 외 no-op 유지.
3. **초기화 순서 변경으로 기존 로딩 UX 변동**
   - 대응: 단계적 적용(먼저 모델/게이트, 이후 순서 최적화).
4. **더미 모드 회귀**
   - 대응: dummy 경로는 JOINING 게이트를 명시적으로 우회.

---

## 9. 완료 정의 (Definition of Done)

1. RoomView/대기목록에서 `JOINING`이 실제 노출된다.
2. 시작 버튼은 "전원 ROOM" 조건을 만족해야만 활성화된다.
3. 동일 seq 승격 케이스를 포함해 상태 역전/누락이 재현되지 않는다.
4. 기존 게임 진행(`IN_GAME`), 결과(`RESULT`), 복귀(`ROOM`) 동기화가 유지된다.
5. lint 및 수동 2클라이언트 시나리오 점검을 통과한다.
