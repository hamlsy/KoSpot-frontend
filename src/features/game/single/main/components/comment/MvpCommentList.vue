<template>
  <div class="list-container">
    <!-- 초기 로딩 -->
    <div v-if="isLoading && !comments.length" class="list-loading">
      <div class="loading-ring" />
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="!comments.length" class="list-empty">
      <i class="fas fa-comment-slash empty-icon"></i>
      <span>첫 번째 댓글을 남겨보세요!</span>
    </div>

    <!-- 댓글 목록 -->
    <template v-else>
      <MvpCommentItem
        v-for="comment in comments"
        :key="comment.commentId"
        :comment="comment"
        :can-delete="canDelete(comment)"
        @delete="$emit('delete', $event)"
      />
      <button
        v-if="hasNext"
        class="load-more-btn"
        :disabled="isLoading"
        @click.stop="$emit('load-more')"
      >
        <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
        <span v-else>더 보기</span>
      </button>
    </template>
  </div>
</template>

<script setup>
import MvpCommentItem from './MvpCommentItem.vue'

const props = defineProps({
  comments: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  hasNext: { type: Boolean, default: false },
  currentNickname: { type: String, default: null },
})
defineEmits(['delete', 'load-more'])

function canDelete(comment) {
  return props.currentNickname !== null && comment.nickname === props.currentNickname
}
</script>

<style scoped>
.list-container {
  min-height: 48px;
}

.list-loading,
.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem 0;
  color: #94a3b8;
  font-size: 0.85rem;
}

.loading-ring {
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-top-color: #4cc9cf;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-icon {
  font-size: 1.2rem;
  color: #cbd5e1;
}

.load-more-btn {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: none;
  border: 1px dashed #e2e8f0;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.load-more-btn:disabled {
  cursor: not-allowed;
  color: #94a3b8;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
