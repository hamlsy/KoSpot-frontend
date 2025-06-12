# API Client 사용 가이드

## 기본 사용법

다른 서비스에서 API 클라이언트 사용

```
import { apiClient } from '@/core/api/client.js'
import { API_ENDPOINTS } from '@/core/api/endpoints.js'

// GET 요청
const getUsers = async () => {
try {
const response = await apiClient.get(API_ENDPOINTS.USER.PROFILE)
return response.data
} catch (error) {
console.error('사용자 정보 조회 실패:', error)
throw error
}
}

// POST 요청 (자동으로 JWT 토큰 첨부됨)
const updateProfile = async (userData) => {
const response = await apiClient.post(API_ENDPOINTS.USER.UPDATE_PROFILE, userData)
return response.data
}
```

# End Point 사용 가이드
## 기본 사용법
```
import { API_ENDPOINTS, createEndpoint } from '@/core/api/endpoints.js'
import { apiClient } from '@/core/api/client.js'

// 정적 엔드포인트 사용
const login = async (credentials) => {
  return await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
}

// 동적 엔드포인트 생성
const getUserById = async (userId) => {
  const endpoint = createEndpoint('/user/:id/profile', { id: userId })
  return await apiClient.get(endpoint)
}

```

### 게임 서비스에서 사용

```
// modules/game/services/gameService.js
import { API_ENDPOINTS } from '@/core/api/endpoints.js'
import { apiClient } from '@/core/api/client.js'

export class GameService {
  async startPhotoGame(gameSettings) {
    return await apiClient.post(API_ENDPOINTS.GAME.PHOTO.START, gameSettings)
  }
  
  async submitAnswer(gameId, answer) {
    const endpoint = createEndpoint('/game/:gameId/submit', { gameId })
    return await apiClient.post(endpoint, answer)
  }
}

```

### 새로운 엔드포인트 추가

```
// endpoints.js에 새 엔드포인트 추가
export const API_ENDPOINTS = {
  // ... 기존 엔드포인트
  
  NOTIFICATION: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    DELETE: '/notifications/:id'
  }
}

```