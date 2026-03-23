# 익명 사용자 온보딩 퍼널 개선 계획

## 목표

비로그인 사용자가 서비스를 **경험하기 전에 이탈하는 것을 방지**한다.
"Try → Aha moment → Convert" 구조로 자연스러운 회원가입 유도를 만든다.

---

## 핵심 전략: 방안 B + 결과 화면 로그인 유도 강화

### 선택 이유

사용자의 시선과 클릭은 `UserLoginCard`보다 **게임 모드 카드**로 먼저 향한다.
가장 자연스러운 동선에 마찰을 제거하고, 게임을 마친 직후 — 자신의 점수가 눈에 보이는 순간 — 로그인을 유도하면 손실 회피 심리가 극대화된다.

> "나의 점수를 저장하고 싶다" → 로그인 동기 발생

---

## 디자인 기준

### 컬러 팔레트 (`src/core/constants/colors.js` 기준)

| 용도 | 값 | 적용 위치 |
|---|---|---|
| **주 브랜드** | `#4cc9cfff` | 주 CTA 버튼 배경 |
| **주 그라데이션** | `linear-gradient(135deg, #52DEE5 0%, #EEE5E9 100%)` | 카드 상단 accent 라인 |
| **텍스트** | `#111827` (흑) / `#ffffff` (백) **only** | 모든 텍스트 — 중간 컬러 사용 금지 |
| **배경** | `#ffffff` / `#f3f4f6` | 카드 배경, 섹션 배경 |
| **손실 강조** | `#ef4444` (5% opacity 배경) | 결과 화면 "기록 미저장" 배너 |

### 이펙트 원칙

> **사용자가 느끼지 못할 정도로 은은하게** — 이펙트가 눈에 띄면 이미 과한 것이다.

- **transition**: `0.2s ease` 통일 — `0.15s`보다 약간 여유 있게, 빠릿하지 않게
- **hover lift**: `translateY(-1px)` — 기존 `.login-button`의 `-2px`보다 절반으로 줄임
- **box-shadow**: hover 시 `0 4px 12px rgba(76, 201, 207, 0.20)` — 번지지 않게 작게
- **active**: `translateY(0)` 복귀만, 별도 scale 없음
- **그라데이션 배경**: opacity 8~10% 이하로만 사용 — 색이 배경을 잡아먹으면 안 됨
- **모바일에서는 hover 이펙트 없음** — touch 환경에서 hover 잔재는 UX 저하 원인

### 반응형 브레이크포인트 (기존 프로젝트 기준 준수)

| 구간 | 기준 | 적용 내용 |
|---|---|---|
| Desktop | `> 1023px` | 기본 레이아웃 |
| Tablet | `≤ 1023px` | `isMobileOrTablet` 기준, 1컬럼 grid |
| Mobile | `≤ 768px` | 버튼 세로 배치, 패딩 축소 |
| Small | `≤ 480px` | 폰트 축소, 패딩 최소화 |

---

## 구현 계획

### Step 1. MainView — 로드뷰 모드 카드 클릭 분기

**파일:** `src/features/main/views/MainView.vue`

현재 `handleModeClick('roadView/main', gameModeStatus.roadviewEnabled)` 로직을 분기한다.

```
로드뷰 모드 카드 클릭
  ├── 로그인 O → 기존대로 /roadView/main (지역 선택 화면)
  └── 로그인 X → /roadView/practice?region=seoul&anonymous=true (즉시 시작)
```

- 지역 서울 고정: 선택 단계가 추가될수록 이탈률이 높아진다. 첫 방문자는 지역 차이를 모른다.
- `anonymous=true` 쿼리는 PracticeView 결과 화면 분기에 사용한다.

**변경 범위:** `handleModeClick` 함수 내 조건 분기 3~5줄

---

### Step 2. UserLoginCard — 비로그인 CTA UI 개편

**파일:** `src/features/main/components/UserLoginCard.vue`

#### 레이아웃 (Desktop / Tablet `> 480px`)

```
┌─────────────────────────────────────────────┐
│  ▔▔▔▔ (상단 accent 라인 3px, 그라데이션)     │  ← border-radius: 16px 유지
│                                             │
│  로그인 없이 바로 체험해보세요               │  ← #111827, font-weight: 700
│  점수·랭킹은 로그인 후 저장됩니다           │  ← #111827, opacity: 0.55, font-size: 14px
│                                             │
│  [     지금 바로 체험하기  →     ]          │  ← 주 CTA: 배경 #4cc9cfff, 텍스트 #ffffff
│  [        로그인하기              ]         │  ← 부 CTA: 배경 투명, 테두리 #e5e7eb
└─────────────────────────────────────────────┘
```

#### 레이아웃 (Mobile `≤ 480px`)

```
┌──────────────────────────────┐
│  ▔▔ (accent 라인 2px)        │
│  로그인 없이 바로 체험하기    │  ← font-size: 15px
│  기록은 로그인 후 저장돼요   │  ← font-size: 13px
│  [   지금 바로 체험하기  ]   │  ← 높이 44px (터치 최소 사이즈)
│  [      로그인하기       ]   │  ← 높이 40px
└──────────────────────────────┘
```

#### 버튼 스타일 상세

**주 CTA**
```scss
background: #4cc9cfff;
color: #ffffff;
border-radius: 12px;
padding: 13px 20px;      // 기존 login-button과 동일 수준
font-weight: 700;
width: 100%;
transition: transform 0.2s ease, box-shadow 0.2s ease;

&:hover {                // desktop only
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 201, 207, 0.20);
}
&:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  &:hover { transform: none; box-shadow: none; }  // touch 환경 hover 제거
  min-height: 44px;
}
@media (max-width: 480px) {
  padding: 12px 16px;
  font-size: 14px;
}
```

**부 CTA**
```scss
background: transparent;
color: #111827;
border: 1.5px solid #e5e7eb;
border-radius: 12px;
padding: 11px 20px;
font-weight: 600;
width: 100%;
margin-top: 8px;
transition: border-color 0.2s ease;

&:hover {                // desktop only
  border-color: #4cc9cfff;
}

@media (max-width: 768px) {
  &:hover { border-color: #e5e7eb; }  // touch 환경 hover 제거
  min-height: 40px;
}
@media (max-width: 480px) {
  padding: 10px 16px;
  font-size: 14px;
}
```

---

### Step 3. PracticeResultOverlay — 익명 사용자 로그인 유도 배너

**파일:** `src/features/game/single/roadview/components/Result/PracticeResultOverlay.vue`

`$route.query.anonymous === 'true'` 조건일 때 결과 UI 하단에 배너를 조건부 렌더링한다.

#### 배너 레이아웃 (Desktop)

```
┌────────────────────────────────────────────┐
│  배경: rgba(239, 68, 68, 0.05)              │  ← border: 1px solid rgba(239,68,68,0.15)
│  border-radius: 12px, padding: 16px        │
│                                            │
│  이 기록은 저장되지 않았습니다              │  ← #111827, font-weight: 700, font-size: 14px
│  로그인하면 랭킹에 등록되고 보존됩니다      │  ← #111827, opacity: 0.6, font-size: 13px
│                                            │
│  [ 로그인하고 기록 저장하기 ]              │  ← 배경 #4cc9cfff, 텍스트 #ffffff, width: 100%
└────────────────────────────────────────────┘
```

#### 모바일 대응 (`≤ 768px`)

```scss
.anonymous-login-banner {
  padding: 14px;
  margin-top: 12px;

  .banner-title { font-size: 13px; }
  .banner-desc  { font-size: 12px; }

  .banner-login-btn {
    padding: 12px 16px;
    min-height: 44px;     // 터치 최소 사이즈
    font-size: 14px;
    &:hover { transform: none; box-shadow: none; }
  }
}
```

- 배너 배경 `rgba(239,68,68,0.05)` — 색이 강하면 불안감을 주므로 극히 옅게
- "다시 하기" 버튼 위치 유지 — 익명 재플레이 허용으로 체류 시간을 높인다
- `@login` 이벤트는 이미 구현되어 있으므로 UI 추가만 필요

---

### Step 4. (선택) NavigationBar — 익명 체험 중 상태 칩

**파일:** `src/core/components/NavigationBar.vue`

`$route.query.anonymous === 'true'`인 경우에만 상단에 작은 칩을 노출한다.

```
[체험 중]   로그인하면 기록이 저장됩니다   [로그인]
```

```scss
.anonymous-chip {
  background: linear-gradient(135deg, #52DEE5 0%, #EEE5E9 100%);
  color: #111827;
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
}

@media (max-width: 768px) {
  // 텍스트 숨기고 칩만 노출 — 공간 부족
  .anonymous-chip-text { display: none; }
  .anonymous-chip { padding: 3px 8px; }
}
```

Step 1~3 완료 후 선택적으로 진행한다.

---

## 파일별 변경 범위 요약

| 단계 | 파일 | 변경 내용 | 공수 |
|---|---|---|---|
| **Step 1** ★ | `src/features/main/views/MainView.vue` | `handleModeClick` 비로그인 분기 | 매우 낮음 |
| **Step 2** | `src/features/main/components/UserLoginCard.vue` | 비로그인 CTA UI 개편 + 반응형 | 낮음 |
| **Step 3** | `src/features/game/single/roadview/components/Result/PracticeResultOverlay.vue` | 익명 손실 배너 + 반응형 | 낮음 |
| **Step 4** (선택) | `src/core/components/NavigationBar.vue` | 익명 체험 중 칩 + 반응형 | 낮음 |

---

## 반응형 체크리스트

구현 후 아래 항목을 각 브레이크포인트에서 확인한다.

- [ ] `> 1023px` — 카드 레이아웃, 버튼 hover 동작
- [ ] `≤ 768px` — 버튼 세로 배치, hover 이펙트 비활성화, 터치 영역 44px 이상
- [ ] `≤ 480px` — 텍스트 잘림 없음, 패딩 최소화, 배너 가독성
- [ ] 모바일 실기기 — 버튼 탭 시 잔류 hover 스타일 없음

---

## 기대 효과

1. **이탈 방지**: 로그인 없이 즉시 게임 진입 → 첫 화면 이탈률 감소
2. **Aha moment 포착**: 점수 확인 직후 로그인 요청 → 손실 회피 심리 자연스럽게 자극
3. **반복 경험**: "다시 하기"로 익명 재플레이 허용 → 체류 시간 증가
4. **시각적 피로 없음**: 이펙트 최소화, 배경 컬러 극히 옅게 → 콘텐츠 집중 유지

---

## 구현 순서

```
Step 1 → Step 2 → Step 3 → [선택] Step 4
```

Step 1만 배포해도 익명 사용자의 게임 진입이 즉시 가능해진다.
