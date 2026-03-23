# 데스크탑에서 모바일 앱 테스트 가이드 (KoSpot)

## 1. 목적
- 실제 Android/iOS 단말이 없어도, 데스크탑 환경에서 모바일 앱 전환 작업을 빠르게 검증한다.
- 웹 회귀를 유지하면서 앱 전용 분기(`VUE_APP_PLATFORM_TARGET=app`)를 사전 점검한다.

---

## 2. 테스트 방식 요약

| 방식 | 실행 환경 | 검증 가능 항목 | 한계 |
|---|---|---|---|
| 브라우저 앱 타깃 모드 | Chrome/Edge | 라우팅, UI 분기, 앱 타깃 스크립트 게이팅, OAuth 분기 조건 | 실제 네이티브 플러그인(Push, Browser, Deeplink) 동작 불가 |
| Android 에뮬레이터 | Android Studio Emulator | Capacitor 런타임, 딥링크, OAuth 외부 브라우저 전환, 푸시 토큰 흐름 일부 | 푸시 실수신/스토어 배포 환경과 100% 동일하지 않음 |
| iOS 시뮬레이터 (macOS) | Xcode Simulator | iOS Capacitor 기본 동작, 라우팅/권한 흐름 확인 | macOS 필요, APNs 실수신 검증 제한 |

---

## 3. 사전 준비

## 3.1 공통
1. 의존성 설치

```bash
npm install
```

2. 환경 변수 구성 (`config/env.template` 기반)
   - 최소 권장 값
     - `VUE_APP_PLATFORM_TARGET=app`
     - `VUE_APP_OAUTH_MOBILE_ENABLED=true`
     - `VUE_APP_API_BASE_URL` (테스트 API)
     - `VUE_APP_WS_URL` (테스트 WS)

3. 환경값 확인

```bash
npm run env:show
```

## 3.2 Android 에뮬레이터 추가 준비
- Android Studio + SDK + Emulator 설치
- 첫 1회 에뮬레이터 생성 (Pixel 계열 권장)

## 3.3 iOS 시뮬레이터 추가 준비
- macOS + Xcode 필요
- CocoaPods 설치 필요

---

## 4. 방법 A: 브라우저에서 앱 타깃 빠른 점검

1. 앱 타깃으로 로컬 실행

```bash
npm run serve:dev
```

2. 데스크탑 브라우저에서 확인
   - 로그인 화면 진입
   - 계정 설정의 모바일 푸시 설정 UI 분기
   - `public/index.html`의 웹 전용 스크립트 게이팅 동작

3. DevTools 디바이스 툴바로 화면 크기 점검
   - iPhone/Android preset으로 레이아웃 깨짐 확인

권장 체크:
- 앱 타깃에서 웹 광고 스크립트 비활성화 여부
- OAuth 콜백 파라미터 처리(`code` vs legacy token) 분기
- 토큰 저장/라우팅 후 `/main` 진입

---

## 5. 방법 B: Android 에뮬레이터에서 실행 (권장)

1. 웹 빌드 + 네이티브 동기화

```bash
npm run mobile:sync
```

2. Android 프로젝트 열기

```bash
npm run mobile:android
```

3. Android Studio에서 에뮬레이터 실행 후 앱 Run

4. 확인 포인트
   - 앱 시작 시 초기 라우팅 정상 동작
   - OAuth 시작 시 시스템 브라우저 열림
   - OAuth 콜백 복귀 후 로그인 완료
   - 푸시 권한 요청/거부 시 UI 상태 반영

참고:
- API 도메인이 로컬/사설망이면 에뮬레이터 네트워크 접근 정책을 먼저 확인한다.

---

## 6. 방법 C: iOS 시뮬레이터에서 실행 (macOS)

1. 웹 빌드 + 네이티브 동기화

```bash
npm run mobile:sync
```

2. iOS 프로젝트 열기

```bash
npm run mobile:ios
```

3. Xcode에서 시뮬레이터 타깃 선택 후 Run

4. 확인 포인트
   - Android와 동일한 OAuth/라우팅/설정 화면 회귀
   - 앱 링크/스킴 복귀 동작

---

## 7. 데스크탑 테스트 시 자주 놓치는 항목
- 실제 푸시 실수신(APNs/FCM)은 실기기에서 최종 검증 필요
- Universal Link / App Link는 도메인 검증 파일(`.well-known`) 배포 상태까지 확인 필요
- OAuth 공급자 콘솔 redirect URI와 앱 설정 불일치 시 에뮬레이터에서만 간헐 실패 가능

---

## 8. 권장 검증 순서
1. 브라우저 앱 타깃 모드로 UI/분기 빠른 확인
2. Android 에뮬레이터로 Capacitor + OAuth + 딥링크 검증
3. (macOS 가능 시) iOS 시뮬레이터로 플랫폼 회귀 검증
4. 마지막으로 실기기에서 푸시/딥링크/E2E 확인

---

## 9. 트러블슈팅

## 9.1 앱 코드 반영이 안 될 때
```bash
npm run build:prod
npx cap sync
```

## 9.2 환경변수 누락 의심 시
```bash
npm run env:validate
npm run env:show
```

## 9.3 Android 빌드 캐시 문제 시
- Android Studio에서 Gradle Sync 재실행
- 필요 시 `Build > Clean Project` 후 재실행
