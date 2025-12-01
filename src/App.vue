<template>
  <router-view></router-view>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { tokenRefreshService } from '@/core/services/tokenRefresh.service.js';
import { useTheme } from '@/core/composables/useTheme.js';

// 테마 초기화
useTheme();

// 토큰 체크 및 서비스 시작
const checkAndStartTokenService = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (accessToken && refreshToken) {
    // 이미 실행 중이면 아무것도 하지 않음 (중복 방지)
    if (tokenRefreshService.refreshInterval) {
      // 이미 실행 중이므로 로그 없이 그냥 return
      return;
    }
    
    console.log('🚀 토큰 갱신 서비스 시작');
    tokenRefreshService.start();
  } else {
    // 토큰이 없으면 중지
    if (tokenRefreshService.refreshInterval) {
      console.log('🛑 토큰 없음: 갱신 서비스 중지');
      tokenRefreshService.stop();
    }
  }
};

// Storage 이벤트 리스너 (다른 탭에서의 변경 감지)
const handleStorageChange = (e) => {
  if (e.key === 'accessToken' || e.key === 'refreshToken') {
    console.log('📦 Storage 변경 감지:', e.key);
    checkAndStartTokenService();
  }
};

// 주기적으로 토큰 상태 체크 (동일 탭에서의 변경 감지)
const tokenCheckInterval = ref(null);

onMounted(() => {
  // 앱 시작 시 토큰 서비스 체크 및 시작
  checkAndStartTokenService();
  
  // Storage 이벤트 리스너 등록 (다른 탭 감지)
  window.addEventListener('storage', handleStorageChange);
  
  // 5초마다 토큰 상태 체크 (동일 탭에서의 로그인/로그아웃 감지)
  tokenCheckInterval.value = setInterval(() => {
    checkAndStartTokenService();
  }, 5000);
});

onBeforeUnmount(() => {
  // 앱 종료 시 토큰 갱신 서비스 중지
  tokenRefreshService.stop();
  
  // 이벤트 리스너 제거
  window.removeEventListener('storage', handleStorageChange);
  
  // 인터벌 정리
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
