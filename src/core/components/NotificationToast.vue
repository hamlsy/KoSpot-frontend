<template>
  <Teleport to="body">
    <div class="notif-toast-container" aria-live="polite">
      <TransitionGroup name="notif-toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.toastId"
          class="notif-toast"
          :class="[`notif-toast--${getTypeCssClass(toast.type)}`, { 'notif-toast--show': toast.show }]"
          role="alert"
        >
          <!-- 타입 아이콘 -->
          <div class="notif-toast__icon" :style="{ color: getNotificationMeta(toast.type).color }">
            <i :class="getNotificationMeta(toast.type).icon"></i>
          </div>

          <!-- 내용 -->
          <div class="notif-toast__content">
            <div class="notif-toast__label">{{ getNotificationMeta(toast.type).label }}</div>
            <div class="notif-toast__title">{{ toast.title }}</div>
            <div v-if="toast.message" class="notif-toast__message">{{ toast.message }}</div>
          </div>

          <!-- 닫기 버튼 -->
          <button class="notif-toast__close" @click="removeToast(toast.toastId)" aria-label="알림 닫기">
            <i class="fas fa-times"></i>
          </button>

          <!-- 진행 바 -->
          <div
            class="notif-toast__progress"
            :style="{ backgroundColor: getNotificationMeta(toast.type).color }"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { useNotificationStore } from '@/store/modules/notificationStore.js';
import { getNotificationMeta } from '@/core/constants/notificationTypes.js';

const store = useNotificationStore();
const toasts = ref([]);
const timers = new Map();

const TOAST_DURATION = 5000; // 5초

/**
 * 타입 → CSS 클래스 변환
 */
const getTypeCssClass = (type) => {
  return (type || 'default').toLowerCase().replace(/_/g, '-');
};

/**
 * 토스트 추가
 */
const addToast = (notification) => {
  const id = notification.toastId;
  const toast = { ...notification, show: false };
  toasts.value.push(toast);

  // 다음 tick에 show 클래스 추가 (애니메이션 트리거)
  setTimeout(() => {
    const t = toasts.value.find((t) => t.toastId === id);
    if (t) t.show = true;
  }, 50);

  // 자동 제거 타이머
  const timer = setTimeout(() => {
    removeToast(id);
  }, TOAST_DURATION);
  timers.set(id, timer);
};

/**
 * 토스트 제거
 */
const removeToast = (toastId) => {
  const t = toasts.value.find((t) => t.toastId === toastId);
  if (t) t.show = false;

  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.toastId !== toastId);
    store.removeToast(toastId);
  }, 350);

  if (timers.has(toastId)) {
    clearTimeout(timers.get(toastId));
    timers.delete(toastId);
  }
};

// 스토어의 toastQueue 감시 → 새 알림이 들어오면 토스트 표시
watch(
  () => store.toastQueue,
  (queue) => {
    queue.forEach((notification) => {
      const alreadyShowing = toasts.value.some((t) => t.toastId === notification.toastId);
      if (!alreadyShowing) {
        addToast(notification);
      }
    });
  },
  { deep: true }
);

onUnmounted(() => {
  timers.forEach((timer) => clearTimeout(timer));
  timers.clear();
});
</script>

<style scoped>
.notif-toast-container {
  position: fixed;
  top: 72px; /* 헤더 아래 */
  right: 1rem;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 380px;
  pointer-events: none;
}

.notif-toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: var(--color-surface, #ffffff);
  border-radius: 12px;
  padding: 1rem 1rem 1.25rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 10px 30px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--color-border-light, #e5e7eb);
  pointer-events: auto;
  transform: translateX(calc(100% + 2rem));
  opacity: 0;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
  min-width: 280px;
  overflow: hidden;
}

.notif-toast--show {
  transform: translateX(0);
  opacity: 1;
}

/* 진행 바 */
.notif-toast__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  opacity: 0.5;
  border-radius: 0 0 12px 12px;
  animation: progress-shrink 5s linear forwards;
}

@keyframes progress-shrink {
  from { width: 100%; }
  to { width: 0%; }
}

/* 아이콘 */
.notif-toast__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

/* 내용 */
.notif-toast__content {
  flex: 1;
  min-width: 0;
}

.notif-toast__label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary, #6b7280);
  margin-bottom: 0.2rem;
}

.notif-toast__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
  line-height: 1.35;
  margin-bottom: 0.2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notif-toast__message {
  font-size: 0.78rem;
  color: var(--color-text-secondary, #6b7280);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 닫기 버튼 */
.notif-toast__close {
  background: none;
  border: none;
  color: var(--color-text-muted, #9ca3af);
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  font-size: 0.7rem;
  transition: all 0.2s ease;
}

.notif-toast__close:hover {
  background: var(--color-surface-hover, #f3f4f6);
  color: var(--color-text-primary, #111827);
}

/* TransitionGroup 애니메이션 */
.notif-toast-enter-active {
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

.notif-toast-leave-active {
  transition: transform 0.3s ease, opacity 0.25s ease;
  position: absolute;
  right: 0;
}

.notif-toast-enter-from {
  transform: translateX(calc(100% + 2rem));
  opacity: 0;
}

.notif-toast-leave-to {
  transform: translateX(calc(100% + 2rem));
  opacity: 0;
}

.notif-toast-move {
  transition: transform 0.3s ease;
}

/* 아이콘 영역 - 타입별 배경 */
.notif-toast--notice .notif-toast__icon { background: rgba(59, 130, 246, 0.1); }
.notif-toast--system .notif-toast__icon { background: rgba(99, 102, 241, 0.1); }
.notif-toast--friend-request .notif-toast__icon { background: rgba(16, 185, 129, 0.1); }

/* 모바일 반응형 */
@media (max-width: 768px) {
  .notif-toast-container {
    top: 64px;
    right: 0.5rem;
    left: 0.5rem;
    max-width: none;
  }

  .notif-toast {
    min-width: 0;
  }
}
</style>
