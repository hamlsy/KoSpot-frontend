<template>
  <div class="temp-login-container">
    <div class="temp-login-card">
      <div class="card-header">
        <h2>임시 로그인</h2>
        <p>테스트용</p>
      </div>

      <!-- 로그인 폼 -->
      <div v-if="!isAuthenticated" class="login-section">
        <form @submit.prevent="handleTempLogin" class="login-form">
          <div class="form-group">
            <label for="username">임시 사용자명</label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="테스트용 사용자명을 입력하세요"
              required
              :disabled="loading"
            />
          </div>
          <button type="submit" :disabled="loading || !username.trim()" class="login-btn">
            {{ loading ? '로그인 중...' : '임시 로그인' }}
          </button>
        </form>
      </div>

      <!-- 로그인 후 관리 섹션 -->
      <div v-else class="management-section">
        <div class="user-info">
          <h3>로그인 성공</h3>
          <p>사용자: {{ currentUser?.username || username }}</p>
          <p>토큰: {{ accessToken ? '발급됨' : '없음' }}</p>
        </div>

        <div class="action-buttons">
          <button @click="handleReissueToken" :disabled="loading" class="reissue-btn">
            {{ loading ? '재발급 중...' : '토큰 재발급' }}
          </button>
          <button @click="handleLogout" :disabled="loading" class="logout-btn">
            {{ loading ? '로그아웃 중...' : '로그아웃' }}
          </button>
        </div>
      </div>

      <!-- 에러 메시지 -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- 성공 메시지 -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <!-- 메인페이지로 돌아가기 -->
      <div class="navigation">
        <router-link to="/main" class="main-link">메인페이지로 돌아가기</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/core/api/apiClient.js'

const router = useRouter()

// 반응형 상태
const username = ref('')
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const currentUser = ref(null)

// 토큰 관련 computed
const accessToken = computed(() => localStorage.getItem('accessToken'))
const isAuthenticated = computed(() => !!accessToken.value)

// 임시 로그인 처리
const handleTempLogin = async () => {
  if (!username.value.trim()) return

  try {
    loading.value = true
    error.value = ''
    successMessage.value = ''

    // GET 요청으로 임시 로그인
    const response = await apiClient.get(`/auth/tempLogin/${username.value}`)
    
    
    // API 응답 성공 여부 확인
    if (!response.data.isSuccess || response.data.code !== 2000) {
      throw new Error(response.data.message || '로그인 처리 중 오류가 발생했습니다.')
    }

    // result에서 토큰 정보 추출
    const { memberId, accessToken, refreshToken } = response.data.result

    // 토큰 저장
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('memberId', memberId)
    
    successMessage.value = '임시 로그인에 성공했습니다!'
    
    // 3초 후 메인페이지로 이동
    setTimeout(() => {
      router.push('/main')
    }, 3000)

  } catch (err) {
    console.error('임시 로그인 실패:', err)
    error.value = err.response?.data?.message || err.message || '임시 로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 로그아웃 처리
const handleLogout = async () => {
  try {
    loading.value = true
    error.value = ''
    successMessage.value = ''

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('리프레시 토큰이 없습니다.')
    }

    // 로그아웃 API 호출 - refreshToken을 요청 본문에 포함
    await apiClient.post('/auth/logout', {
      refreshToken: refreshToken
    })
    
    successMessage.value = '로그아웃되었습니다.'
  } catch (err) {
    console.error('로그아웃 실패:', err)
    error.value = err.response?.data?.message || err.message || '로그아웃 요청에 실패했습니다.'
  } finally {
    // 로컬 스토리지 정리
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('memberId')
    currentUser.value = null
    username.value = ''
    loading.value = false
  }
}

// 토큰 재발급 처리
const handleReissueToken = async () => {
  try {
    loading.value = true
    error.value = ''
    successMessage.value = ''

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('리프레시 토큰이 없습니다.')
    }

    // 토큰 재발급 API 호출
    const response = await apiClient.post('/auth/reIssue', {
      refreshToken: refreshToken
    })
    
    // API 응답 성공 여부 확인
    if (!response.data.isSuccess || response.data.code !== 2000) {
      throw new Error(response.data.message || '토큰 재발급 중 오류가 발생했습니다.')
    }

    // result에서 토큰 정보 추출
    const { accessToken, refreshToken: newRefreshToken } = response.data.result

    // 새 토큰 저장
    localStorage.setItem('accessToken', accessToken)
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken)
    }

    successMessage.value = '토큰이 성공적으로 재발급되었습니다!'

  } catch (err) {
    console.error('토큰 재발급 실패:', err)
    error.value = err.response?.data?.message || err.message || '토큰 재발급에 실패했습니다.'
    
    // 리프레시 토큰이 만료되었거나 유효하지 않은 경우
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      currentUser.value = null
      router.push('/temp-login')
    }
  } finally {
    loading.value = false
  }
}

// 컴포넌트 마운트 시 인증 상태 확인
onMounted(() => {
  if (accessToken.value) {
    // 이미 로그인된 상태라면 사용자 정보 표시
    currentUser.value = { username: '기존 사용자' }
  }
})
</script>

<style scoped>
.temp-login-container {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.temp-login-card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.card-header h2 {
  color: #111827;
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.card-header p {
  color: #6b7280;
  font-size: 0.875rem;
}

.login-section, .management-section {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-group input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.login-btn, .reissue-btn, .logout-btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
}

.login-btn {
  background: #3b82f6;
  color: white;
}

.login-btn:hover:not(:disabled) {
  background: #2563eb;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reissue-btn {
  background: #6b7280;
  color: white;
}

.reissue-btn:hover:not(:disabled) {
  background: #4b5563;
}

.logout-btn {
  background: #ef4444;
  color: white;
}

.logout-btn:hover:not(:disabled) {
  background: #dc2626;
}

.user-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.user-info h3 {
  color: #111827;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}

.user-info p {
  margin: 0.25rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.action-buttons {
  display: grid;
  gap: 0.5rem;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #c3e6cb;
}


.navigation {
  text-align: center;
}

.main-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #374151;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
}

.main-link:hover {
  background: #e5e7eb;
}

@media (max-width: 768px) {
  .temp-login-container {
    padding: 1rem;
  }
  
  .temp-login-card {
    padding: 1.5rem;
  }
}
</style> 