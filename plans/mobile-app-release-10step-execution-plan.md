# KoSpot Web + App 통합 출시 10단계 실행 계획 (EC2 + Spring Boot 기준)

## 문서 목적
- 이 문서는 현재 운영 중인 **웹 전용 OAuth2 + 웹 기능(Spring Boot on EC2)**을 유지하면서,
- `kospot-frontend`를 Android/iOS 앱(WebView 기반)으로 확장 출시하기 위한 **실행 지침서**입니다.
- 목표는 "웹 무중단 + 모바일 신규 도입 + 푸시/웹훅 운영 안정화"입니다.

## 전제 조건 (확정)
- 프론트: Vue 3 + Vue CLI (`vue-cli-service`)
- 웹 배포: S3 (+ CloudFront 선택)
- 백엔드: Spring Boot on EC2
- 인증: 웹 OAuth2는 이미 운영 중, 모바일 OAuth2는 미구현
- 모바일 전용 요구사항: 푸시 알림 ON/OFF 설정

## 현재 프로젝트 특징 요약 (코드 스캔 반영)
- 인증 저장소는 localStorage 중심 (`accessToken`, `refreshToken`, `memberId`)이며 참조 지점이 매우 많음.
  - 예: `src/core/api/apiClient.js`, `src/core/services/tokenRefresh.service.js`, `src/core/composables/useAuth.js`, `src/router/index.js`
- 강제 이동(`window.location.href`) 사용 구간이 있어 앱(WebView) 라우팅 안정성 저하 위험이 있음.
  - 예: `src/features/auth/views/OAuthCallbackView.vue`, `src/core/api/apiClient.js`, `src/core/services/tokenRefresh.service.js`
- OAuth 콜백이 현재 query token 전달 방식임.
  - `src/features/auth/views/OAuthCallbackView.vue`
- WS 주소 생성이 `VUE_APP_API_BASE_URL + /ws` 형태라 API URL 규칙에 따라 오동작 가능.
  - `src/core/services/notificationWebSocket.service.js`, `src/features/friend/services/friendWebSocket.service.js`
- 라우터 가드에 `isBot` 우회 로직 존재.
  - `src/router/index.js`, `src/core/composables/useAuth.js`
- 배포 파이프라인은 웹(S3) 중심이며 앱 파이프라인은 없음.
  - `.github/workflows/deploy.yml`
- README와 실제 빌드 체계에 불일치가 존재(Vite 표기 vs Vue CLI 스크립트).
  - `README.md`, `package.json`
- 환경변수는 `KoSpot-frontend-private` 서브모듈 기반이며 `setup-env.js`로 복사해 사용.
  - `scripts/setup-env.js`, `docs/ENVIRONMENT_SETUP.md`
- `public/index.html`에 광고/외부 스크립트가 전역 포함되어 앱 타겟 빌드 분리가 필요.
  - `public/index.html`

---

## 1단계. 기준선 고정 및 회귀 보호선 설정

### 목표
- 대규모 변경 전에 웹 서비스 기준선을 고정해 회귀를 방지한다.

### 작업
1. 현재 운영 기준선 태깅 (`web-baseline-before-mobile`) 및 릴리즈 노트 생성
2. 핵심 사용자 시나리오(웹 로그인/로그아웃/게임 진입/공지) 스모크 테스트 목록 확정
3. 환경별 도메인/API/WS/OAuth redirect 현황 문서화
4. 웹 OAuth2 정상동작 증빙 로그(성공/실패/취소) 수집

### 코드/문서 대상
- `README.md`
- `docs/ENVIRONMENT_SETUP.md`
- (신규) `plans/regression-baseline-checklist.md`

### 완료 기준 (DoD)
- 웹 기능 기준선 체크리스트가 문서화되고, QA가 재현 가능
- 모바일 작업 전후 비교 가능한 테스트 시트 확보

### 단계별 산출물 (필수)
- `plans/regression-baseline-checklist.md` 생성
- 웹 OAuth2 회귀 테스트 케이스(성공/실패/취소) 3종 문서화
- 현재 브랜치 기준 Known Issues 리스트 작성

### 현재 프로젝트 반영 포인트
- 라우터 진입점이 `/loginPage`와 `/login/oauth2/callback`으로 고정되어 있어 웹 회귀 기준도 이 경로로 고정
- `isBot` 우회 동작은 모바일 범위에서 제외할지 유지할지 제품 정책 확정 필요

---

## 2단계. 플랫폼/런타임 분기 레이어 구축 (프론트)

### 목표
- 웹/앱 분기 로직을 컴포넌트 산발 구현이 아닌 공통 레이어로 통합한다.

### 작업
1. 플랫폼 감지 유틸 작성 (`isWeb`, `isNativeApp`, `isAndroidApp`, `isIosApp`)
2. URL 오픈 정책 모듈 작성
   - 웹: `window.location`/`window.open`
   - 앱: Capacitor Browser 또는 딥링크
3. 인증 토큰 저장 추상화 레이어 도입
   - 웹: localStorage
   - 앱: secure storage(도입 단계에서 인터페이스만 먼저)
4. 라우팅 공통 헬퍼(`navigateTo`, `hardRedirect`) 정리

### 코드 대상 (예정)
- (신규) `src/core/platform/runtime.js`
- (신규) `src/core/platform/navigation.service.js`
- (신규) `src/core/auth/authStorage.service.js`
- `src/core/composables/useAuth.js`

### 완료 기준 (DoD)
- 앱/웹 분기 코드가 단일 서비스 계층에 모여 있음
- 컴포넌트에서 플랫폼 분기 직접 구현 금지 규칙 적용

### 단계별 세부 체크리스트
- [ ] `runtime.js`에 플랫폼 판별 함수와 단위 테스트(최소 6 case) 작성
- [ ] `navigation.service.js`에서 외부 링크 처리 정책 명시 (`internal`, `external`, `oauth`)
- [ ] `authStorage.service.js` 인터페이스 정의 (`get/set/remove/clearAll`)
- [ ] 기존 `localStorage` 직접 접근 호출 지점 매핑 파일 작성

### 현재 프로젝트 반영 포인트
- 현재 컴포넌트/서비스에서 `localStorage` 직접 접근이 많아 1차 목표는 "완전 제거"가 아닌 "신규 코드 직접 접근 금지 + 핵심 인증 플로우 우선 치환"
- `window.open` 사용 지점(`MainView`, 공유 기능)은 navigation service로 점진 이관

---

## 3단계. Capacitor 앱 셸 도입 및 빌드 파이프라인 생성

### 목표
- 동일 웹 산출물(`dist`)로 Android/iOS 빌드 가능한 상태를 만든다.

### 작업
1. Capacitor 설치 및 초기화
2. Android/iOS 플랫폼 프로젝트 생성
3. `build -> cap sync` 스크립트 추가
4. 앱 식별자/앱명/아이콘/스플래시 정의
5. 모바일 빌드 산출물 생성 검증

### 명령 예시
```bash
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init KoSpot com.kospot.app
npx cap add android
npx cap add ios
npm run build:prod
npx cap sync
```

### 코드 대상
- `package.json` (스크립트 추가)
- (신규) `capacitor.config.ts` 또는 `capacitor.config.json`
- (신규) `android/`, `ios/`

### 완료 기준 (DoD)
- 로컬에서 Android/iOS 앱이 기동되고 API 호출 가능
- 웹 배포 파이프라인에 영향 없음

### 단계별 세부 체크리스트
- [ ] `package.json`에 `mobile:sync`, `mobile:android`, `mobile:ios` 스크립트 추가
- [ ] `capacitor.config.*`에 `webDir=dist` 명시
- [ ] Android 최소 SDK/target SDK, iOS deployment target 버전 결정
- [ ] 앱 시작 화면에서 `/main` 라우트 정상 렌더링 확인

### 현재 프로젝트 반영 포인트
- 현재 빌드가 `npm run build:prod` 중심이므로 mobile build도 동일 산출물 재사용
- `public/index.html`의 외부 스크립트는 앱 심사 리스크가 있어 app 타겟 빌드에서 제어 필요

---

## 4단계. OAuth2 분기 구현 (웹 유지 + 모바일 신규)

### 목표
- 기존 웹 OAuth2는 그대로 유지하고 모바일 OAuth2만 신규 분기 추가.

### 핵심 정책
- **Non-breaking**: 기존 `/login/oauth2/callback` 웹 흐름 절대 변경 금지
- 모바일은 one-time code 교환 방식 사용 (query token 금지)

### 프론트 작업
1. `LoginView` OAuth 시작 로직 분기
   - 웹: 기존 웹 플로우 유지
   - 앱: 외부 브라우저 인증 시작
2. `OAuthCallbackView` 교환 방식 변경
   - query token 파싱 제거
   - `code` 기반 교환 API 호출

### 백엔드(Spring Boot) 작업
1. 기존 OAuth2 핸들러 유지
2. 모바일 전용 교환 API 신규 구현
   - `POST /api/auth/mobile/exchange`
3. one-time code 발급/저장/만료/재사용 방지
4. feature flag 적용
   - `feature.oauth.mobile.enabled=false` 기본값

### 완료 기준 (DoD)
- 웹 OAuth2 회귀 0건
- 앱 OAuth2 로그인 성공(내부 테스트) + one-time code 재사용 차단

### 단계별 세부 체크리스트
- [ ] `LoginView.vue` 기본 URL 오타(`http:localhost`) 수정
- [ ] 웹 분기: 기존 `window.location.href` 흐름 유지
- [ ] 앱 분기: 외부 브라우저 열기 + 딥링크 복귀 이벤트 처리
- [ ] `OAuthCallbackView.vue`에서 query token 파싱 제거, exchange API로 교체
- [ ] 백엔드에 `feature.oauth.mobile.enabled` 도입(기본 false)

### 현재 프로젝트 반영 포인트
- 기존 웹 콜백 경로(`/login/oauth2/callback`)는 유지
- 웹 전용 기능/권한 흐름과 충돌하지 않도록 `client_type` 분리 로그를 남겨 추적

---

## 5단계. 푸시 인프라 도입 (FCM/APNs) + 앱 권한 UX 구현

### 목표
- 모바일 알림 권한/토큰 등록/클릭 라우팅까지 E2E로 동작시킨다.

### 작업
1. FCM 프로젝트 준비(dev/stg/prod 분리)
2. 앱 푸시 SDK 연결 및 토큰 획득
3. 권한 UX 구현
   - 앱 진입 즉시 요청 금지
   - 설정 화면에서 사전 안내 후 요청
4. 알림 클릭 시 딥링크 라우팅
5. Android Notification Channel / iOS Category 정의

### 코드 대상
- (신규) `src/core/platform/push.service.js`
- (신규) `src/features/settings/views/NotificationSettingsView.vue` (또는 기존 설정 화면 통합)
- `src/router/index.js` (딥링크 목적지 처리)

### 완료 기준 (DoD)
- 포그라운드/백그라운드/종료 상태 수신 확인
- 앱 설정 ON/OFF가 서버 상태와 동기화됨

### 단계별 세부 체크리스트
- [ ] 푸시 권한 상태를 `granted/denied/prompt` 3단계로 모델링
- [ ] 알림 설정 UI에서 OS 권한/서버 설정을 분리 표시
- [ ] 알림 클릭 payload의 `deeplink`를 라우터 경로로 매핑
- [ ] Android Notification Channel ID를 상수화
- [ ] iOS 권한 거부 시 설정 앱 이동 가이드 제공

### 현재 프로젝트 반영 포인트
- 기존 `NotificationToast`/notification store와 모바일 푸시 수신 이벤트를 충돌 없이 병합
- 기존 알림(WebSocket)과 앱 푸시의 중복 표시 정책 정의 필요(중복 제거 키 사용)

---

## 6단계. Spring Boot 푸시 토큰 API + 선호도 API 구현

### 목표
- 사용자/디바이스 단위로 푸시 발송 가능 상태를 서버에서 권위 있게 관리한다.

### API 계약
1. `PUT /api/mobile/push-tokens` (upsert)
2. `PATCH /api/mobile/push-preference` (enabled 변경)
3. `DELETE /api/mobile/push-tokens/{token}`

### DB 스키마 권장
- `mobile_push_tokens`
  - `member_id`, `app_id`, `platform`, `token`, `enabled`, `permission_status`, `last_seen_at`
  - unique(`app_id`, `platform`, `token`)

### 작업
1. 엔티티/리포지토리/서비스/컨트롤러 구현
2. 토큰 정합성 검증(빈값, 길이, 플랫폼)
3. 로그인/로그아웃/토큰갱신 이벤트와 연동

### 완료 기준 (DoD)
- 동일 토큰 중복 insert 없음 (upsert 정상)
- 사용자가 OFF하면 발송 대상에서 즉시 제외

### 단계별 세부 체크리스트
- [ ] `PUT /api/mobile/push-tokens` idempotent 보장
- [ ] `PATCH /api/mobile/push-preference`는 사용자 단위 전체 토큰 반영 정책 여부 확정
- [ ] 로그아웃 시 토큰 unlink 또는 enabled=false 정책 확정
- [ ] 만료 토큰 정리 배치(job) 스케줄 정의

### 현재 프로젝트 반영 포인트
- 프론트 토큰 갱신 서비스(`tokenRefresh.service.js`)와 별개로 디바이스 토큰 수명주기 관리가 필요
- 회원 식별은 현재 `memberId` localStorage 사용 패턴과 정합 맞춤

---

## 7단계. 웹훅 수신 파이프라인 구현 (동기 발송 금지)

### 목표
- 외부 이벤트를 안전하게 수신하고, 비동기적으로 푸시를 발송한다.

### 아키텍처
- `Webhook Inbound -> 검증(HMAC/Timestamp/EventId) -> Outbox enqueue -> Worker 발송`

### API
- `POST /api/webhooks/notify`
- 헤더: `X-Signature`, `X-Timestamp`, `X-Event-Id`
- 응답: `202 Accepted` 고정

### 작업
1. 서명 검증 및 시계 오차 검증(5분)
2. Event dedupe(DB/Redis)
3. Outbox 테이블 + 워커 구현
4. 실패 재시도(backoff), DLQ 처리
5. rate limit + IP allowlist 정책 반영

### 완료 기준 (DoD)
- 웹훅 burst 트래픽에서도 API timeout 없이 수신
- 실패 이벤트 재처리 가능

### 단계별 세부 체크리스트
- [ ] 서명 계산 기준 문자열(메서드/경로/바디/타임스탬프) 문서화
- [ ] EventId dedupe TTL(예: 24h) 정책 확정
- [ ] Outbox 상태 머신(`PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `DLQ`) 정의
- [ ] 장애 시 수동 재처리 API/관리자 도구 제공

### 현재 프로젝트 반영 포인트
- EC2 단일 인스턴스 시작 시 DB Outbox가 현실적이며, 트래픽 증가 시 SQS로 이행 가능한 인터페이스 설계 필요

---

## 8단계. WebSocket/라우팅/강제이동 안정화

### 목표
- WebView 환경에서 끊김/이탈을 줄이고, 라우팅 안정성을 확보한다.

### 현재 리스크
- `window.location.href` 사용 구간 다수
- WS URL이 `API_BASE_URL + /ws` 조합으로 구성되어 환경 오염 위험

### 작업
1. WS URL은 `VUE_APP_WS_URL` 단일 기준으로 통일
2. 강제 `window.location.href`를 router 중심으로 치환
3. 예외 상황에서만 하드 리다이렉트 허용(정책화)
4. 앱 딥링크 진입 시 초기 라우팅 복원 처리

### 코드 대상
- `src/core/services/notificationWebSocket.service.js`
- `src/features/friend/services/friendWebSocket.service.js`
- `src/core/api/apiClient.js`
- `src/core/services/tokenRefresh.service.js`
- `src/router/index.js`

### 완료 기준 (DoD)
- 앱에서 인증 만료/재로그인/푸시클릭 라우팅이 안정적으로 유지
- WS 재연결/구독 중복 문제 재현되지 않음

### 단계별 세부 체크리스트
- [ ] `apiClient.js`, `tokenRefresh.service.js`, `OAuthCallbackView.vue`의 강제 location 이동 정책 통일
- [ ] WS URL 생성 로직을 `VUE_APP_WS_URL` 단일 소스로 교체
- [ ] 앱 백그라운드->포그라운드 복귀 시 소켓 재연결 정책 확정
- [ ] router `afterEach`의 login 감지 로직이 모바일 OAuth 복귀 케이스를 포함하는지 확인

### 현재 프로젝트 반영 포인트
- 현재 `createWebHistory(process.env.VUE_APP_BASE_URL)`를 사용하므로 앱 딥링크 진입 시 history 모드 호환성 확인 필요
- `friend`/`notification` 소켓이 모두 STOMP 기반이라 연결 중복 방지 플래그를 공통 정책으로 유지

---

## 9단계. 환경변수/시크릿/배포 파이프라인 분리

### 목표
- 웹과 앱, 백엔드의 환경변수 체계를 분리해 운영 사고를 줄인다.

### 프론트 키
- `VUE_APP_API_BASE_URL`
- `VUE_APP_WS_URL`
- `VUE_APP_OAUTH_REDIRECT_WEB`
- `VUE_APP_OAUTH_REDIRECT_APP`
- `VUE_APP_PLATFORM_TARGET` (`web|app`)
- `VUE_APP_OAUTH_MOBILE_ENABLED`

### 백엔드 키
- `CORS_ALLOWED_ORIGINS`
- `WEBHOOK_HMAC_SECRET`
- `FCM_*`
- `OAUTH_*`
- `JWT_SIGNING_KEY`

### 작업
1. EC2에서 Parameter Store/Secrets Manager로 시크릿 표준화
2. 웹 파이프라인(`deploy.yml`) 유지
3. 모바일 파이프라인 신규 생성
   - `mobile-android.yml`
   - `mobile-ios.yml`
4. 앱 서명키/인증서의 보관/회전 정책 수립

### 완료 기준 (DoD)
- 환경별(dev/stg/prod) 키셋 검증 완료
- 웹/앱 배포 파이프라인이 독립적으로 동작

### 단계별 세부 체크리스트
- [ ] `config/env.template`에 모바일 키셋 추가
- [ ] `docs/ENVIRONMENT_SETUP.md`를 Vue CLI 실제 스크립트 기준으로 정정
- [ ] `.gitignore`에 로컬 모바일 시크릿 파일 패턴 추가
- [ ] 앱 배포용 GitHub Actions에서 서명 키 주입/폐기 절차 작성

### 현재 프로젝트 반영 포인트
- 현재 `deploy.yml`은 `GIT_PERSONAL_ACCESS_TOKEN` 시크릿 의존이 있으므로 모바일 workflow도 동일 접근 정책 설계 필요
- `setup-env.js`는 루트와 서브모듈에 동시 복사하므로 모바일 타겟 env 충돌 방지 규칙 필요

---

## 10단계. 통합 QA, 릴리즈 게이트, 점진 배포

### 목표
- 출시 전 회귀를 차단하고, 내부 배포 -> 점진 공개 순서로 안정적으로 릴리즈한다.

### 테스트 매트릭스
1. 웹 회귀: 기존 OAuth2 + 웹 전용 기능 전부 통과
2. 앱 인증: OAuth 시작/취소/실패/성공 + one-time code 만료
3. 앱 푸시: 권한 허용/거부/ON/OFF + 클릭 딥링크
4. 웹훅: 정상/서명오류/중복/대량 요청
5. 네트워크: 오프라인/복구/앱 재실행

### 릴리즈 게이트
- Gate A: 웹 회귀 100% 통과
- Gate B: 모바일 내부 테스트(Play Internal, TestFlight Internal) 통과
- Gate C: 운영 모니터링 대시보드 정상 (성공률/오류율/지연)

### 배포 순서
1. 백엔드(모바일 기능 flag OFF) 배포
2. 웹 회귀 확인
3. 앱 내부 배포 및 제한 사용자 검증
4. 모바일 OAuth flag ON (점진)
5. 스토어 공개

### 완료 기준 (Final DoD)
- 웹 무중단 + 웹 OAuth2 회귀 0
- Android/iOS 로그인/푸시/딥링크/웹훅 E2E 통과
- 운영 문서(장애 대응, 키 회전, 롤백) 완성

### 단계별 세부 체크리스트
- [ ] Gate A/B/C 통과 증적(스크린샷, 로그, 빌드번호) 저장
- [ ] 웹 회귀 자동화 최소 세트(CI smoke) 추가
- [ ] 앱 릴리즈 노트에 "모바일 OAuth2 신규"와 "웹 영향 없음" 명시
- [ ] 롤백 시나리오(백엔드 flag OFF, 앱 배포 중단) 리허설

### 현재 프로젝트 반영 포인트
- 기존 S3 배포 캐시 정책(index no-cache, 정적파일 장기 캐시)이 앱 웹자산 갱신 주기와 충돌하지 않도록 버전 정책 고정
- 다중 기능(게임/친구/공지/상점) 구조이므로 QA는 기능별 오너 지정 필요

---

## 부록 A. 우선순위 백로그 (첫 스프린트 권장)
- P0: 모바일 OAuth2 교환 API + 프론트 로그인 분기
- P0: 푸시 토큰 upsert API + 앱 알림 설정 UI
- P1: 웹훅 Outbox/Worker + 발송로그
- P1: WS URL 정규화 + 강제이동 최소화
- P2: 모바일 CI/CD 자동화 + 스토어 메타데이터 정리

## 부록 B. 절대 금지 항목
- 기존 웹 OAuth2 콜백 계약 파괴
- query string에 access/refresh token 노출
- 웹훅 동기 발송 강제(큐 미사용)
- 시크릿을 프론트 `VUE_APP_*`로 노출
