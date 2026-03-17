<template>
  <router-view></router-view>
  <!-- 글로벌 알림 토스트: 모든 페이지에서 실시간 알림 표시 -->
  <NotificationToast />
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { tokenRefreshService } from '@/core/services/tokenRefresh.service.js';
import { useTheme } from '@/core/composables/useTheme.js';
import NotificationToast from '@/core/components/NotificationToast.vue';
import { connectAll, disconnectAll } from '@/core/services/appWebSocket.service.js';
import { authStorage } from '@/core/auth/authStorage.service.js';

// 테마 초기화
useTheme();

// ─── 토큰 서비스 ──────────────────────────────────────────────────────────

const checkAndStartTokenService = () => {
  const accessToken = authStorage.getAccessToken();
  const refreshToken = authStorage.getRefreshToken();

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
        // 다른 탭에서 로그인 → WebSocket 연결
        connectAll();
      } else {
        // 다른 탭에서 로그아웃 → WebSocket 해제
        disconnectAll();
      }
    }
  }
};

// ─── 라이프사이클 ──────────────────────────────────────────────────────────

onMounted(async () => {
  checkAndStartTokenService();

  // 앱 최초 마운트 시 한 번만 연결 (새로고침 또는 직접 URL 접근 시)
  // 이후 재연결은 STOMP 라이브러리 내장 reconnectDelay(5초)가 자동 처리
  await connectAll();

  window.addEventListener('storage', handleStorageChange);
});

onBeforeUnmount(() => {
  tokenRefreshService.stop();
  disconnectAll();
  window.removeEventListener('storage', handleStorageChange);
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
