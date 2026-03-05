<template>
  <button
    class="friend-toggle-btn"
    :class="{ active: isOpen, 'has-notification': hasNotification }"
    @click="$emit('toggle')"
    aria-label="친구 목록 열기"
  >
    <!-- 알림 뱃지 -->
    <span v-if="hasNotification" class="notification-badge"></span>

    <!-- 아이콘 -->
    <svg class="friend-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- 사람 실루엣 두 개 -->
      <path
        d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
        class="icon-path"
      />
    </svg>
  </button>
</template>

<script>
export default {
  name: 'FriendToggleButton',
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
    hasNotification: {
      type: Boolean,
      default: false,
    },
    notificationCount: {
      type: Number,
      default: 0,
    },
  },
  emits: ['toggle'],
}
</script>

<style scoped>
.friend-toggle-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  /* background: var(--color-surface, #ffffff); */
  background: var(--color-surface-hover);
  border: 1.5px solid var(--color-border, #e5e7eb);
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
  outline: none;
  /* box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08); */
}

.friend-toggle-btn:hover {
  background: var(--color-surface-hover, #f3f4f6);
  border-color: var(--color-primary, #667eea);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.18);
  transform: scale(1.08);
}

.friend-toggle-btn:hover .icon-path {
  fill: var(--color-primary, #667eea);
}

.friend-toggle-btn.active {
  background: var(--color-primary, #667eea);
  border-color: var(--color-primary, #667eea);
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.35);
}

.friend-toggle-btn.active .icon-path {
  fill: #ffffff;
}

.friend-icon {
  width: 20px;
  height: 20px;
}

.icon-path {
  fill: var(--color-text-secondary, #6b7280);
  transition: fill 0.2s ease;
}

/* 알림 뱃지 */
.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  background: var(--color-error, #ef4444);
  border-radius: 50%;
  border: 2px solid var(--color-surface, #ffffff);
  z-index: 1;
  animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
</style>
