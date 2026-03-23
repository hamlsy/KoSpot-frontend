# KoSpot 온보딩 개선 계획

> 작성일: 2026-03-23 | 브랜치: `feat/113`
> 목표: 신규 방문자가 "이게 뭐하는 사이트야?"를 3초 안에 파악하고, 클릭 한 번으로 게임에 진입하게 만들기

---

## 0. 디자인 시스템 제약 (전 항목 공통 준수)

| 항목 | 규칙 |
|------|------|
| 텍스트 색상 | **검은색(`#111827`) 또는 흰색(`#ffffff`)만** — 컬러 텍스트 금지 |
| 브랜드 색상 | `#4cc9cf` (청록) — 배경·버튼·강조에만 사용 |
| 기본 그라데이션 | `linear-gradient(135deg, #52DEE5 0%, #EEE5E9 100%)` |
| 모서리 | 충분히 둥글게 (`border-radius: 16px` 이상) |
| 인터랙션 | hover 시 `translateY(-2px~-4px)` + box-shadow 강화 |
| 기조 | 가볍고 몰입감 있는 라이트 테마, 균형 잡힌 여백 |

---

## 1. 현재 상태 진단 (AS-IS)

### 1-1. 페이지 구조

```
[NavigationBar]
[hero-banner-wrapper]         ← 배너 없으면 완전히 빈 공간
  ❌ HeroSection (주석 처리됨)
  BannerCarousel (서버 데이터 의존)
[game-modes]
  UserLoginCard               ← "로그인 없이 체험하세요" 뿐, 게임 설명 없음
  로드뷰 모드 카드             ← 아이콘 + 텍스트만, 배경 없음
  멀티플레이어 카드             ← 아이콘 + 텍스트만, 배경 없음
[공지사항]
```

### 1-2. 신규 방문자 시나리오 (현재)

```
접속
 └─▶ 빈 상단 + "로드뷰 모드", "멀티플레이어" 카드만 보임
      └─▶ "이게 뭐하는 사이트야?" 의문 → 이탈
```

### 1-3. 핵심 문제

| # | 문제 | 원인 |
|---|------|------|
| 1 | 게임 설명이 전혀 없음 | HeroSection.vue가 이미 구현됐지만 주석 처리 |
| 2 | 상단이 비어있음 | 배너가 서버 데이터에만 의존 |
| 3 | 튜토리얼 접근 불가 | IntroTutorialModal이 NavBar 버튼으로만 열림, 자동 노출 없음 |
| 4 | 게임 루프 미전달 | "로드뷰 보기 → 지도에 찍기 → 점수" 흐름이 어디에도 없음 |

---

## 2. 목표 상태 (TO-BE)

### 2-1. 페이지 구조

```
[NavigationBar]

[HeroSection]  ← 비로그인 유저 / 세션당 1회 노출
  헤드라인: "로드뷰로 대한민국을 탐험하세요"
  서브: "관광지 로드뷰를 보고 지도에 위치를 찍어 점수를 겨루는 게임"
  3단계 플로우: 👁 로드뷰 관찰 → 📍 위치 추리 → 🏆 점수 획득
  CTA: [지금 바로 체험하기]  [게임 소개 보기]
  통계: 5,000+ 관광지  |  500+ 플레이  |  전국 17개 시도

[BannerCarousel]  ← 서버 데이터 있을 때만

[game-modes]
  UserLoginCard
  로드뷰 카드 (청록 그라데이션 + 태그라인)
  멀티플레이어 카드 (보라 그라데이션 + 태그라인)

[공지사항]
```

### 2-2. 신규 방문자 시나리오 (개선 후)

```
접속 (최초)
 └─▶ IntroTutorialModal 자동 팝업 (4슬라이드)
      ├─▶ [건너뛰기] → HeroSection 노출 상태로 메인 진입
      └─▶ 마지막 슬라이드 → [바로 체험하기] 클릭 → 연습 모드 진입

접속 (재방문, 비로그인)
 └─▶ HeroSection 노출 (세션 첫 접속 시)
      ├─▶ [지금 바로 체험하기] → 연습 모드 직행
      └─▶ [게임 소개 보기] → IntroTutorialModal 열림

접속 (로그아웃 후 재진입, 같은 세션)
 └─▶ HeroSection 미노출 (sessionStorage로 차단) ← 피로감 방지
      └─▶ 게임 모드 카드 바로 노출

접속 (로그인 유저)
 └─▶ HeroSection 미노출, 기존 UX 동일
```

---

## 3. 개선 항목 상세

---

### [1] HeroSection 복원 및 전면 개편 `P1`

**수정 파일:** `src/features/intro/components/HeroSection.vue`

#### 현재 vs 목표

| | 현재 | 목표 |
|--|------|------|
| 위치 | `position: absolute` 오버레이 (주석 처리됨) | `position: relative` 인라인 섹션 |
| 노출 조건 | `!isClosed && !isLoggedIn` (isClosed는 메모리만) | `!isLoggedIn && !heroSeenThisSession` (sessionStorage) |
| 배경 | 흰색 카드 | `linear-gradient(135deg, #52DEE5 0%, #EEE5E9 100%)` |
| 헤드라인 | "KoSpot" | "로드뷰로 대한민국을 탐험하세요" |
| 서브타이틀 | "실제 관광지 로드뷰로 위치를 맞추고..." | "관광지 로드뷰를 보고 지도에 위치를 찍어 점수를 겨루는 게임" |
| 게임 설명 | 없음 | 3단계 플로우 아이콘 |
| 닫기 버튼 | 있음 (isClosed ref) | 제거 (인라인 섹션이므로 불필요) |
| 통계 | 없음 | 5,000+ 관광지 / 500+ 플레이 / 17개 시도 |

#### 와이어프레임

```
┌─────────────────────────────────────────────────────────┐
│  (그라데이션 배경: #52DEE5 → #EEE5E9)                    │
│                                                         │
│         로드뷰로 대한민국을 탐험하세요                      │  ← 흰색, 굵은 헤드라인
│    관광지 로드뷰를 보고 지도에 위치를 찍어 점수를 겨루는 게임   │  ← 흰색, 서브타이틀
│                                                         │
│   [👁 로드뷰 관찰]  →  [📍 위치 추리]  →  [🏆 점수 획득]    │  ← 3단계 플로우
│                                                         │
│       [지금 바로 체험하기]    [게임 소개 보기]              │  ← CTA 버튼
│                                                         │
│    5,000+ 관광지   |   500+ 플레이   |   전국 17개 시도     │  ← 통계 배지
└─────────────────────────────────────────────────────────┘
```

#### 3단계 플로우 HTML 구조

```html
<div class="hero-flow">
  <div class="flow-step">
    <div class="flow-icon"><i class="fas fa-street-view"></i></div>
    <span class="flow-label">로드뷰 관찰</span>
  </div>
  <i class="fas fa-chevron-right flow-arrow"></i>
  <div class="flow-step">
    <div class="flow-icon"><i class="fas fa-map-marker-alt"></i></div>
    <span class="flow-label">위치 추리</span>
  </div>
  <i class="fas fa-chevron-right flow-arrow"></i>
  <div class="flow-step">
    <div class="flow-icon"><i class="fas fa-trophy"></i></div>
    <span class="flow-label">점수 획득</span>
  </div>
</div>
```

#### 통계 배지 HTML 구조

```html
<div class="hero-stats">
  <div class="stat-item">
    <span class="stat-number">5,000+</span>
    <span class="stat-label">관광지 문제</span>
  </div>
  <div class="stat-divider"></div>
  <div class="stat-item">
    <span class="stat-number">500+</span>
    <span class="stat-label">게임 플레이</span>
  </div>
  <div class="stat-divider"></div>
  <div class="stat-item">
    <span class="stat-number">17개</span>
    <span class="stat-label">전국 시도</span>
  </div>
</div>
```

#### sessionStorage 노출 제어

```js
// computed: 이번 세션에 이미 봤는지
const heroSeenThisSession = ref(!!sessionStorage.getItem('kospot_hero_seen'));

// 컴포넌트가 실제로 화면에 그려지면 기록
onMounted(() => {
  sessionStorage.setItem('kospot_hero_seen', '1');
});

// show 조건
const shouldShow = computed(() => !isLoggedIn.value && !heroSeenThisSession.value);
```

#### 주요 CSS 변경

```css
/* 레이아웃: 오버레이 → 인라인 */
.hero-section {
  position: relative;          /* absolute 제거 */
  transform: none;             /* translate 제거 */
  width: 100%;
  max-width: 100%;
  border-radius: 0;            /* 전체 너비 섹션 */
  background: linear-gradient(135deg, #52DEE5 0%, #EEE5E9 100%);
  padding: 48px 24px;
  color: #ffffff;
}

/* hover: translate 제거, shadow만 유지 */
.hero-section:hover {
  box-shadow: var(--shadow-md); /* translate(-50%, ...) 제거 */
}

/* 플로우 아이콘 */
.flow-icon {
  width: 56px; height: 56px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; color: #ffffff;
}

/* 통계 숫자 강조 */
.stat-number {
  font-size: 24px; font-weight: 700; color: #ffffff;
}
.stat-label {
  font-size: 12px; color: rgba(255,255,255,0.85);
}

/* 모바일: 3단계 플로우 세로 스택 */
@media (max-width: 640px) {
  .hero-flow { flex-direction: column; gap: 8px; }
  .flow-arrow { transform: rotate(90deg); }
}
```

#### CTA 버튼 스타일

```css
/* primary: 흰색 배경 + 브랜드 색 텍스트 */
.hero-button.primary {
  background: #ffffff;
  color: #4cc9cf;              /* 텍스트는 흰색/검은색 규칙 예외: 버튼 내 브랜드 강조 */
  border: none;
}

/* secondary: ghost */
.hero-button.secondary {
  background: transparent;
  color: #ffffff;
  border: 2px solid rgba(255,255,255,0.7);
}
```

#### 완료 기준

- [ ] 비로그인 + 첫 세션 접속 시 HeroSection 노출
- [ ] 그라데이션 배경 위 흰색 텍스트 (디자인 규칙 준수)
- [ ] 3단계 플로우(아이콘 + 화살표 + 라벨) 가로 배치
- [ ] 통계 배지 3개 표시 (5,000+ / 500+ / 17개)
- [ ] "지금 바로 체험하기" → `/roadView/practice?sido=SEOUL`
- [ ] "게임 소개 보기" → IntroTutorialModal 열기 (`emit('open-tutorial')`)
- [ ] 로그인 유저 → HeroSection 완전 미노출
- [ ] 같은 세션 내 로그아웃 후 재방문 → HeroSection 미노출
- [ ] 모바일: 플로우 세로 스택, 통계 배지 2열 그리드

---

### [2] MainView 레이아웃 재구성 `P1`

**수정 파일:** `src/features/main/views/MainView.vue`

#### 현재 구조 (문제)

```html
<div class="hero-banner-wrapper" :class="{ 'has-banner': ... }">
  <!-- <HeroSection ... /> -->   ← 주석
  <div v-if="배너있음" class="banner-carousel">...</div>
</div>
```
→ 배너 없으면 `hero-banner-wrapper` 전체가 빈 공간

#### 목표 구조

```html
<main class="main-content-wrapper">

  <!-- ① HeroSection: 비로그인 + 세션 첫 방문 시 노출 (HeroSection 내부에서 조건 판단) -->
  <HeroSection
    @open-tutorial="showTutorial = true"
  />

  <!-- ② 배너: 서버 데이터 있을 때만 -->
  <div v-if="bannersLoaded && displayBanners?.length > 0" class="banner-carousel">
    ...
  </div>

  <!-- ③ 게임 모드 -->
  <section class="game-modes">...</section>

  <!-- ④ 공지사항 -->
  <section class="notices-section">...</section>

</main>
```

**변경 포인트:**
- `hero-banner-wrapper` div 및 `has-banner` 클래스 로직 제거
- HeroSection 주석 해제, `main-content-wrapper` 최상단으로 이동
- HeroSection의 show/hide 조건은 HeroSection.vue 내부에서 자체 관리
- BannerCarousel은 기존 `v-if` 조건 그대로 유지

#### 완료 기준

- [ ] `hero-banner-wrapper` 제거 후 배너 없을 때 빈 공간 없음
- [ ] HeroSection이 main-content-wrapper 최상단에 독립 배치
- [ ] 비로그인: HeroSection → (배너) → 게임모드 → 공지 순서
- [ ] 로그인: (배너) → 게임모드 → 공지 순서

---

### [3] 신규 방문자 자동 튜토리얼 트리거 `P1`

**수정 파일:** `src/features/main/views/MainView.vue`, `src/features/intro/components/IntroTutorialModal.vue`

#### 노출 제어 전략

| 컴포넌트 | 저장소 | 키 | 동작 |
|---------|--------|-----|------|
| IntroTutorialModal | `localStorage` | `kospot_tutorial_seen` | 최초 1회만. 브라우저 재시작해도 다시 안 뜸 |
| HeroSection | `sessionStorage` | `kospot_hero_seen` | 세션당 1회. 탭 닫으면 초기화, 재접속 시 다시 노출 |

#### MainView.vue 변경: onMounted 자동 트리거

```js
onMounted(() => {
  // 최초 방문 시에만 튜토리얼 자동 표시
  if (!localStorage.getItem('kospot_tutorial_seen')) {
    showTutorial.value = true;
  }
});

const handleTutorialComplete = () => {
  localStorage.setItem('kospot_tutorial_seen', '1');
  showTutorial.value = false;
};

// skipTutorial도 동일하게 처리
const handleTutorialSkip = () => {
  localStorage.setItem('kospot_tutorial_seen', '1');
  showTutorial.value = false;
};
```

> **주의:** NavigationBar의 `@open-tutorial="showTutorial = true"` 이벤트는 localStorage 체크 없이 그대로 동작시켜야 함 (수동 재열람 가능해야 함)

#### IntroTutorialModal.vue 슬라이드 4 변경

**현재 (비로그인 시):**
```html
<template v-if="!isLoggedIn">
  <button @click="goToLogin">로그인하러 가기</button>   ← 게임 직행 불가
</template>
```

**목표:**
```html
<template v-if="!isLoggedIn">
  <button class="start-button primary" @click="startPractice">
    <i class="fas fa-street-view"></i>
    바로 체험하기        ← 연습 모드 직행 (메인 CTA)
  </button>
  <button class="start-button secondary" @click="goToLogin">
    <i class="fas fa-sign-in-alt"></i>
    로그인하고 랭킹 등록  ← 로그인 유도 (서브)
  </button>
</template>
```

```js
const startPractice = () => {
  emit('complete');
  router.push({ path: '/roadView/practice', query: { sido: 'SEOUL' } });
};
```

#### skipTutorial emit 정리

현재 `skipTutorial`은 `emit('close')`만 발행. 아래로 통일:
```js
const skipTutorial = () => {
  emit('complete'); // MainView에서 localStorage 기록하도록
};
```

#### 완료 기준

- [ ] 첫 방문(localStorage 키 없음) → IntroTutorialModal 자동 표시
- [ ] 재방문(키 있음) → 자동 표시 없음
- [ ] 튜토리얼 완료 또는 건너뛰기 → `kospot_tutorial_seen` 기록
- [ ] 마지막 슬라이드 비로그인: "바로 체험하기"(primary) + "로그인하고 랭킹 등록"(secondary)
- [ ] "바로 체험하기" → `/roadView/practice?sido=SEOUL` 이동
- [ ] NavigationBar 수동 트리거 → localStorage 무관하게 열림

---

### [4] 게임 모드 카드 시각 개선 `P2`

**수정 파일:** `src/features/main/views/MainView.vue`

#### 와이어프레임 (로드뷰 카드)

```
┌─────────────────────────────────┐
│  (청록 그라데이션 배경)            │
│                                 │
│   [🗺 아이콘]                    │
│   로드뷰 모드              흰색  │
│   실제 거리를 둘러보며             │
│   위치를 맞춰보세요                │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 👁 보기 → 📍 찍기 → 🏆 │    │  ← 태그라인 배지
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

#### 카드별 스타일

| 카드 | 배경 | 태그라인 |
|------|------|---------|
| 로드뷰 | `linear-gradient(135deg, #52DEE5 0%, #4cc9cf 100%)` | `로드뷰 관찰 → 위치 추리 → 점수 획득` |
| 멀티플레이어 | `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` | `실시간 대결 → 순위 겨루기 → 승리` |

#### HTML 추가 (카드 내 태그라인)

```html
<!-- mode-info 아래에 추가 -->
<div class="mode-tagline">
  <span>로드뷰 관찰</span>
  <i class="fas fa-arrow-right"></i>
  <span>위치 추리</span>
  <i class="fas fa-arrow-right"></i>
  <span>점수 획득</span>
</div>
```

#### CSS

```css
.mode-card.roadview .mode-background {
  background: linear-gradient(135deg, #52DEE5 0%, #4cc9cf 100%);
}
.mode-card.multiplayer .mode-background {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 카드 위 텍스트 흰색 */
.mode-card .mode-info h3,
.mode-card .mode-info p {
  color: #ffffff;
}

/* 태그라인 배지 */
.mode-tagline {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.2);
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 11px; color: #ffffff;
  margin-top: 12px;
}

/* hover 인터랙션 강화 */
.mode-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.15);
}
```

#### 완료 기준

- [ ] 로드뷰/멀티 카드에 각자 다른 그라데이션 배경
- [ ] 카드 내 모든 텍스트 흰색 (디자인 규칙 준수)
- [ ] 태그라인 배지(반투명 흰색 pill) 카드 하단 표시
- [ ] hover 시 `translateY(-4px)` + shadow 강화

---

## 4. 작업 순서

> 1~3은 같은 파일(MainView.vue)이 겹치므로 순서대로 진행 권장

| 순서 | 항목 | 파일 |
|------|------|------|
| 1 | MainView 레이아웃 재구성 | `MainView.vue` |
| 2 | HeroSection 전면 개편 | `HeroSection.vue` |
| 3 | MainView에 HeroSection 연결 + 자동 튜토리얼 | `MainView.vue` |
| 4 | IntroTutorialModal 마지막 슬라이드 CTA 추가 | `IntroTutorialModal.vue` |
| 5 | 게임 모드 카드 시각 개선 | `MainView.vue` |

---

## 5. 가드레일

**Must:**
- 텍스트는 검은색(`#111827`) 또는 흰색만
- 그라데이션 배경 위 텍스트는 반드시 흰색
- 모바일/태블릿 반응형 유지
- 로그인 유저 경험 변경 없음
- NavigationBar 튜토리얼 버튼 수동 트리거 유지

**Must NOT:**
- 백엔드 API 변경 (프론트엔드만으로 해결)
- 새 라우트 추가
- 게임 플레이 로직 변경
- 컬러(검정/흰색 외) 텍스트 사용

---

## 6. 미결 사항

- [ ] HeroSection 닫기 버튼 완전 제거 vs 유지 여부 (현재 계획: 제거)
- [ ] 튜토리얼 `localStorage` 초기화 방법 제공 여부 (예: 설정 메뉴 "다시 보기")
