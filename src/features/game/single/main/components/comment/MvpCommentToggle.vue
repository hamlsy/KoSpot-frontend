<template>
  <button class="toggle-btn" @click.stop="$emit('toggle')">
    <i class="fas fa-comment-dots toggle-icon"></i>
    <span class="toggle-label">댓글 {{ commentCount }}개</span>
    <i class="fas toggle-chevron" :class="isOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
  </button>
</template>

<script setup>
defineProps({
  commentCount: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: false },
})
defineEmits(['toggle'])
</script>

<style scoped>
.toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 20px 20px;
  cursor: pointer;
  transition: background 0.2s ease;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.toggle-btn:hover {
  background: #f1f5f9;
}

.toggle-icon {
  color: #4cc9cf;
  font-size: 0.9rem;
}

.toggle-label {
  flex: 1;
  text-align: left;
}

.toggle-chevron {
  font-size: 0.7rem;
  color: #94a3b8;
  transition: transform 0.2s ease;
}
</style>
