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
import { useRoute, useRouter } from 'vue-router';
import apiClient from '@/core/api/apiClient.js';
import { API_ENDPOINTS } from '@/core/api/endPoint.js';
import { tokenRefreshService } from '@/core/services/tokenRefresh.service.js';
import { authStorage } from '@/core/auth/authStorage.service.js';
import { isMobileOAuthEnabled } from '@/core/auth/oauth.service.js';
import { getPlatform, isNativeApp } from '@/core/platform/runtime.js';
import { connectAll } from '@/core/services/appWebSocket.service.js';
import { registerPushIfPermitted } from '@/core/platform/push.service.js';

const route = useRoute();
const router = useRouter();

const parseQueryStringValue = (value) => {
  if (Array.isArray(value)) {
    return value[0] || null
  }

  return value ?? null
}

// JWT 토큰에서 memberId 추출 (간단한 디코딩)
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT 디코딩 실패:', error);
    return null;
  }
};

const persistTokens = ({ accessToken, refreshToken, memberId }) => {
  authStorage.setTokens({
    accessToken,
    refreshToken,
    memberId
  })

  if (!memberId && accessToken) {
    const decodedToken = decodeJWT(accessToken)
    if (decodedToken?.memberId) {
      authStorage.setMemberId(decodedToken.memberId)
    }
  }
}

const navigateAfterLogin = async () => {
  tokenRefreshService.start()
  await connectAll()

  try {
    await registerPushIfPermitted()
  } catch (pushError) {
    console.warn('OAuth 이후 푸시 등록 스킵:', pushError)
  }

  await router.replace('/main')
}

const exchangeMobileCode = async ({ code, state }) => {
  const response = await apiClient.post(API_ENDPOINTS.AUTH.MOBILE_EXCHANGE, {
    code,
    state,
    platform: isNativeApp() ? getPlatform() : 'web'
  })

  const tokenResult = response.data?.result || {}

  if (!response.data?.isSuccess || !tokenResult.accessToken || !tokenResult.refreshToken) {
    throw new Error(response.data?.message || '모바일 OAuth 토큰 교환 실패')
  }

  persistTokens({
    accessToken: tokenResult.accessToken,
    refreshToken: tokenResult.refreshToken,
    memberId: tokenResult.memberId
  })
}

const handleLegacyQueryTokens = ({ accessToken, refreshToken }) => {
  if (!accessToken || !refreshToken) {
    throw new Error('토큰이 없습니다.')
  }

  persistTokens({ accessToken, refreshToken })
}

onMounted(async () => {
  try {
    const accessToken = parseQueryStringValue(route.query.accessToken)
    const refreshToken = parseQueryStringValue(route.query.refreshToken)
    const code = parseQueryStringValue(route.query.code)
    const state = parseQueryStringValue(route.query.state)

    const shouldUseMobileExchange = isMobileOAuthEnabled() && !!code && (!accessToken || !refreshToken)

    if (shouldUseMobileExchange) {
      await exchangeMobileCode({ code, state })
    } else {
      handleLegacyQueryTokens({ accessToken, refreshToken })
    }

    console.log('🚀 OAuth 로그인 성공: 토큰 갱신 서비스 시작')
    await navigateAfterLogin()
  } catch (error) {
    console.error('로그인 처리 중 오류:', error)
    await router.replace('/loginPage')
  }
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

