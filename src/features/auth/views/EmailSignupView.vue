<template>
  <div class="signup-container">
    <!-- 로고 (LoginView 브랜드 일관성) -->
    <div class="brand-header">
      <img
        src="/images/logo/kospot_logo_1-removebg.png"
        alt="KoSpot"
        class="brand-logo"
      />
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
          <span v-if="fieldErrors.email" class="field-error">{{
            fieldErrors.email
          }}</span>
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
            <button
              type="button"
              class="toggle-pw"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? "숨기기" : "표시" }}
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
            :class="{
              'input-error': touched.passwordConfirm && !isPasswordMatch,
            }"
            @blur="touched.passwordConfirm = true"
          />
          <span
            v-if="touched.passwordConfirm && !isPasswordMatch"
            class="field-error"
          >
            비밀번호가 일치하지 않습니다
          </span>
        </div>

        <!-- 전역 에러 -->
        <p v-if="globalError" class="global-error">{{ globalError }}</p>

        <!-- 제출 버튼 -->
        <button
          type="submit"
          class="submit-button"
          :disabled="!isFormValid || loading"
        >
          {{ loading ? "가입 중..." : "가입하기" }}
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
import { reactive, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/core/composables/useAuth.js";
import { validators } from "@/core/utils/validators.js";
import { AUTH_ERROR_CODES } from "@/core/constants/errorCodes.js";

const router = useRouter();
const { signup, loading } = useAuth();

const form = reactive({ email: "", password: "", passwordConfirm: "" });
const touched = reactive({
  email: false,
  password: false,
  passwordConfirm: false,
});
const fieldErrors = reactive({ email: "" });
const globalError = ref("");
const showPassword = ref(false);

const isEmailValid = computed(() => validators.email(form.email));
const isPasswordValid = computed(() => validators.password(form.password));
const isPasswordMatch = computed(() =>
  validators.passwordMatch(form.password, form.passwordConfirm),
);
const isFormValid = computed(
  () => isEmailValid.value && isPasswordValid.value && isPasswordMatch.value,
);

// 비밀번호 강도: 8자 미만 weak, 8~11자 medium, 12자↑ strong
const passwordStrengthClass = computed(() => {
  const len = form.password.length;
  if (len < 8) return "weak";
  if (len < 12) return "medium";
  return "strong";
});

const handleSignup = async () => {
  // 제출 시 모든 필드 touched 처리 → 에러 표시
  Object.keys(touched).forEach((k) => {
    touched[k] = true;
  });
  if (!isFormValid.value) return;

  fieldErrors.email = "";
  globalError.value = "";

  const result = await signup({
    email: form.email,
    password: form.password,
  });

  if (result.success) {
    router.push("/main");
    return;
  }

  // API 에러 → 해당 필드 인라인 표시
  if (result.code === AUTH_ERROR_CODES.EMAIL_DUPLICATE) {
    fieldErrors.email = "이미 사용 중인 이메일입니다.";
  } else {
    globalError.value = result.message;
  }
};
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

/* ── 카드 (information hierarchy — subtle shadow) ── */
.signup-card {
  width: 100%;
  max-width: 320px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(76, 201, 207, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.signup-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
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
  border: 1.5px solid #e5e7eb;
  font-size: 15px;
  color: #111827;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
  box-sizing: border-box;
  background: #ffffff;
}

.form-input::placeholder {
  color: #9ca3af;
}

.form-input:focus {
  border-color: #4cc9cf;
  box-shadow: 0 0 0 3px rgba(76, 201, 207, 0.15);
}

.input-error {
  border-color: #ef4444;
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
  color: #9ca3af;
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

.pw-strength-bar.weak {
  width: 33%;
  background: #ef4444;
}
.pw-strength-bar.medium {
  width: 66%;
  background: #f59e0b;
}
.pw-strength-bar.strong {
  width: 100%;
  background: #10b981;
}

/* 에러 메시지 */
.field-error {
  font-size: 12px;
  color: #ef4444;
  padding-left: 4px;
}

.global-error {
  font-size: 13px;
  color: #ef4444;
  text-align: center;
  margin: 0;
}

/* ── 제출 버튼 ── */
.submit-button {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #4cc9cf 0%, #52dee5 100%);
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
  color: #6b7280;
  margin: 0;
}

.login-link a {
  color: #4cc9cf;
  font-weight: 600;
  text-decoration: none;
}

/* ── 애니메이션 ── */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
