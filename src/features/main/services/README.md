# Main Service

메인 페이지 데이터 조회를 위한 API 서비스

## 개요

`main.service.js`는 메인 페이지에서 필요한 모든 데이터를 한 번의 API 호출로 가져오는 서비스입니다.

## API 엔드포인트

```
GET /main
```

### 인증

**선택 사항** - 로그인 여부와 관계없이 호출 가능
- 로그인한 경우: `Authorization: Bearer {access_token}` 헤더 포함 (자동)
- 로그인하지 않은 경우: 헤더 없이 요청

## 사용법

### 기본 사용

```javascript
import { mainService } from 'src/features/main/services/main.service.js';

// 메인 페이지 데이터 조회
const response = await mainService.getMainPageData();

if (response.isSuccess) {
  const data = response.result;
  
  // 관리자 여부
  console.log('관리자:', data.isAdmin);
  
  // 게임 모드 상태
  console.log('로드뷰 활성화:', data.gameModeStatus.roadviewEnabled);
  console.log('포토 활성화:', data.gameModeStatus.photoEnabled);
  console.log('멀티플레이 활성화:', data.gameModeStatus.multiplayEnabled);
  
  // 공지사항 (최대 3개)
  console.log('공지사항:', data.recentNotices);
  
  // 배너 목록
  console.log('배너:', data.banners);
}
```

### MainView.vue에서의 사용 예시

```javascript
import { mainService } from 'src/features/main/services/main.service.js';

async function loadMainPageData() {
  try {
    const response = await mainService.getMainPageData();
    
    if (response.isSuccess && response.result) {
      const data = response.result;
      
      // 데이터 업데이트
      userProfile.value.isAdmin = data.isAdmin;
      gameModeStatus.value = data.gameModeStatus;
      banners.value = mainService.transformBannersForUI(data.banners);
      recentNotices.value = mainService.transformNoticesForUI(data.recentNotices);
    }
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    // 폴백 데이터 사용
    const fallbackData = mainService.getFallbackData();
  }
}
```

## 주요 메서드

### getMainPageData()

메인 페이지의 모든 데이터를 한 번에 조회합니다.

**반환값:**
```javascript
{
  code: 2000,
  isSuccess: true,
  message: "OK",
  result: {
    isAdmin: false,
    gameModeStatus: {
      roadviewEnabled: true,
      photoEnabled: true,
      multiplayEnabled: false
    },
    recentNotices: [
      {
        noticeId: 3,
        title: "신규 게임 모드 오픈",
        createdDate: "2025-10-28T10:00:00"
      }
    ],
    banners: [
      {
        bannerId: 1,
        title: "신규 이벤트",
        imageUrl: "https://...",
        linkUrl: "https://...",
        description: "설명",
        displayOrder: 1
      }
    ]
  }
}
```

### transformBannersForUI(banners)

서버에서 받은 배너 데이터를 UI에서 사용하기 쉬운 형태로 변환합니다.

**파라미터:**
- `banners` (Array): 서버에서 받은 배너 배열

**반환값:**
```javascript
[
  {
    id: 1,
    badge: "이벤트",
    title: "제목",
    description: "설명",
    image: "이미지 URL",
    link: "링크 URL"
  }
]
```

### transformNoticesForUI(notices)

서버에서 받은 공지사항 데이터를 UI에서 사용하기 쉬운 형태로 변환합니다.

**파라미터:**
- `notices` (Array): 서버에서 받은 공지사항 배열

**반환값:**
```javascript
[
  {
    id: 1,
    category: "공지",
    title: "공지사항 제목",
    date: "2025.10.28"
  }
]
```

### sortBanners(banners)

배너를 displayOrder 순으로 정렬합니다.

**파라미터:**
- `banners` (Array): 배너 배열

**반환값:** 정렬된 배너 배열

### formatDate(dateString)

ISO 8601 날짜 문자열을 `YYYY.MM.DD` 형식으로 변환합니다.

**파라미터:**
- `dateString` (String): ISO 8601 형식의 날짜 문자열

**반환값:** 포맷된 날짜 문자열 (예: "2025.10.28")

### getFallbackData()

API 호출 실패 시 사용할 기본 데이터를 반환합니다.

**반환값:**
```javascript
{
  isAdmin: false,
  gameModeStatus: {
    roadviewEnabled: true,
    photoEnabled: false,
    multiplayEnabled: true
  },
  recentNotices: [...],
  banners: []
}
```

## 응답 데이터 구조

### result 객체

| 필드 | 타입 | 설명 |
|------|------|------|
| `isAdmin` | Boolean | 현재 사용자가 관리자인지 여부 |
| `gameModeStatus` | Object | 게임 모드별 활성화 상태 |
| `recentNotices` | Array | 최근 공지사항 3개 |
| `banners` | Array | 활성화된 배너 목록 |

### gameModeStatus 객체

| 필드 | 타입 | 설명 |
|------|------|------|
| `roadviewEnabled` | Boolean | 로드뷰 모드 활성화 여부 |
| `photoEnabled` | Boolean | 포토 모드 활성화 여부 |
| `multiplayEnabled` | Boolean | 멀티플레이 모드 활성화 여부 |

### recentNotices[] 객체

| 필드 | 타입 | 설명 |
|------|------|------|
| `noticeId` | Number | 공지사항 ID |
| `title` | String | 공지사항 제목 |
| `createdDate` | String | 생성일시 (ISO 8601) |

### banners[] 객체

| 필드 | 타입 | 설명 |
|------|------|------|
| `bannerId` | Number | 배너 ID |
| `title` | String | 배너 제목 |
| `imageUrl` | String | 배너 이미지 S3 URL |
| `linkUrl` | String | 배너 클릭 시 이동할 URL |
| `description` | String | 배너 설명 |
| `displayOrder` | Number | 배너 노출 순서 |

## 에러 처리

서비스는 다음과 같은 방식으로 에러를 처리합니다:

1. **서버 응답 에러**: 서버에서 제공하는 에러 메시지를 사용
2. **네트워크 에러**: "서버에 연결할 수 없습니다" 메시지 표시
3. **기타 에러**: 기본 에러 메시지 표시

```javascript
try {
  const response = await mainService.getMainPageData();
} catch (error) {
  // 에러 처리
  console.error('데이터 로드 실패:', error.message);
  
  // 폴백 데이터 사용
  const fallbackData = mainService.getFallbackData();
}
```

## 주의사항

1. **선택적 인증**: 이 API는 로그인 여부와 관계없이 호출 가능합니다.
2. **폴백 데이터**: API 호출 실패 시 `getFallbackData()`를 사용하여 기본 UI를 유지합니다.
3. **배너 정렬**: 배너는 항상 `displayOrder` 순으로 정렬되어야 합니다.
4. **날짜 포맷**: 모든 날짜는 `YYYY.MM.DD` 형식으로 표시됩니다.
5. **카테고리 자동 분류**: 공지사항과 배너의 카테고리는 제목을 기반으로 자동 분류됩니다.

## 관련 파일

- `src/features/main/services/main.service.js` - 메인 서비스 구현
- `src/features/main/views/MainView.vue` - 메인 페이지 뷰
- `src/core/api/apiClient.js` - API 클라이언트
- `src/core/api/endPoint.js` - API 엔드포인트 정의

