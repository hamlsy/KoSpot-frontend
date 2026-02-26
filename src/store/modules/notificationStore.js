/**
 * 알림(Notification) Pinia 스토어
 * 알림 상태를 중앙에서 관리합니다.
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
    getNotifications,
    getUnreadCount,
    markAsRead as apiMarkAsRead,
    markAllAsRead as apiMarkAllAsRead,
} from '@/core/api/notification.api.js';

export const useNotificationStore = defineStore('notification', () => {
    // ─── State ───────────────────────────────────────────────
    const notifications = ref([]);
    const unreadCount = ref(0);
    const isLoading = ref(false);
    const isDropdownOpen = ref(false);
    const toastQueue = ref([]); // 실시간 토스트 대기열

    // ─── Getters ─────────────────────────────────────────────
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
     * 알림 목록 조회 (API 또는 더미 데이터)
     */
    async function fetchNotifications() {
        isLoading.value = true;
        try {
            const data = await getNotifications();
            notifications.value = data.notifications || [];
        } catch (error) {
            console.error('알림 목록 조회 실패:', error);
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * 미읽은 알림 수 조회
     */
    async function fetchUnreadCount() {
        try {
            unreadCount.value = await getUnreadCount();
        } catch (error) {
            console.error('미읽은 알림 수 조회 실패:', error);
        }
    }

    /**
     * 개별 알림 읽기
     * @param {number} notificationId
     */
    async function markAsRead(notificationId) {
        // 로컬 상태 즉시 업데이트 (optimistic update)
        const notification = notifications.value.find((n) => n.id === notificationId);
        if (notification && !notification.isRead) {
            notification.isRead = true;
            unreadCount.value = Math.max(0, unreadCount.value - 1);
        }

        try {
            await apiMarkAsRead(notificationId);
        } catch (error) {
            console.error('알림 읽기 실패:', error);
            // 실패 시 롤백
            if (notification) {
                notification.isRead = false;
                unreadCount.value += 1;
            }
        }
    }

    /**
     * 전체 알림 읽기
     */
    async function markAllAsRead() {
        // 로컬 상태 즉시 업데이트
        notifications.value.forEach((n) => {
            n.isRead = true;
        });
        const prevCount = unreadCount.value;
        unreadCount.value = 0;

        try {
            await apiMarkAllAsRead();
        } catch (error) {
            console.error('전체 읽기 실패:', error);
            // 실패 시 롤백
            notifications.value.forEach((n, idx) => {
                // 이전 isRead 복원 불가 (optimistic update의 trade-off), 재조회로 복원
            });
            unreadCount.value = prevCount;
            await fetchNotifications();
            await fetchUnreadCount();
        }
    }

    /**
     * WebSocket으로 실시간 알림 수신 시 호출
     * @param {Object} notification - 새 알림 객체
     */
    function addNotification(notification) {
        // 중복 방지
        const exists = notifications.value.some((n) => n.id === notification.id);
        if (!exists) {
            notifications.value.unshift({ ...notification, isRead: false });
        }
        unreadCount.value += 1;

        // 토스트 대기열에 추가
        toastQueue.value.push({ ...notification, toastId: Date.now() + Math.random() });
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
        // 드롭다운 열릴 때 알림 목록 새로고침
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
     */
    async function initialize() {
        await fetchUnreadCount();
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
