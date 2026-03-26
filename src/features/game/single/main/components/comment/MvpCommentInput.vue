<template>
  <div class="input-wrapper">
    <textarea
      v-model="text"
      class="textarea"
      :disabled="!isLoggedIn || isSubmitting"
      placeholder="댓글을 입력하세요... (최대 300자)"
      maxlength="300"
      rows="2"
      @keydown.ctrl.enter.prevent="handleSubmit"
    ></textarea>
    <button
      class="submit-btn"
      :disabled="!isLoggedIn || isSubmitting || !text.trim()"
      @click.stop="handleSubmit"
    >
      <span v-if="isSubmitting" class="spinner-wrapper"><i class="fas fa-spinner fa-spin"></i></span>
      <span v-else>등록</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isLoggedIn: { type: Boolean, default: false },
  isSubmitting: { type: Boolean, default: false },
})
const emit = defineEmits(['submit'])

const text = ref('')

function handleSubmit() {
  if (!props.isLoggedIn || props.isSubmitting || !text.value.trim()) return
  emit('submit', text.value.trim())
  text.value = ''
}
</script>

<style scoped>
.input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  padding-top: 0.75rem;
}

.textarea {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #1e293b;
  background: #f8fafc;
  resize: none;
  outline: none;
  transition: border-color 0.2s ease;
  font-family: inherit;
  line-height: 1.5;
}

.textarea:focus {
  border-color: #4cc9cf;
  background: #ffffff;
}

.textarea:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.submit-btn {
  flex-shrink: 0;
  padding: 0.55rem 1rem;
  background: #4cc9cf;
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease;
  min-width: 52px;
  text-align: center;
}

.submit-btn:hover:not(:disabled) {
  background: #38b2b8;
}

.submit-btn:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
}
</style>
