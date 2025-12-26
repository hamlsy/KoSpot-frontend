<template>
  <div class="adsense-bot-manager">
    <div class="header-section">
      <h2 class="section-title">🤖 애드센스 봇 계정 추가</h2>
      <p class="section-description">애드센스 봇 계정을 생성하고 테스트할 수 있습니다.</p>
    </div>

    <!-- 고정된 계정 정보 표시 -->
    <div class="info-section bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h3 class="info-title text-lg font-semibold text-gray-800 mb-4">
        <i class="fas fa-info-circle text-blue-500 mr-2"></i>
        애드센스 봇 계정 정보
      </h3>
      <div class="info-content space-y-2">
        <div class="info-item">
          <span class="info-label font-medium text-gray-700">User ID:</span>
          <span class="info-value font-mono text-gray-900">adsense_bot</span>
        </div>
        <div class="info-item">
          <span class="info-label font-medium text-gray-700">Password:</span>
          <span class="info-value font-mono text-gray-900">fixed_password123</span>
        </div>
      </div>
    </div>

    <!-- 2단 레이아웃: 왼쪽 폼, 오른쪽 테스트 결과 -->
    <div class="main-layout">
      <!-- 왼쪽: 계정 생성 및 로그인 테스트 -->
      <div class="left-section">
        <!-- 계정 생성 폼 -->
        <div class="form-section bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 class="form-title text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-user-plus text-indigo-500 mr-2"></i>
            새 계정 생성
          </h3>
          
          <div class="form-content">
            <div class="form-group mb-4">
              <label for="username" class="form-label block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                v-model="username"
                type="text"
                class="form-input w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="사용자 이름을 입력하세요"
                :disabled="isLoading"
              />
            </div>

            <button
              @click="createAccount"
              :disabled="!username || isLoading"
              class="create-btn w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-semibold transition-all duration-200 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center mb-4"
            >
              <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
              <i v-else class="fas fa-plus mr-2"></i>
              {{ isLoading ? '생성 중...' : '계정 만들기' }}
            </button>
          </div>

          <!-- 메시지 표시 -->
          <div v-if="message" class="message-section mt-4">
            <div
              :class="[
                'message-alert p-4 rounded-lg',
                messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
              ]"
            >
              <div class="flex items-center">
                <i
                  :class="[
                    'mr-2',
                    messageType === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
                  ]"
                ></i>
                <span>{{ message }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 로그인 테스트 -->
        <div class="test-section bg-white rounded-lg shadow-sm p-6">
          <h3 class="form-title text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-vial text-purple-500 mr-2"></i>
            로그인 테스트
          </h3>
          
          <div class="test-info mb-4 p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-2">
              <i class="fas fa-info-circle mr-2"></i>
              고정된 계정 정보로 로그인하여 쿠키 토큰을 테스트합니다.
            </p>
            <div class="text-xs text-gray-500 space-y-1">
              <div>User ID: <span class="font-mono">adsense_bot</span></div>
              <div>Password: <span class="font-mono">fixed_password123</span></div>
            </div>
          </div>

          <button
            @click="testLogin"
            :disabled="isTesting"
            class="test-btn w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-semibold transition-all duration-200 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <i v-if="isTesting" class="fas fa-spinner fa-spin mr-2"></i>
            <i v-else class="fas fa-play mr-2"></i>
            {{ isTesting ? '테스트 중...' : '로그인 테스트 실행' }}
          </button>
        </div>
      </div>

      <!-- 오른쪽: 테스트 결과 -->
      <div class="right-section">
        <div class="result-section bg-white rounded-lg shadow-sm p-6">
          <h3 class="form-title text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-clipboard-list text-green-500 mr-2"></i>
            테스트 결과
          </h3>

          <!-- 쿠키 상태 -->
          <div class="cookie-status mb-4 p-4 rounded-lg" :class="cookieStatusClass">
            <div class="flex items-center justify-between mb-2">
              <span class="font-semibold">쿠키 상태</span>
              <i :class="cookieStatusIcon"></i>
            </div>
            <div class="text-sm">
              <div v-if="cookieStatus === 'checking'">확인 중...</div>
              <div v-else-if="cookieStatus === 'found'">
                <div class="font-mono text-xs break-all">{{ cookieValue }}</div>
              </div>
              <div v-else-if="cookieStatus === 'not-found'">쿠키에 accessToken이 없습니다.</div>
            </div>
          </div>

          <!-- 프로필 조회 결과 -->
          <div class="profile-result">
            <div class="mb-2">
              <span class="font-semibold text-gray-700">프로필 조회 결과</span>
            </div>
            <div v-if="profileResult" class="result-content">
              <pre class="result-json">{{ JSON.stringify(profileResult, null, 2) }}</pre>
            </div>
            <div v-else class="result-placeholder">
              <i class="fas fa-inbox text-gray-400"></i>
              <p class="text-gray-500 text-sm">로그인 테스트를 실행하면 결과가 표시됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiClient } from 'src/core/api/apiClient.js'
import { useAuth } from '@/core/composables/useAuth.js'
import axios from 'axios'

const username = ref('')
const isLoading = ref(false)
const message = ref('')
const messageType = ref('') // 'success' or 'error'

// 테스트 관련 상태
const isTesting = ref(false)
const cookieStatus = ref('not-found') // 'checking', 'found', 'not-found'
const cookieValue = ref('')
const profileResult = ref(null)

// useAuth 컴포저블 사용
const { loginAsBot } = useAuth()

// 쿠키 상태에 따른 스타일 클래스
const cookieStatusClass = computed(() => {
  if (cookieStatus.value === 'checking') return 'bg-yellow-50 border border-yellow-200'
  if (cookieStatus.value === 'found') return 'bg-green-50 border border-green-200'
  return 'bg-gray-50 border border-gray-200'
})

// 쿠키 상태에 따른 아이콘
const cookieStatusIcon = computed(() => {
  if (cookieStatus.value === 'checking') return 'fas fa-spinner fa-spin text-yellow-500'
  if (cookieStatus.value === 'found') return 'fas fa-check-circle text-green-500'
  return 'fas fa-times-circle text-gray-400'
})

// 쿠키에서 accessToken 확인
const checkCookie = () => {
  cookieStatus.value = 'checking'
  
  const cookies = document.cookie.split(';')
  const accessTokenCookie = cookies.find(c => c.trim().startsWith('accessToken='))
  
  if (accessTokenCookie) {
    cookieValue.value = accessTokenCookie.split('=')[1] || ''
    cookieStatus.value = 'found'
  } else {
    cookieValue.value = ''
    cookieStatus.value = 'not-found'
  }
}

// 계정 생성
const createAccount = async () => {
  if (!username.value.trim()) {
    message.value = '사용자 이름을 입력해주세요.'
    messageType.value = 'error'
    return
  }

  isLoading.value = true
  message.value = ''

  try {
    // POST /adsense/register?username=xxx 형태로 요청
    await apiClient.post('/adsense/register', null, {
      params: {
        username: username.value.trim()
      }
    })

    message.value = '계정이 성공적으로 생성되었습니다.'
    messageType.value = 'success'
    username.value = '' // 입력 필드 초기화

    // 3초 후 메시지 자동 제거
    setTimeout(() => {
      message.value = ''
    }, 3000)
  } catch (error) {
    console.error('계정 생성 실패:', error)
    message.value = error.response?.data?.message || '계정 생성에 실패했습니다. 다시 시도해주세요.'
    messageType.value = 'error'
  } finally {
    isLoading.value = false
  }
}

// 로그인 테스트
const testLogin = async () => {
  isTesting.value = true
  profileResult.value = null
  cookieStatus.value = 'not-found'
  cookieValue.value = ''

  try {
    // 1. 로그인 API 호출 (쿠키만 사용, 헤더에 JWT 없음)
    // axios를 직접 사용하여 apiClient의 인터셉터를 우회
    const baseURL = process.env.VUE_APP_API_BASE_URL || '/api'
    const loginResponse = await axios.post(`${baseURL}/adsense/login`, null, {
      params: {
        user_id: 'adsense_bot',
        password: 'fixed_password123'
      },
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
        // Authorization 헤더를 명시적으로 추가하지 않음
      }
    })

    console.log('✅ 로그인 성공:', loginResponse.data)

    // 2. 봇 로그인 상태 저장
    loginAsBot()

    // 3. 쿠키 확인
    setTimeout(() => {
      checkCookie()
    }, 100)

    // 4. 프로필 조회 (쿠키만 사용, 헤더에 JWT 없음)
    try {
      // axios를 직접 사용하여 헤더에 Authorization을 추가하지 않도록 설정
      const profileResponse = await axios.get(`${baseURL}/member/profile`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
          // Authorization 헤더를 명시적으로 추가하지 않음
        }
      })

      profileResult.value = profileResponse.data
      console.log('✅ 프로필 조회 성공:', profileResult.value)
    } catch (profileError) {
      console.error('❌ 프로필 조회 실패:', profileError)
      profileResult.value = {
        error: true,
        message: profileError.response?.data?.message || '프로필 조회에 실패했습니다.',
        status: profileError.response?.status,
        data: profileError.response?.data
      }
    }
  } catch (error) {
    console.error('❌ 로그인 테스트 실패:', error)
    profileResult.value = {
      error: true,
      message: error.response?.data?.message || '로그인에 실패했습니다.',
      status: error.response?.status,
      data: error.response?.data
    }
  } finally {
    isTesting.value = false
    // 쿠키 재확인
    setTimeout(() => {
      checkCookie()
    }, 200)
  }
}

// 컴포넌트 마운트 시 쿠키 확인
onMounted(() => {
  checkCookie()
})
</script>

<style scoped>
.adsense-bot-manager {
  animation: fadeIn 0.3s ease;
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

.header-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.section-description {
  color: #6b7280;
  font-size: 0.875rem;
}

.info-section {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  min-width: 100px;
}

.info-value {
  padding: 0.25rem 0.75rem;
  background-color: #f3f4f6;
  border-radius: 0.375rem;
}

.form-section {
  animation: slideIn 0.3s ease 0.1s both;
}

.form-group {
  margin-bottom: 1rem;
}

.form-input:focus {
  outline: none;
}

.create-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.create-btn:not(:disabled):active {
  transform: translateY(0);
}

.message-alert {
  animation: fadeIn 0.3s ease;
}

/* 2단 레이아웃 */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.left-section {
  display: flex;
  flex-direction: column;
}

.right-section {
  display: flex;
  flex-direction: column;
}

.test-section {
  animation: slideIn 0.3s ease 0.2s both;
}

.test-info {
  font-size: 0.875rem;
}

.result-section {
  animation: slideIn 0.3s ease 0.3s both;
  height: fit-content;
  max-height: 80vh;
  overflow-y: auto;
}

.cookie-status {
  transition: all 0.3s ease;
}

.profile-result {
  margin-top: 1rem;
}

.result-content {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  max-height: 500px;
  overflow-y: auto;
}

.result-json {
  margin: 0;
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
  color: #111827;
  white-space: pre-wrap;
  word-break: break-all;
}

.result-placeholder {
  text-align: center;
  padding: 3rem 1rem;
  color: #9ca3af;
}

.result-placeholder i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.result-placeholder p {
  font-size: 0.875rem;
  margin: 0;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
}
</style>

