# Solo 로드뷰 게임 (멀티플레이어 개인전) - 서버 연동 가이드

## 📁 파일 구조

```
src/features/game/multiplayer/roadview/
├── services/
│   ├── soloGameApi.js          # REST API 호출
│   └── soloGameWebSocket.js    # WebSocket 구독 및 메시지 처리
├── composables/
│   └── useSoloGameFlow.js      # 게임 플로우 관리
├── views/
│   └── SoloGameView.vue        # 멀티플레이어 개인전 뷰
└── README.md
```

## 🎮 게임 플로우

### 1. 게임 시작
```javascript
// WebSocket 연결
await soloGameFlow.connectWebSocket()

// 게임 시작 API 호출 (방장)
const result = await soloGameFlow.startGame(roomId, {
  totalRounds: 5,
  timeLimit: 60000
})
```

**백엔드 API**: `POST /rooms/{roomId}/roadview/games/solo`

**응답 데이터**:
- `gameId`: 게임 ID
- `roundInfo`: 첫 라운드 정보 (roundId, targetLat, targetLng)
- `gamePlayers`: 참여 플레이어 목록

### 2. 라운드 진행

#### 타이머 시작 (WebSocket)
**채널**: `/topic/game/{roomId}/timer`

```javascript
{
  roundId: "1001",
  gameMode: "ROADVIEW",
  serverStartTimeMs: 1698765432000,  // 타이머 시작 시각
  durationMs: 60000,                 // 제한 시간 (60초)
  serverTimestamp: 1698765432000     // 현재 서버 시간
}
```

**처리**: 서버-클라이언트 시간차를 계산하여 정확한 타이머 동기화

#### 정답 제출
```javascript
await soloGameFlow.submitAnswer({
  lat: 37.5665,
  lng: 126.978
})
```

**백엔드 API**: `POST /rooms/{roomId}/games/{gameId}/rounds/{roundId}/submissions/player`

**요청 데이터**:
- `lat`: 제출한 위도
- `lng`: 제출한 경도
- `timeToAnswer`: 응답 시간 (밀리초)

#### 플레이어 제출 알림 (WebSocket)
**채널**: `/topic/game/{gameId}/roadview/submissions/player`

```javascript
{
  playerId: 202,
  roundId: 1001,
  timestamp: "2024-10-31T12:34:56.789Z"
}
```

### 3. 라운드 결과

**채널**: `/topic/game/{roomId}/round/result`

```javascript
{
  roundNumber: 1,
  targetLat: 37.5665,              // 정답 좌표
  targetLng: 126.9780,
  playerSubmissionResults: [       // 각 플레이어 제출 결과
    {
      lat: 37.5670,
      lng: 126.9785,
      distance: 123.45,            // 정답과의 거리 (m)
      timeToAnswer: 45230.5,       // 응답 시간 (ms)
      earnedScore: 8500            // 획득 점수
    }
  ],
  playerTotalResults: [            // 누적 점수 및 순위
    {
      playerId: 201,
      nickname: "플레이어1",
      totalScore: 8500,
      roundRank: 1
    }
  ]
}
```

### 4. 라운드 전환

**채널**: `/topic/game/{roomId}/round/transition`

```javascript
{
  nextRoundStartTimeMs: 1698765442000,  // 다음 라운드 시작 시각
  serverTimestamp: 1698765432000,       // 현재 서버 시간
  isLastRound: false                    // 마지막 라운드 여부
}
```

**처리**: 10초 카운트다운 표시

### 5. 다음 라운드 시작

**채널**: `/topic/game/{roomId}/round/start`

```javascript
{
  gameId: 100,
  currentRound: 2,
  roundInfo: {
    roundId: 1002,
    roundNumber: 2,
    targetLat: 35.1796,
    targetLng: 129.0756
  }
}
```

### 6. 게임 종료

**채널**: `/topic/game/{roomId}/game/finished`

```javascript
{
  gameId: 100,
  message: "게임이 종료되었습니다.",
  timestamp: 1698765532000
}
```

## 🔌 WebSocket 채널 목록

| 채널 | 용도 | 메시지 타입 |
|------|------|------------|
| `/topic/game/{roomId}/timer` | 타이머 시작 | TimerStartMessage |
| `/topic/game/{roomId}/round/result` | 라운드 결과 | RoundResult |
| `/topic/game/{roomId}/round/transition` | 라운드 전환 대기 | RoundTransitionTimerMessage |
| `/topic/game/{roomId}/round/start` | 다음 라운드 시작 | NextRoundResponse |
| `/topic/game/{roomId}/game/finished` | 게임 종료 | GameFinishedMessage |
| `/topic/game/{gameId}/roadview/submissions/player` | 제출 알림 | PlayerSubmissionMessage |

## 📝 사용 방법

### SoloGameView.vue에서 사용

```vue
<script>
import { useSoloGameFlow } from '@/features/game/multiplayer/roadview/composables/useSoloGameFlow'
import gameStore from '@/store/gameStore'

export default {
  setup() {
    const soloGameFlow = useSoloGameFlow(gameStore)
    return { soloGameFlow }
  },

  async mounted() {
    // 서버 모드로 게임 시작
    await this.startServerMode()
  },

  methods: {
    async startServerMode() {
      // WebSocket 연결
      await this.soloGameFlow.connectWebSocket()
      
      // 게임 시작
      await this.soloGameFlow.startGame(this.roomId, {
        totalRounds: 5,
        timeLimit: 60000
      })
    },

    async handleGuessSubmission(position) {
      // 정답 제출
      await this.soloGameFlow.submitAnswer(position)
    }
  },

  beforeUnmount() {
    // 정리
    this.soloGameFlow.cleanup()
  }
}
</script>
```

## 🎯 더미 모드 vs 서버 모드

### 더미 모드
- URL에 `?test=true` 쿼리 파라미터 추가
- WebSocket 연결 없이 로컬에서 시뮬레이션
- 개발 및 테스트용

### 서버 모드
- 기본 모드 (쿼리 파라미터 없음)
- 실제 백엔드 서버와 통신
- WebSocket으로 실시간 게임 진행

**SoloGameView.vue에서 자동 판단**:
```javascript
const isDummyMode = this.$route.query.test === 'true'
if (isDummyMode) {
  this.startDummyMode()
} else {
  await this.startServerMode()
}
```

## ⚠️ 주의사항

### 1. WebSocket 연결
- 게임 시작 전에 반드시 WebSocket 연결
- 연결 실패 시 더미 모드로 자동 전환

### 2. 타이머 동기화
- 서버-클라이언트 시간차 보정 필수
```javascript
const timeDiff = serverTimestamp - Date.now()
const syncedTime = Date.now() + timeDiff
```

### 3. 정리 (Cleanup)
- 컴포넌트 언마운트 시 반드시 정리
```javascript
beforeUnmount() {
  this.soloGameFlow.cleanup()  // 모든 구독 해제 및 타이머 정리
}
```

### 4. 에러 처리
- API 오류 시 사용자에게 알림
- WebSocket 재연결 시도
- 오류 발생 시 더미 모드로 폴백

## 🔧 개발 가이드

### API 서비스 추가
```javascript
// src/features/game/multiplayer/roadview/services/soloGameApi.js

export const newApiMethod = async (params) => {
  try {
    const response = await apiClient.post('/endpoint', params)
    if (response.data?.isSuccess) {
      return response.data.result
    }
    throw new Error(response.data?.message)
  } catch (error) {
    console.error('API 오류:', error)
    throw error
  }
}
```

### WebSocket 핸들러 추가
```javascript
// src/features/game/multiplayer/roadview/services/soloGameWebSocket.js

handleNewMessage(message) {
  console.log('새 메시지:', message)
  
  if (this.handlers.onNewMessage) {
    this.handlers.onNewMessage(message)
  }
}

// 구독 설정
this.subscribe(
  `/topic/game/${roomId}/new-channel`,
  'newChannel',
  this.handleNewMessage.bind(this)
)
```

## 📚 참고 문서

- [REST API 명세](../../../../docs/solo_round_api_docs/ROADVIEW_SOLO_API_GUIDE.md)
- [WebSocket 명세](../../../../docs/solo_round_api_docs/ROADVIEW_SOLO_WEBSOCKET_GUIDE.md)
- [통합 플로우 가이드](../../../../docs/solo_round_api_docs/ROADVIEW_SOLO_INTEGRATION_FLOW.md)
- [Response 명세](../../../../docs/solo_round_api_docs/ROADVIEW_SOLO_RESPONSE_SPEC.md)

## ✅ 체크리스트

### 개발 완료 항목
- [x] REST API 서비스 (`soloGameApi.js`)
- [x] WebSocket 서비스 (`soloGameWebSocket.js`)
- [x] 게임 플로우 Composable (`useSoloGameFlow.js`)
- [x] SoloGameView 서버 모드 연동
- [x] 더미 모드 유지 (테스트용)
- [x] 파일 구조 정리 (multiplayer/roadview로 이동)

### 테스트 필요 항목
- [ ] WebSocket 연결 및 재연결
- [ ] 게임 시작 플로우
- [ ] 정답 제출 및 결과 수신
- [ ] 라운드 전환 및 다음 라운드 시작
- [ ] 게임 종료 처리
- [ ] 에러 처리 및 폴백

## 🐛 문제 해결

### WebSocket 연결 실패
```javascript
// 콘솔 확인
[Solo Flow] WebSocket 연결 타임아웃
[Solo Game] 더미 모드로 전환
```
**해결**: 백엔드 서버 상태 확인, CORS 설정 확인

### 타이머 동기화 오류
```javascript
// 서버 시간과 클라이언트 시간 차이 출력
console.log('Time diff:', timeDiff)
```
**해결**: 서버 타임스탬프 값 확인, NTP 동기화

### 정답 제출 실패
```javascript
[Solo Game] 정답 제출 오류: Error: ...
```
**해결**: API 엔드포인트 확인, 요청 데이터 형식 확인

