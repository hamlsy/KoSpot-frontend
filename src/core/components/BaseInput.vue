<template>
  <div class="base-input-wrapper" :class="{ 'has-error': error }">
    <label v-if="label" :for="id" class="input-label">{{ label }}</label>
    <div class="input-container">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :class="[
          'base-input',
          { 'has-icon': icon },
          { 'is-disabled': disabled },
          size
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />
      <i v-if="icon" :class="['input-icon', icon]"></i>
    </div>
    <p v-if="error" class="error-message">{{ error }}</p>
    <p v-if="hint && !error" class="hint-text">{{ hint }}</p>
  </div>
</template>

<script setup>
// Vue 3 Composition API 방식으로 구현된 기본 입력 컴포넌트
import { computed } from 'vue';

// 이벤트 정의
defineEmits(['update:modelValue', 'blur', 'focus']);

// props 정의
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  id: {
    type: String,
    default: () => `input-${Math.random().toString(36).substring(2, 9)}`
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  icon: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.base-input-wrapper {
  margin-bottom: 16px;
  width: 100%;
}

.input-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  color: #374151;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.base-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background-color: white;
  transition: all 0.2s ease;
  outline: none;
  color: #1f2937;
}

.base-input:focus {
  border-color: #4a6cf7;
  box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.1);
}

.base-input::placeholder {
  color: #9ca3af;
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

/* 아이콘 */
.has-icon {
  padding-left: 40px;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: #6b7280;
  font-size: 16px;
}

/* 상태 */
.is-disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}

.has-error .base-input {
  border-color: #ef4444;
}

.has-error .base-input:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-message {
  margin-top: 4px;
  color: #ef4444;
  font-size: 0.75rem;
}

.hint-text {
  margin-top: 4px;
  color: #6b7280;
  font-size: 0.75rem;
}
</style>
