# feat/117 — 이메일 로그인 / 회원가입 구현 계획

> 작성일: 2026-03-30
> 브랜치: `feat/117`
> 관련 이슈: #117

---

## 1. 현재 상태 — 실제 코드 기반 분석

### 1-1. 응답 래퍼 필드: `result` vs `data` ⚠️ 구현 전 백엔드 확인 필수

기존 코드 전체가 `response.data.result`를 사용한다.

| 파일 | 사용 패턴 |
|------|-----------|
| `apiClient.js` L62 | `response.data?.result` |
| `tokenRefresh.service.js` L117 | `response.data?.result` |
| `OAuthCallbackView.vue` L86 | `response.data?.result` |

→ **기존 백엔드 응답 구조:** `{ isSuccess, code, message, result: { ... } }`

이번 이슈 API 스펙은 `data` 필드를 사용:
```json
{ "isSuccess": true, "code": "2000", "message": "OK",
  "data": { "memberId": 42, "accessToken": "...", "refreshToken": "..." } }
```

아래 플랜은 **`data` 필드 기준**으로 작성하되, 실제 응답이 `result`이면 그대로 교체한다.
방어적으로 `response.data?.data ?? response.data?.result` 패턴을 사용한다.

---

### 1-2. `useAuth.js` `login()` — 기존 버그 2개

```js
// 현재 (useAuth.js L45-46)
const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
const { memberId, accessToken, refreshToken } = response.data   // ❌
```

**버그 1** — `response.data`는 `{ isSuccess, code, message, data/result }` 최상위 객체.
토큰 3개 모두 `undefined`로 저장된다.

**버그 2** — 로그인 응답에는 `memberId`가 없다 (스펙상 signup에만 존재).
`memberId`는 JWT 디코딩으로 추출한다 (`OAuthCallbackView.decodeJWT` 동일 패턴).

---

### 1-3. `errorCodes.js` — 번호 충돌 ⚠️

동일 번호가 완전히 다른 의미로 쓰인다.

| 코드 | 기존 `errorCodes.js` | 신규 Auth API |
|------|----------------------|---------------|
| 4101 | `MEMBER_NOT_FOUND` | 닉네임 중복 |
| 4102 | `MEMBER_UNAUTHORIZED` | 이메일 중복 |
| 4103 | `MEMBER_ALREADY_EXISTS` | 존재하지 않는 이메일 |

→ 기존 `ERROR_CODES`는 건드리지 않는다. 인증 전용 `AUTH_ERROR_CODES` 별도 추가.

---

### 1-4. `validators.js` — 빈 파일

`src/core/utils/validators.js`는 현재 1줄(빈 파일). 유효성 함수를 여기에 추가해 컴포넌트와 분리한다.

---

### 1-5. `auth.service.js` — `register()`는 잘못된 엔드포인트

```js
register(userData) {
  return apiClient.post('/auth/register', userData);  // ❌ 존재하지 않음
}
```
→ `signup()` 메서드로 교체, `/auth/signup` 사용.

---

### 1-6. `router/index.js` `afterEach` — `/signup` 미처리

현재 WebSocket 연결 트리거는 `from.path === '/loginPage'`일 때만 동작한다.
`/signup` → `/main` 이동은 이 조건을 만족하지 않으므로 `connectAll()`이 호출되지 않는다.

**수정 방향:** `useAuth.js signup()` 내부에서 `connectAll()`을 직접 임포트해 호출하는 것보다,
`router/index.js` `afterEach` 조건에 `/signup`을 추가하는 것이 더 깔끔하다.
→ `useAuth.js`는 navigation side-effect에서 자유롭게 유지된다.

```js
// 변경 전
const comingFromLogin = from.path === '/loginPage' || from.path === '/login'

// 변경 후
const comingFromLogin =
  from.path === '/loginPage' ||
  from.path === '/login' ||
  from.path === '/signup'
```

---

## 2. 변경 파일 목록

```
수정
  src/core/api/endPoint.js
  src/core/constants/errorCodes.js
  src/core/utils/validators.js
  src/core/composables/useAuth.js
  src/features/auth/services/auth.service.js
  src/features/auth/views/LoginView.vue
  src/router/mainRoutes.js
  src/router/index.js                        ← afterEach 조건 추가 (1-6)

신규 생성
  src/features/auth/views/EmailSignupView.vue
```

---

## 3. 파일별 상세 구현 명세

### 3-1. `endPoint.js`

```js
AUTH: {
  LOGIN:           '/auth/login',
  LOGOUT:          '/auth/logout',
  SIGNUP:          '/auth/signup',          // 추가 (REGISTER 대체)
  RE_ISSUE:        '/auth/reIssue',
  MOBILE_EXCHANGE: '/auth/mobile/exchange',
},
```

`REGISTER` 키 삭제. `VERIFY_EMAIL`, `FORGOT_PASSWORD`, `RESET_PASSWORD`는 미구현이므로 그대로 유지.

---

### 3-2. `errorCodes.js`

파일 하단에 추가 (기존 코드 변경 없음):

```js
/**
 * 인증(Auth) 전용 에러 코드 — /auth/signup, /auth/login
 * code 필드 타입: 백엔드 확인 필요 (문자열 "4101" vs 숫자 4101)
 */
export const AUTH_ERROR_CODES = {
  NICKNAME_DUPLICATE:  '4101',  // 닉네임 중복 (signup)
  EMAIL_DUPLICATE:     '4102',  // 이메일 중복 (signup)
  EMAIL_NOT_FOUND:     '4103',  // 가입되지 않은 이메일 (login)
  PASSWORD_MISMATCH:   '4104',  // 비밀번호 불일치 (login)
  SOCIAL_ONLY_ACCOUNT: '4105',  // 소셜 전용 계정으로 이메일 로그인 시도 (login)
}
```

---

### 3-3. `validators.js`

```js
export const validators = {
  email:         (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v ?? ''),
  password:      (v) => (v?.length ?? 0) >= 8,
  nickname:      (v) => (v?.length ?? 0) >= 2 && (v?.length ?? 0) <= 12,
  passwordMatch: (a, b) => !!a && a === b,
}
```

---

### 3-4. `auth.service.js`

`register()` 제거, `signup()` 추가. `login()`은 변경 없음.

```js
signup(userData) {
  // POST /auth/signup  body: { email, password, nickname }
  return apiClient.post('/auth/signup', userData)
},
```

---

### 3-5. `useAuth.js`

#### login() — 완전 교체

```js
const login = async (credentials) => {
  try {
    authState.loading = true
    authState.error = null

    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
    // 방어적 필드 접근: 신규 스펙(data) 우선, 기존 패턴(result) 폴백
    const tokenData = response.data?.data ?? response.data?.result
    const { accessToken, refreshToken } = tokenData

    // login 응답에 memberId 없음 → JWT payload 디코딩
    let memberId = null
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      memberId = payload.memberId ?? null
    } catch (_) { /* JWT 파싱 실패 무시 */ }

    authStorage.setTokens({ accessToken, refreshToken, memberId })
    authState.user = { id: memberId }
    authState.isAuthenticated = true
    tokenRefreshService.restart()

    try { await registerPushIfPermitted() } catch (_) {}

    return { success: true }
  } catch (error) {
    const code   = String(error.response?.data?.code ?? '')
    const message = error.response?.data?.message || '로그인에 실패했습니다.'
    authState.error = message
    return { success: false, code, message }
  } finally {
    authState.loading = false
  }
}
```

#### signup() — register() 대체 신규 작성

```js
const signup = async (userData) => {
  try {
    authState.loading = true
    authState.error = null

    const response = await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, userData)
    const tokenData = response.data?.data ?? response.data?.result
    const { memberId, accessToken, refreshToken } = tokenData

    authStorage.setTokens({ accessToken, refreshToken, memberId })
    authState.user = { id: memberId }
    authState.isAuthenticated = true
    tokenRefreshService.restart()

    // connectAll()은 router afterEach(/signup 조건 추가)가 담당
    try { await registerPushIfPermitted() } catch (_) {}

    return { success: true }
  } catch (error) {
    const code    = String(error.response?.data?.code ?? '')
    const message = error.response?.data?.message || '회원가입에 실패했습니다.'
    authState.error = message
    return { success: false, code, message }
  } finally {
    authState.loading = false
  }
}
```

#### return 갱신

```js
return {
  user, isAuthenticated, loading, error,
  login, signup, loginAsBot, logout, checkAuth, isBot,
  // register 제거
}
```

---

### 3-6. `router/index.js` — afterEach 조건 추가

```js
// 변경 전
const comingFromLogin = from.path === '/loginPage' || from.path === '/login'

// 변경 후 (/signup 추가)
const comingFromLogin =
  from.path === '/loginPage' ||
  from.path === '/login'     ||
  from.path === '/signup'
```

---

### 3-7. `mainRoutes.js` — 라우트 추가

기존 파일의 static import 패턴을 그대로 따른다.

```js
import EmailSignupView from '@/features/auth/views/EmailSignupView.vue'

// mainRoutes 배열에 추가
{
  path: '/signup',
  name: 'EmailSignup',
  component: EmailSignupView
}
```

---

### 3-8. `EmailSignupView.vue` — 전체 컴포넌트

> **디자인 원칙 적용**
> - 브랜드 컬러: `BRAND.PRIMARY #4cc9cf`, `GRADIENTS.PRIMARY linear-gradient(135deg, #52DEE5 0%, #EEE5E9 100%)`
> - 텍스트: black(`#111827`) / white만 사용 (디자인 규칙 준수)
> - 에러: `BRAND.DANGER #ef4444`
> - 카드 그림자: information hierarchy 구현
> - 로고 상단 표시: LoginView와 브랜드 일관성
> - micro-interaction: 버튼 hover translateY, input focus transition

```vue
<template>
  <div class="signup-container">
    <!-- 로고 (LoginView 브랜드 일관성) -->
    <div class="brand-header">
      <img src="/images/logo/kospot_logo_1-removebg.png" alt="KoSpot" class="brand-logo" />
    </div>

    <div class="signup-card">
      <h2 class="signup-title">회원가입</h2>

      <form class="signup-form" @submit.prevent="handleSignup" novalidate>

        <!-- 이메일 -->
        <div class="field-group">
          <input
            v-model="form.email"
            type="email"
            placeholder="이메일"
            autocomplete="email"
            class="form-input"
            :class="{ 'input-error': touched.email && !isEmailValid }"
            @blur="touched.email = true"
          />
          <span v-if="touched.email && !isEmailValid" class="field-error">
            올바른 이메일 형식을 입력해주세요
          </span>
          <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>
        </div>

        <!-- 비밀번호 -->
        <div class="field-group">
          <div class="input-wrapper">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="비밀번호 (8자 이상)"
              autocomplete="new-password"
              class="form-input"
              :class="{ 'input-error': touched.password && !isPasswordValid }"
              @blur="touched.password = true"
            />
            <button type="button" class="toggle-pw" @click="showPassword = !showPassword">
              {{ showPassword ? '숨기기' : '표시' }}
            </button>
          </div>
          <!-- 비밀번호 강도 바 -->
          <div v-if="form.password" class="pw-strength">
            <div class="pw-strength-bar" :class="passwordStrengthClass"></div>
          </div>
          <span v-if="touched.password && !isPasswordValid" class="field-error">
            비밀번호는 8자 이상이어야 합니다
          </span>
        </div>

        <!-- 비밀번호 확인 -->
        <div class="field-group">
          <input
            v-model="form.passwordConfirm"
            :type="showPassword ? 'text' : 'password'"
            placeholder="비밀번호 확인"
            autocomplete="new-password"
            class="form-input"
            :class="{ 'input-error': touched.passwordConfirm && !isPasswordMatch }"
            @blur="touched.passwordConfirm = true"
          />
          <span v-if="touched.passwordConfirm && !isPasswordMatch" class="field-error">
            비밀번호가 일치하지 않습니다
          </span>
        </div>

        <!-- 닉네임 -->
        <div class="field-group">
          <input
            v-model="form.nickname"
            type="text"
            placeholder="닉네임 (2~12자)"
            autocomplete="username"
            class="form-input"
            :class="{ 'input-error': touched.nickname && !isNicknameValid }"
            @blur="touched.nickname = true"
          />
          <span v-if="touched.nickname && !isNicknameValid" class="field-error">
            닉네임은 2~12자여야 합니다
          </span>
          <span v-if="fieldErrors.nickname" class="field-error">{{ fieldErrors.nickname }}</span>
        </div>

        <!-- 전역 에러 -->
        <p v-if="globalError" class="global-error">{{ globalError }}</p>

        <!-- 제출 버튼 -->
        <button
          type="submit"
          class="submit-button"
          :disabled="!isFormValid || loading"
        >
          {{ loading ? '가입 중...' : '가입하기' }}
        </button>
      </form>

      <p class="login-link">
        이미 계정이 있으신가요?
        <router-link to="/loginPage">로그인</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/core/composables/useAuth.js'
import { validators } from '@/core/utils/validators.js'
import { AUTH_ERROR_CODES } from '@/core/constants/errorCodes.js'

const router = useRouter()
const { signup, loading } = useAuth()

const form = reactive({ email: '', password: '', passwordConfirm: '', nickname: '' })
const touched = reactive({ email: false, password: false, passwordConfirm: false, nickname: false })
const fieldErrors = reactive({ email: '', nickname: '' })
const globalError = ref('')
const showPassword = ref(false)

const isEmailValid    = computed(() => validators.email(form.email))
const isPasswordValid = computed(() => validators.password(form.password))
const isPasswordMatch = computed(() => validators.passwordMatch(form.password, form.passwordConfirm))
const isNicknameValid = computed(() => validators.nickname(form.nickname))
const isFormValid     = computed(() =>
  isEmailValid.value && isPasswordValid.value && isPasswordMatch.value && isNicknameValid.value
)

// 비밀번호 강도: 8자 미만 weak, 8~11자 medium, 12자↑ strong
const passwordStrengthClass = computed(() => {
  const len = form.password.length
  if (len < 8)  return 'weak'
  if (len < 12) return 'medium'
  return 'strong'
})

const handleSignup = async () => {
  Object.keys(touched).forEach(k => { touched[k] = true })
  if (!isFormValid.value) return

  fieldErrors.email = ''
  fieldErrors.nickname = ''
  globalError.value = ''

  const result = await signup({
    email:    form.email,
    password: form.password,
    nickname: form.nickname,
  })

  if (result.success) {
    router.push('/main')
    return
  }

  if (result.code === AUTH_ERROR_CODES.EMAIL_DUPLICATE) {
    fieldErrors.email = '이미 사용 중인 이메일입니다.'
  } else if (result.code === AUTH_ERROR_CODES.NICKNAME_DUPLICATE) {
    fieldErrors.nickname = '이미 존재하는 닉네임입니다.'
  } else {
    globalError.value = result.message
  }
}
</script>

<style scoped>
/* ── 레이아웃 ── */
.signup-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #ffffff, #f3f4f6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1.25rem;
}

/* ── 브랜드 로고 ── */
.brand-header {
  display: flex;
  justify-content: center;
}

.brand-logo {
  height: 48px;
  object-fit: contain;
  animation: fadeInDown 0.5s ease-out;
}

/* ── 카드 ── (information hierarchy — subtle shadow) */
.signup-card {
  width: 100%;
  max-width: 320px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(76, 201, 207, 0.10), 0 1px 4px rgba(0,0,0,0.06);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.signup-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;       /* TEXT.PRIMARY */
  text-align: center;
  margin: 0;
}

/* ── 폼 ── */
.signup-form {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  height: 46px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1.5px solid #e5e7eb;   /* THEME.LIGHT.border */
  font-size: 15px;
  color: #111827;                 /* TEXT.PRIMARY */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
  box-sizing: border-box;
  background: #ffffff;
}

.form-input::placeholder {
  color: #9ca3af;   /* TEXT.MUTED */
}

.form-input:focus {
  border-color: #4cc9cf;          /* BRAND.PRIMARY */
  box-shadow: 0 0 0 3px rgba(76, 201, 207, 0.15);
}

.input-error {
  border-color: #ef4444;          /* BRAND.DANGER */
}

.input-error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
}

/* 비밀번호 표시/숨기기 */
.toggle-pw {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 12px;
  color: #9ca3af;   /* TEXT.MUTED */
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

/* 비밀번호 강도 바 */
.pw-strength {
  height: 3px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.pw-strength-bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.pw-strength-bar.weak   { width: 33%;  background: #ef4444; }  /* BRAND.DANGER */
.pw-strength-bar.medium { width: 66%;  background: #f59e0b; }  /* BRAND.WARNING */
.pw-strength-bar.strong { width: 100%; background: #10b981; }  /* BRAND.SUCCESS */

/* 에러 메시지 */
.field-error {
  font-size: 12px;
  color: #ef4444;   /* BRAND.DANGER */
  padding-left: 4px;
}

.global-error {
  font-size: 13px;
  color: #ef4444;   /* BRAND.DANGER */
  text-align: center;
  margin: 0;
}

/* ── 제출 버튼 ── */
.submit-button {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  border: none;
  /* GRADIENTS.PRIMARY 기반 브랜드 버튼 */
  background: linear-gradient(135deg, #4cc9cf 0%, #52DEE5 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  margin-top: 0.25rem;
  font-family: inherit;
  letter-spacing: -0.2px;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── 하단 로그인 링크 ── */
.login-link {
  text-align: center;
  font-size: 13px;
  color: #6b7280;   /* TEXT.SECONDARY */
  margin: 0;
}

.login-link a {
  color: #4cc9cf;   /* BRAND.PRIMARY */
  font-weight: 600;
  text-decoration: none;
}

/* ── 애니메이션 ── */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .signup-card {
    border-radius: 16px;
    padding: 1.5rem;
  }
  .brand-logo {
    height: 40px;
  }
}
</style>
```

---

### 3-9. `LoginView.vue` — 이메일 폼 추가 상세 명세

#### 추가할 script 변수/함수

```js
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/core/composables/useAuth.js'
import { AUTH_ERROR_CODES } from '@/core/constants/errorCodes.js'

const route = useRoute()
const router = useRouter()
const { login, loading } = useAuth()

const email = ref('')
const password = ref('')
const loginError = ref('')
const toast = reactive({ show: false, message: '' })

let toastTimer = null
const showToast = (message) => {
  if (toastTimer) clearTimeout(toastTimer)
  toast.show = true
  toast.message = message
  toastTimer = setTimeout(() => { toast.show = false }, 3500)
}

const handleEmailLogin = async () => {
  loginError.value = ''
  if (!email.value || !password.value) {
    loginError.value = '이메일과 비밀번호를 입력해주세요.'
    return
  }

  const result = await login({ email: email.value, password: password.value })

  if (result.success) {
    const redirect = route.query.redirect
    router.push(typeof redirect === 'string' ? redirect : '/main')
    return
  }

  if (result.code === AUTH_ERROR_CODES.SOCIAL_ONLY_ACCOUNT) {
    showToast('소셜 계정입니다. 카카오 또는 네이버 로그인을 이용해주세요.')
  } else {
    loginError.value = result.message
  }
}
```

#### 추가할 template 블록 (`.game-controls` 안, `start-button` 아래)

```html
<!-- Toast 알림 -->
<div v-if="toast.show" class="toast-banner">{{ toast.message }}</div>

<!-- 이메일 로그인 폼 -->
<form v-if="!isLoggedIn" class="email-login-form" @submit.prevent="handleEmailLogin" novalidate>
  <input
    v-model="email"
    type="email"
    placeholder="이메일"
    autocomplete="email"
    class="login-input"
  />
  <input
    v-model="password"
    type="password"
    placeholder="비밀번호"
    autocomplete="current-password"
    class="login-input"
  />
  <span v-if="loginError" class="login-error">{{ loginError }}</span>
  <button type="submit" class="login-submit-btn" :disabled="loading">
    {{ loading ? '로그인 중...' : '로그인' }}
  </button>
</form>

<!-- 구분선 -->
<div v-if="!isLoggedIn" class="divider">
  <span>또는 소셜 로그인</span>
</div>

<!-- 기존 소셜 버튼 영역 (변경 없음) -->
<div v-if="!isLoggedIn" class="social-login-section">
  ...기존 소셜 버튼...

  <!-- 가입 링크 (소셜 버튼 아래) -->
  <router-link to="/signup" class="signup-link">이메일로 가입하기</router-link>
</div>
```

#### 추가할 style

```css
.email-login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.login-input {
  width: 100%;
  height: 45px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1.5px solid #e5e7eb;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
  font-family: inherit;
}

.login-input:focus {
  border-color: #4cc9cf;                        /* BRAND.PRIMARY */
  box-shadow: 0 0 0 3px rgba(76, 201, 207, 0.15);
}

.login-error {
  font-size: 12px;
  color: #ef4444;   /* BRAND.DANGER */
  padding-left: 4px;
}

.login-submit-btn {
  width: 100%;
  height: 45px;
  border-radius: 12px;
  border: none;
  /* 게임시작 버튼과 차별화: 브랜드 컬러 solid (gradient는 start-button이 사용) */
  background: #4cc9cf;   /* BRAND.PRIMARY */
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  font-family: inherit;
}

.login-submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.login-submit-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.divider {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #9ca3af;   /* TEXT.MUTED */
  font-size: 12px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;   /* THEME.LIGHT.border */
}

.signup-link {
  display: block;
  text-align: center;
  font-size: 13px;
  color: #4cc9cf;   /* BRAND.PRIMARY */
  font-weight: 600;
  text-decoration: none;
  margin-top: 0.25rem;
}

.toast-banner {
  position: fixed;
  top: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  background: #111827;   /* TEXT.PRIMARY — black */
  color: white;
  padding: 0.6rem 1.25rem;
  border-radius: 999px;
  font-size: 13px;
  z-index: 9999;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: fadeIn 0.2s ease;
}
```

---

## 4. WebSocket 연결 트리거 — 수정 후 전체 정리

| 진입 경로 | connectAll() 호출 위치 | 상태 |
|----------|----------------------|------|
| 소셜 로그인 | `OAuthCallbackView.navigateAfterLogin()` | 기존 ✅ |
| 이메일 로그인 | `router afterEach` (from=`/loginPage`) | 기존 ✅ |
| 이메일 회원가입 | `router afterEach` (from=`/signup` 조건 추가) | **수정 필요** |
| 앱 새로고침 | `App.vue onMounted` | 기존 ✅ |
| 타 탭 로그인 감지 | `App.vue storage 이벤트` | 기존 ✅ |

---

## 5. Acceptance Criteria 체크리스트

- [ ] 모든 필드 유효성 통과 시에만 `가입하기` 버튼 활성화
- [ ] blur 이후에만 인라인 에러 표시 (입력 도중 에러 노출 없음)
- [ ] 비밀번호 확인 불일치 → 실시간 인라인 에러
- [ ] 이메일/닉네임 중복 API 에러 → 해당 필드 인라인 에러
- [ ] 회원가입 API 호출 중 버튼 비활성화 + "가입 중..." 텍스트
- [ ] 회원가입 완료 즉시 재로그인 없이 `/main` 이동 및 WebSocket 연결
- [ ] 이메일 로그인 성공 후 `/main` (또는 `redirect` 쿼리 파라미터) 이동
- [ ] 로그인 API 호출 중 버튼 비활성화 + "로그인 중..." 텍스트
- [ ] 소셜 전용 계정 (`4105`) → 토스트 알림 3.5초 표시
- [ ] 기존 소셜 로그인 / OAuth 콜백 / 토큰 갱신 정상 동작 유지

---

## 6. 구현 순서

1. `endPoint.js` — SIGNUP 추가 (`REGISTER` 삭제)
2. `errorCodes.js` — `AUTH_ERROR_CODES` 추가
3. `validators.js` — 유효성 함수 구현
4. `auth.service.js` — `signup()` 추가 (`register()` 제거)
5. `useAuth.js` — `login()` 버그 수정 + `signup()` 추가 + return 갱신
6. `router/index.js` — `afterEach` 조건에 `/signup` 추가
7. `mainRoutes.js` — `/signup` 라우트 등록
8. `EmailSignupView.vue` — 신규 생성
9. `LoginView.vue` — 이메일 폼 + 에러 처리 + 가입 링크 추가

---

## 7. 구현 전 백엔드 확인 사항

| # | 확인 항목 | 이유 |
|---|-----------|------|
| 1 | `/auth/signup`, `/auth/login` 응답 래퍼 필드가 `data`인지 `result`인지 | 기존 코드 전체가 `result` 사용 중 |
| 2 | 에러 응답 `code` 필드 타입 (문자열 `"4101"` vs 숫자 `4101`) | `AUTH_ERROR_CODES` 값 타입 결정 |
| 3 | `/auth/reIssue` 엔드포인트 변경 여부 | 토큰 갱신 로직 영향 |
