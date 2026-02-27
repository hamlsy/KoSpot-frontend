/**
 * 알림(Notification) Pinia 스토어
 * 백엔드 명세 기준: notificationId, content 필드명 사용
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import notificationService from '@/core/api/notification.api.js';

export const useNotificationStore = defineStore('notification', () => {
    // ─── State ───────────────────────────────────────────────
    const notifications = ref([]);
    const unreadCount = ref(0);
    const isLoading = ref(false);
    const isDropdownOpen = ref(false);
    const toastQueue = ref([]);

    // ─── Getters ─────────────────────────────────────────────
    /** 최신순 정렬 (서버도 최신순이지만 클라이언트 prepend 반영) */
    const sortedNotifications = computed(() =>
        [...notifications.value].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )
    );

    const unreadNotifications = computed(() =>
        notifications.value.filter((n) => !n.isRead)
    );

    // ─── Actions ─────────────────────────────────────────────

    /**
     * 알림 목록 조회 (GET /notifications)
     */
    async function fetchNotifications(params = {}) {
        isLoading.value = true;
        try {
            const data = await notificationService.getNotifications({ page: 0, size: 20, ...params });
            notifications.value = data ?? [];
        } catch (error) {
            console.error('알림 목록 조회 실패:', error);
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * 미읽음 알림 수 조회 (GET /notifications/unread-count)
     */
    async function fetchUnreadCount() {
        try {
            unreadCount.value = await notificationService.getUnreadCount();
        } catch (error) {
            console.error('미읽음 알림 수 조회 실패:', error);
        }
    }

    /**
     * 단건 읽음 처리 (PATCH /notifications/{notificationId}/read)
     * @param {number} notificationId
     */
    async function markAsRead(notificationId) {
        // Optimistic update
        const notification = notifications.value.find(
            (n) => n.notificationId === notificationId
        );
        if (notification && !notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date().toISOString();
            unreadCount.value = Math.max(0, unreadCount.value - 1);
        }

        try {
            await notificationService.markAsRead(notificationId);
        } catch (error) {
            console.error('알림 읽기 실패 - 롤백:', error);
            if (notification) {
                notification.isRead = false;
                notification.readAt = null;
                unreadCount.value += 1;
            }
        }
    }

    /**
     * 전체 읽음 처리 (PATCH /notifications/read-all)
     */
    async function markAllAsRead() {
        const prevUnreadCount = unreadCount.value;
        const prevStates = notifications.value.map((n) => ({
            id: n.notificationId,
            isRead: n.isRead,
            readAt: n.readAt,
        }));

        // Optimistic update
        const now = new Date().toISOString();
        notifications.value.forEach((n) => {
            n.isRead = true;
            n.readAt = now;
        });
        unreadCount.value = 0;

        try {
            await notificationService.markAllAsRead();
        } catch (error) {
            console.error('전체 읽음 처리 실패 - 롤백:', error);
            prevStates.forEach(({ id, isRead, readAt }) => {
                const n = notifications.value.find((n) => n.notificationId === id);
                if (n) {
                    n.isRead = isRead;
                    n.readAt = readAt;
                }
            });
            unreadCount.value = prevUnreadCount;
        }
    }

    /**
     * WebSocket 실시간 알림 수신 시 호출
     * payload 스키마: { notificationId, type, title, content, payloadJson, sourceId, isRead, createdAt }
     * @param {Object} notification
     */
    function addNotification(notification) {
        if (!notification) return;

        // 중복 방지 (notificationId가 있는 경우만)
        if (notification.notificationId) {
            const exists = notifications.value.some(
                (n) => n.notificationId === notification.notificationId
            );
            if (exists) return;
        }

        // 리스트 맨 앞에 추가
        notifications.value.unshift({ ...notification, isRead: false });
        unreadCount.value += 1;

        // 토스트 대기열에 추가
        toastQueue.value.push({
            ...notification,
            toastId: Date.now() + Math.random(),
        });
    }

    /**
     * 토스트 제거
     * @param {number} toastId
     */
    function removeToast(toastId) {
        toastQueue.value = toastQueue.value.filter((t) => t.toastId !== toastId);
    }

    /**
     * 드롭다운 토글
     */
    function toggleDropdown() {
        isDropdownOpen.value = !isDropdownOpen.value;
        if (isDropdownOpen.value) {
            fetchNotifications();
        }
    }

    /**
     * 드롭다운 닫기
     */
    function closeDropdown() {
        isDropdownOpen.value = false;
    }

    /**
     * 스토어 초기화 (로그인 후 호출)
     * 권장 전략: 진입 시 unread-count + 목록 동시 조회
     */
    async function initialize() {
        await Promise.all([fetchUnreadCount(), fetchNotifications()]);
    }

    /**
     * 스토어 리셋 (로그아웃 후 호출)
     */
    function reset() {
        notifications.value = [];
        unreadCount.value = 0;
        isLoading.value = false;
        isDropdownOpen.value = false;
        toastQueue.value = [];
    }

    return {
        // State
        notifications,
        unreadCount,
        isLoading,
        isDropdownOpen,
        toastQueue,
        // Getters
        sortedNotifications,
        unreadNotifications,
        // Actions
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        removeToast,
        toggleDropdown,
        closeDropdown,
        initialize,
        reset,
    };
});
