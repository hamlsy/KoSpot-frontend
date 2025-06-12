# 회원 관리와 웹소켓 관리
## useAuth.js 사용법법
### 컴포넌트에서 사용

```
<template>
  <div>
    <div v-if="loading">로그인 중...</div>
    <div v-else-if="isAuthenticated">
      <h1>안녕하세요, {{ user.username }}님!</h1>
      <button @click="handleLogout">로그아웃</button>
    </div>
    <div v-else>
      <LoginForm @submit="handleLogin" />
    </div>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { useAuth } from '@/core/composables/useAuth.js'
import LoginForm from '@/components/LoginForm.vue'

const { user, isAuthenticated, loading, error, login, logout } = useAuth()

const handleLogin = async (credentials) => {
  const result = await login(credentials)
  if (result.success) {
    console.log('로그인 성공!')
  }
}

const handleLogout = async () => {
  await logout()
}
</script>

```

### 라우터 가드에서 사용용

```
// router/index.js
import { useAuth } from '@/core/composables/useAuth.js'

router.beforeEach(async (to, from, next) => {
  const { checkAuth, isAuthenticated } = useAuth()
  
  if (to.meta.requiresAuth) {
    const isValid = await checkAuth()
    if (!isValid) {
      next('/login')
      return
    }
  }
  
  next()
})

```

### 앱 초기화시 사용

```
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import { useAuth } from '@/core/composables/useAuth.js'

const app = createApp(App)

// 앱 시작 시 인증 상태 확인
const { checkAuth } = useAuth()
checkAuth().then(() => {
  app.mount('#app')
})

```

### 회원가입 처리
```
<script setup>
import { useAuth } from '@/core/composables/useAuth.js'

const { register, loading, error } = useAuth()

const handleRegister = async (userData) => {
  const result = await register(userData)
  if (result.success) {
    alert('회원가입이 완료되었습니다. 이메일을 확인해주세요.')
  }
}
</script>

```

## useWebSocket.js 사용 가이드
### 기본 사용법
```
<template>
  <div>
    <div>연결 상태: {{ isConnected ? '연결됨' : '연결 안됨' }}</div>
    <div>재연결 시도: {{ reconnectAttempts }}</div>
    
    <div class="messages">
      <div v-for="message in messages" :key="message.timestamp">
        {{ message.type }}: {{ message.data }}
      </div>
    </div>
    
    <button @click="sendTestMessage">테스트 메시지 전송</button>
    <button @click="disconnect">연결 종료</button>
  </div>
</template>

<script setup>
import { useWebSocket } from '@/core/composables/useWebSocket.js'

const wsUrl = `${process.env.VUE_APP_WS_BASE_URL}/game`
const { 
  isConnected, 
  messages, 
  reconnectAttempts,
  send, 
  disconnect,
  sendGameMessage 
} = useWebSocket(wsUrl)

const sendTestMessage = () => {
  sendGameMessage('TEST', { message: 'Hello WebSocket!' })
}
</script>

```

### 멀티플레이 게임에서 사용

```
<script setup>
import { useWebSocket } from '@/core/composables/useWebSocket.js'
import { ref, watch } from 'vue'

const currentRoom = ref(null)
const { 
  isConnected, 
  lastMessage,
  joinRoom, 
  leaveRoom, 
  sendChatMessage 
} = useWebSocket(`${process.env.VUE_APP_WS_BASE_URL}/multiplayer`)

// 방 입장
const enterRoom = (roomId) => {
  currentRoom.value = roomId
  joinRoom(roomId)
}

// 방 나가기
const exitRoom = () => {
  if (currentRoom.value) {
    leaveRoom(currentRoom.value)
    currentRoom.value = null
  }
}

// 채팅 메시지 전송
const sendChat = (message) => {
  if (currentRoom.value) {
    sendChatMessage(currentRoom.value, message)
  }
}

// 메시지 수신 처리
watch(lastMessage, (message) => {
  if (message?.type === 'PLAYER_JOINED') {
    console.log('새 플레이어 참가:', message.data.username)
  }
})
</script>

```

### 게임상태 동기화

```
// modules/game/composables/useGameSync.js
import { useWebSocket } from '@/core/composables/useWebSocket.js'
import { ref, watch } from 'vue'

export function useGameSync(gameId) {
  const gameState = ref({
    players: [],
    currentRound: 1,
    timeRemaining: 0
  })
  
  const { sendGameMessage, lastMessage } = useWebSocket(
    `${process.env.VUE_APP_WS_BASE_URL}/game/${gameId}`
  )
  
  // 게임 상태 업데이트 수신
  watch(lastMessage, (message) => {
    if (message?.type === 'GAME_STATE_UPDATE') {
      gameState.value = { ...gameState.value, ...message.data }
    }
  })
  
  const submitAnswer = (answer) => {
    sendGameMessage('SUBMIT_ANSWER', {
      gameId,
      answer,
      timestamp: Date.now()
    })
  }
  
  return {
    gameState,
    submitAnswer
  }
}

```