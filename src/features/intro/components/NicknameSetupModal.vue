<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container">
        <div class="modal-header">
          <h2>닉네임 설정</h2>
          <p>KoSpot에서 사용할 닉네임을 입력해주세요</p>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="nickname">닉네임</label>
              <input
                id="nickname"
                v-model="nickname"
                type="text"
                placeholder="닉네임을 입력하세요"
                :disabled="loading"
                maxlength="20"
                autocomplete="off"
                @input="validateNickname"
              />
              <div class="input-hint">
                <span :class="{ error: hasError }">{{ nicknameHint }}</span>
                <span class="char-count">{{ nickname.length }}/20</span>
              </div>
            </div>

            <div class="modal-actions">
              <button
                type="submit"
                :disabled="loading || !isValid || !nickname.trim()"
                class="submit-btn"
              >
                {{ loading ? '설정 중...' : '확인' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { userService } from '@/features/user/services/user.service.js';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'complete']);

const nickname = ref('');
const loading = ref(false);
const hasError = ref(false);
const nicknameHint = ref('2-20자 이내로 입력해주세요');

// 닉네임 유효성 검사
const isValid = computed(() => {
  const trimmed = nickname.value.trim();
  return trimmed.length >= 2 && trimmed.length <= 20 && !hasError.value;
});

// 닉네임 입력 검증
function validateNickname() {
  const trimmed = nickname.value.trim();
  
  if (trimmed.length === 0) {
    hasError.value = false;
    nicknameHint.value = '2-20자 이내로 입력해주세요';
    return;
  }

  if (trimmed.length < 2) {
    hasError.value = true;
    nicknameHint.value = '닉네임은 최소 2자 이상이어야 합니다';
    return;
  }

  if (trimmed.length > 20) {
    hasError.value = true;
    nicknameHint.value = '닉네임은 최대 20자까지 입력 가능합니다';
    return;
  }

  // 특수문자 체크 (한글, 영문, 숫자, 공백만 허용)
  const invalidChars = /[^가-힣a-zA-Z0-9\s]/;
  if (invalidChars.test(trimmed)) {
    hasError.value = true;
    nicknameHint.value = '한글, 영문, 숫자만 사용 가능합니다';
    return;
  }

  hasError.value = false;
  nicknameHint.value = '사용 가능한 닉네임입니다';
}

// 닉네임 제출
async function handleSubmit() {
  if (!isValid.value || loading.value) return;

  try {
    loading.value = true;
    hasError.value = false;
    
    const response = await userService.setNickname(nickname.value.trim());

    if (response.isSuccess) {
      emit('complete', nickname.value.trim());
    } else {
      // 응답에서 에러 코드와 메시지 확인
      const errorCode = response.code;
      const errorMessage = response.message || '닉네임 설정에 실패했습니다.';
      
      hasError.value = true;
      
      // 에러 코드 4101은 중복된 닉네임
      if (errorCode === 4101) {
        nicknameHint.value = '중복된 닉네임이 존재합니다';
      } else {
        nicknameHint.value = '서버 에러';
      }
    }
  } catch (error) {
    console.error('❌ 닉네임 설정 실패:', error);
    hasError.value = true;
    
    // axios 에러 응답에서 코드 확인
    const errorCode = error.response?.data?.code;
    const errorMessage = error.response?.data?.message;
    
    if (errorCode === 4101) {
      nicknameHint.value = '중복된 닉네임이 존재합니다';
    } else if (errorMessage) {
      nicknameHint.value = errorMessage;
    } else {
      nicknameHint.value = '서버 에러';
    }
  } finally {
    loading.value = false;
  }
}

// 모달 닫기
function handleClose() {
  if (!loading.value) {
    emit('close');
  }
}

// 모달이 열릴 때 닉네임 초기화
watch(() => props.show, (newValue) => {
  if (newValue) {
    nickname.value = '';
    hasError.value = false;
    nicknameHint.value = '2-20자 이내로 입력해주세요';
    loading.value = false;
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  will-change: opacity;
  animation: fadeIn 0.25s ease-out;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  will-change: transform, opacity;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.modal-header {
  padding: 2.5rem 2rem 2rem;
  text-align: center;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-bottom: 1px solid #e5e7eb;
  position: relative;
  overflow: hidden;
}

.modal-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 200%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
  will-change: transform;
  animation: shimmer 4s ease-in-out infinite;
}

.modal-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e40af;
  margin: 0 0 0.5rem 0;
  position: relative;
  z-index: 1;
}

.modal-header p {
  font-size: 0.875rem;
  color: #3b82f6;
  margin: 0;
  position: relative;
  z-index: 1;
}

.modal-body {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.875rem 1.25rem;
  font-size: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background: #f9fafb;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  transform: translate3d(0, -1px, 0);
  will-change: transform;
}

.form-group input:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.input-hint {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.75rem;
}

.input-hint span:first-child {
  color: #6b7280;
}

.input-hint span.error {
  color: #ef4444;
}

.char-count {
  color: #9ca3af;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.submit-btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, background 0.2s ease-out;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;
  will-change: transform;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  will-change: transform;
  transition: transform 0.6s ease-out;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translate3d(0, -2px, 0);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.submit-btn:hover:not(:disabled)::before {
  transform: translateX(200%);
}

.submit-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

/* GPU 가속 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate3d(0, 20px, 0) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-50%);
  }
  100% {
    transform: translateX(50%);
  }
}

/* 모달 트랜지션 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  opacity: 0;
  transform: translate3d(0, 20px, 0) scale(0.98);
}

/* 반응형 */
@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    margin: 1rem;
  }

  .modal-header {
    padding: 1.5rem 1.5rem 1rem;
  }

  .modal-body {
    padding: 1.5rem;
  }
}
</style>

