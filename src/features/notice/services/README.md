# Notice Service

공지사항 CRUD 기능을 위한 백엔드 API 연동 서비스입니다.

## 파일 구조

```
notice/
├── services/
│   ├── notice.service.js    # 공지사항 API 서비스
│   └── README.md            # 이 문서
├── views/
│   ├── NoticeListView.vue   # 공지사항 목록 페이지
│   ├── NoticeDetailView.vue # 공지사항 상세 페이지
│   └── NoticeWriteView.vue  # 공지사항 작성/수정 페이지
└── components/              # 공지사항 관련 컴포넌트들
```

## 주요 기능

### 1. 공지사항 목록 조회

```javascript
import { noticeService } from './notice.service.js';

// 페이지별 공지사항 조회
const response = await noticeService.getAllNotices(0); // 첫 번째 페이지
if (response.isSuccess) {
  const notices = response.result; // NoticeListResponse[]
}
```

**응답 데이터 형식:**
```javascript
{
  isSuccess: true,
  code: 0,
  message: "string",
  result: [
    {
      noticeId: 123,
      title: "새로운 기능 업데이트",
      createdDate: "2025-01-15T09:00:00.000Z"
    }
  ]
}
```

### 2. 공지사항 상세 조회

```javascript
// 특정 공지사항 조회
const response = await noticeService.getNoticeById(123);
if (response.isSuccess) {
  const notice = response.result; // NoticeDetailResponse
  console.log(notice.title, notice.content);
}
```

**응답 데이터 형식:**
```javascript
{
  isSuccess: true,
  code: 0,
  message: "string",
  result: {
    noticeId: 123,
    title: "새로운 기능 업데이트",
    content: "새로운 기능이 추가되었습니다...",
    createdDate: "2025-01-15T09:00:00.000Z"
  }
}
```

### 3. 공지사항 생성 (관리자 전용)

```javascript
// 새 공지사항 작성
const noticeData = {
  title: "새로운 공지사항",
  content: "공지사항 내용입니다.",
  images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
};

const response = await noticeService.createNotice(noticeData);
if (response.isSuccess) {
  console.log('공지사항 생성 완료');
}
```

### 4. 공지사항 수정 (관리자 전용)

```javascript
// 공지사항 수정
const updateData = {
  title: "수정된 제목",
  content: "수정된 내용"
};

const response = await noticeService.updateNotice(123, updateData);
if (response.isSuccess) {
  console.log('공지사항 수정 완료');
}
```

### 5. 공지사항 삭제 (관리자 전용)

```javascript
// 공지사항 삭제
const response = await noticeService.deleteNotice(123);
if (response.isSuccess) {
  console.log('공지사항 삭제 완료');
}
```

## 유틸리티 메서드

### 날짜 포맷팅

```javascript
// ISO 8601 형식을 YYYY.MM.DD로 변환
const formatted = noticeService.formatDate("2025-01-15T09:00:00.000Z");
console.log(formatted); // "2025.01.15"

// 상대적 시간 표시
const relative = noticeService.getRelativeTime("2025-01-15T09:00:00.000Z");
console.log(relative); // "2시간 전", "3일 전" 등
```

### 텍스트 처리

```javascript
// 텍스트 요약
const summary = noticeService.truncateText("긴 텍스트 내용...", 50);
console.log(summary); // "긴 텍스트 내용..."

// 카테고리 자동 분류
const category = noticeService.getNoticeCategory("이벤트 공지사항");
console.log(category); // "이벤트"
```

## Vue 컴포넌트에서 사용

### NoticeListView.vue 예시

```javascript
import { ref, onMounted } from 'vue'
import { noticeService } from '@/features/notice/services/notice.service.js'

export default {
  setup() {
    const loading = ref(false)
    const notices = ref([])
    
    const loadNotices = async () => {
      try {
        loading.value = true
        const response = await noticeService.getAllNotices(0)
        
        if (response.isSuccess) {
          notices.value = response.result.map(notice => ({
            ...notice,
            category: noticeService.getNoticeCategory(notice.title),
            formattedDate: noticeService.getRelativeTime(notice.createdDate)
          }))
        }
      } catch (error) {
        console.error('공지사항 로드 실패:', error)
      } finally {
        loading.value = false
      }
    }
    
    onMounted(() => {
      loadNotices()
    })
    
    return {
      loading,
      notices,
      loadNotices
    }
  }
}
```

### MainView.vue 연동 예시

```javascript
// 메인 페이지에서 최근 공지사항 3개 표시
const loadRecentNotices = async () => {
  try {
    const response = await noticeService.getAllNotices(0)
    
    if (response.isSuccess) {
      recentNotices.value = response.result.slice(0, 3).map(notice => ({
        id: notice.noticeId,
        category: noticeService.getNoticeCategory(notice.title),
        title: notice.title,
        date: noticeService.formatDate(notice.createdDate)
      }))
    }
  } catch (error) {
    console.error('공지사항 로드 실패:', error)
    // 에러 시 더미 데이터 표시
  }
}
```

## 데이터 유효성 검사

서비스는 자동으로 데이터 유효성을 검사합니다:

### 제목 검증
- 필수 입력
- 최대 100자
- 빈 문자열 불허

### 내용 검증
- 필수 입력
- 최대 5000자
- 빈 문자열 불허

### 이미지 검증
- 배열 형태여야 함
- 선택사항

```javascript
// 자동 유효성 검사 예시
try {
  await noticeService.createNotice({
    title: "", // 에러: 제목이 비어있음
    content: "내용"
  })
} catch (error) {
  console.error(error.message) // "공지사항 제목을 입력해주세요."
}
```

## 에러 처리

### 네트워크 에러
```javascript
try {
  await noticeService.getAllNotices()
} catch (error) {
  // "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요."
  console.error(error.message)
}
```

### 서버 에러
```javascript
try {
  await noticeService.getNoticeById(999) // 존재하지 않는 ID
} catch (error) {
  // 서버에서 제공하는 에러 메시지 표시
  console.error(error.message)
}
```

### 권한 에러
```javascript
try {
  await noticeService.deleteNotice(123) // 관리자 권한 필요
} catch (error) {
  // "권한이 없습니다" 등의 서버 메시지
  console.error(error.message)
}
```

## 카테고리 시스템

공지사항은 제목을 기반으로 자동으로 카테고리가 분류됩니다:

| 카테고리 | 감지 키워드 | 스타일 클래스 |
|---------|------------|--------------|
| 공지 | "공지", "notice" | `.notice-category.공지` |
| 이벤트 | "이벤트", "event" | `.notice-category.이벤트` |
| 업데이트 | "업데이트", "update" | `.notice-category.업데이트` |
| 일반 | 기타 | `.notice-category.일반` |

```javascript
// 사용 예시
const category = noticeService.getNoticeCategory("신규 이벤트 안내")
console.log(category) // "이벤트"
```

## Swagger API 연동

이 서비스는 다음 Swagger API와 연동됩니다:

- `GET /notice/`: 공지사항 전체 조회 (페이지네이션)
- `GET /notice/{id}`: 공지사항 단일 조회
- `POST /notice/`: 공지사항 생성 (관리자)
- `PUT /notice/{id}`: 공지사항 수정 (관리자)
- `DELETE /notice/{id}`: 공지사항 삭제 (관리자)

## 페이지 구성

### 1. NoticeListView.vue
- 공지사항 목록 표시
- 카테고리별 필터링
- 검색 기능
- 페이지네이션
- 관리자 작성 버튼

### 2. NoticeDetailView.vue
- 공지사항 상세 내용
- 이미지 확대 보기
- 관리자 수정/삭제 버튼
- 삭제 확인 모달

### 3. NoticeWriteView.vue
- 공지사항 작성/수정 폼
- 실시간 미리보기
- 이미지 URL 추가
- 입력 유효성 검사
- 자동 저장 확인

## 라우팅 설정

```javascript
// router 설정 예시
{
  path: '/notice',
  name: 'NoticeList',
  component: () => import('@/features/notice/views/NoticeListView.vue')
},
{
  path: '/notice/:id',
  name: 'NoticeDetail',
  component: () => import('@/features/notice/views/NoticeDetailView.vue')
},
{
  path: '/notice/write',
  name: 'NoticeWrite',
  component: () => import('@/features/notice/views/NoticeWriteView.vue'),
  meta: { requiresAdmin: true }
},
{
  path: '/notice/edit/:id',
  name: 'NoticeEdit',
  component: () => import('@/features/notice/views/NoticeWriteView.vue'),
  meta: { requiresAdmin: true }
}
```

## 권한 관리

관리자 전용 기능:
- 공지사항 작성
- 공지사항 수정
- 공지사항 삭제

```javascript
// 컴포넌트에서 권한 확인
const isAdmin = ref(false) // TODO: 실제 권한 체크로 교체

// 템플릿에서 조건부 표시
<button v-if="isAdmin" @click="writeNotice">작성</button>
```

## 사용 시 주의사항

1. **관리자 권한**: 작성/수정/삭제는 관리자만 가능
2. **데이터 검증**: 클라이언트 측 검증 + 서버 측 검증
3. **에러 처리**: 모든 API 호출에 try-catch 사용
4. **로딩 상태**: 사용자 경험을 위한 로딩 표시
5. **페이지네이션**: 대량 데이터 처리 고려

## 의존성

- `src/core/api/apiClient.js`: Axios 클라이언트 인스턴스
- Vue 3 Composition API
- Vue Router 4
- 사용자 인증 토큰 (자동 첨부)
