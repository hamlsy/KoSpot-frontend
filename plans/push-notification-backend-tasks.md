# 백엔드 추가 구현 명세서 — 모바일 푸시 알림 시스템

> 작성일: 2026-03-23
> 대상 브랜치: feat/111
> 프론트엔드 API 호출 기준: `src/core/api/mobile.api.js`, `src/core/api/endPoint.js`

---

## 1. 개요

프론트엔드는 이미 FCM 토큰 등록·삭제, 푸시 수신 선호도 저장, 딥링크 라우팅까지 완전히 구현된 상태이다.
백엔드는 아래 네 영역을 추가 구현해야 한다.

| 영역 | 핵심 작업 |
|------|-----------|
| **CORS 설정** | WebView Origin 허용 — API·WebSocket·OAuth 전체의 기반 |
| **DB 스키마** | 푸시 토큰 테이블, 푸시 선호도 컬럼, OAuth one-time code 테이블 |
| **REST API** | 토큰 등록/삭제, 선호도 조회/변경, 모바일 OAuth 교환 |
| **FCM 발송 서비스** | Firebase Admin SDK 연동, 이벤트별 트리거 |

---

## 2. CORS 설정 — WebView Origin 허용 [최우선 / 블로커]

> **이 설정이 없으면 모바일 앱에서 API 호출, WebSocket 연결, OAuth 콜백이 전부 실패한다.**
> 다른 모든 구현보다 먼저 적용해야 한다.

---

### 2-1. 문제 원인

Capacitor WebView 앱은 브라우저가 아니라 네이티브 WebView 안에서 동작한다.
HTTP 요청을 보낼 때 `Origin` 헤더가 일반 웹과 다르게 설정된다.

| 플랫폼 | `capacitor.config.json` 설정 | WebView Origin |
|--------|------------------------------|----------------|
| Android | `androidScheme: "https"` ✅ | `https://localhost` |
| iOS | `iosScheme` 미설정 ❌ (현재) | `capacitor://localhost` |
| iOS | `iosScheme: "https"` ✅ (수정 후) | `https://localhost` |

백엔드 CORS에 이 Origin들이 허용되어 있지 않으면:
- **REST API** → `403 CORS error`
- **WebSocket (SockJS/STOMP)** → `handshake 실패` → 실시간 알림·멀티플레이어 전체 불가
- **OAuth 콜백** → `redirect 후 API 호출 실패`

---

### 2-2. Spring CORS 설정 수정

```java
// CorsConfig.java (또는 SecurityConfig 내 corsConfigurationSource())
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();

    config.setAllowedOrigins(List.of(
        // ── 웹 ───────────────────────────────────────────
        "https://kospot.com",           // 웹 프로덕션
        "https://www.kospot.com",
        "http://localhost:3000",         // 웹 개발

        // ── 모바일 WebView ────────────────────────────────
        "https://localhost",             // Android (androidScheme: "https")
                                         // iOS (iosScheme: "https" 설정 후)
        "capacitor://localhost"          // iOS fallback (iosScheme 미설정 시)
                                         // → 프론트에서 iosScheme 추가 후 제거 가능
    ));

    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);   // JWT 쿠키 또는 Authorization 헤더 포함 요청 허용
    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

> **`allowCredentials(true)` 주의사항:**
> `allowedOrigins`에 와일드카드(`*`)를 사용하면 `allowCredentials(true)`와 함께 쓸 수 없다.
> 반드시 Origin을 명시적으로 열거해야 한다.

---

### 2-3. WebSocket (SockJS/STOMP) CORS 별도 설정

SockJS는 HTTP handshake 과정에서 별도 CORS 처리가 필요하다.
Spring의 `WebSocketMessageBrokerConfigurer`에도 허용 Origin을 추가해야 한다.

```java
// WebSocketConfig.java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOrigins(
                "https://kospot.com",
                "https://www.kospot.com",
                "http://localhost:3000",
                "https://localhost",        // Android + iOS (iosScheme 설정 후)
                "capacitor://localhost"     // iOS fallback
            )
            .withSockJS();
    }

    // ... 기존 configureMessageBroker 등 유지
}
```

> **`setAllowedOrigins`와 `setAllowedOriginPatterns` 차이:**
> SockJS를 사용하는 경우 `setAllowedOriginPatterns("*")`는 개발 환경에서만 사용하고,
> 운영 환경에서는 반드시 Origin을 명시한다.

---

### 2-4. 환경별 CORS Origin 관리

하드코딩 대신 `application.yml`로 관리하는 것을 권장한다.

```yaml
# application.yml
cors:
  allowed-origins:
    - https://kospot.com
    - https://www.kospot.com
    - https://localhost       # 모바일 WebView (Android + iOS)
    - capacitor://localhost   # iOS WebView fallback

# application-local.yml (로컬 개발 전용)
cors:
  allowed-origins:
    - http://localhost:3000
    - https://localhost
    - capacitor://localhost
```

```java
@Value("${cors.allowed-origins}")
private List<String> allowedOrigins;
```

---

### 2-5. 적용 확인 방법

**브라우저 없이 WebView CORS 테스트:**
```bash
# Android WebView Origin 시뮬레이션
curl -H "Origin: https://localhost" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://api.kospot.com/notifications \
     -v 2>&1 | grep "Access-Control"

# iOS fallback Origin 시뮬레이션
curl -H "Origin: capacitor://localhost" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://api.kospot.com/notifications \
     -v 2>&1 | grep "Access-Control"
```

응답에 `Access-Control-Allow-Origin: https://localhost` 가 있으면 정상.

---

## 3. DB 스키마

### 2-1. `mobile_push_token` 테이블

```sql
CREATE TABLE mobile_push_token (
    id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id     BIGINT       NOT NULL,                          -- FK → member.id
    token         VARCHAR(512) NOT NULL UNIQUE,                   -- FCM 등록 토큰
    platform      VARCHAR(10)  NOT NULL,                          -- 'android' | 'ios'
    app_id        VARCHAR(100) NOT NULL DEFAULT 'com.kospot.app',
    device_id     VARCHAR(100) NOT NULL,                          -- 기기 식별자 (localStorage 생성값)
    app_version   VARCHAR(20),
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE,             -- 사용자가 앱 내에서 끈 경우 FALSE
    permission_status VARCHAR(20) NOT NULL DEFAULT 'granted',     -- granted | denied | prompt
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_member_id (member_id),
    INDEX idx_token (token)
);
```

> **설계 포인트**
> - 동일 사용자가 여러 기기를 가질 수 있으므로 `member_id`가 PK가 아닌 인덱스
> - `token`은 UNIQUE → 다른 사용자가 같은 기기를 사용할 경우 자동 교체 처리
> - `device_id`는 프론트엔드 `localStorage`에서 생성한 `webview-{timestamp}-{random}` 값

### 2-2. `member` 테이블 컬럼 추가

```sql
-- 기존 member 테이블에 푸시 전체 수신 여부 컬럼 추가
ALTER TABLE member
    ADD COLUMN push_enabled BOOLEAN NOT NULL DEFAULT TRUE;
```

> 토큰 단위의 `enabled`(기기별)와 별개로 **계정 전체 푸시 on/off**를 저장한다.
> 프론트엔드 `GET /mobile/push-preference` 응답에 이 값이 담긴다.

---

## 3. REST API 명세

### 3-1. `PUT /mobile/push-tokens` — 토큰 등록/갱신 (Upsert)

**프론트 호출 시점:** 로그인 후 + 앱 푸시 허용 시 (FCM `registration` 이벤트)

**Request Body:**
```json
{
  "token": "fcm-token-string",
  "platform": "android",
  "appId": "com.kospot.app",
  "enabled": true,
  "permissionStatus": "granted",
  "appVersion": "1.0.0",
  "deviceId": "webview-1710000000000-ab3c9f"
}
```

**처리 로직:**
1. `token` 기준으로 DB 조회
2. **존재하면** `updated_at`, `member_id`, `enabled`, `app_version` 업데이트 (타 사용자가 쓰던 토큰 교체 대응)
3. **없으면** 신규 INSERT
4. 동일 `device_id`로 다른 토큰이 있으면 기존 토큰 `enabled=false` 처리 (기기 교체 대응)

**Response:**
```json
{
  "result": { "tokenId": 42 }
}
```

**HTTP Status:** `200 OK`
**인증:** Bearer JWT 필수

---

### 3-2. `DELETE /mobile/push-tokens/{token}` — 토큰 삭제

**프론트 호출 시점:** 로그아웃 시 (현재 미연결 → 추가 필요, 하단 프론트 플랜 참조)

**Path Variable:** `token` (URL 인코딩된 FCM 토큰)

**처리 로직:**
1. `token` + `member_id`(JWT에서 추출) 기준으로 조회
2. 본인 토큰이면 삭제, 타인 토큰이면 `403 Forbidden`

**Response:** `204 No Content`
**인증:** Bearer JWT 필수

---

### 3-3. `GET /mobile/push-preference` — 푸시 수신 선호도 조회

**프론트 호출 시점:** 설정 화면(`AccountSettings.vue`) 진입 시

**처리 로직:**
1. JWT에서 `member_id` 추출
2. `member.push_enabled` 조회

**Response:**
```json
{
  "result": {
    "enabled": true
  }
}
```

> **주의:** 프론트가 `response?.data?.result?.enabled` 또는 `response?.data?.enabled` 두 경로를 모두 처리하므로
> `{ "result": { "enabled": true } }` 구조를 권장한다.

**인증:** Bearer JWT 필수

---

### 3-4. `PATCH /mobile/push-preference` — 푸시 수신 선호도 변경

**프론트 호출 시점:** 설정 화면에서 토글 변경 시

**Request Body:**
```json
{ "enabled": false }
```

**처리 로직:**
1. `member.push_enabled` 업데이트
2. `enabled=false`인 경우 해당 회원의 모든 `mobile_push_token.enabled`도 `false`로 일괄 업데이트

**Response:**
```json
{
  "result": { "enabled": false }
}
```

**인증:** Bearer JWT 필수

---

## 4. FCM 발송 서비스

### 4-1. Firebase Admin SDK 설정

```xml
<!-- pom.xml (Maven) -->
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>
```

```java
// FirebaseConfig.java
@Configuration
public class FirebaseConfig {

    @Value("${firebase.credentials-path}")
    private String credentialsPath;

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        FileInputStream serviceAccount = new FileInputStream(credentialsPath);
        FirebaseOptions options = FirebaseOptions.builder()
            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
            .build();
        return FirebaseApp.initializeApp(options);
    }
}
```

```yaml
# application.yml
firebase:
  credentials-path: /secret/firebase-service-account.json
```

> `firebase-service-account.json`은 Firebase Console → 프로젝트 설정 → 서비스 계정에서 다운로드
> EC2 배포 시 `/secret/` 디렉토리에 파일 배치 또는 AWS Secrets Manager에서 주입

---

### 4-2. FCM 발송 서비스 구현

```java
// PushNotificationService.java
@Service
@RequiredArgsConstructor
public class PushNotificationService {

    private final MobilePushTokenRepository pushTokenRepository;

    /**
     * 특정 회원에게 푸시 발송
     */
    public void sendToMember(Long memberId, String title, String body, Map<String, String> data) {
        List<MobilePushToken> tokens = pushTokenRepository
            .findByMemberIdAndEnabledTrue(memberId);

        if (tokens.isEmpty()) return;

        List<String> tokenValues = tokens.stream()
            .map(MobilePushToken::getToken)
            .collect(Collectors.toList());

        sendMulticast(tokenValues, title, body, data);
    }

    /**
     * 전체 사용자에게 브로드캐스트 푸시
     */
    public void sendBroadcast(String title, String body, Map<String, String> data) {
        // 배치 처리: FCM multicast는 최대 500개 토큰
        List<String> allTokens = pushTokenRepository.findAllEnabledTokens();
        Lists.partition(allTokens, 500).forEach(batch ->
            sendMulticast(batch, title, body, data)
        );
    }

    private void sendMulticast(List<String> tokens, String title, String body, Map<String, String> data) {
        MulticastMessage message = MulticastMessage.builder()
            .setNotification(Notification.builder()
                .setTitle(title)
                .setBody(body)
                .build())
            .putAllData(data != null ? data : Map.of())
            .addAllTokens(tokens)
            .build();

        try {
            BatchResponse response = FirebaseMessaging.getInstance().sendEachForMulticast(message);
            handleFailedTokens(tokens, response);
        } catch (FirebaseMessagingException e) {
            log.error("[FCM] 발송 실패: {}", e.getMessage());
        }
    }

    /**
     * 만료·무효 토큰 자동 정리
     */
    private void handleFailedTokens(List<String> tokens, BatchResponse response) {
        List<SendResponse> responses = response.getResponses();
        for (int i = 0; i < responses.size(); i++) {
            SendResponse sr = responses.get(i);
            if (!sr.isSuccessful()) {
                String errorCode = sr.getException().getMessagingErrorCode().name();
                if (errorCode.equals("UNREGISTERED") || errorCode.equals("INVALID_ARGUMENT")) {
                    // 무효 토큰 삭제
                    pushTokenRepository.deleteByToken(tokens.get(i));
                    log.info("[FCM] 무효 토큰 삭제: {}", tokens.get(i).substring(0, 20) + "...");
                }
            }
        }
    }
}
```

---

### 4-3. 딥링크 데이터 구조

프론트엔드 `App.vue`는 푸시 클릭 시 `notification.data.deeplink` 경로로 Vue Router를 이동시킨다.
FCM `data` 필드에 반드시 `deeplink` 키를 포함해야 한다.

```java
// 딥링크 경로 상수
public class DeepLinkPaths {
    public static final String NOTICE_DETAIL = "/notice/%d";           // 공지사항 상세
    public static final String FRIEND_LIST   = "/user/friends";        // 친구 목록
    public static final String GAME_LOBBY    = "/game";                // 게임 로비
    public static final String NOTIFICATION  = "/notifications";       // 알림 목록
}
```

```java
// 사용 예시
Map<String, String> data = new HashMap<>();
data.put("deeplink", String.format("/notice/%d", noticeId));
data.put("type", "NOTICE");
data.put("notificationId", String.valueOf(notificationId));

pushNotificationService.sendBroadcast("새 공지사항", noticeTitle, data);
```

---

## 5. 이벤트별 푸시 트리거

### 5-1. 친구 요청 수신

```java
// FriendService.java 내 친구 요청 생성 메서드에 추가
@Transactional
public void sendFriendRequest(Long senderId, Long receiverId) {
    // ... 기존 로직 ...

    // 푸시 발송
    String senderNickname = memberRepository.findNicknameById(senderId);
    Map<String, String> data = Map.of(
        "type", "FRIEND_REQUEST",
        "deeplink", "/user/friends",
        "senderId", String.valueOf(senderId)
    );
    pushNotificationService.sendToMember(
        receiverId,
        "친구 요청",
        senderNickname + "님이 친구 요청을 보냈습니다.",
        data
    );
}
```

### 5-2. 공지사항 등록

```java
// NoticeService.java 내 공지 저장 메서드에 추가
@Transactional
public void createNotice(NoticeCreateRequest request) {
    Notice notice = noticeRepository.save(...);

    // 전체 브로드캐스트 푸시
    Map<String, String> data = Map.of(
        "type", "NOTICE",
        "deeplink", "/notice/" + notice.getId(),
        "noticeId", String.valueOf(notice.getId())
    );
    pushNotificationService.sendBroadcast(
        "[공지] " + notice.getTitle(),
        notice.getSummary(),  // 미리보기 텍스트 (50자 이내 권장)
        data
    );
}
```

### 5-3. 관리자 메시지 (Admin Message)

```java
// AdminNotificationService.java
public void sendAdminMessage(Long targetMemberId, String title, String message) {
    Map<String, String> data = Map.of(
        "type", "ADMIN_MESSAGE",
        "deeplink", "/notifications"
    );
    pushNotificationService.sendToMember(targetMemberId, title, message, data);
}
```

### 5-4. 추후 확장 — 게임 초대 (현재 UI 존재, 기능 미연결)

```java
// AccountSettings.vue에 '게임 초대 알림' 토글이 있으나 서버 연동 없음
// 추후 구현 시 member 테이블에 notify_game_invite BOOLEAN 컬럼 추가 필요
Map<String, String> data = Map.of(
    "type", "GAME_INVITE",
    "deeplink", "/game/lobby/" + roomId,
    "roomId", String.valueOf(roomId)
);
pushNotificationService.sendToMember(inviteeId, "게임 초대", inviterNickname + "님이 초대했습니다.", data);
```

---

## 6. 보안 및 운영 고려사항

### 6-1. 토큰 만료 자동 정리 스케줄러

FCM 발송 시 실패한 `UNREGISTERED` 토큰은 `handleFailedTokens()`에서 즉시 삭제된다.
추가로 장기 미사용 토큰도 정기 정리 필요:

```java
@Scheduled(cron = "0 0 3 * * *")  // 매일 새벽 3시
public void cleanUpStaleTokens() {
    LocalDateTime threshold = LocalDateTime.now().minusDays(90);
    pushTokenRepository.deleteByUpdatedAtBefore(threshold);
    log.info("[FCM] 90일 이상 미갱신 토큰 정리 완료");
}
```

### 6-2. 발송 전 `push_enabled` 체크

```java
// 발송 전 반드시 회원의 전체 푸시 설정 확인
public void sendToMember(Long memberId, ...) {
    Member member = memberRepository.findById(memberId).orElseThrow();
    if (!member.isPushEnabled()) return;  // 전체 푸시 OFF 회원 제외
    // ...
}
```

### 6-3. API 인증 요구사항

| 엔드포인트 | 인증 |
|------------|------|
| `PUT /mobile/push-tokens` | JWT 필수 |
| `DELETE /mobile/push-tokens/{token}` | JWT 필수 + 본인 소유 검증 |
| `GET /mobile/push-preference` | JWT 필수 |
| `PATCH /mobile/push-preference` | JWT 필수 |

---

## 7. 모바일 소셜 로그인 (OAuth2) — 신규 구현

> 현재 백엔드는 웹 전용 OAuth2만 구현되어 있다.
> 모바일 앱에서 소셜 로그인을 처리하려면 아래 내용을 추가 구현해야 한다.

---

### 7-1. 전체 플로우 이해

```
[앱] 카카오/네이버 버튼 클릭
  → LoginView: buildOAuthAuthorizeUrl()
    → {API_BASE}/oauth2/authorization/kakao?platform=app&client_type=android
  → Capacitor Browser로 외부 브라우저 오픈

[외부 브라우저] 소셜 로그인 완료
  → 카카오/네이버 → 백엔드 OAuth 콜백 (기존 웹 흐름)
  → 백엔드가 platform=app 감지 → one-time code 발급
  → 앱 딥링크로 리다이렉트: kospot://auth/callback?code={one-time-code}

[앱] Capacitor appUrlOpen 이벤트 수신
  → deeplink.service.js → /login/oauth2/callback?code={code}
  → OAuthCallbackView.vue → POST /auth/mobile/exchange
    body: { code, state, platform: "android"|"ios" }

[백엔드] one-time code 검증 → JWT 발급
  → { accessToken, refreshToken, memberId } 응답

[앱] 토큰 저장 → /main 이동
```

**핵심 차이:** 웹은 소셜 로그인 완료 후 accessToken/refreshToken을 query string으로 직접 전달하지만,
모바일은 **one-time code를 딥링크로 전달 → 앱이 code를 서버에 교환 → JWT 수령** 하는 구조이다.
(query string에 JWT를 노출하면 앱 스킴 URL이 로그에 기록될 수 있으므로 보안상 교환 방식을 사용한다)

---

### 7-2. DB 스키마 — `mobile_oauth_code` 테이블

```sql
CREATE TABLE mobile_oauth_code (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(64)  NOT NULL UNIQUE,    -- UUID 기반 one-time code
    member_id   BIGINT       NOT NULL,           -- 검증 완료된 사용자 ID
    platform    VARCHAR(10)  NOT NULL,           -- 'android' | 'ios'
    used        BOOLEAN      NOT NULL DEFAULT FALSE,
    expires_at  DATETIME     NOT NULL,           -- 발급 후 5분
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_code (code),
    INDEX idx_expires_at (expires_at)
);
```

---

### 7-3. OAuth 콜백 핸들러 수정

기존 Spring Security OAuth2 `AuthenticationSuccessHandler`를 수정한다.

```java
// MobileAwareOAuth2SuccessHandler.java
@Component
@RequiredArgsConstructor
public class MobileAwareOAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final MobileOAuthCodeService mobileOAuthCodeService;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${oauth.mobile.app-scheme}")
    private String appScheme;  // "kospot"

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        String platform = request.getParameter("platform");     // "app"
        String clientType = request.getParameter("client_type"); // "android" | "ios"

        // 모바일 앱 요청인 경우
        if ("app".equals(platform)) {
            Long memberId = extractMemberId(authentication);

            // one-time code 발급 (5분 유효)
            String oneTimeCode = mobileOAuthCodeService.issueCode(memberId, clientType);

            // 앱 딥링크로 리다이렉트
            // kospot://auth/callback?code={oneTimeCode}
            String deepLink = appScheme + "://auth/callback?code=" + oneTimeCode;
            response.sendRedirect(deepLink);
            return;
        }

        // 웹 기존 방식 (query token 전달) — 변경 없음
        handleWebLogin(request, response, authentication);
    }
    // ...
}
```

```yaml
# application.yml 추가
oauth:
  mobile:
    app-scheme: kospot
    enabled: true   # feature flag — false이면 모바일 OAuth 비활성화
```

---

### 7-4. `POST /auth/mobile/exchange` — one-time code → JWT 교환

**프론트 호출 위치:** `OAuthCallbackView.vue`의 `exchangeMobileCode()`

**Request Body:**
```json
{
  "code": "a1b2c3d4-e5f6-...",
  "state": null,
  "platform": "android"
}
```

**처리 로직:**
1. `code`로 `mobile_oauth_code` 조회
2. 존재하지 않으면 `400 Bad Request`
3. `used = true`이면 `400 Bad Request` (재사용 방지)
4. `expires_at < now()`이면 `400 Bad Request` (만료)
5. `used = true` 업데이트 (원자적 처리)
6. `member_id`로 JWT accessToken + refreshToken 발급
7. 응답 반환

**Response:**
```json
{
  "isSuccess": true,
  "result": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "memberId": 42
  }
}
```

**인증:** 불필요 (공개 엔드포인트 — SecurityConfig에서 명시적으로 허용 필요)

```java
// SecurityConfig.java
.requestMatchers("/auth/mobile/exchange").permitAll()
.requestMatchers("/mobile/**").authenticated()
```

---

### 7-5. MobileOAuthCodeService 구현

```java
@Service
@RequiredArgsConstructor
public class MobileOAuthCodeService {

    private final MobileOAuthCodeRepository codeRepository;

    /**
     * one-time code 발급 (5분 유효)
     */
    @Transactional
    public String issueCode(Long memberId, String platform) {
        String code = UUID.randomUUID().toString();
        MobileOAuthCode entity = MobileOAuthCode.builder()
            .code(code)
            .memberId(memberId)
            .platform(platform)
            .used(false)
            .expiresAt(LocalDateTime.now().plusMinutes(5))
            .build();
        codeRepository.save(entity);
        return code;
    }

    /**
     * code 검증 및 memberId 반환 (원자적 used=true 처리)
     */
    @Transactional
    public Long validateAndConsume(String code) {
        MobileOAuthCode entity = codeRepository.findByCode(code)
            .orElseThrow(() -> new InvalidOAuthCodeException("존재하지 않는 코드"));

        if (entity.isUsed()) {
            throw new InvalidOAuthCodeException("이미 사용된 코드");
        }
        if (entity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidOAuthCodeException("만료된 코드");
        }

        entity.setUsed(true);  // 원자적 소비
        return entity.getMemberId();
    }
}
```

---

### 7-6. 앱 딥링크 수신을 위한 네이티브 설정

백엔드가 `kospot://auth/callback?code=xxx` 로 리다이렉트하면,
앱(Android/iOS)이 이 URL을 수신하려면 각 플랫폼에 스킴을 등록해야 한다.

#### Android — AndroidManifest.xml에 Intent Filter 추가

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<activity android:name=".MainActivity" ...>
    <!-- 기존 LAUNCHER intent-filter -->

    <!-- 딥링크 수신용 intent-filter 추가 -->
    <intent-filter android:autoVerify="false">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="kospot" android:host="auth" />
    </intent-filter>
</activity>
```

#### iOS — Info.plist에 URL Scheme 추가

`ios/App/App/Info.plist`에 추가:
```xml
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

> **중요:** 이 설정이 없으면 외부 브라우저에서 `kospot://` 딥링크를 열 때 앱이 응답하지 않아
> 로그인 완료 후 앱으로 돌아오지 못한다.

---

### 7-7. 소셜 플랫폼별 redirect_uri 등록

카카오, 네이버 각 개발자 센터에서 모바일 앱용 redirect_uri를 추가 등록해야 한다.

| 플랫폼 | 기존 웹 redirect_uri | 추가 필요 (모바일) |
|--------|---------------------|-------------------|
| 카카오 | `https://api.kospot.com/login/oauth2/code/kakao` | 동일 URI 유지 (백엔드가 처리) |
| 네이버 | `https://api.kospot.com/login/oauth2/code/naver` | 동일 URI 유지 (백엔드가 처리) |

> 소셜 플랫폼의 redirect_uri는 **백엔드 서버 URL**로 유지한다.
> 앱 딥링크(`kospot://`)는 소셜 플랫폼이 아닌 **백엔드**가 발급한다.
> 따라서 소셜 플랫폼 개발자 센터 설정은 변경 없이 유지해도 된다.

---

### 7-8. 만료 코드 정리 스케줄러

```java
@Scheduled(cron = "0 0 * * * *")  // 매시간
public void cleanUpExpiredCodes() {
    codeRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    log.info("[MobileOAuth] 만료된 one-time code 정리 완료");
}
```

---

### 7-9. 환경변수 및 배포

```yaml
# application.yml 추가
oauth:
  mobile:
    app-scheme: kospot        # 앱 딥링크 스킴
    enabled: ${OAUTH_MOBILE_ENABLED:false}  # feature flag

firebase:
  credentials-path: /secret/firebase-service-account.json
```

```bash
# EC2 환경변수 추가
OAUTH_MOBILE_ENABLED=true
FIREBASE_CREDENTIALS_PATH=/secret/firebase-service-account.json
```

**프론트엔드 환경변수 (KoSpot-frontend-private):**
```dotenv
VUE_APP_OAUTH_MOBILE_ENABLED=true
VUE_APP_ENABLE_PUSH=true
VUE_APP_APP_ID=com.kospot.app
VUE_APP_BUILD_VERSION=1.0.0
```

### Spring Security 최종 화이트리스트

```java
.requestMatchers("/auth/mobile/exchange").permitAll()   // ← 신규 추가 (인증 불필요)
.requestMatchers("/oauth2/**").permitAll()               // 기존 OAuth 엔드포인트
.requestMatchers("/mobile/**").authenticated()           // 푸시 토큰/설정 API
```

---

## 8. 구현 우선순위 (전체)

| 순서 | 영역 | 작업 | 이유 |
|------|------|------|------|
| 1 | **CORS** | `CorsConfig` — `https://localhost`, `capacitor://localhost` Origin 허용 | API·WebSocket·OAuth 전체 기반 |
| 2 | **CORS** | `WebSocketConfig` — SockJS `setAllowedOrigins`에 WebView Origin 추가 | 실시간 알림·멀티플레이어 |
| 3 | OAuth | `mobile_oauth_code` 테이블 생성 | 로그인 전체 의존 |
| 4 | OAuth | `OAuth2SuccessHandler` 수정 — `platform=app` 감지 + one-time code 발급 | 앱 로그인 시작점 |
| 5 | OAuth | `POST /auth/mobile/exchange` 구현 | 토큰 교환 |
| 6 | OAuth | feature flag `OAUTH_MOBILE_ENABLED` 환경변수 설정 | 점진 활성화 |
| 7 | Push | `mobile_push_token` 테이블 + `member.push_enabled` 컬럼 | 푸시 API 의존 |
| 8 | Push | `PUT /mobile/push-tokens` | 토큰 등록 |
| 9 | Push | `GET/PATCH /mobile/push-preference` | 설정 화면 |
| 10 | Push | `DELETE /mobile/push-tokens/{token}` | 로그아웃 정리 |
| 11 | Push | Firebase Admin SDK + `PushNotificationService` | 실제 발송 |
| 12 | Push | 이벤트별 트리거 연결 | 알림 발송 |
| 13 | Push | 만료 토큰/코드 정리 스케줄러 | 운영 안정화 |
