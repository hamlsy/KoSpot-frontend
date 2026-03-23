# 모바일 앱 빌드 및 테스트 안내서

> 작성일: 2026-03-23
> 대상: Android / iOS (Capacitor WebView 기반)
> 전제: Node 18+, Java 17+, Android Studio 또는 Xcode 설치 완료

---

## 목차

1. [사전 준비](#1-사전-준비)
2. [로컬 공통 빌드 절차](#2-로컬-공통-빌드-절차)
3. [Android 빌드 및 실기기 테스트](#3-android-빌드-및-실기기-테스트)
4. [iOS 빌드 및 실기기 테스트](#4-ios-빌드-및-실기기-테스트)
5. [CI/CD 빌드 트리거](#5-cicd-빌드-트리거)
6. [푸시 알림 E2E 테스트 절차](#6-푸시-알림-e2e-테스트-절차)
7. [자주 발생하는 빌드 오류](#7-자주-발생하는-빌드-오류)

---

## 1. 사전 준비

### 1-1. 저장소 및 서브모듈 초기화

```bash
# 저장소 클론 (서브모듈 포함)
git clone --recurse-submodules <repo-url>
cd kospot-frontend

# 이미 클론한 경우 서브모듈만 초기화
git submodule update --init --recursive
```

### 1-2. 의존성 설치

```bash
npm ci
```

### 1-3. 환경변수 설정

```bash
# 개발 환경
node scripts/setup-env.js development setup

# 프로덕션 환경 (앱 스토어 배포 빌드)
node scripts/setup-env.js production setup

# 설정 확인
npm run env:show
npm run env:validate
```

### 1-4. Firebase 설정 파일 배치 (⚠️ 필수 — 없으면 빌드 실패)

| 플랫폼 | 파일명 | 배치 경로 |
|--------|--------|-----------|
| Android | `google-services.json` | `android/app/google-services.json` |
| iOS | `GoogleService-Info.plist` | `ios/App/App/GoogleService-Info.plist` |

> Firebase Console → 프로젝트 설정 → 앱 등록에서 다운로드
> 이 파일들은 `.gitignore`에 포함되어 있으므로 직접 배치해야 한다.

---

## 2. 로컬 공통 빌드 절차

Android와 iOS 모두 동일한 웹 빌드 산출물(`dist/`)을 사용한다.
플랫폼별 빌드 전에 반드시 아래 순서를 먼저 실행한다.

```bash
# 1. 웹 빌드 (dist/ 생성)
npm run build:prod       # 프로덕션 빌드
# 또는
npm run build:dev        # 개발 빌드

# 2. Capacitor 동기화 (dist/ → 네이티브 프로젝트에 복사)
npx cap sync android     # Android만
npx cap sync ios         # iOS만 (macOS에서만 동작)
# 또는
npx cap sync             # Android + iOS 동시
```

> `npx cap sync`는 `npm run mobile:sync`로도 실행 가능 (`package.json` 스크립트 기준)

---

## 3. Android 빌드 및 실기기 테스트

### 3-1. 디버그 APK 빌드 (로컬)

```bash
# 웹 빌드 + sync 먼저 실행 (섹션 2 참고)

# Android 디렉토리에서 Gradle 빌드
cd android
./gradlew assembleDebug

# 빌드 산출물 위치
# android/app/build/outputs/apk/debug/app-debug.apk
```

> Windows에서는 `./gradlew` 대신 `gradlew.bat assembleDebug` 사용

### 3-2. APK 실기기 설치

```bash
# ADB로 직접 설치 (USB 디버깅 활성화 필요)
adb install android/app/build/outputs/apk/debug/app-debug.apk

# 이미 설치된 경우 강제 재설치
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 연결된 기기 확인
adb devices
```

### 3-3. Android Studio에서 실행

```bash
# Android Studio 열기
npm run mobile:android
# 또는
npx cap open android
```

Android Studio 실행 후:
1. Run → Select Device → 실기기 또는 에뮬레이터 선택
2. Run 버튼(▶) 클릭

### 3-4. 로그 확인

```bash
# 앱 로그만 필터링
adb logcat -s "chromium" | grep -i "kospot\|push\|fcm\|notification"

# 전체 로그
adb logcat
```

### 3-5. 릴리즈 APK 빌드 (서명 필요)

```bash
cd android
./gradlew assembleRelease
# android/app/build/outputs/apk/release/app-release-unsigned.apk

# 서명 (keystore 필요)
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore kospot.keystore \
  app-release-unsigned.apk kospot_key

# zipalign
zipalign -v 4 app-release-unsigned.apk app-release.apk
```

---

## 4. iOS 빌드 및 실기기 테스트

> **iOS 빌드는 macOS에서만 가능하다.** Xcode 14+ 필요.

### 4-1. CocoaPods 설치 (최초 1회)

```bash
sudo gem install cocoapods
cd ios/App
pod install
```

### 4-2. Xcode에서 열기

```bash
# 웹 빌드 + sync 먼저 실행 (섹션 2 참고)

# Xcode 열기
npm run mobile:ios
# 또는
npx cap open ios
```

Xcode에서:
1. `ios/App/App.xcworkspace` 열기 (`.xcodeproj` 아님)
2. Signing & Capabilities → Team 설정 (Apple Developer 계정 필요)
3. `Push Notifications` capability 추가 확인
4. 실기기 연결 후 Run(▶) 클릭

### 4-3. 시뮬레이터 빌드 (서명 없이)

```bash
xcodebuild \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  build
```

> **주의:** 시뮬레이터에서는 FCM 푸시 수신이 불가능하다. 푸시 테스트는 반드시 실기기에서 진행한다.

### 4-4. TestFlight 배포 (내부 테스트)

1. Xcode → Product → Archive
2. Distribute App → App Store Connect → Upload
3. App Store Connect → TestFlight → 내부 테스터 초대
4. 테스터가 TestFlight 앱으로 설치

---

## 5. CI/CD 빌드 트리거

모바일 빌드 워크플로우는 **수동 트리거(`workflow_dispatch`)** 방식이다.
자동으로 실행되지 않으며, GitHub에서 직접 실행해야 한다.

### 5-1. Android CI 빌드

1. GitHub → Actions 탭 → `Mobile Android Build` 선택
2. Run workflow → 브랜치 선택 → `Run workflow` 클릭
3. 완료 후 Artifacts에서 `android-debug-apk` 다운로드

### 5-2. iOS CI 빌드

1. GitHub → Actions 탭 → `Mobile iOS Build` 선택
2. Run workflow → 브랜치 선택 → `Run workflow` 클릭
3. iOS 빌드는 시뮬레이터 대상이므로 **실기기 테스트용 IPA는 로컬 Xcode에서 별도 생성**

### 5-3. CI 빌드 전 필수 GitHub Secrets 등록

| Secret 이름 | 내용 |
|-------------|------|
| `GIT_PERSONAL_ACCESS_TOKEN` | 서브모듈 접근용 PAT |
| `GOOGLE_SERVICES_JSON` | `google-services.json` 파일 내용 (JSON 문자열) |
| `GOOGLE_SERVICE_INFO_PLIST` | `GoogleService-Info.plist` 파일 내용 |

> Secrets 등록: GitHub → Settings → Secrets and variables → Actions

워크플로우에 아직 Firebase 파일 주입 단계가 없으므로 아래 스텝을 추가해야 한다:

```yaml
# .github/workflows/mobile-android.yml — Capacitor sync 전에 추가
- name: Inject google-services.json
  run: echo '${{ secrets.GOOGLE_SERVICES_JSON }}' > android/app/google-services.json
```

```yaml
# .github/workflows/mobile-ios.yml — Capacitor sync 전에 추가
- name: Inject GoogleService-Info.plist
  run: echo '${{ secrets.GOOGLE_SERVICE_INFO_PLIST }}' > ios/App/App/GoogleService-Info.plist
```

---

## 6. 푸시 알림 E2E 테스트 절차

### 6-1. 테스트 환경 전제조건

- [ ] `google-services.json` / `GoogleService-Info.plist` 배치 완료
- [ ] `VUE_APP_ENABLE_PUSH=true` 환경변수 설정 완료
- [ ] Android Manifest에 `POST_NOTIFICATIONS` 권한 추가 완료
- [ ] 백엔드 `PUT /mobile/push-tokens`, `GET/PATCH /mobile/push-preference` API 구현 완료
- [ ] 백엔드 Firebase Admin SDK 연동 완료

### 6-2. 토큰 등록 확인

1. 앱 설치 및 실행
2. 로그인
3. 첫 실행 시 또는 설정 화면에서 푸시 권한 허용
4. 백엔드 로그 또는 DB에서 `mobile_push_token` 테이블에 토큰 등록 확인

```bash
# 백엔드 서버에서 확인 (예시)
# SELECT * FROM mobile_push_token WHERE member_id = {테스트계정ID};
```

### 6-3. FCM 테스트 발송 (Firebase Console)

1. Firebase Console → Cloud Messaging → 새 알림 만들기
2. 제목/내용 입력
3. 대상 → 특정 기기 → 등록된 FCM 토큰 입력
4. 발송 → 기기에서 수신 확인

### 6-4. 백엔드 API로 테스트 발송

```bash
# 공지사항 등록 트리거 (브로드캐스트 발송)
curl -X POST https://api.kospot.com/admin/notice \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{"title": "테스트 공지", "content": "푸시 테스트입니다."}'
```

### 6-5. 수신 상태별 테스트 시나리오

| 시나리오 | 앱 상태 | 기대 동작 |
|----------|---------|-----------|
| 포그라운드 수신 | 앱 실행 중 | 앱 내 토스트 표시 (`onNotificationReceived`) |
| 백그라운드 수신 | 앱이 백그라운드에 있음 | OS 알림 트레이에 표시 |
| 종료 상태 수신 | 앱 완전 종료 | OS 알림 트레이에 표시 |
| 알림 클릭 | 백그라운드/종료 | `onNotificationActionPerformed` 호출 → 딥링크 이동 |

### 6-6. 딥링크 이동 검증

| 알림 타입 | `data.deeplink` | 기대 이동 경로 |
|-----------|----------------|--------------|
| NOTICE | `/notice/{id}` | 공지사항 상세 |
| FRIEND_REQUEST | `/user/friends` | 친구 목록 |
| ADMIN_MESSAGE | `/notifications` | 알림 목록 |
| GAME_INVITE | `/game/lobby/{roomId}` | 게임 로비 |

### 6-7. 설정 화면 토글 테스트

1. 설정 → 알림 설정 → 앱 푸시 알림 OFF
2. 백엔드 DB에서 `mobile_push_token.enabled = false` 또는 `member.push_enabled = false` 확인
3. FCM 테스트 발송 → 수신되지 않는지 확인
4. 알림 설정 → 앱 푸시 알림 ON
5. FCM 테스트 발송 → 정상 수신 확인

### 6-8. 로그아웃 토큰 삭제 확인

1. 로그인 상태에서 FCM 토큰 등록 확인
2. 로그아웃 실행
3. 백엔드 DB에서 해당 토큰 삭제 확인
4. 로그아웃 후 FCM 발송 → 수신되지 않는지 확인

---

## 7. 자주 발생하는 빌드 오류

### Android

| 오류 | 원인 | 해결 |
|------|------|------|
| `google-services.json not found` | Firebase 설정 파일 누락 | `android/app/google-services.json` 배치 |
| `AAPT: error: resource not found` | `cap sync` 미실행 | `npx cap sync android` 재실행 |
| `SDK location not found` | `local.properties` 없음 | Android Studio 실행 후 자동 생성, 또는 수동으로 `sdk.dir=/path/to/sdk` 작성 |
| `Gradle build failed: minSdk` | minSdk 불일치 | `android/variables.gradle`의 `minSdkVersion` 확인 (현재 22) |
| `POST_NOTIFICATIONS denied` | Manifest 권한 누락 | `AndroidManifest.xml`에 `POST_NOTIFICATIONS` 추가 |

### iOS

| 오류 | 원인 | 해결 |
|------|------|------|
| `GoogleService-Info.plist not found` | Firebase 설정 파일 누락 | `ios/App/App/` 하위에 파일 배치 후 Xcode에서 추가 |
| `No signing certificate` | Apple 개발자 계정 미설정 | Xcode → Signing & Capabilities → Team 선택 |
| `Push capability missing` | APNs capability 미추가 | Xcode → Signing & Capabilities → Push Notifications 추가 |
| `Pod install required` | CocoaPods 미실행 | `cd ios/App && pod install` |
| `xcworkspace not found` | pod install 미실행 또는 `.xcodeproj`로 열기 시도 | `App.xcworkspace` 파일로 열기 |

### 공통

| 오류 | 원인 | 해결 |
|------|------|------|
| `VUE_APP_ENABLE_PUSH is not defined` | 환경변수 미설정 | `KoSpot-frontend-private/.env.*`에 `VUE_APP_ENABLE_PUSH=true` 추가 |
| `cap sync` 후 변경사항 미반영 | 웹 빌드 없이 sync만 실행 | `npm run build:prod` 후 `npx cap sync` 재실행 |
| 푸시 권한 요청이 뜨지 않음 | `VUE_APP_ENABLE_PUSH` 미설정 또는 `isNativeApp()` false | 빌드가 네이티브 앱인지 확인, 환경변수 확인 |
| 로그인 후 FCM 토큰 미등록 | 백엔드 API 미구현 | `PUT /mobile/push-tokens` 엔드포인트 구현 여부 확인 |
