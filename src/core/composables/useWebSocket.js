// core/composables/useWebSocket.js
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useAuth } from './useAuth.js'

export function useWebSocket(url) {
  const { user, isAuthenticated } = useAuth()
  
  // WebSocket 상태
  const ws = ref(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const reconnectInterval = ref(null)
  
  // 메시지 관리
  const messages = reactive([])
  const lastMessage = ref(null)
  
  // 연결 설정
  const connect = () => {
    if (!isAuthenticated.value) {
      console.warn('WebSocket: 인증되지 않은 사용자')
      return
    }
    
    try {
      const token = localStorage.getItem('accessToken')
      const wsUrl = `${url}?token=${token}`
      
      ws.value = new WebSocket(wsUrl)
      
      ws.value.onopen = () => {
        console.log('WebSocket 연결됨')
        isConnected.value = true
        reconnectAttempts.value = 0
        
        // 연결 확인 메시지 전송
        send({
          type: 'CONNECTION',
          userId: user.value?.id,
          timestamp: new Date().toISOString()
        })
      }
      
      ws.value.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          lastMessage.value = message
          messages.push(message)
          
          // 메시지 타입별 처리
          handleMessage(message)
        } catch (error) {
          console.error('WebSocket 메시지 파싱 오류:', error)
        }
      }
      
      ws.value.onclose = (event) => {
        console.log('WebSocket 연결 종료:', event.code, event.reason)
        isConnected.value = false
        
        // 자동 재연결 (정상 종료가 아닌 경우)
        if (event.code !== 1000 && reconnectAttempts.value < maxReconnectAttempts) {
          scheduleReconnect()
        }
      }
      
      ws.value.onerror = (error) => {
        console.error('WebSocket 오류:', error)
        isConnected.value = false
      }
      
    } catch (error) {
      console.error('WebSocket 연결 실패:', error)
    }
  }
  
  // 재연결 스케줄링
  const scheduleReconnect = () => {
    if (reconnectInterval.value) return
    
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000)
    
    reconnectInterval.value = setTimeout(() => {
      reconnectAttempts.value++
      console.log(`WebSocket 재연결 시도 ${reconnectAttempts.value}/${maxReconnectAttempts}`)
      connect()
      reconnectInterval.value = null
    }, delay)
  }
  
  // 메시지 전송
  const send = (message) => {
    if (!isConnected.value || !ws.value) {
      console.warn('WebSocket이 연결되지 않음')
      return false
    }
    
    try {
      const messageString = typeof message === 'string' 
        ? message 
        : JSON.stringify(message)
      
      ws.value.send(messageString)
      return true
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      return false
    }
  }
  
  // 메시지 타입별 처리
  const handleMessage = (message) => {
    switch (message.type) {
      case 'GAME_START':
        console.log('게임 시작:', message.data)
        break
      case 'PLAYER_JOINED':
        console.log('플레이어 참가:', message.data)
        break
      case 'GAME_UPDATE':
        console.log('게임 업데이트:', message.data)
        break
      case 'CHAT_MESSAGE':
        console.log('채팅 메시지:', message.data)
        break
      default:
        console.log('알 수 없는 메시지 타입:', message.type)
    }
  }
  
  // 연결 종료
  const disconnect = () => {
    if (reconnectInterval.value) {
      clearTimeout(reconnectInterval.value)
      reconnectInterval.value = null
    }
    
    if (ws.value) {
      ws.value.close(1000, '정상 종료')
      ws.value = null
    }
    
    isConnected.value = false
  }
  
  // 게임별 메시지 전송 헬퍼
  const sendGameMessage = (type, data) => {
    return send({
      type,
      data,
      userId: user.value?.id,
      timestamp: new Date().toISOString()
    })
  }
  
  const sendChatMessage = (roomId, message) => {
    return sendGameMessage('CHAT_MESSAGE', {
      roomId,
      message,
      username: user.value?.username
    })
  }
  
  const joinRoom = (roomId) => {
    return sendGameMessage('JOIN_ROOM', { roomId })
  }
  
  const leaveRoom = (roomId) => {
    return sendGameMessage('LEAVE_ROOM', { roomId })
  }
  
  // 라이프사이클
  onMounted(() => {
    if (isAuthenticated.value) {
      connect()
    }
  })
  
  onUnmounted(() => {
    disconnect()
  })
  
  return {
    // 상태
    isConnected,
    messages,
    lastMessage,
    reconnectAttempts,
    
    // 메서드
    connect,
    disconnect,
    send,
    sendGameMessage,
    sendChatMessage,
    joinRoom,
    leaveRoom
  }
}
