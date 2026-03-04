<template>
  <router-view></router-view>
  <!-- 글로벌 알림 토스트: 모든 페이지에서 실시간 알림 표시 -->
  <NotificationToast />
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { tokenRefreshService } from '@/core/services/tokenRefresh.service.js';
import { useTheme } from '@/core/composables/useTheme.js';
import NotificationToast from '@/core/components/NotificationToast.vue';
import { useNotificationStore } from '@/store/modules/notificationStore.js';
import { useFriendStore } from '@/features/friend/stores/friend.store.js';
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
} from '@/core/services/notificationWebSocket.service.js';
import { isFriendSocketConnected } from '@/features/friend/services/friendWebSocket.service.js';

// 테마 초기화
useTheme();

const notificationStore = useNotificationStore();
const friendStore = useFriendStore();

// ─── 알림 + 친구 WebSocket 전역 연결 ─────────────────────────────────────

/**
 * 로그인 상태일 때 모든 WebSocket을 연결하고 초기 데이터를 로드합니다.
 * - 앱 최초 로드 (이미 로그인된 경우)
 * - 다른 탭에서 로그인 감지 시
 * - 5초 인터벌에서 소켓이 끊어진 경우 재연결 시
 */
const connectAll = async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return;

  // 1. 알림 WebSocket 연결 (서비스 내부에서 중복 연결 방지)
  connectNotificationSocket((notification) => {
    notificationStore.addNotification(notification);
  });
  notificationStore.fetchUnreadCount();

  // 2. 친구 WebSocket 연결 (미연결 상태일 때만)
  if (!isFriendSocketConnected()) {
    await friendStore.initSocket();
  }

  // 3. 친구 초기 데이터 로드 (친구 목록 + 받은 요청)
  //    데이터가 아직 없을 때만 로드하여 불필요한 중복 요청 방지
  if (friendStore.friends.length === 0 && !friendStore.isLoading) {
    await friendStore.loadInitialData();
  }
};

/**
 * 로그아웃 / 앱 종료 시 모든 WebSocket을 해제합니다.
 */
const disconnectAll = () => {
  disconnectNotificationSocket();
  notificationStore.reset();

  friendStore.destroySocket();
  friendStore.reset();
};

// ─── 토큰 서비스 ──────────────────────────────────────────────────────────

const checkAndStartTokenService = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (accessToken && refreshToken) {
    if (tokenRefreshService.refreshInterval) return;
    console.log('🚀 토큰 갱신 서비스 시작');
    tokenRefreshService.start();
  } else {
    if (tokenRefreshService.refreshInterval) {
      console.log('🛑 토큰 없음: 갱신 서비스 중지');
      tokenRefreshService.stop();
    }
  }
};

// ─── Storage 이벤트 (다른 탭에서의 로그인/로그아웃 감지) ─────────────────

const handleStorageChange = (e) => {
  if (e.key === 'accessToken' || e.key === 'refreshToken') {
    checkAndStartTokenService();

    if (e.key === 'accessToken') {
      if (e.newValue) {
        // 다른 탭에서 로그인 → 모든 WebSocket 연결
        connectAll();
      } else {
        // 다른 탭에서 로그아웃 → 모든 WebSocket 해제
        disconnectAll();
      }
    }
  }
};

// ─── 주기적 상태 체크 (동일 탭 로그인/소켓 자동 재연결) ─────────────────

const tokenCheckInterval = ref(null);

onMounted(async () => {
  checkAndStartTokenService();

  // 앱 시작 시 모든 WebSocket 연결 시도 (이미 로그인된 경우)
  await connectAll();

  window.addEventListener('storage', handleStorageChange);

  // 5초마다: 토큰 서비스 체크 + 소켓 자동 재연결
  // → 동일 탭에서 로그인하거나 소켓이 끊어진 경우를 자동 복구
  tokenCheckInterval.value = setInterval(async () => {
    checkAndStartTokenService();

    const token = localStorage.getItem('accessToken');
    if (token && !isFriendSocketConnected()) {
      await connectAll();
    }
  }, 5000);
});

onBeforeUnmount(() => {
  tokenRefreshService.stop();
  disconnectAll();
  window.removeEventListener('storage', handleStorageChange);
  if (tokenCheckInterval.value) {
    clearInterval(tokenCheckInterval.value);
  }
});
</script>

<style>
@import url("@/shared/assets/styles/common/reset.css");
@import url("@/shared/assets/styles/index.css");
@import url('https://use.fontawesome.com/releases/v5.15.4/css/all.css');

:root {
  --header-height: 60px;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
