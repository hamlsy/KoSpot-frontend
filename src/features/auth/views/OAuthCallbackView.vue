<template>
  <div class="oauth-callback-container">
    <div class="loading-content">
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <h2 class="loading-title">로그인 처리 중...</h2>
      <p class="loading-subtitle">잠시만 기다려주세요</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  // 로그인 성공 후 메인 페이지로 리다이렉트 (새로고침)
  // 백엔드에서 이미 토큰을 설정했으므로 바로 리다이렉트
  setTimeout(() => {
    window.location.href = '/main';
  }, 1000); // 1초 후 리다이렉트 (로딩 애니메이션을 보여주기 위해)
});
</script>

<style scoped>
.oauth-callback-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, #ffffff, #f3f3f3);
  padding: 2rem;
}

.loading-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
}

.spinner {
  width: 80px;
  height: 80px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  animation: fadeIn 0.5s ease-out;
}

.loading-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
  animation: fadeIn 0.7s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .loading-title {
    font-size: 1.25rem;
  }
  
  .loading-subtitle {
    font-size: 0.9rem;
  }
  
  .loading-spinner {
    width: 60px;
    height: 60px;
  }
  
  .spinner {
    width: 60px;
    height: 60px;
    border-width: 3px;
  }
}
</style>

