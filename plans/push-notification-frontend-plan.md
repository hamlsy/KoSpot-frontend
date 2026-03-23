# 프론트엔드 추가 작업 플랜 — 모바일 푸시 알림 시스템

> 작성일: 2026-03-23
> 대상 브랜치: feat/111
> 현재 구현 완성도: 약 70% (인프라 완성, 연결 고리 누락)

---

## 현황 요약

| 구분 | 파일 | 상태 |
|------|------|------|
| FCM 서비스 | `src/core/platform/push.service.js` | ✅ 완성 |
| Mobile API | `src/core/api/mobile.api.js` | ✅ 완성 |
| OAuth 분기 로직 | `src/features/auth/views/LoginView.vue` | ✅ 완성 |
| OAuth 콜백 처리 | `src/features/auth/views/OAuthCallbackView.vue` | ✅ 완성 |
| OAuth 서비스 | `src/core/auth/oauth.service.js` | ✅ 완성 |
| 딥링크 서비스 | `src/core/platform/deeplink.service.js` | ✅ 완성 |
| 알림 설정 UI | `src/features/user/components/AccountSettings.vue` | ✅ 완성 (2026-03-23) |
| App.vue 통합 | `src/App.vue` | ✅ 완성 (2026-03-23) |
| Android Manifest | `android/app/src/main/AndroidManifest.xml` | ✅ 완성 (2026-03-23) |
| Firebase 설정 | `android/app/google-services.json` | ❌ 파일 없음 (개발자 직접 배치 필요) |
| iOS APNs | `ios/App/App/GoogleService-Info.plist` | ❌ 파일 없음 (개발자 직접 배치 필요) |
| iOS URL Scheme | `ios/App/App/Info.plist` | ✅ 완성 (2026-03-23) |
| capacitor.config | `capacitor.config.json` | ✅ 완성 (2026-03-23) |
| 환경변수 | `KoSpot-frontend-private/.env.*` | ❌ PUSH·OAuth 환경변수 미설정 (개발자 직접 설정 필요) |
| 로그아웃 토큰 삭제 | `useAuth.js` | ✅ 완성 (2026-03-23) |
| 알림 타입 세분화 | `notificationTypes.js` | ✅ 완성 (2026-03-23) |

---

## TASK 1. Firebase 설정 파일 추가 [필수 / 블로커]

> 이 작업 없이는 Android 빌드 자체가 불가능하다.

### 1-1. Android — `google-services.json`

1. [Firebase Console](https://console.firebase.google.com) → 프로젝트 선택 → 프로젝트 설정
2. Android 앱 추가 (패키지명: `com.kospot.app`)
3. `google-services.json` 다운로드
4. 파일 배치:
   ```
   android/app/google-services.json
   ```

### 1-2. iOS — `GoogleService-Info.plist`

1. 동일 Firebase 프로젝트 → iOS 앱 추가 (Bundle ID: `com.kospot.app`)
2. `GoogleService-Info.plist` 다운로드
3. Xcode에서 `ios/App/App/` 하위에 드래그 앤 드롭으로 추가 (Copy items if needed 체크)
4. Xcode → Signing & Capabilities → `Push Notifications` capability 추가

### 1-3. CI/CD 보안 처리

`google-services.json`과 `GoogleService-Info.plist`는 **절대 Git에 커밋하지 않는다**.

```yaml
# .github/workflows/mobile-android.yml 에 추가
- name: Inject google-services.json
  run: echo '${{ secrets.GOOGLE_SERVICES_JSON }}' > android/app/google-services.json
```

```yaml
# .github/workflows/mobile-ios.yml 에 추가
- name: Inject GoogleService-Info.plist
  run: echo '${{ secrets.GOOGLE_SERVICE_INFO_PLIST }}' > ios/App/App/GoogleService-Info.plist
```

GitHub Secrets에 파일 내용을 JSON 문자열로 등록한다.

---

## TASK 2. 환경변수 활성화 [필수 / 블로커]

`push.service.js`의 모든 로직이 `VUE_APP_ENABLE_PUSH === 'true'` 조건으로 게이팅되어 있다.
이 값이 없으면 앱을 설치해도 푸시 기능 전체가 비활성화된다.

### `KoSpot-frontend-private/.env.development` 추가

```dotenv
VUE_APP_ENABLE_PUSH=true
VUE_APP_APP_ID=com.kospot.app
VUE_APP_BUILD_VERSION=1.0.0
VUE_APP_OAUTH_MOBILE_ENABLED=true
```

### `KoSpot-frontend-private/.env.production` 추가

```dotenv
VUE_APP_ENABLE_PUSH=true
VUE_APP_APP_ID=com.kospot.app
VUE_APP_BUILD_VERSION=1.0.0
VUE_APP_OAUTH_MOBILE_ENABLED=true
```

> **`VUE_APP_OAUTH_MOBILE_ENABLED`이 없거나 `false`이면:**
> - `LoginView.vue`에서 `isMobileOAuthEnabled()` → `false` 반환
> - `openExternalUrl()` 대신 `hardRedirect()` (웹 방식)로 실행되어
>   **앱 내 WebView에서 소셜 로그인이 시도됨** → 카카오/네이버 앱 전환이 제대로 안 될 수 있음
> - `OAuthCallbackView.vue`에서 code 교환 대신 legacy query token 방식으로 처리됨

---

## TASK 3. Android Manifest 권한 추가 [필수]

**파일:** `android/app/src/main/AndroidManifest.xml`

Android 13(API 33)부터 `POST_NOTIFICATIONS`는 런타임 권한이다.
Manifest에 선언하지 않으면 `PushNotifications.requestPermissions()` 호출 자체가 무효화된다.

```xml
<!-- 현재 -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- 추가 후 -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
```

### Android 딥링크 intent-filter 추가 (`kospot://` 스킴)

소셜 로그인 완료 후 백엔드가 `kospot://auth/callback?code=xxx`로 리다이렉트할 때
앱이 이 URL을 수신하려면 `MainActivity`에 intent-filter를 추가해야 한다.
**이 설정이 없으면 소셜 로그인 완료 후 앱으로 돌아오지 못한다.**

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<!-- 기존 <activity android:name=".MainActivity"> 내부에 추가 -->

<!-- 기존 LAUNCHER intent-filter는 그대로 유지 -->

<!-- OAuth 딥링크 수신용 추가 -->
<intent-filter android:autoVerify="false">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="kospot" android:host="auth" />
</intent-filter>
```

---

## TASK 4. 로그아웃 시 FCM 토큰 삭제 연결 [필수]

**현재 문제:** `deletePushToken()`은 구현되어 있지만 로그아웃 플로우에 연결되어 있지 않다.
로그아웃 후에도 FCM 서버에 토큰이 남아 있으면 로그아웃한 기기에 푸시가 계속 발송된다.

### 로그아웃 처리 위치 확인 후 아래 로직 추가

```js
// 로그아웃 함수(Pinia store 또는 auth service)에 추가
import { deletePushToken } from '@/core/platform/push.service.js'

async function logout() {
  // 토큰 삭제 — 실패해도 로그아웃은 진행
  const storedToken = localStorage.getItem('fcmToken')
  if (storedToken) {
    try {
      await deletePushToken(storedToken)
    } catch (e) {
      console.warn('[push] 로그아웃 시 토큰 삭제 실패 (무시):', e)
    }
    localStorage.removeItem('fcmToken')
  }

  // 기존 로그아웃 로직 (WebSocket 해제, authStorage 초기화 등)
  disconnectAll()
  authStorage.clearAuth()
  router.push('/login')
}
```

### FCM 토큰을 localStorage에 저장하도록 `push.service.js` 수정

현재 `registration` 이벤트에서 토큰을 받아 서버에 등록하지만, 로컬에는 저장하지 않는다.
로그아웃 시 삭제에 사용할 수 있도록 저장 추가:

```js
// push.service.js — registration 리스너 내부
const registrationSub = await PushNotifications.addListener('registration', async (tokenPayload) => {
  const token = tokenPayload?.value
  if (token) {
    localStorage.setItem('fcmToken', token)  // ← 추가
  }
  await registerPushToken({ token, enabled: true })
})
```

---

## TASK 5. App.vue — `onNotificationReceived` 핸들러 추가 [권장]

**현재 문제:** `App.vue`에서 `initializePush`를 호출할 때 `onNotificationActionPerformed`(푸시 클릭)만 처리하고,
`onNotificationReceived`(앱 포그라운드 중 수신)는 전달하지 않는다.
앱이 열려 있을 때 수신된 푸시가 조용히 묻힌다.

**파일:** `src/App.vue`

> **주의:** `notificationStore.addNotification()`의 스키마는 `{ notificationId, type, title, content, ... }` 이다.
> FCM payload의 `body`는 스토어 필드 `content`에 매핑해야 하며, `notificationId`가 없으면 중복 방지가 동작하지 않는다.

```js
// 현재
removePushListeners = await initializePush({
  onNotificationActionPerformed: handlePushAction
})

// 수정 후
import { useNotificationStore } from '@/store/modules/notificationStore.js'

const notificationStore = useNotificationStore()

const handlePushReceived = (notification) => {
  // 포그라운드 수신 시 토스트로 표시
  // notificationStore 스키마: { notificationId, type, title, content, isRead, createdAt }
  const data = notification?.data || {}
  notificationStore.addNotification({
    notificationId: null,           // FCM 포그라운드 수신은 서버 ID 없음 (중복 방지 미적용)
    type: data.type || 'ADMIN_MESSAGE',
    title: notification.title,
    content: notification.body,     // 스토어 필드명은 content (body 아님)
    isRead: false,
    createdAt: new Date().toISOString(),
  })
}

removePushListeners = await initializePush({
  onNotificationReceived: handlePushReceived,
  onNotificationActionPerformed: handlePushAction
})
```

---

## TASK 6. AccountSettings — 미연결 알림 토글 처리 [권장]

**현재 문제:** `AccountSettings.vue`에 게임 초대 알림, 레벨업 알림, 새 친구 알림, 이메일 마케팅 토글이
UI로만 존재하고 `v-model="userSettings.notifications.gameInvites"` 처럼 로컬 상태에만 바인딩되어
서버에 저장되지 않는다.

### 단기 처리 방안 (백엔드 API 준비 전)

백엔드에서 해당 컬럼을 추가하기 전까지, UI에서 미지원 기능임을 명확히 하거나 비활성화한다.

```vue
<!-- AccountSettings.vue — 미지원 토글에 disabled 처리 예시 -->
<div class="toggle-group">
  <div class="toggle-label">
    <span>게임 초대 알림</span>
    <p>친구가 게임에 초대했을 때 알림을 받습니다. <span class="badge-coming-soon">준비중</span></p>
  </div>
  <label class="toggle">
    <input type="checkbox" disabled>
    <span class="toggle-slider"></span>
  </label>
</div>
```

### 장기 처리 방안 (백엔드 API 연결 시)

백엔드에서 `PATCH /member/notification-preference` 또는 `PATCH /mobile/push-preference` 확장 후
아래처럼 연결:

```js
async saveNotificationPreferences() {
  await memberApi.updateNotificationPreference({
    gameInvites: this.userSettings.notifications.gameInvites,
    levelUp: this.userSettings.notifications.levelUp,
    friendRequests: this.userSettings.notifications.friendRequests,
    marketing: this.userSettings.notifications.marketing
  })
}
```

---

## TASK 7. 알림 타입 확장 [권장]

**파일:** `src/core/constants/notificationTypes.js`

`AccountSettings.vue`에 게임 초대 알림 UI가 있고, 백엔드 플랜에도 `GAME_INVITE` 트리거가 포함되어 있다.
백엔드 `NotificationType` enum과 동기화하여 미리 정의해둔다.

```js
export const NOTIFICATION_TYPE = {
  ADMIN_MESSAGE:  'ADMIN_MESSAGE',
  NOTICE:         'NOTICE',
  FRIEND_REQUEST: 'FRIEND_REQUEST',
  GAME_INVITE:    'GAME_INVITE',    // 추가
  LEVEL_UP:       'LEVEL_UP',       // 추가 (추후)
}

export const NOTIFICATION_TYPE_META = {
  // ... 기존 ...
  [NOTIFICATION_TYPE.GAME_INVITE]: {
    label: '게임 초대',
    icon: 'fas fa-gamepad',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  [NOTIFICATION_TYPE.LEVEL_UP]: {
    label: '레벨 업',
    icon: 'fas fa-star',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
}
```

---

## TASK 8. `alert()` → 토스트/모달로 교체 [UX 개선]

**현재 문제:** `AccountSettings.vue`에서 푸시 권한 거부 시 브라우저 기본 `alert()`를 사용한다.
네이티브 앱에서 `alert()`는 WebView 블로킹 다이얼로그로 표시되어 UX가 나쁘다.

**파일:** `src/features/user/components/AccountSettings.vue`

> **주의:** `notificationStore`에는 `showToast()` 메서드가 없다.
> 토스트는 `addNotification()`을 통해 `toastQueue`에 자동 추가되는 구조다 (`notificationStore.js` 참고).
> 단순 경고 토스트는 `addNotification()`으로 넣거나, `NotificationToast.vue`가 소비하는 `toastQueue`에 직접 push한다.

```js
// 현재
alert('푸시 권한이 허용되지 않아 알림을 켤 수 없습니다. 기기 설정에서 권한을 허용해 주세요.')
alert('푸시 설정 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.')

// 수정 후 — notificationStore.addNotification()으로 토스트 표시
// AccountSettings는 Options API이므로 Pinia 스토어를 setup() 또는 mapStores()로 주입
import { useNotificationStore } from '@/store/modules/notificationStore.js'

// methods 내부:
showWarningToast(message) {
  const store = useNotificationStore()
  store.addNotification({
    notificationId: null,
    type: 'ADMIN_MESSAGE',
    title: message,
    content: '',
    isRead: false,
    createdAt: new Date().toISOString(),
  })
},

// 기존 alert() 교체:
// alert('푸시 권한이...') → this.showWarningToast('푸시 권한이 허용되지 않았습니다. 기기 설정에서 권한을 허용해 주세요.')
// alert('푸시 설정 변경에...') → this.showWarningToast('푸시 설정 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.')
```

> **참고:** `AccountSettings.vue`가 현재 Options API(`export default { ... }`)로 작성되어 있으므로
> Composition API의 `useNotificationStore()`를 `mounted()` 또는 메서드 내부에서 직접 호출하거나,
> `mapStores(useNotificationStore)`로 주입하는 방식을 택한다.

---

## TASK 9. iOS 딥링크 설정 — 두 가지 스킴 분리 [필수]

> **주의:** iOS에서 필요한 스킴 설정은 **목적이 다른 두 가지**가 있다. 혼동하지 말 것.

| 설정 | 파일 | 목적 | 현재 상태 |
|------|------|------|-----------|
| `iosScheme: "https"` | `capacitor.config.json` | WebView 내부 URL 스킴 (`https://localhost`) | ❌ 누락 |
| `CFBundleURLSchemes: kospot` | `ios/App/App/Info.plist` | 외부에서 `kospot://`으로 앱 열기 (OAuth 콜백) | ❌ 누락 |

### 9-1. `capacitor.config.json` — `iosScheme` 추가

iOS WebView가 내부 리소스를 로드할 때 사용하는 스킴이다.
`androidScheme: "https"`와 맞추지 않으면 iOS에서 `capacitor://localhost`로 동작하여
CORS 설정, 쿠키 도메인, OAuth redirect_uri 비교 시 불일치가 생길 수 있다.

```json
// 현재
{
  "appId": "com.kospot.app",
  "appName": "KoSpot",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  }
}

// 수정 후
{
  "appId": "com.kospot.app",
  "appName": "KoSpot",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "iosScheme": "https"
  }
}
```

### 9-2. `ios/App/App/Info.plist` — `kospot://` URL Scheme 등록

소셜 로그인 완료 후 백엔드가 `kospot://auth/callback?code=xxx`로 리다이렉트할 때
iOS가 이 URL을 앱으로 전달하려면 커스텀 URL Scheme을 등록해야 한다.
**이 설정이 없으면 Safari에서 "이 페이지를 열 수 없습니다" 오류가 나며 앱으로 돌아오지 못한다.**

```xml
<!-- ios/App/App/Info.plist 에 추가 -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.kospot.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>kospot</string>
        </array>
    </dict>
</array>
```

> Xcode에서도 동일하게 설정 가능:
> Target → Info → URL Types → `+` → URL Schemes에 `kospot` 입력

### 확인 체크리스트

- [ ] `capacitor.config.json`에 `iosScheme: "https"` 추가
- [ ] `ios/App/App/Info.plist`에 `CFBundleURLSchemes: kospot` 등록
- [ ] iOS 실기기에서 소셜 로그인 후 `kospot://` 딥링크로 앱 복귀 확인
- [ ] `appUrlOpen` 이벤트 수신 및 `/login/oauth2/callback?code=xxx` 라우팅 확인
- [ ] 푸시 클릭 시 딥링크 라우팅 정상 동작 확인

---

## 작업 우선순위 요약

| 순서 | 작업 | 유형 | 상태 |
|------|------|------|------|
| 1 | `VUE_APP_OAUTH_MOBILE_ENABLED=true` + `VUE_APP_ENABLE_PUSH=true` 환경변수 추가 | 블로커 | ❌ 개발자 직접 설정 필요 |
| 2 | Android Manifest — `POST_NOTIFICATIONS` 권한 + `kospot://` intent-filter 추가 | 블로커 | ✅ 완료 |
| 3 | iOS `Info.plist` — `CFBundleURLSchemes: kospot` 등록 | 블로커 | ✅ 완료 |
| 4 | `capacitor.config.json` — `iosScheme: "https"` 추가 | 필수 | ✅ 완료 |
| 5 | Firebase `google-services.json` / `GoogleService-Info.plist` 생성 및 배치 | 블로커 | ❌ Firebase 프로젝트 생성 후 배치 필요 |
| 6 | 로그아웃 시 FCM 토큰 삭제 연결 | 필수 | ✅ 완료 |
| 7 | `App.vue` `onNotificationReceived` 핸들러 추가 | 권장 | ✅ 완료 |
| 8 | `AccountSettings` 미연결 토글 disabled 처리 | 권장 | ✅ 완료 |
| 9 | `notificationTypes.js` GAME_INVITE 타입 추가 | 권장 | ✅ 완료 |
| 10 | `alert()` → 토스트로 교체 | UX 개선 | ✅ 완료 |

---

## 테스트 체크리스트

### Android 실기기 테스트 — 소셜 로그인

- [ ] 카카오 로그인 버튼 클릭 → Capacitor Browser로 외부 브라우저 열림 확인
- [ ] 카카오 로그인 완료 → `kospot://auth/callback?code=xxx` 딥링크로 앱 복귀 확인
- [ ] `appUrlOpen` 이벤트 → `/login/oauth2/callback?code=xxx` 라우팅 확인
- [ ] `POST /auth/mobile/exchange` 호출 → JWT 토큰 수신 및 저장 확인
- [ ] 로그인 완료 후 `/main` 이동 확인
- [ ] 네이버 로그인 동일 플로우 반복 확인
- [ ] 로그인 취소 시 `/loginPage`로 복귀 확인

### Android 실기기 테스트 — 푸시 알림

- [ ] 첫 실행 시 푸시 권한 요청 팝업 노출
- [ ] 권한 허용 시 FCM 토큰 서버 등록 확인 (백엔드 로그)
- [ ] 설정 화면에서 푸시 토글 off → 서버 preference 변경 확인
- [ ] 설정 화면에서 푸시 토글 on → 토큰 재등록 + preference 변경 확인
- [ ] 백엔드에서 테스트 푸시 발송 → 알림 수신 확인
- [ ] 푸시 클릭 → 딥링크 라우팅 정상 동작 확인
- [ ] 앱 포그라운드 중 수신 → 토스트 표시 확인
- [ ] 로그아웃 → FCM 토큰 삭제 확인 (백엔드 로그)
- [ ] 재로그인 → 토큰 재등록 확인

### iOS 실기기 테스트 — 소셜 로그인

- [ ] 카카오 로그인 버튼 클릭 → Capacitor Browser로 외부 브라우저 열림 확인
- [ ] 카카오 로그인 완료 → `kospot://auth/callback?code=xxx`로 앱 복귀 확인
  - `CFBundleURLSchemes: kospot` 미등록 시 Safari에서 "열 수 없음" 오류 발생
- [ ] `POST /auth/mobile/exchange` 호출 → JWT 수신 및 `/main` 이동 확인
- [ ] 로그인 취소 시 `/loginPage`로 복귀 확인

### iOS 실기기 테스트 — 푸시 알림

- [ ] APNs 권한 요청 팝업 노출
- [ ] 권한 허용 시 FCM 토큰 서버 등록 확인
- [ ] 백엔드에서 테스트 푸시 발송 → 알림 수신 확인
- [ ] 푸시 클릭 → 딥링크 라우팅 정상 동작 확인
