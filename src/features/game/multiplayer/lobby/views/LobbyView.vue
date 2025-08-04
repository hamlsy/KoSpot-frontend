<template>
  <div class="multiplayer-container">
    <!-- 헤더 -->
    <header class="header">
      <div class="header-content">
        <button class="back-button" @click="$router.push('/main')">
          <i class="fas fa-arrow-left"></i>
        </button>
        <div class="header-left">
          <app-logo class="home-link" to="/main" />
        </div>
        <div class="header-right">
          <h3>멀티플레이어 로비</h3>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- 모바일 채팅 토글 버튼 -->
      <button 
        v-if="isMobile" 
        class="chat-toggle-button" 
        @click="isChatVisible = !isChatVisible"
        :class="{ 'active': isChatVisible }"
      >
        <i class="fas" :class="isChatVisible ? 'fa-times' : 'fa-comments'"></i>
        <span>{{ isChatVisible ? '채팅 닫기' : '채팅 열기' }}</span>
      </button>

      <div class="lobby-layout">
        <!-- 왼쪽 패널: 게임 방 목록 -->
        <GameRoomList 
          :rooms="rooms" 
          :loading="isLoading || isJoining"
          :error="roomError"
          @join-room="joinRoom"
          @refresh-rooms="refreshRooms"
          @load-more="loadMoreRooms"
          @clear-error="clearError"
          class="game-room-list"
          :class="{ 'chat-open': isChatVisible && isMobile }"
        />

        <!-- 오른쪽 패널: 채팅 및 방 생성 -->
        <div 
          class="right-panel" 
          :class="{ 'mobile-visible': isChatVisible, 'mobile-hidden': !isChatVisible }"
        >
          <ChatWindow 
            :messages="formattedChatMessages" 
            @send-message="sendChatMessage"
            :current-user-id="getCurrentUserId()"
            :show-mobile-close="isMobile"
            @close="isChatVisible = false"
          />
          
          <button class="create-room-button" @click="showCreateRoomModal = true">
            <i class="fas fa-plus"></i> 새 게임방 만들기
          </button>
        </div>
      </div>
    </main>

    <!-- 방 생성 모달 -->
    <CreateRoomModal 
      v-if="showCreateRoomModal" 
      @close="showCreateRoomModal = false"
      @create-room="createRoom"
    />

    <!-- 로딩 오버레이 -->
    <div v-if="isLoading || isJoining" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>{{ isJoining ? '방에 입장 중...' : '로딩 중...' }}</p>
      </div>
    </div>
    
    <!-- 에러 알림 (Toast 형태) -->
    <div v-if="roomError" class="error-toast" @click="clearError">
      <div class="error-content">
        <i class="fas fa-exclamation-triangle"></i>
        <span>{{ roomError }}</span>
        <button class="error-close" @click="clearError">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/core/composables/useAuth.js';
import useGlobalLobbyWebSocketService from '../services/useGlobalLobbyWebSocketService';
import { useLobbyRoom } from '../composables/useLobbyRoom.js';
import GameRoomList from '../components/RoomList.vue';
import ChatWindow from '../../chat/components/Lobby/ChatWindow.vue';
import CreateRoomModal from '../components/CreateRoomModal.vue';
import AppLogo from '@/core/components/AppLogo.vue';

// Vue Router
const router = useRouter();

// WebSocket 로비 서비스 초기화
const lobbyService = useGlobalLobbyWebSocketService();

// 방 관리 composables 초기화
const {
  rooms,
  isLoading,
  error: roomError,
  isJoining,
  currentPage,
  hasNextPage,
  availableRooms,
  playingRooms,
  fetchRooms,
  loadMoreRooms,
  refreshRooms,
  joinRoom: joinRoomAPI,
  joinRoomByObject,
  createRoom: createRoomAPI,
  clearError
} = useLobbyRoom();

// 반응형 데이터
const showCreateRoomModal = ref(false);
const isInitialized = ref(false);
const isMobile = ref(false);
const isChatVisible = ref(false);
const windowWidth = ref(window.innerWidth);
const refreshInterval = ref(null);

// 계산된 속성
const formattedChatMessages = computed(() => {
  // WebSocket 서비스에서 받은 채팅 메시지를 UI 컴포넌트 형식에 맞게 변환
  return lobbyService.globalLobbyChatMessages.value.map(msg => ({
    id: msg.messageId || msg.id || `msg-${msg.timestamp}`,
    sender: msg.nickname || msg.playerName || msg.sender || '익명',
    senderId: msg.senderId || msg.playerId || msg.memberId, // 백엔드에서 제공하는 senderId
    message: msg.content || msg.message,
    timestamp: msg.timestamp,
    system: msg.messageType === 'SYSTEM' || msg.messageType === 'JOIN' || msg.messageType === 'LEAVE' || msg.isSystem === true,
    messageType: msg.messageType,
    channelType: msg.channelType
  }));
});

// 메서드
const checkMobileView = () => {
  windowWidth.value = window.innerWidth;
  isMobile.value = windowWidth.value <= 900;
  isChatVisible.value = !isMobile.value;
};

const getCurrentUserId = () => {
  // localStorage에서 memberId 가져오기
  const localStorageMemberId = localStorage.getItem('memberId');
  return localStorageMemberId;
};

const initializeData = async () => {
  try {
    // WebSocket 연결 및 채팅 서비스 시작
    // (사용자 정보는 서비스 내에서 자동으로 초기화됨)
    await connectToChat();
    
    // 방 목록 가져오기 (첫 페이지)
    await fetchRooms(0);
    
    isInitialized.value = true;
      
      // 30초마다 방 목록 새로고침
    refreshInterval.value = setInterval(() => {
      refreshRooms();
      }, 30000);
    
  } catch (error) {
    console.error('로비 초기화 중 오류:', error);
  }
};

// fetchRooms는 이제 composables에서 가져옴 (더 이상 여기서 정의하지 않음)

const connectToChat = async () => {
  try {
    console.log('🔗 WebSocket 서비스 연결 시도 중...');
    
    // WebSocket 서비스 연결
    lobbyService.connectWebSocket();
    
    // 연결 상태 모니터링
    const checkConnection = () => {
      console.log('📊 연결 상태:', {
        isConnected: lobbyService.isConnected.value
      });
    };
    
    // 1초 후 연결 상태 확인
    setTimeout(checkConnection, 1000);
    
    console.log('✅ 채팅 서비스 연결 요청 완료');
  } catch (error) {
    console.error('❌ 채팅 서비스 연결 실패:', error);
  }
};

const disconnectFromChat = () => {
  try {
    lobbyService.disconnectWebSocket();
    console.log('채팅 연결 해제 완료');
  } catch (error) {
    console.error('채팅 연결 해제 중 오류:', error);
  }
};

const sendChatMessage = (message) => {
      if (!message.trim()) return;
      
  // WebSocket 서비스를 통해 메시지 전송
  const success = lobbyService.sendGlobalLobbyChat(message);
  
  if (!success) {
    console.error('메시지 전송 실패');
    // 사용자에게 오류 알림 (Toast 메시지 등)
  }
};

const joinRoom = async (roomParam) => {
  try {
    // roomParam이 문자열(roomId)인지 객체(room)인지 확인
    if (typeof roomParam === 'string' || typeof roomParam === 'number') {
      // roomId로 직접 입장
      await joinRoomAPI(roomParam);
    } else if (roomParam && roomParam.id) {
      // room 객체로 입장
      await joinRoomByObject(roomParam);
    } else {
      console.error('❌ 잘못된 방 입장 파라미터:', roomParam);
      return;
    }
  } catch (error) {
    console.error('❌ 방 입장 처리 중 오류:', error);
    // 에러는 composables에서 처리됨
  }
};
    
const createRoom = async (roomData) => {
  try {
    console.log('🏗️ 새 방 생성 요청:', roomData);
    
    // 모달 닫기
    showCreateRoomModal.value = false;
    
    // API를 통해 방 생성 (자동으로 해당 방에 입장됨)
    const newRoom = await createRoomAPI(roomData);
    
    if (newRoom) {
      // 사용자 정보 가져오기 
      const { user: authUser } = useAuth();
      const userNickname = authUser.value?.nickname || '익명';
      
      // 시스템 메시지 추가 (WebSocket 서비스를 통해)
      lobbyService.createGlobalSystemMessage(
        `${userNickname}님이 '${roomData.name}' 방을 생성했습니다.`
      );
      
      console.log('✅ 방 생성 및 입장 완료');
    }
  } catch (error) {
    console.error('❌ 방 생성 처리 중 오류:', error);
    // 에러 발생 시 모달 다시 열기
    showCreateRoomModal.value = true;
  }
};

// 라이프사이클 훅
onMounted(() => {
  initializeData();
  checkMobileView();
  window.addEventListener('resize', checkMobileView);
});

onBeforeUnmount(() => {
  // 정리 작업
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
  disconnectFromChat();
  window.removeEventListener('resize', checkMobileView);
});
</script>

<style scoped>
@import url("@/shared/assets/styles/common/header.css");

.multiplayer-container {
  min-height: 100vh;
  padding-bottom: 40px;
  position: relative;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 헤더 스타일 */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.03);
  z-index: 100;
  transition: all 0.3s ease;
}

.header-content {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.back-button {
  background: none;
  border: none;
  color: #333;
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.2s ease;
  margin-right: 1rem;
}

.back-button:hover {
  transform: translateX(-3px);
}

.header-left {
  display: flex;
  align-items: center;
}

/* 로고 스타일 */
.header-right {
  margin-left: auto;
}

.header-right h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #111827;
  font-weight: 700;
  position: relative;
  letter-spacing: -0.01em;
}

.header-right h3::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 40%;
  height: 3px;
  background: linear-gradient(90deg, #60a5fa, #8b5cf6);
  border-radius: 2px;
}

/* 메인 콘텐츠 스타일 */
.main-content {
  padding: 80px 20px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 로비 레이아웃 */
.lobby-layout {
  display: flex;
  gap: 1.5rem;
  position: relative;
  height: calc(100vh - 120px);
  max-height: 700px;
  margin-top: 1rem;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.right-panel {
  display: flex;
  flex-direction: column;
  width: 30%;
  min-width: 300px;
}

.create-room-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  margin-top: 1rem;
  background: linear-gradient(135deg, #60a5fa 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(96, 165, 250, 0.25);
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.create-room-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #8b5cf6 0%, #60a5fa 100%);
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
}

.create-room-button i {
  margin-right: 0.5rem;
  font-size: 0.9rem;
}

.create-room-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(96, 165, 250, 0.35);
}

.create-room-button:hover::before {
  opacity: 1;
}

.create-room-button:active {
  transform: translateY(0);
  box-shadow: 0 4px 10px rgba(96, 165, 250, 0.2);
}

/* 로딩 오버레이 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-spinner i {
  font-size: 3rem;
  color: #667eea;
  margin-bottom: 1rem;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.7;
  }
}

.loading-spinner p {
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

/* 채팅 토글 버튼 */
.chat-toggle-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  z-index: 50;
}

.chat-toggle-button i {
  margin-right: 8px;
}

.chat-toggle-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.chat-toggle-button.active {
  background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%);
}

/* 에러 토스트 */
.error-toast {
  position: fixed;
  top: 100px;
  right: 20px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
  z-index: 1000;
  cursor: pointer;
  animation: slideInRight 0.3s ease-out;
  max-width: 400px;
  min-width: 300px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.error-content i {
  font-size: 1.1rem;
  color: #fef2f2;
}

.error-content span {
  flex: 1;
  font-weight: 500;
  line-height: 1.4;
}

.error-close {
  background: none;
  border: none;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.error-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 반응형 스타일 */
@media (max-width: 900px) {
  .lobby-layout {
    flex-direction: column;
    height: auto;
    max-height: none;
    position: relative;
    overflow: hidden;
  }
  
  .game-room-list {
    width: 100%;
    transition: all 0.3s ease;
    z-index: 10;
  }
  
  .game-room-list.chat-open {
    opacity: 0;
    pointer-events: none;
  }
  
  .right-panel {
    width: 100%;
    min-width: auto;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    z-index: 20;
    transition: all 0.3s ease;
  }
  
  .right-panel.mobile-hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateX(100%);
  }
  
  .right-panel.mobile-visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(0);
  }
}

@media (max-width: 640px) {
  .header-content {
    padding: 0.8rem 1rem;
  }
  
  .header-right h3 {
    font-size: 1rem;
  }
  
  .main-content {
    padding: 70px 15px 15px;
  }
  
  .chat-toggle-button {
    bottom: 15px;
    right: 15px;
    padding: 10px 16px;
    font-size: 0.85rem;
  }
  
  .error-toast {
    top: 80px;
    left: 15px;
    right: 15px;
    max-width: none;
    min-width: auto;
  }
}
</style>