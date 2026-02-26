<template>
  <div class="notif-dropdown" v-if="isOpen" ref="dropdownRef">
    <!-- 헤더 -->
    <div class="notif-dropdown__header">
      <h3 class="notif-dropdown__title">
        <i class="fas fa-bell"></i>
        알림
        <span v-if="store.unreadCount > 0" class="notif-dropdown__unread-chip">
          {{ store.unreadCount }}
        </span>
      </h3>
      <button
        v-if="store.unreadNotifications.length > 0"
        class="notif-dropdown__read-all"
        @click="handleMarkAllAsRead"
        :disabled="store.isLoading"
      >
        <i class="fas fa-check-double"></i>
        전체 읽기
      </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="store.isLoading" class="notif-dropdown__loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>불러오는 중...</span>
    </div>

    <!-- 알림 목록 -->
    <div v-else-if="store.sortedNotifications.length > 0" class="notif-dropdown__list" ref="listRef">
      <div
        v-for="notification in store.sortedNotifications"
        :key="notification.notificationId"
        class="notif-item"
        :class="{ 'notif-item--unread': !notification.isRead }"
        @click="handleNotificationClick(notification)"
      >
        <!-- 타입 아이콘 -->
        <div
          class="notif-item__icon"
          :style="{
            color: getMeta(notification.type).color,
            backgroundColor: getMeta(notification.type).bgColor,
          }"
        >
          <i :class="getMeta(notification.type).icon"></i>
        </div>

        <!-- 내용 -->
        <div class="notif-item__body">
          <div class="notif-item__meta">
            <span class="notif-item__type-label">{{ getMeta(notification.type).label }}</span>
            <span class="notif-item__time">{{ formatTime(notification.createdAt) }}</span>
          </div>
          <div class="notif-item__title">{{ notification.title }}</div>
          <div v-if="notification.content" class="notif-item__message">{{ notification.content }}</div>
        </div>

        <!-- 미읽음 점 -->
        <div v-if="!notification.isRead" class="notif-item__dot"></div>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="notif-dropdown__empty">
      <div class="notif-dropdown__empty-icon">
        <i class="fas fa-bell-slash"></i>
      </div>
      <p class="notif-dropdown__empty-text">알림이 없습니다</p>
      <p class="notif-dropdown__empty-sub">새로운 알림이 오면 여기에 표시됩니다</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/store/modules/notificationStore.js';
import { getNotificationMeta } from '@/core/constants/notificationTypes.js';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);

const store = useNotificationStore();
const router = useRouter();
const dropdownRef = ref(null);
const listRef = ref(null);

// 메타데이터 반환 (템플릿에서 사용하기 편하게 alias)
const getMeta = getNotificationMeta;

/**
 * 시간 포맷팅 (한국어 상대 시간)
 * @param {string} dateStr
 * @returns {string}
 */
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

/**
 * 알림 클릭 → 읽기 처리 + 링크 이동
 */
const handleNotificationClick = async (notification) => {
  if (!notification.isRead) {
    await store.markAsRead(notification.notificationId);
  }

  // NOTICE 타입 → noticeId로 공지사항 상세 이동
  if (notification.type === 'NOTICE' && notification.sourceId) {
    emit('close');
    router.push(`/noticeDetail/${notification.sourceId}`);
    return;
  }

  // 직접 link 필드가 있는 경우 (추후 확장용)
  if (notification.link) {
    emit('close');
    router.push(notification.link);
  }
};

/**
 * 전체 읽기
 */
const handleMarkAllAsRead = async () => {
  await store.markAllAsRead();
};

/**
 * 외부 클릭 감지 → 드롭다운 닫기
 */
const handleOutsideClick = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    // 벨 아이콘 버튼은 NavigationBar에서 처리하므로 여기선 아무것도 안 함
    // (버튼과 드롭다운 둘 다 클릭 감지 → 토글 로직은 부모에서)
  }
};

onMounted(() => {
  document.addEventListener('click', handleOutsideClick, true);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick, true);
});
</script>

<style scoped>
/* ── 드롭다운 컨테이너 ─────────────────────────────── */
.notif-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 380px;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 16px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.08),
    0 20px 50px rgba(0, 0, 0, 0.15);
  z-index: 9000;
  overflow: hidden;
  animation: notif-dropdown-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: top right;
}

@keyframes notif-dropdown-in {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* ── 헤더 ─────────────────────────────────────────── */
.notif-dropdown__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border-light, #f3f4f6);
  background: var(--color-surface, #ffffff);
}

.notif-dropdown__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary, #111827);
  margin: 0;
}

.notif-dropdown__title i {
  color: var(--color-primary, #33fbe8);
  font-size: 0.95rem;
}

.notif-dropdown__unread-chip {
  background: #ef4444;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 99px;
  min-width: 18px;
  text-align: center;
}

.notif-dropdown__read-all {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  color: var(--color-primary, #33fbe8);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.35rem 0.65rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.notif-dropdown__read-all:hover {
  background: rgba(51, 251, 232, 0.1);
}

.notif-dropdown__read-all i {
  font-size: 0.8rem;
}

/* ── 로딩 ─────────────────────────────────────────── */
.notif-dropdown__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.875rem;
}

/* ── 알림 목록 (스크롤 영역) ─────────────────────── */
.notif-dropdown__list {
  max-height: 420px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.notif-dropdown__list::-webkit-scrollbar {
  width: 4px;
}

.notif-dropdown__list::-webkit-scrollbar-track {
  background: transparent;
}

.notif-dropdown__list::-webkit-scrollbar-thumb {
  background: var(--color-border, #e5e7eb);
  border-radius: 2px;
}

/* ── 알림 아이템 ───────────────────────────────────── */
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 0.875rem 1.25rem;
  cursor: pointer;
  transition: background 0.15s ease;
  position: relative;
  border-bottom: 1px solid var(--color-border-light, #f9fafb);
}

.notif-item:last-child {
  border-bottom: none;
}

.notif-item:hover {
  background: var(--color-surface-hover, #f9fafb);
}

.notif-item--unread {
  background: rgba(51, 251, 232, 0.04);
}

.notif-item--unread:hover {
  background: rgba(51, 251, 232, 0.08);
}

/* 타입 아이콘 */
.notif-item__icon {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  margin-top: 1px;
}

/* 내용 */
.notif-item__body {
  flex: 1;
  min-width: 0;
}

.notif-item__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.notif-item__type-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--color-text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.notif-item__time {
  font-size: 0.68rem;
  color: var(--color-text-muted, #9ca3af);
}

.notif-item__title {
  font-size: 0.855rem;
  font-weight: 600;
  color: var(--color-text-primary, #111827);
  line-height: 1.35;
  margin-bottom: 0.2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notif-item--unread .notif-item__title {
  font-weight: 700;
}

.notif-item__message {
  font-size: 0.78rem;
  color: var(--color-text-secondary, #6b7280);
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 미읽음 점 */
.notif-item__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  margin-top: 6px;
  animation: dot-pulse 2s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.8); }
}

/* ── 빈 상태 ─────────────────────────────────────── */
.notif-dropdown__empty {
  padding: 2.5rem 1.5rem;
  text-align: center;
}

.notif-dropdown__empty-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--color-surface-hover, #f9fafb);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.notif-dropdown__empty-icon i {
  font-size: 1.5rem;
  color: var(--color-text-muted, #9ca3af);
}

.notif-dropdown__empty-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary, #6b7280);
  margin: 0 0 0.35rem;
}

.notif-dropdown__empty-sub {
  font-size: 0.78rem;
  color: var(--color-text-muted, #9ca3af);
  margin: 0;
}

/* ── 모바일 반응형 ─────────────────────────────────── */
@media (max-width: 768px) {
  .notif-dropdown {
    position: fixed;
    top: 60px;
    left: 8px;
    right: 8px;
    width: auto;
    border-radius: 16px;
  }

  .notif-dropdown__list {
    max-height: 60vh;
  }
}
</style>
