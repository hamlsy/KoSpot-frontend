<template>
  <div class="comment-item">
    <div class="avatar">
      <img v-if="comment.markerImageUrl" :src="comment.markerImageUrl" :alt="comment.nickname" @error="onImgError" />
      <i v-else class="fas fa-user avatar-fallback"></i>
    </div>
    <div class="body">
      <div class="header">
        <span class="nickname">{{ comment.nickname }}</span>
        <span class="time">{{ relativeTime }}</span>
        <button v-if="canDelete" class="delete-btn" title="삭제" @click.stop="$emit('delete', comment.commentId)">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <p class="content">{{ comment.content }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatRelativeTime } from '@/shared/utils/formatRelativeTime'

const props = defineProps({
  comment: { type: Object, required: true },
  canDelete: { type: Boolean, default: false },
})
defineEmits(['delete'])

const relativeTime = computed(() => formatRelativeTime(props.comment.createdDate))

function onImgError(e) {
  e.target.style.display = 'none'
}
</script>

<style scoped>
.comment-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.comment-item:last-child {
  border-bottom: none;
}

.avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e8f0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.avatar-fallback {
  font-size: 0.85rem;
  color: #94a3b8;
}

.body {
  flex: 1;
  min-width: 0;
}

.header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.nickname {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e293b;
}

.time {
  font-size: 0.72rem;
  color: #94a3b8;
  flex: 1;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.1rem 0.3rem;
  color: #cbd5e1;
  font-size: 0.7rem;
  border-radius: 4px;
  transition: color 0.15s ease;
  line-height: 1;
}

.delete-btn:hover {
  color: #ef4444;
}

.content {
  margin: 0;
  font-size: 0.85rem;
  color: #334155;
  line-height: 1.5;
  word-break: break-word;
}
</style>
