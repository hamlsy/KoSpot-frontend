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

    <!-- 활성화 언더라인 -->
    <span class="active-line"></span>
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
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600&display=swap');

.friend-toggle-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;
  outline: none;
}

.friend-toggle-btn:hover {
  background: var(--color-surface-hover);
  transform: scale(1.05);
}

.friend-toggle-btn:hover .icon-path {
  fill: var(--color-primary);
}

.friend-toggle-btn.active {
  background: var(--color-surface-hover);
}

.friend-toggle-btn.active .icon-path {
  fill: var(--color-primary);
}

.friend-toggle-btn.active .active-line {
  width: 60%;
  opacity: 1;
}

.friend-icon {
  width: 24px;
  height: 24px;
}

.icon-path {
  fill: var(--color-text-secondary);
  transition: fill 0.2s ease, filter 0.2s ease;
}

/* 활성화 언더라인 */
.active-line {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: var(--color-primary);
  border-radius: 1px;
  opacity: 0;
  transition: width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
}

/* 알림 뱃지 */
.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 12px;
  height: 12px;
  background: var(--color-error);
  border-radius: 50%;
  border: 2px solid var(--color-surface);
  z-index: 1;
}
</style>
