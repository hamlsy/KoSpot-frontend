# RoadView API Service

로드뷰 게임의 백엔드 API 연동을 담당하는 서비스 레이어입니다.

## 파일 구조

```
services/
├── roadViewApi.service.js    # 메인 API 서비스 클래스
└── README.md                 # 이 문서
```

## 주요 기능

### 1. 랭크 게임 API

#### 게임 시작
```javascript
import { roadViewApiService } from './roadViewApi.service.js';

// 랭크 게임 시작
const response = await roadViewApiService.startRankGame();
if (response.isSuccess) {
  const { gameId, targetLat, targetLng, markerImageUrl } = response.result;
  // 게임 데이터 활용
}
```

#### 게임 종료
```javascript
// 랭크 게임 종료
const endData = {
  gameId: 'game_id_from_start',
  targetLat: '37.566826',
  targetLng: '126.978656',
  markerImageUrl: 'https://example.com/marker.png'
};

const response = await roadViewApiService.endRankGame(endData);
if (response.isSuccess) {
  const { currentRatingPoint, ratingScoreChange, score } = response.result;
  // 결과 데이터 활용
}
```

### 2. 연습 게임 API

#### 게임 시작
```javascript
// 연습 게임 시작 (sido key 사용)
const sido = 'SEOUL'; // SEOUL, BUSAN, DAEGU, INCHEON, GWANGJU, DAEJEON, 
                     // ULSAN, SEJONG, GYEONGGI, GANGWON, CHUNGBUK, 
                     // CHUNGNAM, JEONBUK, JEONNAM, GYEONGBUK, GYEONGNAM, JEJU
const response = await roadViewApiService.startPracticeGame(sido);
if (response.isSuccess) {
  const { gameId, targetLat, targetLng, markerImageUrl } = response.result;
  // 게임 데이터 활용
}
```

#### 게임 종료
```javascript
// 연습 게임 종료
const endData = {
  gameId: 'practice_game_id',
  targetLat: '35.179682',
  targetLng: '129.075087',
  markerImageUrl: 'https://example.com/marker.png'
};

const response = await roadViewApiService.endPracticeGame(endData);
if (response.isSuccess) {
  const { score } = response.result;
  // 점수 데이터 활용
}
```

## API 응답 형식

### 공통 응답 형식
```javascript
{
  isSuccess: boolean,
  code: number,
  message: string,
  result: Object
}
```

### 게임 시작 응답
```javascript
{
  isSuccess: true,
  code: 0,
  message: "string",
  result: {
    gameId: "string",
    targetLat: "string",
    targetLng: "string", 
    markerImageUrl: "string"
  }
}
```

### 랭크 게임 종료 응답
```javascript
{
  isSuccess: true,
  code: 0,
  message: "string",
  result: {
    currentRatingPoint: 1250,
    ratingScoreChange: 25,
    score: 85
  }
}
```

### 연습 게임 종료 응답
```javascript
{
  isSuccess: true,
  code: 0,
  message: "string",
  result: {
    score: 85
  }
}
```

## 유틸리티 메서드

### 좌표 변환
```javascript
// 숫자 좌표를 문자열로 변환
const strCoord = roadViewApiService.convertCoordinateToString(37.566826);

// 문자열 좌표를 숫자로 변환
const numCoord = roadViewApiService.convertCoordinateToNumber("37.566826");
```

## 에러 처리

서비스는 자동으로 에러를 처리하며, 다음과 같은 상황에서 적절한 에러 메시지를 제공합니다:

- **네트워크 에러**: "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요."
- **서버 에러**: 서버에서 제공하는 에러 메시지 사용
- **기본 에러**: 메서드별 기본 에러 메시지

## 폴백 전략

API 호출이 실패할 경우, 각 View 컴포넌트에서 더미 데이터로 폴백하여 게임을 계속 진행할 수 있도록 구현되어 있습니다.

### RankView.vue
- API 실패 시 `fallbackToDummyData()` 메서드 호출
- 더미 게임 ID: `dummy_${Date.now()}`

### PracticeView.vue  
- API 실패 시 `fallbackToDummyData()` 메서드 호출
- 더미 게임 ID: `dummy_practice_${Date.now()}`

## 사용 예시

각 View 컴포넌트에서의 실제 사용법은 다음 파일들을 참조하세요:

- `src/features/game/single/roadview/views/RankView.vue`
- `src/features/game/single/roadview/views/PracticeView.vue`

## Sido Key 플로우

연습 게임에서는 백엔드 API 요구사항에 맞춰 sido key를 사용합니다:

1. **RoadViewMainView.vue**: 사용자가 지역 선택 (서울, 부산 등)
2. **라우팅**: 선택된 지역을 sido key로 변환하여 쿼리 파라미터로 전달
   ```javascript
   // 예: 서울 선택 시
   router.push({
     path: '/roadView/practice',
     query: { sido: 'SEOUL' }
   });
   ```
3. **PracticeView.vue**: 쿼리 파라미터에서 sido key를 받아 API 호출
4. **API 호출**: 백엔드에 sido key 전달

### 지원하는 Sido Key 목록

| 지역명 | Sido Key |
|--------|----------|
| 서울 | SEOUL |
| 부산 | BUSAN |
| 대구 | DAEGU |
| 인천 | INCHEON |
| 광주 | GWANGJU |
| 대전 | DAEJEON |
| 울산 | ULSAN |
| 세종 | SEJONG |
| 경기 | GYEONGGI |
| 강원 | GANGWON |
| 충북 | CHUNGBUK |
| 충남 | CHUNGNAM |
| 전북 | JEONBUK |
| 전남 | JEONNAM |
| 경북 | GYEONGBUK |
| 경남 | GYEONGNAM |
| 제주 | JEJU |

## 의존성

- `src/core/api/apiClient.js`: Axios 클라이언트 인스턴스
- 인증 토큰은 apiClient에서 자동으로 처리됨
