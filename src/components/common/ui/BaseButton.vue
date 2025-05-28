<template>
  <button 
    :class="[
      'base-button', 
      `variant-${variant}`, 
      { 'full-width': fullWidth },
      { 'is-loading': loading },
      { 'is-disabled': disabled },
      size
    ]" 
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="spinner"></span>
    <slot></slot>
  </button>
</template>

<script setup>
// Vue 3 Composition API 방식으로 구현된 기본 버튼 컴포넌트
// 다양한 스타일 옵션을 제공합니다.

// 이벤트 정의
defineEmits(['click']);

// props 정의
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'outline', 'danger', 'success', 'text'].includes(value)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;
  position: relative;
  overflow: hidden;
}

/* 사이즈 */
.small {
  padding: 6px 12px;
  font-size: 0.875rem;
}

.medium {
  padding: 10px 16px;
  font-size: 1rem;
}

.large {
  padding: 12px 20px;
  font-size: 1.125rem;
}

/* 변형 */
.variant-primary {
  background-color: #4a6cf7;
  color: white;
}

.variant-primary:hover:not(.is-disabled) {
  background-color: #3a5bd9;
}

.variant-secondary {
  background-color: #f3f4f6;
  color: #1f2937;
}

.variant-secondary:hover:not(.is-disabled) {
  background-color: #e5e7eb;
}

.variant-outline {
  background-color: transparent;
  color: #4a6cf7;
  border: 1px solid #4a6cf7;
}

.variant-outline:hover:not(.is-disabled) {
  background-color: rgba(74, 108, 247, 0.05);
}

.variant-danger {
  background-color: #ef4444;
  color: white;
}

.variant-danger:hover:not(.is-disabled) {
  background-color: #dc2626;
}

.variant-success {
  background-color: #10b981;
  color: white;
}

.variant-success:hover:not(.is-disabled) {
  background-color: #059669;
}

.variant-text {
  background-color: transparent;
  color: #4a6cf7;
  padding-left: 0;
  padding-right: 0;
}

.variant-text:hover:not(.is-disabled) {
  color: #3a5bd9;
  text-decoration: underline;
}

/* 상태 */
.full-width {
  width: 100%;
}

.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.is-loading {
  color: transparent;
}

.spinner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
