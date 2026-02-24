<template>
  <button type="button" class="share-btn" :disabled="disabled" :aria-label="buttonText" @click="$emit('share')">
    <i class="fas fa-share-nodes"></i>
    <span>{{ disabled ? "링크 생성 중..." : buttonText }}</span>
  </button>
</template>

<script>
export default {
  name: "ShareGameButton",
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    buttonText: {
      type: String,
      default: "게임 공유",
    },
  },
  emits: ["share"],
};
</script>

<style scoped>
.share-btn {
  padding: 12px 18px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.95rem;
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.25);
}

.share-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
}

.share-btn:disabled {
  opacity: 0.75;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
